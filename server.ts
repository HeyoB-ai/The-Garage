import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { cmsRouter } from "./server/cms/router";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// AI-CMS backend API (/api/cms/*). Registered before the SPA fallback.
app.use("/api/cms", cmsRouter);

// Lazy-initialization helper for Gemini API to meet the dependency guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for AI Advisor
app.post("/api/advisor", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: `You are the AI automotive specialist for "The Garage Jávea" (located in Jávea, Alicante, Spain).
Your goal is to provide reliable, professional, and friendly advice to premium car owners, enthusiasts, and expats living in or moving to Spain.
The Garage Jávea excels in three primary services:
1. Certified Repair & High-End Maintenance (certified technicians, dealer-level diagnostic systems, ITV test preparation, and alignments).
2. Worldwide Import & Export (completely turnkey service for importing luxury, classic, or sports vehicles from the UK, Germany, Netherlands, etc., including Spanish matriculación registration, customs brokerage for Brexit, COC handling, and transport).
3. Exclusive Car Sales & Brokerage (premium sports cars, classic roadsters, and sourcing specific luxury models upon customer request).

Answer premium clients elegantly and in high-class English. Focus on the absolute peace-of-mind ("turnkey") solution that we handle all the bureaucracy, transport, and inspections.
If they ask about import taxes, explain that the registration tax (Impuesto de Matriculación) depends on CO2 emissions and the Spanish Hacienda's official tables, and encourage them to use our on-screen Import Calculator for a fast estimate.
Always end your reply on a helpful note, inviting them for a coffee at our high-class showroom or service facility in Jávea on Augusta Avenue. Use elegant Markdown hierarchy with bullets and bold terms.`,
      },
    });

    const reply = response.text || "I apologize, I could not synthesize a response. Please call our team directly for immediate assistance.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI Advisor. Please verify that GEMINI_API_KEY is configured." });
  }
});

// Serve frontend assets with Vite in development and from /dist in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server gestart op http://0.0.0.0:${PORT}`);
  });
}

startServer();
