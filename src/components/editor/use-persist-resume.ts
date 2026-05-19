"use client";

import * as React from "react";
import { toast } from "sonner";
import { useResumeStore } from "@/store/resume-store";
import { patchResume } from "@/lib/firebase/resumes";
import { useT } from "@/components/providers/i18n-provider";

const DEBOUNCE_MS = 1200;

/**
 * Hook that debounces in-memory store changes and persists them to Firestore.
 *
 * Returns `{ saving, lastSavedAt }` so the editor frame can render a subtle
 * "Saving… / Saved" indicator next to the title.
 */
export function usePersistResume() {
  const t = useT();
  const [saving, setSaving] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);

  // Latest error toast key — used to avoid spamming the user if the network
  // is down. We only fire one toast per failure burst.
  const lastErrorShownRef = React.useRef<number>(0);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const unsub = useResumeStore.subscribe(
      (s) => ({
        dirty: s.dirty,
        resume: s.resume,
        ownerUid: s.ownerUid,
      }),
      (state) => {
        if (!state.dirty || !state.resume || !state.ownerUid) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          if (cancelled) return;
          setSaving(true);
          try {
            const { id, updatedAt: _ignored, ...rest } = state.resume!;
            await patchResume(state.ownerUid!, id, rest);
            useResumeStore.setState({ dirty: false });
            setLastSavedAt(Date.now());
          } catch (err) {
            // Notify the user — but throttle so we don't spam if their
            // network is intermittent and we get back-to-back failures.
            const now = Date.now();
            if (now - lastErrorShownRef.current > 8000) {
              lastErrorShownRef.current = now;
              toast.error(t("common.error"), {
                description: err instanceof Error ? err.message : undefined,
              });
            }
          } finally {
            setSaving(false);
          }
        }, DEBOUNCE_MS);
      },
      { equalityFn: (a, b) => a.dirty === b.dirty && a.resume === b.resume },
    );

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsub();
    };
    // `t` is stable per locale; we intentionally re-subscribe when it
    // changes so error toasts always use the latest dictionary.
  }, [t]);

  return { saving, lastSavedAt };
}
