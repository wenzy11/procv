#!/usr/bin/env node
/**
 * Quick smoke test that the Firebase Admin SDK can initialise with the
 * credentials in `.env.local`. Run with `node --env-file=.env.local
 * scripts/verify-firebase.mjs` (Node 20+).
 *
 * Outputs:
 *   ✅  on success: prints the project ID + a short summary.
 *   ❌  on failure: prints the error so you know what to fix.
 *
 * This file is dev-only — exclude from any production bundle.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Missing FIREBASE_ADMIN_* env vars.");
  process.exit(1);
}

try {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

  // Touch both services so we surface any IAM permission issues now.
  const auth = getAuth(app);
  const db = getFirestore(app);

  const userCount = await auth.listUsers(1).then((r) => r.users.length);
  await db.collection("__procv_health").doc("ping").set({
    at: Date.now(),
    note: "verify-firebase script",
  });

  console.log("✅ Firebase Admin SDK initialised");
  console.log("   project_id   :", projectId);
  console.log("   client_email :", clientEmail);
  console.log("   auth users   :", userCount, "(sampled)");
  console.log("   firestore    : write OK to /__procv_health/ping");
  process.exit(0);
} catch (err) {
  console.error("❌ Failed to initialise Firebase Admin:");
  console.error(err);
  process.exit(1);
}
