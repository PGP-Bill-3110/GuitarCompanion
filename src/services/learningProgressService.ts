import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getLearningLesson } from "../data/learningPath";

export type LearningStatus = "in_progress" | "completed";

export interface LessonProgress {
  lessonId: string;
  status: LearningStatus;
  startedAtMs?: number;
  completedAtMs?: number;
  updatedAtMs: number;
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
