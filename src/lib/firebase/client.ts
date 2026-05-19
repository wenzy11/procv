"use client";

import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase — client SDK singleton.
 *
 * Initialized once per browser session. The config values are read from
 * `NEXT_PUBLIC_FIREBASE_*` env vars and are safe to ship to the client
 * (Firebase enforces all access via Auth + Security Rules, not the API key).
 *
 * Consumers should import `getFirebaseAuth` / `getFirebaseDb` rather than
 * calling `getAuth()` / `getFirestore()` directly so we always reuse the
 * same `FirebaseApp` instance.
 */

interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

function readConfig(): FirebaseClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Firebase is not configured. Fill the NEXT_PUBLIC_FIREBASE_* values in .env.local.",
    );
  }
  _app = getApps().length === 0 ? initializeApp(config) : getApp();
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseApp());
  return _db;
}

/**
 * Lazily initialise Firebase Analytics in the browser.
 *
 * Analytics:
 *   - is browser-only (it pulls in `gtag` and uses cookies);
 *   - is gated by `isSupported()` so SSR / unsupported environments don't crash;
 *   - is no-op when the measurement ID is missing.
 */
/**
 * Optional Firebase App Check (reCAPTCHA v3). Set
 * `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY` in .env.local.
 */
export async function initAppCheck(): Promise<void> {
  if (typeof window === "undefined") return;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY;
  if (!siteKey) return;

  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import(
      "firebase/app-check"
    );
    initializeAppCheck(getFirebaseApp(), {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // App Check is optional.
  }
}

export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined") return;
  const config = readConfig();
  if (!config?.measurementId) return;

  try {
    const [{ getAnalytics, isSupported }] = await Promise.all([
      import("firebase/analytics"),
    ]);
    if (!(await isSupported())) return;
    getAnalytics(getFirebaseApp());
  } catch {
    // Analytics is optional — never let it break the app shell.
  }
}
