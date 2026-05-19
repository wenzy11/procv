import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: {
    default: "ProCV — AI Résumé & ATS Optimization",
    template: "%s · ProCV",
  },
  description:
    "ProCV is the AI-native résumé builder. Live ATS scoring, job-description matching, and one-click polish — engineered for top-tier hiring.",
  applicationName: "ProCV",
  authors: [{ name: "ProCV Team" }],
  keywords: [
    "resume builder",
    "ATS",
    "AI resume",
    "CV optimization",
    "job matching",
    "career",
  ],
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
