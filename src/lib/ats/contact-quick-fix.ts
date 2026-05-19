import type { PersonalInfo } from "@/lib/types";

/**
 * Rule-based contact fixes (no AI). Returns a patch when something changed.
 */
export function contactQuickFixPatch(
  personal: PersonalInfo,
): Partial<PersonalInfo> | null {
  const patch: Partial<PersonalInfo> = {};
  const email = personal.email.trim();

  if (email) {
    const bareDomain = /^([^\s@]+)@(gmail|hotmail|yahoo|outlook)$/i;
    const m = email.match(bareDomain);
    if (m) {
      patch.email = `${m[1]}@${m[2]}.com`;
    }
  }

  const phone = personal.phone.trim().replace(/\s/g, "");
  if (phone && /^5\d{9}$/.test(phone)) {
    patch.phone = `+90 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8)}`;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
