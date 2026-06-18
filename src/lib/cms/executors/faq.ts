/**
 * Content generator for the `add_faq` intent. Produces a FAQ entry from the
 * instruction. The executor assigns the final `order` when appending.
 *
 * SWAP TARGET: the answer is a placeholder draft; replace with an LLM that
 * writes a real answer from the customer's knowledge base.
 */
import type { FaqItem } from "../../../types";
import { slugify } from "../slug";

export function buildFaqEntry(question: string, answer?: string): FaqItem {
  const q = (question || "").trim() || "Nieuwe vraag";
  return {
    id: `faq-${slugify(q).slice(0, 40) || "new"}`,
    question: /[?]\s*$/.test(q) ? q : `${q}?`,
    answer:
      answer?.trim() ||
      "This answer was drafted automatically from your instruction — edit it to " +
        "add the details you want to share with visitors.",
    order: 0, // executor assigns the real order on append
    visible: true,
  };
}
