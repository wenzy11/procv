"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useT } from "@/components/providers/i18n-provider";
import { Logo } from "@/components/brand/logo";

/**
 * Rendered when Firebase env vars are absent. We intentionally show this
 * inside the app shell (rather than a hard crash) so developers can see the
 * exact action they need to take.
 */
export function ConfigMissing() {
  const t = useT();
  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center px-6">
      <div className="w-full max-w-lg rounded-xl border border-state-warn/30 bg-state-warn/5 p-6 shadow-panel">
        <div className="mb-4 flex items-center gap-3">
          <Logo showWordmark={false} />
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.14em] text-state-warn">
              {t("auth.configRequired")}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              {t("auth.configurationMissing")}
            </h2>
          </div>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-surface-inset p-4 font-mono text-xs leading-relaxed text-ink-secondary">
          <p className="mb-2 inline-flex items-center gap-2 text-ink-tertiary">
            <AlertTriangle className="h-3 w-3" />
            .env.local
          </p>
          <pre className="whitespace-pre-wrap break-all">
            NEXT_PUBLIC_FIREBASE_API_KEY=…{"\n"}
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…{"\n"}
            NEXT_PUBLIC_FIREBASE_PROJECT_ID=…{"\n"}
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…{"\n"}
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…{"\n"}
            NEXT_PUBLIC_FIREBASE_APP_ID=…{"\n\n"}
            FIREBASE_ADMIN_PROJECT_ID=…{"\n"}
            FIREBASE_ADMIN_CLIENT_EMAIL=…{"\n"}
            FIREBASE_ADMIN_PRIVATE_KEY=…
          </pre>
        </div>
        <a
          href="https://console.firebase.google.com/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-300 hover:text-accent-200"
        >
          Open Firebase Console
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
