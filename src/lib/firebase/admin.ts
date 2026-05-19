import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK — server-only singleton.
 *
 * Loaded lazily so that builds in environments without service-account
 * credentials don't crash at import time. API routes that need the admin
 * SDK should call `getFirebaseAdmin()` and surface a clean 5xx if it throws.
 */

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function buildAdminApp(): App {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private keys in env files commonly have `\n` escaped — unescape on read.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
    );
  }

  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getFirebaseAdminApp(): App {
  if (_app) return _app;
  _app = buildAdminApp();
  return _app;
}

export function getAdminAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseAdminApp());
  return _auth;
}

export function getAdminDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseAdminApp());
  return _db;
}

/**
 * Verify the bearer token from an incoming request and return the decoded
 * claims. Throws a clean error on failure — caller turns it into a 401.
 */
export async function verifyIdToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    throw new Error("Missing Authorization header");
  }
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Malformed Authorization header");
  }
  return getAdminAuth().verifyIdToken(token);
}
