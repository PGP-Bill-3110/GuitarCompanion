import type {
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";

import {
  db,
} from "../config/firebase";

export interface PublicProfile {
  uid: string;

  displayName: string;
  username: string;
  avatarUrl: string;

  level: string;

  bio: string;

  favoriteGenres: string[];

  gear: string[];

  createdAtMs: number;
}

// ======================================
// ENSURE PUBLIC PROFILE
// ======================================

export async function ensurePublicProfile(
  user: User
) {
  const privateProfileRef =
    doc(
      db,
      "users",
      user.uid
    );

  const privateSnapshot =
    await getDoc(
      privateProfileRef
    );

  const privateData =
    privateSnapshot.exists()
      ? privateSnapshot.data()
      : {};

  const publicProfileRef =
    doc(
      db,
      "publicProfiles",
      user.uid
    );

  const publicSnapshot =
    await getDoc(
      publicProfileRef
    );

  // Nếu đã tồn tại thì không overwrite
  // bio / genres / gear sau này.
  if (publicSnapshot.exists()) {
    return;
  }

  const username =
    privateData.username ||
    user.email
      ?.split("@")[0] ||
    "guitarist";

  await setDoc(
    publicProfileRef,
    {
      uid:
        user.uid,

      displayName:
        privateData.displayName ||
        user.displayName ||
        username,

      username,

      avatarUrl:
        privateData.avatarUrl ||
        user.photoURL ||
        "",

      level:
        privateData.level ||
        "beginner",

      bio: "",

      favoriteGenres: [],

      gear: [],

      createdAt:
        serverTimestamp(),

      createdAtMs:
        Date.now(),
    }
  );
}

// ======================================
// REALTIME PUBLIC PROFILE
// ======================================

export function subscribePublicProfile(
  uid: string,
  callback: (
    profile:
      PublicProfile | null
  ) => void
) {
  return onSnapshot(
    doc(
      db,
      "publicProfiles",
      uid
    ),

    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(
        snapshot.data()  as PublicProfile
      );
    },

    (error) => {
      console.error(
        "Public profile subscription error:",
        error
      );

      callback(null);
    }
  );
}

// ======================================
// GET MULTIPLE PUBLIC PROFILES
// ======================================

export async function getPublicProfilesByIds(
  userIds: string[]
): Promise<PublicProfile[]> {
  if (
    userIds.length === 0
  ) {
    return [];
  }

  const snapshots =
    await Promise.all(
      userIds.map(
        (uid) =>
          getDoc(
            doc(
              db,
              "publicProfiles",
              uid
            )
          )
      )
    );

  return snapshots
    .filter(
      (snapshot) =>
        snapshot.exists()
    )
    .map(
      (snapshot) =>
        snapshot.data()          as PublicProfile
    );
}

export interface GuitarIdentityInput {
  displayName: string;
  username: string;
  bio: string;
  level: string;
  favoriteGenres: string[];
  gear: string[];
}

// ======================================
// UPDATE GUITAR IDENTITY
// ======================================

export async function updateGuitarIdentity(
  uid: string,
  input: GuitarIdentityInput
) {
  const batch = writeBatch(db);

  const publicRef =
    doc(
      db,
      "publicProfiles",
      uid
    );

  const privateRef =
    doc(
      db,
      "users",
      uid
    );

  const publicData = {
    uid,

    displayName:
      input.displayName.trim(),

    username:
      input.username
        .trim()
        .toLowerCase(),

    bio:
      input.bio.trim(),

    level:
      input.level,

    favoriteGenres:
      input.favoriteGenres,

    gear:
      input.gear,

    updatedAt:
      serverTimestamp(),

    updatedAtMs:
      Date.now(),
  };

  // Public data
  batch.set(
    publicRef,
    publicData,
    {
      merge: true,
    }
  );

  // Những field cần dùng trong
  // profile cá nhân.
  batch.set(
    privateRef,
    {
      displayName:
        publicData.displayName,

      username:
        publicData.username,

      level:
        publicData.level,

      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  await batch.commit();
}