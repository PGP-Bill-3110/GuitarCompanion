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

  title: string;

  durationSeconds: number;

  bpm:
    number | null;

  selfRating:
    number | null;

  focusArea: string;

  notes: string;

  accuracy:
    number | null;

  timingScore:
    number | null;

  noteAccuracy:
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

  title: string;

  durationSeconds: number;

  bpm?: number;

  selfRating?: number;

  focusArea?: string;

  notes?: string;

  accuracy?: number;

  timingScore?: number;

  noteAccuracy?: number;
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

        accuracy:
          input.accuracy ??
          null,

        timingScore:
          input.timingScore ??
          null,

        noteAccuracy:
          input.noteAccuracy ??
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