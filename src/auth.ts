import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signOut,
  type User,
} from "firebase/auth/web-extension";
import { app, firebaseReady } from "./firebase";

export const auth = getAuth(app);

export async function ensureSession(): Promise<User | null> {
  if (!firebaseReady()) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn("anonymous sign-in failed", err);
    return null;
  }
}

export async function signIn(): Promise<User | null> {
  if (!firebaseReady()) throw new Error("Firebase is not configured");

  // In Chrome extensions, Chrome Identity API provides OAuth tokens
  if (typeof chrome !== "undefined" && chrome.identity?.getAuthToken) {
    try {
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (t) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (t) {
            resolve(t);
          } else {
            reject(new Error("No OAuth token returned"));
          }
        });
      });
      const credential = GoogleAuthProvider.credential(null, token);
      const cred = await signInWithCredential(auth, credential);
      return cred.user;
    } catch (err) {
      console.warn("Chrome identity sign-in failed, falling back to anonymous session:", err);
    }
  }

  // Graceful fallback to anonymous session
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export const signOutUser = () => signOut(auth);

export const onUser = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);
