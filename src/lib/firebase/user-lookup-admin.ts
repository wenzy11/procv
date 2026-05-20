import "server-only";

import { getAdminAuth, getAdminDb } from "./admin";

/** Find Firebase uid by email (webhook fallback when external_customer_id missing). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  try {
    const authUser = await getAdminAuth().getUserByEmail(normalized);
    if (authUser.uid) return authUser.uid;
  } catch {
    /* fall through to Firestore */
  }

  const snap = await getAdminDb()
    .collection("users")
    .where("email", "==", normalized)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0]?.id ?? null;
}
