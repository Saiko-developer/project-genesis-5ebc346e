/**
 * Renders the hand-written grammar scripts from `src/data/grammar/*` exactly as
 * authored — no AI-generated prose. Each section offers two views:
 * "Text Explanation" (default) and "Oral Explanation".
 */
import { useState } from "react";
import { BookOpen, Mic } from "lucide-react";

import { OwlBadge } from "@/components/lesson/ExerciseKit";
import { Button } from "@/components/ui/button";
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
        >
          <Mic className="h-3.5 w-3.5" /> Oral Explanation
        </Button>
      </div>

      {mode === "text" ? <TextMode section={section} /> : <OralMode section={section} />}
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

function OralMode({ section }: { section: GrammarSection }) {
  const o = section.oral;
  return (
    <div className="mt-4 space-y-3">
      <OwlBadge>
        <p className="font-semibold">ဆရာ ဇီးကွက်ရဲ့ ပါးစပ်ရှင်းပြချက် 🦉</p>
      </OwlBadge>

      <div className="rounded-lg border border-border bg-background p-3">
        <p className="whitespace-pre-line text-sm leading-relaxed">{o.scriptMy}</p>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-primary">📝 မှတ်စု (Cheat sheet)</p>
        <p className="mt-1 text-sm leading-relaxed">{o.note.ideaMy}</p>
        <p className="mt-2 font-mono text-xs">{o.note.formula}</p>
        <ul className="mt-2 space-y-1">
          {o.note.examples.map((e, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{e.en}</span>
              <span className="text-muted-foreground"> — {e.my}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
