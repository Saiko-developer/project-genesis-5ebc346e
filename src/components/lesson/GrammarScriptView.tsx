/**
 * Renders the hand-written grammar scripts from `src/data/grammar/*` exactly as
 * authored — no AI-generated prose. Each section offers two views:
 * "Text Explanation" (default) and "Oral Explanation".
 *
 * Oral mode speaks the authored `oral.scriptMy` string through the app's own
 * `/api/tts` pipeline (Gemini `google/gemini-2.5-flash-tts` voice "Kore",
 * falling back to `openai/gpt-4o-mini-tts` voice "shimmer" on any failure).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Mic, Pause, Play, Volume2 } from "lucide-react";

import { OwlBadge } from "@/components/lesson/ExerciseKit";
import { Button } from "@/components/ui/button";
import { sanitizeForSpeech } from "@/lib/sanitizeSpeech";
import type { GrammarSection, UnitGrammar } from "@/data/grammar/types";

type Mode = "text" | "oral";




export function GrammarScriptView({ grammar }: { grammar: UnitGrammar }) {
  return (
    <div className="space-y-6">
      {grammar.sections.map((section) => (
        <GrammarSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}

function GrammarSectionCard({ section }: { section: GrammarSection }) {
  const [mode, setMode] = useState<Mode>("text");
  const speech = useCloudSpeech();
  const { stop } = speech;

  // Stop audio instantly when leaving oral mode or unmounting the card.
  useEffect(() => {
    if (mode !== "oral") stop();
  }, [mode, stop]);
  useEffect(() => () => stop(), [stop]);

  const busy = speech.status === "loading";
  const active = speech.status === "playing" || speech.status === "paused";

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header>
        <h3 className="text-lg font-bold leading-tight">{section.titleEn}</h3>
        <p className="text-sm text-muted-foreground">{section.titleMy}</p>
      </header>

      <div className="mt-4 inline-flex rounded-xl border border-border bg-background p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === "text" ? "default" : "ghost"}
          className="gap-1.5 rounded-lg"
          onClick={() => setMode("text")}
          aria-pressed={mode === "text"}
        >
          <BookOpen className="h-3.5 w-3.5" /> Text Explanation
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "oral" ? "default" : "ghost"}
          className="gap-1.5 rounded-lg"
          onClick={() => setMode("oral")}
          aria-pressed={mode === "oral"}
          aria-busy={mode === "oral" && busy}
        >
          {mode === "oral" && busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : mode === "oral" && active ? (
            <Volume2 className="h-3.5 w-3.5 animate-pulse" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
          {mode === "oral" && busy
            ? "Loading audio…"
            : mode === "oral" && active
              ? "Oral Explanation • Playing"
              : "Oral Explanation"}
        </Button>
      </div>

      {mode === "text" ? (
        <TextMode section={section} />
      ) : (
        <OralMode section={section} speech={speech} />
      )}
    </section>
  );
}


function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-semibold text-primary">{title}</p>
      <div className="mt-1 space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function TextMode({ section }: { section: GrammarSection }) {
  const t = section.text;
  return (
    <div className="mt-4 space-y-3">
      <Block title="၁။ ဘာလဲ? (What)">
        {t.whatMy.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Block>

      <Block title="၂။ ဘာကြောင့် သုံးလဲ? (Why)">
        {t.whyMy.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Block>

      <Block title="🔀 Before vs After">
        <ul className="space-y-1">
          {t.transformation.beforeEn.map((s, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              • {s}
            </li>
          ))}
        </ul>
        <p className="rounded-md bg-primary/10 p-2 text-sm font-semibold">
          → {t.transformation.afterEn}
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          {t.transformation.stepsMy.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Block>

      <Block title="၃။ ရွှေစည်းမျဉ်းများ (Golden Rules)">
        <ul className="space-y-1">
          {t.goldenRulesMy.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      </Block>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/30">
        <p className="text-xs font-semibold">⚠️ အမှားများ (Common Mistakes)</p>
        <ul className="mt-1 space-y-2 text-sm leading-relaxed">
          {t.mistakes.map((m, i) => (
            <li key={i}>
              <p className="line-through decoration-destructive">✘ {m.wrongEn}</p>
              <p className="font-semibold">✔ {m.rightEn}</p>
              <p className="text-muted-foreground">{m.whyMy}</p>
            </li>
          ))}
        </ul>
      </div>

      <Block title="၄။ ဝါကျတည်ဆောက်ပုံ (Formulas)">
        <div className="space-y-3">
          {t.formulas.map((f, i) => (
            <div key={i} className="rounded-md border border-border p-2">
              <p className="text-xs font-semibold text-primary">{f.labelMy}</p>
              <p className="mt-1 font-mono text-xs">{f.formula}</p>
              <p className="mt-1 text-sm font-medium">{f.exampleEn}</p>
              <p className="text-sm text-muted-foreground">{f.exampleMy}</p>
              <ul className="mt-2 space-y-1">
                {f.parts.map((p, j) => (
                  <li key={j} className="text-xs">
                    <span className="font-semibold">{p.chunk}</span>{" "}
                    <span className="text-primary">{p.role}</span> — {p.glossMy}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}

/**
 * Oral mode — the authored `oral.scriptMy` is spoken through `/api/tts`
 * (Gemini "Kore", OpenAI "shimmer" fallback) and NOT shown on screen.
 * Students see a short, scannable bullet summary plus a play/pause control.
 */
function OralMode({
  section,
  speech,
}: {
  section: GrammarSection;
  speech: CloudSpeech;
}) {
  const o = section.oral;
  // `scriptMy` is authored as concatenated string literals — joining happens at
  // build time, so this is already one clean Unicode string. Only strip markup.
  const spoken = sanitizeForSpeech(String(o.scriptMy));
  const { status, error, toggle } = speech;
  const startedRef = useRef(false);

  // Auto-read as soon as the Oral Explanation view opens.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void toggle(spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bullets = summarise(section);
  const loading = status === "loading";
  const playing = status === "playing";

  return (
    <div className="mt-4 space-y-3">
      <OwlBadge>
        <p className="font-semibold">ဆရာ ဇီးကွက်ရဲ့ ပါးစပ်ရှင်းပြချက် 🦉</p>
      </OwlBadge>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold text-primary">📝 မှတ်စု အကျဉ်းချုပ် (Short notes)</p>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 rounded-full"
            disabled={loading}
            onClick={() => void toggle(spoken)}
            aria-label={playing ? "Pause explanation" : "Play explanation"}
            aria-busy={loading}
            title={
              loading ? "အသံ ပြင်ဆင်နေသည်..." : playing ? "ခေတ္တရပ်ရန်" : "အသံဖွင့်ရန်"
            }
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 font-mono text-xs">{o.note.formula}</p>

        <ul className="mt-2 space-y-1">
          {o.note.examples.map((e, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{e.en}</span>
              <span className="text-muted-foreground"> — {e.my}</span>
            </li>
          ))}
        </ul>

        {status === "error" ? (
          <p className="mt-3 text-xs text-destructive">
            အသံ ဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။{error ? ` (${error})` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Turn the cheat-sheet idea + golden rules into short scannable bullets. */
function summarise(section: GrammarSection): string[] {
  const fromIdea = section.oral.note.ideaMy
    .split(/(?<=။)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const rules = section.text.goldenRulesMy.map((r) => r.trim()).filter(Boolean);
  return [...fromIdea, ...rules].slice(0, 6);
}

/** Split a long Burmese script into TTS-sized chunks at sentence boundaries. */
function chunkScript(text: string, maxChars = 900): string[] {
  const sentences = text.split(/(?<=[။\.\!\?])\s*/).filter((s) => s.trim());
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      current = "";
      for (let i = 0; i < sentence.length; i += maxChars) {
        chunks.push(sentence.slice(i, i + maxChars).trim());
      }
      continue;
    }
    if (current.length + sentence.length > maxChars) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
}

type SpeechStatus = "idle" | "loading" | "playing" | "paused" | "error";

type CloudSpeech = {
  status: SpeechStatus;
  error: string | null;
  toggle: (text: string) => Promise<void>;
  stop: () => void;
};

/**
 * Cloud TTS playback for the grammar oral scripts.
 *
 * Every chunk is POSTed to `/api/tts`, which uses
 * `google/gemini-2.5-flash-tts` (voice "Kore") and instantly falls back to
 * `openai/gpt-4o-mini-tts` (voice "shimmer") if Gemini errors out. The body is
 * JSON-encoded, so Burmese Unicode is transmitted intact.
 */
function useCloudSpeech(): CloudSpeech {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const runIdRef = useRef(0);

  const cleanup = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
      } catch {
        // ignore
      }
      audio.onended = null;
      audio.onerror = null;
      audio.src = "";
      audioRef.current = null;
    }
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    cleanup();
    setStatus("idle");
    setError(null);
  }, [cleanup]);

  useEffect(() => () => stop(), [stop]);

  const fetchChunk = useCallback(async (text: string): Promise<Blob> => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      // "sarah" maps to Gemini "Kore" server-side and to OpenAI "shimmer"
      // in the fallback path.
      body: JSON.stringify({ text, voice: "sarah", speed: 1.0 }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`TTS ${res.status}${detail ? `: ${detail.slice(0, 120)}` : ""}`);
    }
    return res.blob();
  }, []);

  const playBlob = useCallback((blob: Blob, myId: number) => {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio playback failed"));
      audio.play().then(
        () => {
          if (myId === runIdRef.current) setStatus("playing");
        },
        (err) => reject(err instanceof Error ? err : new Error("autoplay blocked")),
      );
    });
  }, []);

  const toggle = useCallback(
    async (text: string) => {
      if (typeof window === "undefined") return;
      const audio = audioRef.current;

      if (audio && !audio.paused) {
        audio.pause();
        setStatus("paused");
        return;
      }
      if (audio && audio.paused && status === "paused") {
        try {
          await audio.play();
          setStatus("playing");
        } catch {
          setStatus("error");
        }
        return;
      }

      const clean = text.trim();
      if (!clean) return;

      runIdRef.current += 1;
      const myId = runIdRef.current;
      cleanup();
      setError(null);
      setStatus("loading");

      try {
        const chunks = chunkScript(clean);
        // Fetch the first chunk, then prefetch the next while the current plays.
        let pending: Promise<Blob> | null = fetchChunk(chunks[0]);
        for (let i = 0; i < chunks.length; i++) {
          const blob = await pending!;
          if (myId !== runIdRef.current) return;
          pending = i + 1 < chunks.length ? fetchChunk(chunks[i + 1]) : null;
          await playBlob(blob, myId);
          if (myId !== runIdRef.current) return;
        }
        if (myId !== runIdRef.current) return;
        cleanup();
        setStatus("idle");
      } catch (err) {
        if (myId !== runIdRef.current) return;
        console.error("[grammar-oral-tts] failed", err);
        cleanup();
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    },
    [cleanup, fetchChunk, playBlob, status],
  );

  return { status, error, toggle, stop };
}


