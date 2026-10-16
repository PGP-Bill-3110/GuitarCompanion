import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
} from "../config/firebase";

export interface RecordProject {
  id: string;

  userId: string;

  title: string;

  durationSeconds: number;

  audioUri: string;

  status:
    | "draft"
    | "completed";

  createdAtMs: number;
}

export async function createRecordProject(
  uid: string,
  input: {
    title: string;

    durationSeconds: number;

    audioUri: string;
  }
) {
  const projectRef =
    await addDoc(
      collection(
        db,
        "users",
        uid,
        "recordProjects"
      ),
      {
        userId: uid,

        title:
          input.title.trim(),

        durationSeconds:
          Math.max(
            1,
            Math.round(
              input.durationSeconds
            )
          ),

        audioUri:
          input.audioUri,

        status:
          "draft",

        createdAt:
          serverTimestamp(),

        createdAtMs:
          Date.now(),
      }
    );

  return projectRef.id;
}

export function subscribeRecordProjects(
  uid: string,
  callback: (
    projects:
      RecordProject[]
  ) => void
) {
  const projectsQuery =
    query(
      collection(
        db,
        "users",
        uid,
        "recordProjects"
      ),

      orderBy(
        "createdAtMs",
        "desc"
      ),

      limit(20)
    );

  return onSnapshot(
    projectsQuery,

    (snapshot) => {
      callback(
        snapshot.docs.map(
          (projectDoc) => ({
            id:
              projectDoc.id,

            ...projectDoc.data(),
          })
        ) as RecordProject[]
      );
    },

    (error) => {
      console.error(
        "Record projects error:",
        error
      );

      callback([]);
    }
  );
}