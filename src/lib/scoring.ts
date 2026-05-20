"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { getIdToken } from "@/lib/firebase/auth";
import type {
  AISuggestion,
  ATSScore,
  KeywordMatchResult,
  ResumeDocument,
} from "./types";

/**
 * ProCV — Client-side AI service façade.
 *
 * Every function below makes an authenticated POST to a Next.js route
 * handler under `/api/ai/*`. The handler verifies the Firebase ID token
 * server-side and forwards the request to OpenAI. The browser never sees
 * the OpenAI key.
 */

async function authedFetch<T>(path: string, payload: unknown): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (user?.email && !user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  const token = await getIdToken();
  if (!token) {
    throw new Error("You must be signed in to use AI features.");
  }
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      feature?: string;
    };
    const code = data.error ?? `HTTP_${res.status}`;
    throw new Error(code);
  }
  return (await res.json()) as T;
}

export async function polishText(input: string, locale: string): Promise<string> {
  if (!input.trim()) return "";
  const { polished } = await authedFetch<{ polished: string }>(
    "/api/ai/polish",
    { text: input, locale },
  );
  return polished;
}

export async function analyzeResume(
  resume: ResumeDocument,
  locale: string,
): Promise<{ score: ATSScore; suggestions: AISuggestion[] }> {
  return authedFetch("/api/ai/analyze", { resume, locale });
}

export async function matchJobDescription(
  resume: ResumeDocument,
  jobDescription: string,
  locale: string,
): Promise<KeywordMatchResult> {
  return authedFetch("/api/ai/match", { resume, jobDescription, locale });
}

export async function generateCoverLetter(
  resume: ResumeDocument,
  jobDescription: string,
  locale: string,
  options?: { company?: string; role?: string; tone?: string },
): Promise<string> {
  const { letter } = await authedFetch<{ letter: string }>(
    "/api/ai/cover-letter",
    { resume, jobDescription, locale, ...options },
  );
  return letter;
}
