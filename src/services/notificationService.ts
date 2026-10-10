import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  db,
} from "../config/firebase";

import {
  getFollowerIds,
} from "./followService";

export type NotificationType =
  | "post_like"
  | "post_comment"
  | "preset_saved"
  | "new_follower"
  | "follow_post";

export interface AppNotification {
  id: string;

  type: NotificationType;

  actorId: string;

  actorName: string;

  postId?: string;

  presetId?: string;

  message: string;

  read: boolean;

  createdAtMs: number;
}

// ======================================
// CREATE
// ======================================

export async function createNotification(
  targetUserId: string,

  data: Omit<
    AppNotification,
    | "id"
    | "read"
    | "createdAtMs"
  >
) {
  await addDoc(
    collection(
      db,
      "users",
      targetUserId,
      "notifications"
    ),
    {
      ...data,

      read: false,

      createdAt:
        serverTimestamp(),

      createdAtMs:
        Date.now(),
    }
  );
}

// ======================================
// NOTIFY FOLLOWERS ABOUT NEW POST
// ======================================

interface NotifyFollowersInput {
  actorId: string;

  actorName: string;

  postId: string;

  postType:
    | "text"
    | "preset";

  presetId?: string;

  presetName?: string;
}

export async function notifyFollowersOfNewPost(
  input: NotifyFollowersInput
) {
  const followerIds =
    await getFollowerIds(
      input.actorId
    );

  if (
    followerIds.length === 0
  ) {
    return;
  }

  const message =
    input.postType ===
      "preset"
      ? input.presetName
        ? `đã chia sẻ preset ${input.presetName}.`
        : "đã chia sẻ một preset mới."
      : "đã đăng một bài viết mới.";

  await Promise.all(
    followerIds.map(
      (followerId) =>
        createNotification(
          followerId,
          {
            type:
              "follow_post",

            actorId:
              input.actorId,

            actorName:
              input.actorName,

            postId:
              input.postId,

            // Firestore không nhận undefined.
            ...(input.presetId
              ? {
                  presetId:
                    input.presetId,
                }
              : {}),

            message,
          }
        )
    )
  );
}

// ======================================
// REALTIME LIST
// ======================================

export function subscribeNotifications(
  uid: string,

  callback: (
    notifications:
      AppNotification[]
  ) => void
) {
  const notificationsQuery =
    query(
      collection(
        db,
        "users",
        uid,
        "notifications"
      ),

      orderBy(
        "createdAtMs",
        "desc"
      ),

      limit(100)
    );

  return onSnapshot(
    notificationsQuery,

    (snapshot) => {
      const notifications =
        snapshot.docs.map(
          (
            notificationDoc
          ) => ({
            id:
              notificationDoc.id,

            ...notificationDoc.data(),
          })
        ) as AppNotification[];

      callback(
        notifications
      );
    },

    (error) => {
      console.error(
        "Notification subscription error:",
        error
      );

      callback([]);
    }
  );
}

// ======================================
// UNREAD COUNT
// ======================================

export function subscribeUnreadNotificationCount(
  uid: string,

  callback: (
    count: number
  ) => void
) {
  return onSnapshot(
    collection(
      db,
      "users",
      uid,
      "notifications"
    ),

    (snapshot) => {
      const unread =
        snapshot.docs.filter(
          (notificationDoc) =>
            notificationDoc
              .data()
              .read !== true
        ).length;

      callback(unread);
    },

    (error) => {
      console.error(
        "Unread notification error:",
        error
      );

      callback(0);
    }
  );
}

// ======================================
// MARK ONE AS READ
// ======================================

export async function markNotificationRead(
  uid: string,
  notificationId: string
) {
  await updateDoc(
    doc(
      db,
      "users",
      uid,
      "notifications",
      notificationId
    ),
    {
      read: true,
    }
  );
}

// ======================================
// MARK ALL AS READ
// ======================================

export async function markAllNotificationsRead(
  uid: string
) {
  const notificationsQuery =
    query(
      collection(
        db,
        "users",
        uid,
        "notifications"
      ),

      orderBy(
        "createdAtMs",
        "desc"
      ),

      limit(100)
    );

  const snapshot =
    await getDocs(
      notificationsQuery
    );

  const unreadDocs =
    snapshot.docs.filter(
      (notificationDoc) =>
        notificationDoc
          .data()
          .read !== true
    );

  if (
    unreadDocs.length === 0
  ) {
    return;
  }

  const batch =
    writeBatch(db);

  unreadDocs.forEach(
    (notificationDoc) => {
      batch.update(
        notificationDoc.ref,
        {
          read: true,
        }
      );
    }
  );

  await batch.commit();
}