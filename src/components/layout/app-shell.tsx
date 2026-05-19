import * as React from "react";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { TopNav } from "./top-nav";

/**
 * AppShell — the persistent application chrome rendered above every
 * authenticated page. Splits the screen vertically into nav + content.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-ink-primary">
      <TopNav />
      <EmailVerificationBanner />
      <main className="flex-1">{children}</main>
    </div>
  );
}
