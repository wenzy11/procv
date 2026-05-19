#!/usr/bin/env node
/**
 * End-to-end smoke test: confirm that the OpenAI-backed routes return
 * suggestions in the requested language.
 *
 * Calls the prompt builder + OpenAI directly (no HTTP / no auth) so we can
 * test in isolation. Outputs a sample of suggestions per locale so we can
 * eyeball the language quality.
 */
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("❌ OPENAI_API_KEY missing.");
  process.exit(1);
}
const client = new OpenAI({ apiKey });
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const LOCALE_TO_LANGUAGE = {
  en: "English",
  tr: "Turkish",
  es: "Spanish",
  de: "German",
  fr: "French",
};

const LANGUAGE_RULE = (lang) =>
  `CRITICAL: Every free-text field in your response — including titles, descriptions, action labels, summaries, and explanations — MUST be written entirely in ${lang}. Do not mix languages. Do not respond in English unless ${lang} is English. Use natural, idiomatic ${lang} a hiring manager in that locale would write.`;

function analyzeMessages(resume, locale) {
  const lang = LOCALE_TO_LANGUAGE[locale] ?? "English";
  return [
    {
      role: "system",
      content: `You are an ATS analyzer. Score the résumé on five rubrics (each 0..100): keywordCoverage, formatting, impactLanguage, completeness, readability. Provide 3-6 improvement suggestions targeting one of: personal, summary, experience, projects, skills, languages, education, global.

${LANGUAGE_RULE(lang)}

Return strict JSON:
{
  "score": { "total": int, "breakdown": { "keywordCoverage": int, "formatting": int, "impactLanguage": int, "completeness": int, "readability": int } },
  "suggestions": [ { "title": "<in ${lang}>", "description": "<in ${lang}>", "severity": "critical"|"warning"|"info", "target": "...", "actionLabel": "<in ${lang}>" } ]
}`,
    },
    {
      role: "user",
      content: `Analyze this résumé and reply in ${lang}.\n\n${JSON.stringify(resume, null, 2)}`,
    },
  ];
}

const sampleResume = {
  id: "test",
  title: "Test",
  updatedAt: new Date().toISOString(),
  personal: {
    fullName: "Ali Yılmaz",
    headline: "Frontend Engineer",
    email: "ali@example.com",
    phone: "+90 555 000 0000",
    location: "Istanbul",
    summary: "Frontend developer with 5 years of experience.",
  },
  experience: [
    {
      id: "e1",
      role: "Frontend Engineer",
      company: "TestCo",
      location: "Istanbul",
      startDate: "2020-01",
      endDate: "Present",
      description: "Built web apps.",
      highlights: ["Shipped features.", "Improved performance."],
    },
  ],
  projects: [],
  skills: [
    { id: "s1", name: "React", level: "Expert" },
    { id: "s2", name: "TypeScript", level: "Advanced" },
  ],
  languages: [{ id: "l1", name: "Turkish", proficiency: "Native" }],
  education: [],
};

const locales = ["tr", "es", "de", "fr"];

console.log("Model:", model);
console.log("---");

for (const locale of locales) {
  const lang = LOCALE_TO_LANGUAGE[locale];
  process.stdout.write(`▸ ${lang.padEnd(8)} `);
  try {
    const t0 = Date.now();
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1200,
      messages: analyzeMessages(sampleResume, locale),
    });
    const elapsed = Date.now() - t0;
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const first = parsed.suggestions?.[0];
    if (!first) {
      console.log(`(no suggestions) ${elapsed}ms`);
      continue;
    }
    console.log(`${elapsed}ms`);
    console.log(`   title       : ${first.title}`);
    console.log(`   description : ${(first.description || "").slice(0, 120)}…`);
    console.log(`   actionLabel : ${first.actionLabel}`);
    console.log();
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  }
}
