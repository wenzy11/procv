import "server-only";
import type { ResumeDocument } from "@/lib/types";

/**
 * Prompt builders — kept separate so we can iterate on prompt design without
 * touching the route handlers and so each prompt is easy to unit-test.
 *
 * Convention: every prompt returns *strict JSON* and explicitly states the
 * schema. The route handler asks for `response_format: { type: "json_object" }`
 * and validates the shape before sending it to the client.
 *
 * Language handling: the client sends a locale code (`tr`, `en`, …). We map
 * it to a human-readable language name (`Turkish`) before injecting it into
 * the prompt, because LLMs follow `"Reply in Turkish"` reliably but ignore
 * `"Reply in tr"`. We *also* repeat the language instruction in the system
 * prompt so the model can't drift across the conversation.
 */

const LOCALE_TO_LANGUAGE: Record<string, string> = {
  en: "English",
  tr: "Turkish",
  es: "Spanish",
  de: "German",
  fr: "French",
};

function languageOf(locale: string): string {
  return LOCALE_TO_LANGUAGE[locale] ?? "English";
}

const LANGUAGE_RULE = (lang: string) =>
  `CRITICAL: Every free-text field in your response — including titles, descriptions, action labels, summaries, and explanations — MUST be written entirely in ${lang}. Do not mix languages. Do not respond in English unless ${lang} is English. Use natural, idiomatic ${lang} a hiring manager in that locale would write.`;

// ---------- POLISH ------------------------------------------------------------

export function polishMessages(
  input: string,
  locale: string,
): Array<{ role: "system" | "user"; content: string }> {
  const lang = languageOf(locale);
  return [
    {
      role: "system",
      content: `You are a senior career coach and résumé writer specializing in tech roles.
Rewrite the user's text so it is:
- More concise and outcome-oriented.
- Starts with a strong action verb (in ${lang}).
- Quantifies impact when reasonable (only fabricate numbers if the input already implies them).
- Plain, recruiter-friendly ${lang}.

${LANGUAGE_RULE(lang)}

Reply with strict JSON: { "polished": "<rewritten text in ${lang}>" }.
Do NOT add prefixes, quotes, markdown, or commentary.`,
    },
    {
      role: "user",
      content: `Rewrite the following snippet in ${lang}.\n\n"""${input}"""`,
    },
  ];
}

// ---------- ANALYZE -----------------------------------------------------------

export function analyzeMessages(
  resume: ResumeDocument,
  locale: string,
): Array<{ role: "system" | "user"; content: string }> {
  const lang = languageOf(locale);
  return [
    {
      role: "system",
      content: `You are an ATS (Applicant Tracking System) analyzer. Score the candidate's résumé
on five rubrics, each 0..100:
  - keywordCoverage  : breadth and relevance of hard-skill keywords.
  - formatting       : presence of contact details, dates, structure, quantified bullets.
  - impactLanguage   : usage of strong action verbs and outcome language.
  - completeness     : every standard section present and non-trivial.
  - readability      : bullet lengths, scannability, avoidance of walls of text.

Also produce 3–6 concrete improvement suggestions. Each suggestion targets one
of: personal, summary, experience, projects, skills, languages, education, global.

Each "description" must clearly explain WHAT the user should change and HOW (step by step).
Do NOT imply the app will auto-apply fixes — the user edits manually.
"actionLabel" is a short hint for navigation only (e.g. "Open personal section").

${LANGUAGE_RULE(lang)}

Return strict JSON:
{
  "score": {
    "total": int,
    "breakdown": {
      "keywordCoverage": int,
      "formatting": int,
      "impactLanguage": int,
      "completeness": int,
      "readability": int
    }
  },
  "suggestions": [
    {
      "title": "<short headline in ${lang}>",
      "description": "<2–3 sentence explanation in ${lang}>",
      "severity": "critical" | "warning" | "info",
      "target": "personal" | "summary" | "experience" | "projects" | "skills" | "languages" | "education" | "global",
      "actionLabel": "<2–4 word button label in ${lang}>"
    }
  ]
}

"total" should be a weighted average of the breakdown that you compute internally.
The "severity" and "target" enums above are the ONLY values allowed for those keys.`,
    },
    {
      role: "user",
      content: `Analyze this résumé and reply in ${lang}.\n\n${JSON.stringify(
        resume,
        null,
        2,
      )}`,
    },
  ];
}

// ---------- MATCH -------------------------------------------------------------

export function matchMessages(
  resume: ResumeDocument,
  jobDescription: string,
  locale: string,
): Array<{ role: "system" | "user"; content: string }> {
  const lang = languageOf(locale);
  return [
    {
      role: "system",
      content: `You compare a résumé against a job description and produce a keyword-level
match report.

${LANGUAGE_RULE(lang)}

Return strict JSON:
{
  "strength": int (0..100 — fraction of important JD keywords present in résumé),
  "matched": [string],           // keywords found in BOTH résumé and JD
  "missing": [string],           // keywords in JD but NOT in résumé
  "categories": [                // bucketed counts for charting
    { "name": "Languages"|"Frameworks"|"Cloud"|"Data"|"Practices"|"Other", "matched": int, "missing": int }
  ]
}

Rules for the keyword arrays:
- Keywords (matched/missing) are technical terms (frameworks, tools, languages,
  methodologies). Keep them in their canonical form (English casing) since
  recruiters and ATS systems match them that way (e.g. "react", "kubernetes").
  Do NOT translate keyword tokens.
- Lowercase all keywords. De-duplicate.
- Cap matched/missing arrays at 24 items each.
- Ignore generic words ("team", "work", "experience").
- Use one of the named "categories" buckets; "Other" as fallback.`,
    },
    {
      role: "user",
      content: `Reply in ${lang}.\n\n=== RÉSUMÉ ===\n${JSON.stringify(
        resume,
        null,
        2,
      )}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`,
    },
  ];
}

// ---------- COVER LETTER ------------------------------------------------------

export function coverLetterMessages(
  resume: ResumeDocument,
  jobDescription: string,
  locale: string,
  options?: { company?: string; role?: string; tone?: string },
): Array<{ role: "system" | "user"; content: string }> {
  const lang = languageOf(locale);
  const company = options?.company?.trim() || "the company";
  const role = options?.role?.trim() || "the role";
  const tone = options?.tone?.trim() || "professional and confident";

  return [
    {
      role: "system",
      content: `You write tailored cover letters for tech and knowledge-work roles.
The letter must:
- Be 3–4 short paragraphs, under 380 words total.
- Open with a specific hook tied to ${company} and ${role} (no "To whom it may concern").
- Mirror 2–3 keywords from the job description naturally (do not keyword-stuff).
- Highlight 2 concrete achievements from the résumé with metrics where present.
- Close with a clear call to action.
- Tone: ${tone}.

${LANGUAGE_RULE(lang)}

Return strict JSON: { "letter": "<full cover letter body in ${lang}, plain text, paragraphs separated by blank lines>" }.
No markdown, no subject line, no signature block placeholders.`,
    },
    {
      role: "user",
      content: `Write a cover letter in ${lang} for ${role} at ${company}.\n\n=== RÉSUMÉ ===\n${JSON.stringify(
        resume,
        null,
        2,
      )}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`,
    },
  ];
}
