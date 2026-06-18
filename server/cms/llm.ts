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
  title: string,
  source?: { url: string; text: string }
): Promise<{ title?: string; excerpt?: string; body?: string } | null> {
  const prompt = source
    ? `You are writing an ORIGINAL short news item for the website, based on a source article. ` +
      `Do NOT copy, quote at length, or reproduce the source — summarize it in your OWN words. ` +
      `Write in the SAME language as this instruction: "${instruction}". ` +
      (title ? `Suggested title: "${title}". ` : "") +
      `Source URL: ${source.url}\n\nSOURCE ARTICLE TEXT:\n"""${source.text}"""\n\n` +
      `Return JSON with exactly: {"title": string (a concise original headline), ` +
      `"excerpt": string (max ~160 chars, no markdown), "body": string ` +
      `(3-6 short paragraphs, simple markdown: "## " headings, "- " bullets, "**bold**"; ` +
      `no top-level H1, no images)}. The body MUST end with a short source attribution on its own ` +
      `line that includes a markdown link to the source URL, e.g. "Bron: [titel](${source.url})".`
    : `Write a short website news article based on this instruction: "${instruction}". ` +
      `The working title is "${title}". Write in the SAME language as the instruction. ` +
      `Return JSON with exactly: {"excerpt": string (max ~160 chars, no markdown), ` +
      `"body": string (3-6 short paragraphs in simple markdown: "## " headings, ` +
      `"- " bullets and "**bold**" allowed; no images, no top-level H1)}.`;

  const data = await generateJson(prompt, BRAND);
  if (!data || typeof data.body !== "string") return null;
  return {
    title: typeof data.title === "string" ? data.title : undefined,
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

/* ---------------------------------------------------------------------- *
 * Source-article fetching (server-only) for "turn this link into a news
 * item". Fail-safe: returns null on ANY problem so callers fall back to
 * drafting from the instruction / placeholder.
 * ---------------------------------------------------------------------- */

const FETCH_TIMEOUT_MS = 8000;
const MAX_FETCH_BYTES = 1024 * 1024; // ~1MB
const MAX_TEXT_CHARS = 4000;

/** Only allow external, public http(s) URLs (basic SSRF guard). */
function isPublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) return false; // IPv6 loopback/ULA
  if (/^(127\.|0\.|10\.|169\.254\.|192\.168\.)/.test(host)) return false; // loopback/private/link-local
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false; // 172.16-31.x
  return true;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#3[49];|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fetch an external article and return its main text, or null on any failure. */
export async function fetchArticleText(url: string): Promise<string | null> {
  if (!isPublicHttpUrl(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "TheGarageCMS/1.0 (+article summarizer)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct && !/text\/html|application\/xhtml|text\/plain/i.test(ct)) return null;

    // Bounded read (~1MB) so a huge page can't blow up memory.
    let html: string;
    const reader = res.body?.getReader();
    if (reader) {
      const chunks: Buffer[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          received += value.length;
          chunks.push(Buffer.from(value));
          if (received >= MAX_FETCH_BYTES) {
            try { await reader.cancel(); } catch { /* ignore */ }
            break;
          }
        }
      }
      html = Buffer.concat(chunks).toString("utf8");
    } else {
      html = (await res.text()).slice(0, MAX_FETCH_BYTES);
    }

    const text = htmlToText(html);
    if (text.length < 50) return null; // too little to summarize
    return text.slice(0, MAX_TEXT_CHARS);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
