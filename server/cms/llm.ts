/**
 * LLM copy drafting (server-side only) — provider-agnostic with fallback.
 *
 * Drafts the real news excerpt/body and FAQ answers. Supports OpenAI and Gemini;
 * it tries providers in order and falls back to the next one (and finally to the
 * deterministic placeholders) so one flaky/overloaded provider never breaks the
 * flow. Adding Anthropic/Claude is a third `call*` function in the same shape.
 *
 * Selection (env):
 *   - CMS_LLM_PROVIDER = "openai" | "gemini"  → preferred provider
 *   - otherwise: whichever API keys are present (OpenAI first if available)
 *   - OPENAI_API_KEY / OPENAI_MODEL (default gpt-4o-mini)
 *   - GEMINI_API_KEY / GEMINI_MODEL (default gemini-3.5-flash)
 *
 * OpenAI uses fetch (no extra dependency); Gemini uses @google/genai.
 */
import { GoogleGenAI } from "@google/genai";

type Provider = "openai" | "gemini";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isTransient = (msg: string) => /429|rate|5\d\d|UNAVAILABLE|high demand|overloaded|timeout/i.test(msg);

function providerOrder(): Provider[] {
  const available: Provider[] = [];
  if (process.env.OPENAI_API_KEY) available.push("openai");
  if (process.env.GEMINI_API_KEY) available.push("gemini");
  const pref = process.env.CMS_LLM_PROVIDER?.toLowerCase() as Provider | undefined;
  if (pref && available.includes(pref)) {
    return [pref, ...available.filter((p) => p !== pref)];
  }
  return available;
}

export function llmEnabled(): boolean {
  return providerOrder().length > 0;
}

/** Returns the model's raw text (expected JSON), or null after retries. */
async function callOpenAI(prompt: string, system: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`OpenAI ${res.status}: ${body}`);
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < 3 && isTransient(msg)) {
        await sleep(700 * attempt);
        continue;
      }
      console.error(`OpenAI draft failed (attempt ${attempt}):`, msg);
      return null;
    }
  }
  return null;
}

async function callGemini(prompt: string, system: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: system, responseMimeType: "application/json" },
      });
      return res.text ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < 3 && isTransient(msg)) {
        await sleep(700 * attempt);
        continue;
      }
      console.error(`Gemini draft failed (attempt ${attempt}):`, msg);
      return null;
    }
  }
  return null;
}

function parseJson(text: string | null): any | null {
  if (!text) return null;
  try {
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/** Try each configured provider in order; fall back to placeholders (null). */
async function generateJson(prompt: string, system: string): Promise<any | null> {
  for (const provider of providerOrder()) {
    const text = provider === "openai" ? await callOpenAI(prompt, system) : await callGemini(prompt, system);
    const parsed = parseJson(text);
    if (parsed) return parsed;
  }
  return null;
}

const BRAND =
  `The Garage Jávea is a premium car garage on the Costa Blanca (Jávea, Spain): ` +
  `certified supercar maintenance, turnkey vehicle import/export, and exclusive sales. ` +
  `Tone: professional, warm, trustworthy.`;

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

export async function draftFaqAnswer(question: string): Promise<string | null> {
  const data = await generateJson(
    `Write a concise, helpful answer (2-4 sentences, plain text) to this FAQ question ` +
      `for the website. Answer in the SAME language as the question. ` +
      `Question: "${question}". Return JSON: {"answer": string}.`,
    BRAND
  );
  return data && typeof data.answer === "string" ? data.answer : null;
}
