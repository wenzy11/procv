"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import {
  completeGoogleRedirectSignIn,
  GoogleRedirectPendingError,
} from "@/lib/firebase/auth";
import {
  firebaseAuthErrorCode,
  firebaseAuthErrorKey,
} from "@/lib/firebase/auth-errors";

/** Handles return from Google `signInWithRedirect`. */
export function useGoogleRedirect(locale: string) {
  const t = useT();
  const router = useRouter();
  const { configured } = useAuth();
  const [pending, setPending] = React.useState(true);

  React.useEffect(() => {
    if (!configured) {
      setPending(false);
      return;
    }
    let cancelled = false;
    void completeGoogleRedirectSignIn(locale)
      .then((user) => {
        if (cancelled) return;
        if (user) router.replace("/dashboard");
      })
      .catch((err) => {
        if (cancelled) return;
        const key = firebaseAuthErrorKey(firebaseAuthErrorCode(err));
        toast.error(t(key), {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [configured, locale, router, t]);

  return pending;
}

export function handleGoogleAuthError(
  err: unknown,
  t: (key: string) => string,
): boolean {
  if (err instanceof GoogleRedirectPendingError) return true;
  const key = firebaseAuthErrorKey(firebaseAuthErrorCode(err));
  toast.error(t(key), {
    description: err instanceof Error ? err.message : undefined,
  });
  return false;
}
