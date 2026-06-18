import React, { useEffect, useRef, useState } from "react";
import {
  Send, Mic, MicOff, Sparkles, Eye, Check, X, Clock, GitBranch,
  AlertTriangle, ShieldCheck, Loader2, ExternalLink, Wifi, WifiOff,
  FilePlus2, FilePen, FileX2, ImagePlus,
} from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Seo from "../components/Seo";
import { INTENT_LABELS } from "../lib/cms/intent";
import { cmsApi } from "../lib/cms/api";
import { createCommand, applyAction } from "../lib/cms/machine";
import {
  STATUS_FLOW,
  type ApiCommand,
  type CommandAction,
  type CommandStatus,
  type PlannedFileChange,
} from "../lib/cms/contract";

/* ----------------------------------------------------------------------- *
 * This dashboard is backend-first: it calls /api/cms/* (real Express API).
 * If the backend is unreachable (e.g. static deploy without functions), it
 * transparently falls back to the SHARED pure state machine so the demo keeps
 * working. The logic is identical on both paths.
 * ----------------------------------------------------------------------- */

type Mode = "unknown" | "online" | "offline";

interface UploadedImage {
  dataUrl: string;
  filename: string;
}

type PreviewState = "building" | "ready" | "timeout";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A real Netlify deploy preview (not the simulated "--the-garage" mock URL).
function isRealPreviewUrl(url?: string | null): boolean {
  return Boolean(url) && url!.includes(".netlify.app") && !url!.includes("the-garage");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const STATUS_LABEL: Record<CommandStatus, string> = {
  analyzed: "Analyzed",
  planned: "Planned",
  preview_ready: "Preview ready",
  approved: "Approved",
  live: "Live",
  cancelled: "Cancelled",
  error: "Error",
};

const EXAMPLES = [
  "Voeg een nieuwsbericht toe over onze open dag met foto",
  "Voeg een nieuwssectie toe aan de website met eigen menukeuze",
  "Wijzig de openingstijden naar 09:00 - 17:00",
];

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
  const [commands, setCommands] = useState<ApiCommand[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("unknown");
  const [images, setImages] = useState<Record<string, UploadedImage>>({});
  // Per-command deploy-preview reachability: building -> ready | timeout.
  const [previewState, setPreviewState] = useState<Record<string, PreviewState>>({});
  const pollCancels = useRef<Record<string, boolean>>({});
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

  // Load persisted command history (durable when a database is configured).
  useEffect(() => {
    let active = true;
    cmsApi
      .list()
      .then((history) => {
        if (active && history.length > 0) {
          setCommands(history);
          setMode("online");
        }
      })
      .catch(() => {
        /* no backend / no history — stay in current mode */
      });
    return () => {
      active = false;
    };
  }, []);

  // Stop any running preview polls when the dashboard unmounts.
  useEffect(() => {
    return () => {
      for (const id of Object.keys(pollCancels.current)) pollCancels.current[id] = true;
    };
  }, []);

  // Poll the server-side reachability check until the deploy preview is live
  // (~4 min max). Mock URLs are treated as ready immediately (nothing to wait
  // for). Any failure just keeps "building" — the Open preview link still works.
  const startPreviewPoll = async (cmd: ApiCommand) => {
    const url = cmd.previewUrl;
    if (!url) return;
    if (!isRealPreviewUrl(url)) {
      setPreviewState((s) => ({ ...s, [cmd.id]: "ready" }));
      return;
    }
    setPreviewState((s) => ({ ...s, [cmd.id]: "building" }));
    pollCancels.current[cmd.id] = false;
    for (let attempt = 0; attempt < 48; attempt++) {
      if (pollCancels.current[cmd.id]) return;
      const { ready } = await cmsApi.previewStatus(url);
      if (pollCancels.current[cmd.id]) return;
      if (ready) {
        setPreviewState((s) => ({ ...s, [cmd.id]: "ready" }));
        return;
      }
      await sleep(5000);
    }
    setPreviewState((s) => ({ ...s, [cmd.id]: "timeout" }));
  };

  const submit = async (text: string, source: "text" | "voice") => {
    const trimmed = text.trim();
    if (!trimmed || analyzing) return;
    setInput("");
    setAnalyzing(true);
    let cmd: ApiCommand;
    try {
      cmd = await cmsApi.analyze(trimmed, source);
      setMode("online");
    } catch {
      cmd = createCommand(trimmed, source); // offline fallback (shared machine)
      setMode("offline");
    }
    setCommands((prev) => [cmd, ...prev]);
    setAnalyzing(false);
  };

  const act = async (cmd: ApiCommand, action: CommandAction) => {
    setBusyId(cmd.id);
    let next: ApiCommand;
    try {
      if (mode === "offline") {
        next = applyAction(cmd, action);
      } else {
        try {
          const extra =
            action === "preview" && images[cmd.id] ? { image: images[cmd.id] } : undefined;
          next = await cmsApi.transition(cmd, action, extra);
          setMode("online");
        } catch {
          // Backend went away mid-flow — continue locally.
          next = applyAction(cmd, action);
          setMode("offline");
        }
      }
      setCommands((prev) => prev.map((c) => (c.id === cmd.id ? next : c)));

      // Kick off / stop preview reachability polling.
      if (action === "preview" && next.status === "preview_ready") {
        void startPreviewPoll(next);
      } else if (action === "approve" || action === "cancel") {
        pollCancels.current[cmd.id] = true;
      }
    } finally {
      setBusyId(null);
    }
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
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-2 text-amber-500 uppercase tracking-widest font-mono text-xs mb-3">
                <Sparkles className="w-4 h-4" /> AI-CMS · Step 1 backend
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                Manage your website
              </h1>
              <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed">
                Type or speak an instruction in plain language. The assistant interprets it,
                drafts a change plan, builds a safe preview, and waits for your approval.
              </p>
            </div>
            <ModeBadge mode={mode} />
          </div>

          {/* Command input */}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(input, "text"); }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6"
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
              {EXAMPLES.map((ex) => (
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
              <CommandCard
                key={c.id}
                record={c}
                busy={busyId === c.id}
                onAct={act}
                previewState={previewState[c.id]}
                image={images[c.id]}
                onImageSelect={(img) => setImages((prev) => ({ ...prev, [c.id]: img }))}
                onImageClear={() =>
                  setImages((prev) => {
                    const next = { ...prev };
                    delete next[c.id];
                    return next;
                  })
                }
              />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ModeBadge({ mode }: { mode: Mode }) {
  if (mode === "online")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
        <Wifi className="w-3.5 h-3.5" /> Backend connected
      </span>
    );
  if (mode === "offline")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
        <WifiOff className="w-3.5 h-3.5" /> Demo mode (offline)
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500">
      <Loader2 className="w-3.5 h-3.5" /> Not connected yet
    </span>
  );
}

const FILE_ICON: Record<PlannedFileChange["action"], React.ReactNode> = {
  create: <FilePlus2 className="w-3.5 h-3.5 text-emerald-400" />,
  update: <FilePen className="w-3.5 h-3.5 text-amber-400" />,
  delete: <FileX2 className="w-3.5 h-3.5 text-rose-400" />,
};

function CommandCard({
  record, busy, onAct, previewState, image, onImageSelect, onImageClear,
}: {
  record: ApiCommand;
  busy: boolean;
  onAct: (c: ApiCommand, a: CommandAction) => void;
  previewState?: PreviewState;
  image?: UploadedImage;
  onImageSelect: (img: UploadedImage) => void;
  onImageClear: () => void;
}) {
  const structural = record.changeType === "structural";
  const stepIndex = STATUS_FLOW.indexOf(record.status);
  const needsImage = Boolean(record.fields?.needsImage) || record.intent === "set_image";
  const canUpload = needsImage && (record.status === "analyzed" || record.status === "planned");
  const previewBuilding = previewState === "building";
  const previewTimedOut = previewState === "timeout";
  // Steering intents: show a friendly message, no pipeline / buttons.
  const isInfo =
    record.intent === "clarify" || record.intent === "unsupported" || record.intent === "unknown";
  const infoText =
    record.intent === "unsupported"
      ? String(record.fields?.message ?? "Sorry, that isn't something I can do yet.")
      : String(record.fields?.question ?? "Sorry, I didn't fully understand that — could you rephrase?");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    onImageSelect({ dataUrl, filename: file.name });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            {record.transcriptSource === "voice" ? <Mic className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm text-white font-medium leading-snug">{record.inputText}</p>
            <p className="text-[11px] font-mono text-neutral-500 mt-1">
              {record.understood || INTENT_LABELS[record.intent]}
            </p>
          </div>
        </div>
        {!isInfo && (
          <span
            className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${
              structural
                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {structural ? "Structural · approval" : record.changeType}
          </span>
        )}
      </div>

      {isInfo ? (
        <div
          className={`flex items-start gap-3 rounded-lg p-4 text-xs leading-relaxed border ${
            record.intent === "unsupported"
              ? "bg-neutral-950 border-neutral-800 text-neutral-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-100/90"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p>{infoText}</p>
            <p className="text-[11px] text-neutral-500 mt-2">
              Type a new instruction above to continue.
            </p>
          </div>
        </div>
      ) : (
      <>
      {/* Plan */}
      {record.plan && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-neutral-300 mb-3">{record.plan.summary}</p>
          {record.plan.files.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {record.plan.files.map((f, i) => (
                <li key={i} className="text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center gap-2">
                    {FILE_ICON[f.action]}
                    <span className="text-neutral-300">{f.path}</span>
                    <span className="text-neutral-600">— {f.description}</span>
                  </div>
                  {f.preview && (
                    <details className="mt-1 ml-5">
                      <summary className="cursor-pointer text-neutral-600 hover:text-neutral-400">
                        view generated content
                      </summary>
                      <pre className="mt-1 bg-neutral-900 border border-neutral-800 rounded p-2 text-[10px] text-neutral-400 overflow-x-auto whitespace-pre-wrap">
{f.preview}
                      </pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
          {record.plan.warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300/90">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w}
            </p>
          ))}
        </div>
      )}

      {/* Image upload (when the command needs a photo) */}
      {(canUpload || image) && (
        <div className="flex items-center gap-3 mb-4 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
          {image ? (
            <>
              <img src={image.dataUrl} alt="upload preview" className="h-14 w-14 object-cover rounded border border-neutral-800" />
              <span className="text-[11px] font-mono text-neutral-400 flex-grow truncate">{image.filename}</span>
              <button
                onClick={onImageClear}
                className="text-[11px] font-mono text-rose-300 hover:text-rose-200 px-2 py-1"
              >
                remove
              </button>
            </>
          ) : (
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-amber-400">
              <ImagePlus className="w-4 h-4 text-amber-500" />
              <span>Upload a photo for this article</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
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
          {record.previewUrl &&
            (previewBuilding ? (
              <span className="flex items-center gap-1.5 text-amber-300" title="Waiting for the Netlify deploy preview">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preview building…
              </span>
            ) : (
              <a
                href={record.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-amber-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open preview
              </a>
            ))}
        </div>
      )}
      {record.status === "preview_ready" && record.previewUrl && previewBuilding && (
        <p className="flex items-start gap-1.5 text-[11px] text-neutral-500 mb-4 -mt-2">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Waiting for the Netlify deploy preview to come online — this can take a few minutes.
        </p>
      )}
      {record.status === "preview_ready" && record.previewUrl && previewTimedOut && (
        <p className="flex items-start gap-1.5 text-[11px] text-neutral-500 mb-4 -mt-2">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          This is taking longer than usual — you can try “Open preview” anyway.
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        {busy && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
        {record.status === "analyzed" && (
          <ActionBtn onClick={() => onAct(record, "plan")} icon={<Clock className="w-4 h-4" />}>
            Make plan
          </ActionBtn>
        )}
        {record.status === "planned" && (
          <ActionBtn onClick={() => onAct(record, "preview")} icon={<Eye className="w-4 h-4" />}>
            Create preview
          </ActionBtn>
        )}
        {record.status === "preview_ready" && (
          <>
            <ActionBtn primary onClick={() => onAct(record, "approve")} icon={<Check className="w-4 h-4" />}>
              {structural ? "Approve (required)" : "Approve"}
            </ActionBtn>
            <ActionBtn onClick={() => onAct(record, "cancel")} icon={<X className="w-4 h-4" />} danger>
              Cancel
            </ActionBtn>
          </>
        )}
        {record.status === "approved" && (
          <ActionBtn primary onClick={() => onAct(record, "deploy")} icon={<ShieldCheck className="w-4 h-4" />}>
            Merge &amp; go live
          </ActionBtn>
        )}
        {record.status === "live" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Published live
          </span>
        )}
      </div>

      {/* Log timeline */}
      {record.logs.length > 0 && (
        <details className="mt-4 group">
          <summary className="text-[11px] font-mono text-neutral-500 cursor-pointer hover:text-neutral-300">
            Activity log ({record.logs.length})
          </summary>
          <ul className="mt-2 space-y-1 border-l border-neutral-800 pl-3">
            {record.logs.map((l, i) => (
              <li key={i} className="text-[11px] font-mono text-neutral-500">
                <span className="text-amber-500/80">{l.step}</span> — {l.message}
              </li>
            ))}
          </ul>
        </details>
      )}
      </>
      )}
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
