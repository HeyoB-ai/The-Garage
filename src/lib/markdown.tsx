import React from "react";

/**
 * Intentionally tiny markdown renderer — no external dependency.
 * Supports exactly what the news/content model needs:
 *   ## heading        -> h2
 *   ### heading       -> h3
 *   - list item       -> bulleted list
 *   ![alt](url)       -> image
 *   **bold**          -> bold (inline)
 *   blank line        -> paragraph break
 * Anything else is rendered as a paragraph. This keeps content authoring
 * simple enough that an AI agent can reliably produce valid bodies.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on **bold** markers
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-t${i}`}>{part}</React.Fragment>
    )
  );
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    const items = [...list];
    list = [];
    blocks.push(
      <ul key={key} className="list-disc list-outside pl-5 space-y-2 my-4 text-neutral-300">
        {items.map((li, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(li, `${key}-${i}`)}
          </li>
        ))}
      </ul>
    );
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const key = `md-${idx}`;

    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      return;
    }
    flushList(`${key}-list`);

    if (line === "") return;

    const img = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (img) {
      blocks.push(
        <img
          key={key}
          src={img[2]}
          alt={img[1]}
          className="w-full rounded-xl border border-neutral-800 my-6"
          referrerPolicy="no-referrer"
        />
      );
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key} className="text-lg font-bold text-white mt-8 mb-3">
          {renderInline(line.slice(4), key)}
        </h3>
      );
      return;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key} className="text-2xl font-bold text-white mt-10 mb-4">
          {renderInline(line.slice(3), key)}
        </h2>
      );
      return;
    }

    blocks.push(
      <p key={key} className="text-neutral-300 leading-relaxed my-4">
        {renderInline(line, key)}
      </p>
    );
  });

  flushList("md-final-list");
  return <div className="max-w-none">{blocks}</div>;
}
