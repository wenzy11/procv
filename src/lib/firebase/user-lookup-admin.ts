import "server-only";

import { getAdminDb } from "./admin";

/** Find Firebase uid by profile email (fallback when Gumroad ping has no user_id). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const snap = await getAdminDb()
    .collection("users")
    .where("email", "==", normalized)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0]?.id ?? null;
}
