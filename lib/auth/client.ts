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
      return "Sign-in popup was closed. Try again.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Allow popups for this site.";
    case "auth/internal-error":
      return "Firebase Auth failed (internal). Check authorized domains include localhost, and that Email/Google providers are enabled.";
    case "auth/invalid-api-key":
      return "Invalid Firebase API key in .env.local.";
    case "auth/network-request-failed":
      return "Network error talking to Firebase. Check your connection.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid credentials";
    case "auth/email-already-in-use":
      return "That email is already registered.";
    case "auth/weak-password":
      return "Password is too weak.";
    default:
      return err instanceof Error ? err.message : "Authentication failed";
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
