import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Terms of Service — ProCV",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-base px-6 py-12 text-ink-primary">
      <div className="mx-auto max-w-3xl">
        <Link href="/">
          <Logo />
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-tertiary">Last updated: May 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-secondary">
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">1. Service</h2>
            <p>
              ProCV provides résumé editing, ATS scoring, job-description
              matching, application tracking, and AI-assisted writing. Features
              depend on your subscription plan.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">2. Accounts</h2>
            <p>
              You are responsible for your account credentials and for content
              you upload. You must not use the service for unlawful purposes or
              to generate misleading applications.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">3. Billing</h2>
            <p>
              Paid plans renew per the billing cycle you select (monthly, yearly,
              or lifetime). Refunds follow Polar and your stated refund policy.
              You may cancel recurring subscriptions before the next charge.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">4. AI disclaimer</h2>
            <p>
              AI outputs are suggestions only. You are responsible for reviewing
              accuracy before submitting CVs or cover letters to employers.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">5. Limitation</h2>
            <p>
              ProCV is provided as-is. We do not guarantee interview or job
              offers. Liability is limited to the extent permitted by applicable
              law.
            </p>
          </section>
        </div>
        <Link href="/" className="mt-10 inline-block text-sm text-accent-300 hover:underline">
          ← Back to ProCV
        </Link>
      </div>
    </div>
  );
}
