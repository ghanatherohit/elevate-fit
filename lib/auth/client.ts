import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type AuthError,
} from "firebase/auth";
import { firebaseAuth } from "./firebase-client";
import { toUserMessage, USER_ERRORS } from "@/lib/errors/user-facing";

export function formatFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as AuthError).code === "string"
      ? (err as AuthError).code
      : "";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return USER_ERRORS.popupClosed;
    case "auth/popup-blocked":
      return USER_ERRORS.popupBlocked;
    case "auth/internal-error":
    case "auth/invalid-api-key":
      return USER_ERRORS.unavailable;
    case "auth/network-request-failed":
      return USER_ERRORS.network;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return USER_ERRORS.invalidCredentials;
    case "auth/email-already-in-use":
      return USER_ERRORS.emailInUse;
    case "auth/weak-password":
      return USER_ERRORS.weakPassword;
    default:
      return toUserMessage(err, USER_ERRORS.signInFailed);
  }
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  return credential.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(firebaseAuth, provider);
  return credential.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(firebaseAuth, email);
}
