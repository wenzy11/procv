import "server-only";
import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";

/**
 * Auth guard for API routes.
 *
 * Usage:
 *   const guard = await requireUser(req);
 *   if (!guard.ok) return guard.response;
 *   const { uid } = guard;
 */
export async function requireUser(
  req: Request,
  options?: { allowUnverifiedEmail?: boolean },
): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse }
> {
  try {
    const decoded = await verifyIdToken(req.headers.get("authorization"));

    if (
      !options?.allowUnverifiedEmail &&
      decoded.email &&
      decoded.email_verified === false &&
      process.env.REQUIRE_EMAIL_VERIFICATION !== "false"
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              "Please verify your email address before using AI features.",
          },
          { status: 403 },
        ),
      };
    }

    return { ok: true, uid: decoded.uid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 401 }),
    };
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : "Internal error";
  return NextResponse.json({ error: message }, { status: 500 });
}
