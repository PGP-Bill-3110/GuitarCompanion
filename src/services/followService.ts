import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import {
  db,
} from "../config/firebase";

export interface FollowStats {
  followers: number;
  following: number;
}

// ======================================
// FOLLOW DOCUMENT ID
// ======================================

function getFollowId(
  followerId: string,
  followingId: string
) {
  return `${followerId}__${followingId}`;
}

// ======================================
// FOLLOW
// ======================================

export async function followUser(
  followerId: string,
  followingId: string
) {
  if (
    followerId ===
    followingId
  ) {
    return;
  }

  const followRef =
    doc(
      db,
      "follows",
      getFollowId(
        followerId,
        followingId
      )
    );

  await setDoc(
    followRef,
    {
      followerId,
      followingId,

      createdAt:
        serverTimestamp(),

      createdAtMs:
        Date.now(),
    }
  );
}

// ======================================
// UNFOLLOW
// ======================================

export async function unfollowUser(
  followerId: string,
  followingId: string
) {
  await deleteDoc(
    doc(
      db,
      "follows",
      getFollowId(
        followerId,
        followingId
      )
    )
  );
}

// ======================================
// CURRENT FOLLOW STATE
// ======================================

export function subscribeFollowState(
  currentUid: string,
  targetUid: string,
  callback: (
    following: boolean
  ) => void
) {
  return onSnapshot(
    doc(
      db,
      "follows",
      getFollowId(
        currentUid,
        targetUid
      )
    ),

    (snapshot) => {
      callback(
        snapshot.exists()
      );
    },

    (error) => {
      console.error(
        "Follow state error:",
        error
      );

      callback(false);
    }
  );
}

// ======================================
// FOLLOWER COUNT
// ======================================

export function subscribeFollowerCount(
  uid: string,
  callback: (
    count: number
  ) => void
) {
  const q =
    query(
      collection(
        db,
        "follows"
      ),

      where(
        "followingId",
        "==",
        uid
      )
    );

  return onSnapshot(
    q,

    (snapshot) => {
      callback(
        snapshot.size
      );
    }
  );
}

// ======================================
// GET FOLLOWER IDS
// ======================================

export async function getFollowerIds(
  uid: string
): Promise<string[]> {
  const followersQuery =
    query(
      collection(
        db,
        "follows"
      ),

      where(
        "followingId",
        "==",
        uid
      )
    );

  const snapshot =
    await getDocs(
      followersQuery
    );

  return snapshot.docs
    .map((followDoc) => {
      const data =
        followDoc.data();

      return data.followerId        as string;
    })
    .filter(Boolean);
}

// ======================================
// FOLLOWING IDS
// ======================================

export function subscribeFollowingIds(
  uid: string,
  callback: (
    ids: string[]
  ) => void
) {
  const followingQuery =
    query(
      collection(
        db,
        "follows"
      ),

      where(
        "followerId",
        "==",
        uid
      )
    );

  return onSnapshot(
    followingQuery,

    (snapshot) => {
      const ids =
        snapshot.docs
          .map((item) => {
            const data =
              item.data();

            return data.followingId              as string;
          })
          .filter(Boolean);

      callback(ids);
    },

    (error) => {
      console.error(
        "Following subscription error:",
        error
      );

      callback([]);
    }
  );
}

// ======================================
// FOLLOWING COUNT
// ======================================

export function subscribeFollowingCount(
  uid: string,
  callback: (
    count: number
  ) => void
) {
  const q =
    query(
      collection(
        db,
        "follows"
      ),

      where(
        "followerId",
        "==",
        uid
      )
    );

  return onSnapshot(
    q,

    (snapshot) => {
      callback(
        snapshot.size
      );
    }
  );
}

// ======================================
// REALTIME FOLLOWER IDS
// ======================================

export function subscribeFollowerIds(
  uid: string,
  callback: (
    ids: string[]
  ) => void
) {
  const followersQuery =
    query(
      collection(
        db,
        "follows"
      ),

      where(
        "followingId",
        "==",
        uid
      )
    );

  return onSnapshot(
    followersQuery,

    (snapshot) => {
      const ids =
        snapshot.docs
          .map(
            (followDoc) => {
              const data =
                followDoc.data();

              return data.followerId as string;
            }
          )
          .filter(Boolean);

      callback(ids);
    },

    (error) => {
      console.error(
        "Followers subscription error:",
        error
      );

      callback([]);
    }
  );
}