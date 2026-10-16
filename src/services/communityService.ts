import type {
  User,
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import {
  db,
} from "../config/firebase";

import type {
  GuitarPreset,
} from "../data/presets";

export type CloudPostType =
  | "text"
  | "preset"
  | "image";

export type CommentReactionType =
  | "like"
  | "dislike";

export interface PresetPostPreview {
  id: string;
  name: string;
  code: string;
  creator: string;
  tags: string[];
}

export interface CloudCommunityPost {
  id: string;

  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string;

  type: CloudPostType;

  content: string;

mediaUrl:
  string | null;

mediaPath:
  string | null;

mediaType:
  "image" | null;

  presetId: string | null;

  presetPreview:
    | PresetPostPreview
    | null;

  likeCount: number;
  commentCount: number;

  createdAtMs: number;
}

export interface CloudComment {
  id: string;

  authorId: string;

  authorName: string;

  authorUsername: string;

  authorAvatarUrl: string;

  content: string;

  createdAtMs: number;
}


interface CreatePostInput {
  type: CloudPostType;

  content: string;

  preset?: GuitarPreset;

  mediaUrl?: string;

mediaPath?: string;
}

// ======================================
// GET USER PROFILE
// ======================================

async function getAuthorInfo(
  user: User
) {
  const snapshot =
    await getDoc(
      doc(
        db,
        "users",
        user.uid
      )
    );

  const data =
    snapshot.exists()
      ? snapshot.data()
      : {};

  const username =
    data.username ||
    user.email?.split("@")[0] ||
    "guitarist";

  const displayName =
    data.displayName ||
    user.displayName ||
    username;

  const avatarUrl =
    data.avatarUrl ||
    user.photoURL ||
    "";

  return {
    username,
    displayName,
    avatarUrl,
  };
}

// ======================================
// CREATE POST
// ======================================

export async function createCommunityPost(
  user: User,
  input: CreatePostInput
) {
  const author =
    await getAuthorInfo(user);

  let presetPreview:
    | PresetPostPreview
    | null = null;

  let presetId:
    | string
    | null = null;

  if (
    input.type === "preset" &&
    input.preset
  ) {
    presetId =
      input.preset.id;

    presetPreview = {
      id:
        input.preset.id,

      name:
        input.preset.name,

      code:
        input.preset.code,

      creator:
        input.preset.creator,

      tags:
        input.preset.tags,
    };
  }

  const postRef =
    await addDoc(
      collection(
        db,
        "posts"
      ),
      {
        authorId:
          user.uid,

        authorName:
          author.displayName,

        authorUsername:
          author.username,

        authorAvatarUrl:
          author.avatarUrl,

        type:
          input.type,

        content:
          input.content.trim(),

        mediaUrl:
  input.mediaUrl ??
  null,

mediaPath:
  input.mediaPath ??
  null,

mediaType:
  input.type ===
  "image"
    ? "image"
    : null,

        presetId,

        presetPreview,

        likeCount: 0,

        commentCount: 0,

        createdAt:
          serverTimestamp(),

        // Dùng field này để
        // orderBy đơn giản cho MVP.
        createdAtMs:
          Date.now(),
      }
    );

  return postRef.id;
}

// ======================================
// REALTIME COMMUNITY FEED
// ======================================

export function subscribeCommunityPosts(
  callback: (
    posts: CloudCommunityPost[]
  ) => void
) {
  const postsQuery =
    query(
      collection(
        db,
        "posts"
      ),

      orderBy(
        "createdAtMs",
        "desc"
      ),

      limit(50)
    );

  return onSnapshot(
    postsQuery,

    (snapshot) => {
      const posts =
        snapshot.docs.map(
          (snapshot) => ({
            id:
              snapshot.id,

            ...snapshot.data(),
          })
        ) as CloudCommunityPost[];

      callback(posts);
    },

    (error) => {
      console.error(
        "Community subscription error:",
        error
      );

      callback([]);
    }
  );
}

// ======================================
// REALTIME POST LIKES
// ======================================

export function subscribePostLikes(
  postId: string,
  currentUserId: string | undefined,
  callback: (data: {
    count: number;
    liked: boolean;
  }) => void
) {
  const likesRef =
    collection(
      db,
      "posts",
      postId,
      "likes"
    );

  return onSnapshot(
    likesRef,

    (snapshot) => {
      const liked =
        currentUserId
          ? snapshot.docs.some(
              (likeDoc) =>
                likeDoc.id ===
                currentUserId
            )
          : false;

      callback({
        count: snapshot.size,
        liked,
      });
    },

    (error) => {
      console.error(
        "Like subscription error:",
        error
      );
    }
  );
}

// ======================================
// SET / REMOVE LIKE
// ======================================

export async function setPostLike(
  postId: string,
  uid: string,
  shouldLike: boolean
) {
  const likeRef =
    doc(
      db,
      "posts",
      postId,
      "likes",
      uid
    );

  if (shouldLike) {
    await setDoc(
      likeRef,
      {
        userId: uid,
        createdAt:
          serverTimestamp(),
      }
    );

    return;
  }

  await deleteDoc(
    likeRef
  );
}

// ======================================
// CREATE COMMENT
// ======================================

export async function createPostComment(
  user: User,
  postId: string,
  content: string
) {
  const cleanContent =
    content.trim();

  if (!cleanContent) {
    return;
  }

  const author =
    await getAuthorInfo(user);

  await addDoc(
    collection(
      db,
      "posts",
      postId,
      "comments"
    ),
    {
      authorId:
        user.uid,

      authorName:
        author.displayName,

      authorUsername:
        author.username,

      authorAvatarUrl:
        author.avatarUrl,

      content:
        cleanContent,

      createdAt:
        serverTimestamp(),

      createdAtMs:
        Date.now(),
    }
  );
}

// ======================================
// REALTIME COMMENTS
// ======================================

export function subscribePostComments(
  postId: string,
  callback: (
    comments: CloudComment[]
  ) => void
) {
  const commentsQuery =
    query(
      collection(
        db,
        "posts",
        postId,
        "comments"
      ),

      orderBy(
        "createdAtMs",
        "asc"
      )
    );

  return onSnapshot(
    commentsQuery,

    (snapshot) => {
      const comments =
        snapshot.docs.map(
          (commentDoc) => ({
            id:
              commentDoc.id,

            ...commentDoc.data(),
          })
        ) as CloudComment[];

      callback(comments);
    },

    (error) => {
      console.error(
        "Comment subscription error:",
        error
      );

      callback([]);
    }
  );
}

// ======================================
// COMMENT REACTIONS
// ======================================

export function subscribeCommentReactions(
  postId: string,
  commentId: string,
  currentUserId: string | undefined,
  callback: (data: {
    likes: number;
    dislikes: number;
    myReaction:
      | CommentReactionType
      | null;
  }) => void
) {
  const reactionsRef =
    collection(
      db,
      "posts",
      postId,
      "comments",
      commentId,
      "reactions"
    );

  return onSnapshot(
    reactionsRef,

    (snapshot) => {
      let likes = 0;
      let dislikes = 0;

      let myReaction:
        | CommentReactionType
        | null = null;

      snapshot.docs.forEach(
        (reactionDoc) => {
          const data =
            reactionDoc.data();

          if (
            data.type === "like"
          ) {
            likes++;
          }

          if (
            data.type === "dislike"
          ) {
            dislikes++;
          }

          if (
            currentUserId &&
            reactionDoc.id ===
              currentUserId
          ) {
            myReaction =
              data.type;
          }
        }
      );

      callback({
        likes,
        dislikes,
        myReaction,
      });
    },

    (error) => {
      console.error(
        "Comment reaction subscription error:",
        error
      );
    }
  );
}

export async function setCommentReaction(
  postId: string,
  commentId: string,
  uid: string,
  reaction:
    | CommentReactionType
    | null
) {
  const reactionRef =
    doc(
      db,
      "posts",
      postId,
      "comments",
      commentId,
      "reactions",
      uid
    );

  if (!reaction) {
    await deleteDoc(
      reactionRef
    );

    return;
  }

  await setDoc(
    reactionRef,
    {
      userId: uid,

      type: reaction,

      createdAt:
        serverTimestamp(),
    }
  );
}

// ======================================
// REALTIME POSTS OF ONE USER
// ======================================

export function subscribeUserPosts(
  uid: string,
  callback: (
    posts: CloudCommunityPost[]
  ) => void
) {
  const postsQuery =
    query(
      collection(
        db,
        "posts"
      ),

      where(
        "authorId",
        "==",
        uid
      )
    );

  return onSnapshot(
    postsQuery,

    (snapshot) => {
      const posts =
        snapshot.docs.map(
          (postDoc) => ({
            id:
              postDoc.id,

            ...postDoc.data(),
          })
        ) as CloudCommunityPost[];

      // Sort ở client để không cần
      // composite Firestore index.
      posts.sort(
        (a, b) =>
          (b.createdAtMs || 0) -
          (a.createdAtMs || 0)
      );

      callback(posts);
    },

    (error) => {
      console.error(
        "User posts subscription error:",
        error
      );

      callback([]);
    }
  );
}