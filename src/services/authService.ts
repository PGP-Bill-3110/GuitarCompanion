import {
  GoogleAuthProvider,
  User,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../config/firebase";

const googleProvider =
  new GoogleAuthProvider();

// Hiển thị màn chọn tài khoản Google
// thay vì tự động dùng tài khoản gần nhất.
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ============================================
// CREATE FIRESTORE PROFILE IF NEEDED
// ============================================

export async function ensureUserProfile(
  user: User
) {
  const userRef = doc(
    db,
    "users",
    user.uid
  );

  const snapshot =
    await getDoc(userRef);

  // Nếu đã có profile thì không ghi đè
  if (snapshot.exists()) {
    return;
  }

  const emailUsername =
    user.email
      ?.split("@")[0]
      ?.replace(
        /[^a-zA-Z0-9_]/g,
        ""
      ) || "guitarist";

  await setDoc(userRef, {
    uid: user.uid,

    email:
      user.email || "",

    username:
      user.displayName
        ?.trim()
        .replace(/\s+/g, "")
        .toLowerCase() ||
      emailUsername,

    displayName:
      user.displayName || "",

    avatarUrl:
      user.photoURL || "",

    level: "beginner",

    plan: "free",

    streak: 0,

    practiceMinutes: 0,

    provider: "google",

    createdAt:
      serverTimestamp(),
  });
}

// ============================================
// GOOGLE SIGN IN
// ============================================

export async function loginWithGoogle() {
  const credential =
    await signInWithPopup(
      auth,
      googleProvider
    );

  await ensureUserProfile(
    credential.user
  );

  return credential.user;
}