"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { normalizePlan } from "@/lib/billing/plan";
import type { SubscriptionStatus, UserPlan } from "@/lib/billing/types";

import { getFirebaseAuth, getFirebaseDb } from "./client";

/** Public app-side projection of a Firebase user. */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/* -------------------------------------------------------------------------
 * Profile document (one per user) lives at users/{uid}.
 *
 * Stores user-scoped preferences that aren't covered by Firebase Auth itself
 * (currently: locale). Auth-managed fields (email, displayName) are mirrored
 * here only for offline-friendly reads.
 * --------------------------------------------------------------------- */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  locale: string;
  plan?: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
  createdAt: number;
  updatedAt: number;
}

function profileRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

export async function ensureUserProfile(user: FirebaseUser, locale: string) {
  const ref = profileRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    locale,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    locale: data.locale ?? "en",
    plan: normalizePlan(data.plan as string | undefined),
    subscriptionStatus: data.subscriptionStatus ?? "none",
    createdAt: data.createdAt?.toMillis?.() ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? 0,
  };
}

export async function updateUserLocale(uid: string, locale: string) {
  await setDoc(
    profileRef(uid),
    { locale, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/* -------------------------------------------------------------------------
 * Auth helpers
 * --------------------------------------------------------------------- */

export function subscribeToAuth(cb: (u: AppUser | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), (u) => {
    cb(u ? toAppUser(u) : null);
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  locale: string,
): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await ensureUserProfile(cred.user, locale);
  await sendEmailVerification(cred.user);
  return toAppUser(cred.user);
}

export async function resendVerificationEmail(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  await sendEmailVerification(user);
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  return toAppUser(cred.user);
}

const AUTH_LOCALE_KEY = "procv_auth_locale";

/** Persist locale across Google redirect sign-in. */
export function stashAuthLocale(locale: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_LOCALE_KEY, locale);
  }
}

function takeAuthLocale(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = sessionStorage.getItem(AUTH_LOCALE_KEY);
  if (v) sessionStorage.removeItem(AUTH_LOCALE_KEY);
  return v ?? fallback;
}

/** Thrown when `signInWithRedirect` navigates away (not a real failure). */
export class GoogleRedirectPendingError extends Error {
  constructor() {
    super("GOOGLE_REDIRECT_PENDING");
    this.name = "GoogleRedirectPendingError";
  }
}

export async function signInWithGoogle(locale: string): Promise<AppUser> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  stashAuthLocale(locale);

  try {
    const cred = await signInWithPopup(auth, provider);
    await ensureUserProfile(cred.user, locale);
    return toAppUser(cred.user);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : "";

    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, provider);
      throw new GoogleRedirectPendingError();
    }
    throw err;
  }
}

/** Call on /sign-in and /sign-up after Google redirect. */
export async function completeGoogleRedirectSignIn(
  fallbackLocale: string,
): Promise<AppUser | null> {
  const result = await getRedirectResult(getFirebaseAuth());
  if (!result?.user) return null;
  const locale = takeAuthLocale(fallbackLocale);
  await ensureUserProfile(result.user, locale);
  return toAppUser(result.user);
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

/**
 * Read the current user's ID token. API routes use this to verify the caller.
 * Returns null when no user is signed in.
 */
export async function getIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function toAppUser(u: FirebaseUser): AppUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
  };
}
