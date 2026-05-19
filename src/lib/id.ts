/**
 * Lightweight client-side id generator. Avoids the `crypto.randomUUID()`
 * SSR vs CSR mismatch and is good enough for in-memory list keys.
 */
export function uid(prefix = "id"): string {
  const seed = Math.random().toString(36).slice(2, 9);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${seed}`;
}
