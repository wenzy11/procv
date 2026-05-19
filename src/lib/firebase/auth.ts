"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

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
    plan: data.plan === "pro" ? "pro" : "free",
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

export async function signInWithGoogle(locale: string): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(getFirebaseAuth(), provider);
  await ensureUserProfile(cred.user, locale);
  return toAppUser(cred.user);
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
