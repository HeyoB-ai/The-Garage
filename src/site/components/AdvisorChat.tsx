import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useSite } from "../i18n";

type Msg = { role: "ai" | "user"; text: string };

export default function AdvisorChat() {
  const { t } = useSite();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: t.advisor.intro }]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: t.advisor.error }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-[2px] bg-accent px-4 py-3 text-sm font-medium text-accent-ink shadow-lg transition-all hover:bg-accent-hover hover:-translate-y-0.5"
        >
          <MessageSquare className="h-4 w-4" />
          {t.advisor.open}
        </button>
      )}

      {open && (
        <div className="flex h-[480px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-[3px] border border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-display text-base font-medium text-ink">{t.advisor.title}</span>
            <button onClick={() => setOpen(false)} className="p-1 text-ink-soft hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-grow space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-[3px] px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-accent text-accent-ink"
                      : "border border-line bg-bg text-ink-soft"
                  }`}
                >
                  {m.text.replace(/\*\*/g, "")}
                </div>
              </div>
            ))}
            {loading && (
              <div className="font-mono text-xs text-ink-soft">…</div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.advisor.placeholder}
              className="flex-grow border-b border-line bg-transparent px-1 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-[2px] bg-accent px-3 text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
