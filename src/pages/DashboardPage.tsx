import React, { useEffect, useRef, useState } from "react";
import {
  Send, Mic, MicOff, Sparkles, Eye, Check, X, Clock, GitBranch,
  AlertTriangle, ShieldCheck, Loader2, ExternalLink,
} from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Seo from "../components/Seo";
import {
  analyzeCommand, INTENT_LABELS, type ParsedCommand,
} from "../lib/cms/intent";

/* ----------------------------------------------------------------------- *
 * NOTE: This is a front-end SCAFFOLD / mockup. No backend is wired yet.
 * Status transitions below are simulated client-side so the workflow is
 * demonstrable. The buttons map 1:1 to the real pipeline described in
 * AI_AGENT_ARCHITECTURE.md. Replacing `analyzeCommand` and the
 * `advance()` simulation with real API calls is the only work needed.
 * ----------------------------------------------------------------------- */

type Status =
  | "received" | "analyzed" | "planned" | "preview_ready"
  | "approved" | "live" | "cancelled";

interface CommandRecord {
  id: string;
  text: string;
  source: "text" | "voice";
  parsed?: ParsedCommand;
  status: Status;
  branchName?: string;
  previewUrl?: string;
  createdAt: number;
}

const STATUS_FLOW: Status[] = [
  "received", "analyzed", "planned", "preview_ready", "approved", "live",
];

const STATUS_LABEL: Record<Status, string> = {
  received: "Received",
  analyzed: "Analyzed",
  planned: "Planned",
  preview_ready: "Preview ready",
  approved: "Approved",
  live: "Live",
  cancelled: "Cancelled",
};

function slugifyForBranch(parsed?: ParsedCommand): string {
  const intent = parsed?.intent ?? "change";
  const rand = Math.random().toString(36).slice(2, 7);
  return `cms/${intent.replace(/_/g, "-")}-${rand}`;
}

// Minimal typing for the optional Web Speech API (no dependency added).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | undefined;
  return Ctor ? new Ctor() : null;
}

export default function DashboardPage() {
  const [input, setInput] = useState("");
  const [commands, setCommands] = useState<CommandRecord[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

  const submit = async (text: string, source: "text" | "voice") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    const id = `cmd-${Date.now()}`;
    const record: CommandRecord = {
      id, text: trimmed, source, status: "received", createdAt: Date.now(),
    };
    setCommands((prev) => [record, ...prev]);

    setAnalyzing(true);
    const parsed = await analyzeCommand(trimmed);
    setAnalyzing(false);

    setCommands((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, parsed, status: "analyzed", branchName: slugifyForBranch(parsed) }
          : c
      )
    );
  };

  // Simulated pipeline step. In production each transition is an API call.
  const advance = (id: string, to: Status) => {
    setCommands((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const previewUrl =
          to === "preview_ready"
            ? `https://deploy-preview--the-garage.netlify.app/${(c.branchName ?? "").split("/").pop()}`
            : c.previewUrl;
        return { ...c, status: to, previewUrl };
      })
    );
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = getSpeechRecognition();
    if (!recognition) return;
    recognition.lang = "nl-NL";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      submit(transcript, "voice");
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <PageShell>
      <Seo title="AI-CMS Dashboard" description="Manage your website with voice or text commands." />

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 text-amber-500 uppercase tracking-widest font-mono text-xs mb-3">
              <Sparkles className="w-4 h-4" /> AI-CMS · Preview Scaffold
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Manage your website
            </h1>
            <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed">
              Type or speak an instruction in plain language. The assistant interprets it,
              prepares a change, and creates a safe preview before anything goes live.
            </p>
          </div>

          {/* Demo notice */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-8 text-xs text-amber-200/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-300">Demo mode.</strong> No backend is connected yet —
              intents are parsed locally and the pipeline is simulated. See{" "}
              <code className="text-amber-300">AI_AGENT_ARCHITECTURE.md</code> for wiring.
            </p>
          </div>

          {/* Command input */}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(input, "text"); }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='e.g. "Voeg een nieuwsbericht toe over onze open dag met foto"'
                className="flex-grow bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600"
              />
              <button
                type="button"
                onClick={toggleVoice}
                disabled={!voiceSupported}
                title={voiceSupported ? "Voice input" : "Voice input not supported in this browser"}
                className={`p-3 rounded transition-colors shrink-0 ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                type="submit"
                disabled={analyzing}
                className="p-3 bg-amber-500 hover:bg-amber-600 rounded text-neutral-950 transition-colors disabled:opacity-50 shrink-0"
              >
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                "Voeg een nieuwsbericht toe over onze open dag met foto",
                "Voeg een nieuwssectie toe aan de website met eigen menukeuze",
                "Wijzig de openingstijden naar 09:00 - 17:00",
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setInput(ex)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>

          {/* Command history */}
          <div className="space-y-4">
            {commands.length === 0 && (
              <p className="text-center text-sm text-neutral-600 py-10">
                Your commands and their status will appear here.
              </p>
            )}
            {commands.map((c) => (
              <CommandCard key={c.id} record={c} onAdvance={advance} />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function CommandCard({
  record, onAdvance,
}: { record: CommandRecord; onAdvance: (id: string, to: Status) => void }) {
  const { parsed } = record;
  const structural = parsed?.changeType === "structural";
  const stepIndex = STATUS_FLOW.indexOf(record.status);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            {record.source === "voice" ? <Mic className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm text-white font-medium leading-snug">{record.text}</p>
            {parsed && (
              <p className="text-[11px] font-mono text-neutral-500 mt-1">
                {INTENT_LABELS[parsed.intent]} · {(parsed.confidence * 100).toFixed(0)}% confidence
              </p>
            )}
          </div>
        </div>
        {parsed && (
          <span
            className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${
              structural
                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {structural ? "Structural" : parsed.changeType}
          </span>
        )}
      </div>

      {/* Parsed intent payload */}
      {parsed && (
        <pre className="bg-neutral-950 border border-neutral-800 rounded p-3 text-[11px] text-neutral-400 font-mono overflow-x-auto mb-4">
{JSON.stringify(
  { intent: parsed.intent, confidence: parsed.confidence, requiresApproval: parsed.requiresApproval, fields: parsed.fields },
  null, 2
)}
        </pre>
      )}

      {/* Status stepper */}
      {record.status !== "cancelled" ? (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {STATUS_FLOW.map((s, i) => (
            <React.Fragment key={s}>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  i <= stepIndex
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-neutral-950 text-neutral-600 border border-neutral-800"
                }`}
              >
                {STATUS_LABEL[s]}
              </span>
              {i < STATUS_FLOW.length - 1 && <span className="text-neutral-700 text-[10px]">→</span>}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mb-4 text-rose-400 text-xs">
          <X className="w-4 h-4" /> Cancelled
        </div>
      )}

      {/* Branch + preview meta */}
      {record.branchName && record.status !== "cancelled" && (
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-neutral-500 mb-4">
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-amber-500" /> {record.branchName}
          </span>
          {record.previewUrl && (
            <a
              href={record.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-amber-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open preview
            </a>
          )}
        </div>
      )}

      {/* Actions — map to the real pipeline */}
      <div className="flex flex-wrap gap-2">
        {record.status === "analyzed" && (
          <ActionBtn onClick={() => onAdvance(record.id, "planned")} icon={<Clock className="w-4 h-4" />}>
            Make plan
          </ActionBtn>
        )}
        {record.status === "planned" && (
          <ActionBtn onClick={() => onAdvance(record.id, "preview_ready")} icon={<Eye className="w-4 h-4" />}>
            Create preview
          </ActionBtn>
        )}
        {record.status === "preview_ready" && (
          <>
            <ActionBtn
              primary
              onClick={() => onAdvance(record.id, "approved")}
              icon={<Check className="w-4 h-4" />}
            >
              {structural ? "Approve (required)" : "Approve & publish"}
            </ActionBtn>
            <ActionBtn onClick={() => onAdvance(record.id, "cancelled")} icon={<X className="w-4 h-4" />} danger>
              Cancel
            </ActionBtn>
          </>
        )}
        {record.status === "approved" && (
          <ActionBtn primary onClick={() => onAdvance(record.id, "live")} icon={<ShieldCheck className="w-4 h-4" />}>
            Merge &amp; go live
          </ActionBtn>
        )}
        {record.status === "live" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Published live
          </span>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  children, onClick, icon, primary, danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all";
  const variant = primary
    ? "bg-amber-500 hover:bg-amber-600 text-neutral-950"
    : danger
    ? "bg-neutral-950 border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200";
  return (
    <button onClick={onClick} className={`${base} ${variant}`}>
      {icon} {children}
    </button>
  );
}
