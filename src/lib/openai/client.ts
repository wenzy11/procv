import "server-only";
import OpenAI from "openai";

/**
 * OpenAI — server-only singleton. The API key is loaded from
 * `process.env.OPENAI_API_KEY` and never leaves the server runtime.
 *
 * Consumers should call `getOpenAI()` rather than `new OpenAI()` directly so
 * we share the same client (and its HTTP connection pool) across requests.
 */

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Set it in .env.local (server-only).",
    );
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
