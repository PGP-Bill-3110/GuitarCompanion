import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../config/firebase";

export type PracticeSourceType =
  | "chord"
  | "score"
  | "free";

export interface PracticeSession {
  id: string;

  userId: string;

  sourceType:
    PracticeSourceType;

  sourceId:
    string | null;

  exerciseId?:
    string | null;

  title: string;

  durationSeconds: number;

  bpm:
    number | null;

  selfRating:
    number | null;

  focusArea: string;

  notes: string;


  // ==============================
  // AI ANALYSIS
  // ==============================

  overallScore:
    number | null;

  noteAccuracy:
    number | null;

  timingScore:
    number | null;

  audioId:
    string | null;

  analysisFeedback:
    string[];

  analysisUpdatedAtMs:
    number | null;


  createdAtMs: number;
}

export interface PracticeStats {
  sessionCount: number;

  totalSeconds: number;

  totalMinutes: number;

  streak: number;
}

interface CreatePracticeSessionInput {
  sourceType:
    PracticeSourceType;

  sourceId?: string;

  exerciseId?: string;

  title: string;

  durationSeconds: number;

  bpm?: number;

  selfRating?: number;

  focusArea?: string;

  notes?: string;

  // accuracy?: number;

  // timingScore?: number;

  // noteAccuracy?: number;
}

// ======================================
// CREATE SESSION
// ======================================

export async function createPracticeSession(
  uid: string,
  input: CreatePracticeSessionInput
) {
  const sessionRef =
    await addDoc(
      collection(
        db,
        "users",
        uid,
        "practiceSessions"
      ),
      {
        userId:
          uid,

        sourceType:
          input.sourceType,

        sourceId:
          input.sourceId ??
          null,

        exerciseId:
          input.exerciseId ??
          null,

        title:
          input.title.trim(),

        durationSeconds:
          Math.max(
            1,
            Math.round(
              input.durationSeconds
            )
          ),

        bpm:
          input.bpm ??
          null,

        selfRating:
          input.selfRating ??
          null,

        focusArea:
          input.focusArea?.trim() ??
          "",

        notes:
          input.notes?.trim() ??
          "",

        overallScore:
          null,

        noteAccuracy:
          null,

        timingScore:
          null,

        audioId:
          null,

        analysisFeedback:
          [],

        analysisUpdatedAtMs:
          null,

        createdAt:
          serverTimestamp(),

        createdAtMs:
          Date.now(),
      }
    );

  return sessionRef.id;
}

// ======================================
// REALTIME HISTORY
// ======================================

export function subscribePracticeSessions(
  uid: string,
  callback: (
    sessions:
      PracticeSession[]
  ) => void
) {
  const sessionsQuery =
    query(
      collection(
        db,
        "users",
        uid,
        "practiceSessions"
      ),

      orderBy(
        "createdAtMs",
        "desc"
      ),

      limit(100)
    );

  return onSnapshot(
    sessionsQuery,

    (snapshot) => {
      callback(
        snapshot.docs.map(
          (sessionDoc) => ({
            id:
              sessionDoc.id,

            ...sessionDoc.data(),
          })
        ) as PracticeSession[]
      );
    },

    (error) => {
      console.error(
        "Practice history error:",
        error
      );

      callback([]);
    }
  );
}

// ======================================
// STATS
// ======================================

export function subscribePracticeStats(
  uid: string,
  callback: (
    stats:
      PracticeStats
  ) => void
) {
  return subscribePracticeSessions(
    uid,

    (sessions) => {
      const totalSeconds =
        sessions.reduce(
          (
            total,
            session
          ) =>
            total +
            session.durationSeconds,
          0
        );

      callback({
        sessionCount:
          sessions.length,

        totalSeconds,

        totalMinutes:
          Math.round(
            totalSeconds / 60
          ),

        streak:
          calculateStreak(
            sessions
          ),
      });
    }
  );
}

// ======================================
// STREAK
// ======================================

function calculateStreak(
  sessions:
    PracticeSession[]
) {
  if (
    sessions.length === 0
  ) {
    return 0;
  }

  const dayMap =
    new Map<
      string,
      Date
    >();

  sessions.forEach(
    (session) => {
      const date =
        new Date(
          session.createdAtMs
        );

      const normalized =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );

      const key =
        normalized.toISOString();

      dayMap.set(
        key,
        normalized
      );
    }
  );

  const days =
    Array.from(
      dayMap.values()
    ).sort(
      (a, b) =>
        b.getTime() -
        a.getTime()
    );

  if (
    days.length === 0
  ) {
    return 0;
  }

  const todayRaw =
    new Date();

  const today =
    new Date(
      todayRaw.getFullYear(),
      todayRaw.getMonth(),
      todayRaw.getDate()
    );

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() -
      1
  );

  const latest =
    days[0];

  if (
    latest.getTime() !==
      today.getTime() &&
    latest.getTime() !==
      yesterday.getTime()
  ) {
    return 0;
  }

  let streak = 1;

  let expected =
    new Date(latest);

  for (
    let i = 1;
    i < days.length;
    i++
  ) {
    expected.setDate(
      expected.getDate() -
        1
    );

    if (
      days[i].getTime() ===
      expected.getTime()
    ) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
// ======================================
// ONE PRACTICE SESSION
// ======================================

export function subscribePracticeSession(
  uid: string,
  sessionId: string,
  callback: (
    session:
      PracticeSession | null
  ) => void
) {
  return onSnapshot(
    doc(
      db,
      "users",
      uid,
      "practiceSessions",
      sessionId
    ),

    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id:
          snapshot.id,

        ...snapshot.data(),
      } as PracticeSession);
    },

    (error) => {
      console.error(
        "Practice session error:",
        error
      );

      callback(null);
    }
  );
}

// ======================================
// UPDATE PRACTICE SESSION
// ======================================

export async function updatePracticeSession(
  uid: string,
  sessionId: string,
  data: {
    bpm?: number | null;

    selfRating?:
      number | null;

    focusArea?: string;

    notes?: string;
  }
) {
  await updateDoc(
    doc(
      db,
      "users",
      uid,
      "practiceSessions",
      sessionId
    ),

    {
      ...data,

      updatedAt:
        serverTimestamp(),

      updatedAtMs:
        Date.now(),
    }
  );
}

// ======================================
// UPDATE AI PRACTICE ANALYSIS
// ======================================

export interface PracticeAnalysisUpdate {
  overallScore: number;

  noteAccuracy: number;

  timingScore: number;

  audioId: string;

  feedback?: string[];
}


export async function updatePracticeAnalysis(
  uid: string,
  sessionId: string,
  analysis:
    PracticeAnalysisUpdate
) {
  await updateDoc(
    doc(
      db,
      "users",
      uid,
      "practiceSessions",
      sessionId
    ),

    {
      overallScore:
        analysis.overallScore,

      noteAccuracy:
        analysis.noteAccuracy,

      timingScore:
        analysis.timingScore,

      audioId:
        analysis.audioId,

      analysisFeedback:
        analysis.feedback ??
        [],

      analysisUpdatedAt:
        serverTimestamp(),

      analysisUpdatedAtMs:
        Date.now(),
    }
  );
}

// ======================================
// DELETE SESSION
// ======================================

export async function deletePracticeSession(
  uid: string,
  sessionId: string
) {
  await deleteDoc(
    doc(
      db,
      "users",
      uid,
      "practiceSessions",
      sessionId
    )
  );
}

// ======================================
// DEMO PRACTICE DATA
// ======================================

export async function seedDemoPracticeSessions(
  uid: string
) {
  const now = Date.now();

  const demoSessions = [
    {
      daysAgo: 6,
      overallScore: 32,
      noteAccuracy: 38,
      timingScore: 26,
    },
    {
      daysAgo: 5,
      overallScore: 41,
      noteAccuracy: 47,
      timingScore: 35,
    },
    {
      daysAgo: 4,
      overallScore: 49,
      noteAccuracy: 55,
      timingScore: 43,
    },
    {
      daysAgo: 3,
      overallScore: 58,
      noteAccuracy: 64,
      timingScore: 52,
    },
    {
      daysAgo: 2,
      overallScore: 66,
      noteAccuracy: 72,
      timingScore: 60,
    },
    {
      daysAgo: 1,
      overallScore: 74,
      noteAccuracy: 81,
      timingScore: 67,
    },
    {
      daysAgo: 0,
      overallScore: 82,
      noteAccuracy: 88,
      timingScore: 76,
    },
  ];

  for (const demo of demoSessions) {
    const createdAtMs =
      now -
      demo.daysAgo *
        24 *
        60 *
        60 *
        1000;

    await addDoc(
      collection(
        db,
        "users",
        uid,
        "practiceSessions"
      ),
      {
        userId: uid,

        sourceType: "score",

        sourceId:
          "demo-c-major-scale",

        exerciseId:
          "c-major-scale",

        title:
          "C Major Scale - Demo",

        durationSeconds:
          60 + Math.floor(
            Math.random() * 60
          ),

        bpm: 60,

        selfRating: null,

        focusArea:
          "Scales",

        notes:
          "Demo progress data",

        overallScore:
          demo.overallScore,

        noteAccuracy:
          demo.noteAccuracy,

        timingScore:
          demo.timingScore,

        audioId:
          `demo-${createdAtMs}`,

        analysisFeedback: [
          "Demo AI feedback",
        ],

        analysisUpdatedAtMs:
          createdAtMs,

        createdAt:
          serverTimestamp(),

        createdAtMs,
      }
    );
  }
}
