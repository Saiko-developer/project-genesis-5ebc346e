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
 * Oral mode — the long script is spoken with the browser's native
 * SpeechSynthesis API and NOT shown on screen. Students see a short,
 * scannable bullet summary plus a play/pause control.
 */
function OralMode({ section }: { section: GrammarSection }) {
  const o = section.oral;
  const spoken = sanitizeForSpeech(o.scriptMy);
  const { supported, speaking, paused, toggle, stop } = useNativeSpeech();
  const startedRef = useRef(false);

  // Auto-read as soon as the Oral Explanation view opens; stop on unmount or
  // when the student switches back to Text Explanation.
  useEffect(() => {
    if (!supported || startedRef.current) return;
    startedRef.current = true;
    toggle(spoken);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  useEffect(() => () => stop(), [stop]);

  const bullets = summarise(section);

  return (
    <div className="mt-4 space-y-3">
      <OwlBadge>
        <p className="font-semibold">ဆရာ ဇီးကွက်ရဲ့ ပါးစပ်ရှင်းပြချက် 🦉</p>
      </OwlBadge>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold text-primary">📝 မှတ်စု အကျဉ်းချုပ် (Short notes)</p>
          {supported ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => toggle(spoken)}
              aria-label={speaking && !paused ? "Pause explanation" : "Play explanation"}
              title={speaking && !paused ? "ခေတ္တရပ်ရန်" : "အသံဖွင့်ရန်"}
            >
              {speaking && !paused ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          ) : null}
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

        {!supported ? (
          <p className="mt-3 text-xs text-muted-foreground">
            ဤဘရောက်ဇာတွင် အသံဖတ်ခြင်း (Speech) ကို မထောက်ပံ့ပါ။
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

/** Minimal wrapper around window.speechSynthesis with play / pause / stop. */
function useNativeSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const toggle = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;

      if (synth.speaking && !synth.paused) {
        synth.pause();
        setPaused(true);
        return;
      }
      if (synth.speaking && synth.paused) {
        synth.resume();
        setPaused(false);
        return;
      }

      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "my-MM";
      utter.rate = 0.95;
      utter.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      utter.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };
      synth.speak(utter);
      setSpeaking(true);
      setPaused(false);
    },
    [],
  );

  return { supported, speaking, paused, toggle, stop };
}

