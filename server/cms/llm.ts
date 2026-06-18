/**
 * LLM copy drafting (server-side only).
 *
 * Uses Gemini (GEMINI_API_KEY) to write real content — the news excerpt/body and
 * FAQ answers — replacing the placeholder copy from the pure generators. Runs
 * during the `plan` step in service.ts. Env-gated and fail-safe: if the key is
 * missing or the call fails, callers fall back to the deterministic placeholders
 * so the pipeline never breaks.
 *
 * Gemini is used here (cheap, multilingual) per the model-routing plan in
 * AI_AGENT_ARCHITECTURE.md; structural/code drafting would route to Claude.
 */
import { GoogleGenAI } from "@google/genai";

export function llmEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Overridable without a code change (e.g. to dodge a transiently overloaded model).
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateJson(prompt: string, system: string): Promise<any | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  // Retry transient errors (e.g. 503 "high demand"); fail safe to placeholders.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { systemInstruction: system, responseMimeType: "application/json" },
      });
      const text = res.text;
      if (!text) return null;
      // Be tolerant of accidental code fences.
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const transient = /503|UNAVAILABLE|high demand|overloaded|429|rate/i.test(msg);
      if (attempt < maxAttempts && transient) {
        await sleep(700 * attempt);
        continue;
      }
      console.error(`LLM draft failed (attempt ${attempt}), using placeholder:`, msg);
      return null;
    }
  }
  return null;
}

const BRAND =
  `The Garage Jávea is a premium car garage on the Costa Blanca (Jávea, Spain): ` +
  `certified supercar maintenance, turnkey vehicle import/export, and exclusive sales. ` +
  `Tone: professional, warm, trustworthy.`;

/** Draft a news article. Returns null on failure (caller uses placeholders). */
export async function draftNews(
  instruction: string,
  title: string
): Promise<{ excerpt?: string; body?: string } | null> {
  const data = await generateJson(
    `Write a short website news article based on this instruction: "${instruction}". ` +
      `The working title is "${title}". Write in the SAME language as the instruction. ` +
      `Return JSON with exactly: {"excerpt": string (max ~160 chars, no markdown), ` +
      `"body": string (3-6 short paragraphs in simple markdown: "## " headings, ` +
      `"- " bullets and "**bold**" allowed; no images, no top-level H1)}.`,
    BRAND
  );
  if (!data || typeof data.body !== "string") return null;
  return {
    excerpt: typeof data.excerpt === "string" ? data.excerpt : undefined,
    body: data.body,
  };
}

/** Draft a concise FAQ answer. Returns null on failure. */
export async function draftFaqAnswer(question: string): Promise<string | null> {
  const data = await generateJson(
    `Write a concise, helpful answer (2-4 sentences, plain text) to this FAQ question ` +
      `for the website. Answer in the SAME language as the question. ` +
      `Question: "${question}". Return JSON: {"answer": string}.`,
    BRAND
  );
  return data && typeof data.answer === "string" ? data.answer : null;
}
