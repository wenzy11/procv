import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Privacy Policy — ProCV",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-base px-6 py-12 text-ink-primary">
      <div className="mx-auto max-w-3xl">
        <Link href="/">
          <Logo />
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-tertiary">Last updated: May 2026</p>
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-ink-secondary">
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">1. Data we collect</h2>
            <p>
              When you create an account we store your email, display name, and
              résumé content in Firebase (Google Cloud). Payment metadata is
              processed by Polar; we do not store full card numbers.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">2. AI processing</h2>
            <p>
              Résumé text you submit for ATS scoring, job matching, polish, or
              cover letters is sent to OpenAI to generate results. Do not include
              data you are not allowed to share with subprocessors.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">3. Your rights</h2>
            <p>
              You may delete your account data by removing résumés and
              applications in the app, or contact support to request account
              deletion. EU/UK users may exercise GDPR rights including access and
              erasure.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink-primary">4. Contact</h2>
            <p>
              Questions: use the email linked to your ProCV account or your
              support channel listed on the product site.
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
