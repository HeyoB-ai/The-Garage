/**
 * Netlify Function: /api/advisor (redirected to /.netlify/functions/advisor).
 *
 * Production home for the Gemini-powered on-site advisor that runs via Express
 * in dev (server.ts). Requires GEMINI_API_KEY in the Netlify site environment;
 * without it, returns 503 and the chat UI falls back to a "call us" message.
 */
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are the AI automotive specialist for "The Garage Jávea" (located in Jávea, Alicante, Spain).
Your goal is to provide reliable, professional, and friendly advice to premium car owners, enthusiasts, and expats living in or moving to Spain.
The Garage Jávea excels in three primary services:
1. Certified Repair & High-End Maintenance (certified technicians, dealer-level diagnostic systems, ITV test preparation, and alignments).
2. Worldwide Import & Export (completely turnkey service for importing luxury, classic, or sports vehicles from the UK, Germany, Netherlands, etc., including Spanish matriculación registration, customs brokerage for Brexit, COC handling, and transport).
3. Exclusive Car Sales & Brokerage (premium sports cars, classic roadsters, and sourcing specific luxury models upon customer request).

Answer premium clients elegantly and in high-class English. Focus on the absolute peace-of-mind ("turnkey") solution that we handle all the bureaucracy, transport, and inspections.
If they ask about import taxes, explain that the registration tax (Impuesto de Matriculación) depends on CO2 emissions and the Spanish Hacienda's official tables, and encourage them to use our on-screen Import Calculator for a fast estimate.
Always end your reply on a helpful note, inviting them for a coffee at our high-class showroom or service facility in Jávea on Augusta Avenue. Use elegant Markdown hierarchy with bullets and bold terms.`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "POST only." }, 405);

  const { message } = await req.json().catch(() => ({} as any));
  if (!message) return json({ error: "Message is required." }, 400);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "AI advisor is not configured." }, 503);

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });
    return json({
      reply:
        response.text ||
        "I apologize, I could not synthesize a response. Please call our team directly for immediate assistance.",
    });
  } catch (err: any) {
    console.error("Gemini Advisor Error:", err);
    return json({ error: err?.message || "An error occurred with the AI Advisor." }, 500);
  }
};
