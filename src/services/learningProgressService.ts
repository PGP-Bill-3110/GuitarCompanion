import { collection, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getLearningLesson } from "../data/learningPath";

export type LearningStatus = "in_progress" | "completed";

export interface LessonProgress {
  lessonId: string;
  status: LearningStatus;
  startedAtMs?: number;
  completedAtMs?: number;
  updatedAtMs: number;
  rhythmAttempts?: number;
  rhythmLastScore?: number;
  rhythmBestScore?: number;
  rhythmLastBpm?: number;
  rhythmLastPatternId?: string;
  rhythmLastAtMs?: number;
}

export type LearningProgressById = Record<string, LessonProgress>;

function progressDocument(uid: string, lessonId: string) {
  if (!getLearningLesson(lessonId)) throw new Error("Unknown lesson");
  return doc(db, "users", uid, "learningProgress", lessonId);
}

export function subscribeLearningProgress(
  uid: string,
  onData: (progress: LearningProgressById) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "learningProgress"),
    (snapshot) => {
      const entries: LearningProgressById = {};
      snapshot.forEach((item) => {
        if (!getLearningLesson(item.id)) return;
        const raw = item.data();
        entries[item.id] = {
          lessonId: item.id,
          status: raw.status === "completed" ? "completed" : "in_progress",
          startedAtMs: Number(raw.startedAtMs) || undefined,
          completedAtMs: Number(raw.completedAtMs) || undefined,
          updatedAtMs: Number(raw.updatedAtMs) || 0,
          rhythmAttempts: Number(raw.rhythmAttempts) || 0,
          rhythmLastScore: typeof raw.rhythmLastScore === "number" ? raw.rhythmLastScore : undefined,
          rhythmBestScore: typeof raw.rhythmBestScore === "number" ? raw.rhythmBestScore : undefined,
          rhythmLastBpm: Number(raw.rhythmLastBpm) || undefined,
          rhythmLastPatternId: typeof raw.rhythmLastPatternId === "string" ? raw.rhythmLastPatternId : undefined,
          rhythmLastAtMs: Number(raw.rhythmLastAtMs) || undefined,
        };
      });
      onData(entries);
    },
    (error) => {
      console.error("Learning progress Firestore subscription error:", error);
      onError?.(error);
    }
  );
}

export async function startLearningLesson(uid: string, lessonId: string) {
  const now = Date.now();
  await setDoc(progressDocument(uid, lessonId), {
    lessonId,
    status: "in_progress",
    startedAtMs: now,
    updatedAtMs: now,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function completeLearningLesson(uid: string, lessonId: string) {
  const now = Date.now();
  await setDoc(progressDocument(uid, lessonId), {
    lessonId,
    status: "completed",
    completedAtMs: now,
    updatedAtMs: now,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export interface RhythmPracticeEntry {
  score: number;
  bpm: number;
  patternId: string;
}

/**
 * Save an explicitly submitted TAP result on the linked lesson document.
 * Never marks a lesson complete: checklist + quiz completion stays independent.
 */
export async function saveRhythmPractice(
  uid: string,
  lessonId: string,
  entry: RhythmPracticeEntry,
) {
  if (!Number.isFinite(entry.score) || entry.score < 0 || entry.score > 100) {
    throw new Error("Invalid rhythm score");
  }
  if (!Number.isFinite(entry.bpm) || entry.bpm < 40 || entry.bpm > 180) {
    throw new Error("Invalid rhythm BPM");
  }
  const ref = progressDocument(uid, lessonId);
  const now = Date.now();
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref);
    const previous = snapshot.exists() ? snapshot.data() : null;
    const score = Math.round(entry.score);
    tx.set(ref, {
      lessonId,
      status: previous?.status === "completed" ? "completed" : "in_progress",
      startedAtMs: Number(previous?.startedAtMs) || now,
      updatedAtMs: now,
      updatedAt: serverTimestamp(),
      rhythmAttempts: Math.max(0, Number(previous?.rhythmAttempts) || 0) + 1,
      rhythmLastScore: score,
      rhythmBestScore: Math.max(score, Number(previous?.rhythmBestScore) || 0),
      rhythmLastBpm: entry.bpm,
      rhythmLastPatternId: entry.patternId,
      rhythmLastAtMs: now,
    }, { merge: true });
  });
}
