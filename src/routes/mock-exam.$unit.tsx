import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  FileDown,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { SYLLABUS, type SyllabusUnit } from "@/data/syllabus";
import { downloadAnswerKey, downloadExamPaper } from "@/lib/examPrint";
import type { ExamSection, MockExamPaper } from "@/lib/mockExam";

export const Route = createFileRoute("/mock-exam/$unit")({
  head: ({ params }) => {
    const title = `Unit ${params.unit} Mock Exam — Sayar Owl Academy`;
    const description = `A full Grade 10 English mock exam paper for Unit ${params.unit}, written by Sayar Owl in the Myanmar matriculation format: nine sections, 95 marks, with a built-in timer.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: MockExamPage,
});

function useUnitMeta(unitNumber: number) {
  return useMemo(() => {
    const node = SYLLABUS.find(
      (n): n is SyllabusUnit => n.type === "unit" && n.number === unitNumber,
    );
    return {
      title: node?.title ?? `Unit ${unitNumber}`,
      topics: node ? node.skills.map((s) => `${s.label}: ${s.detail}`).join("; ") : "",
    };
  }, [unitNumber]);
}

function MockExamPage() {
  const { unit } = Route.useParams();
  const navigate = useNavigate();
  const unitNumber = Number(unit);
  const meta = useUnitMeta(unitNumber);

  const [paper, setPaper] = useState<MockExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const generate = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      setPaper(null);
      setShowAnswers(false);
      try {
        const res = await fetch("/api/mock-exam", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ unit: unitNumber, unitTitle: meta.title, topics: meta.topics }),
        });
        const data = (await res.json()) as MockExamPaper & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Could not generate the exam paper");
        setPaper(data);
        setSeconds((data.durationMinutes ?? 120) * 60);
        setRunning(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [unitNumber, meta.title, meta.topics],
  );

  useEffect(() => {
    void generate();
  }, [generate]);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [running, seconds]);

  const clock = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(
    Math.floor((seconds % 3600) / 60),
  ).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the curriculum
        </button>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Unit {unit} · Sayar Owl mock exam
            </p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {paper?.title ?? meta.title}
            </h1>
            {paper && (
              <p className="mt-1 text-sm text-muted-foreground">
                {paper.sections.length} sections · {paper.totalMarks} marks ·{" "}
                {paper.durationMinutes} minutes
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-sm ${
                seconds === 0 && paper ? "border-destructive text-destructive" : "border-border"
              }`}
            >
              <Clock className="h-4 w-4" /> {clock}
            </span>
            <Button variant="outline" size="sm" onClick={() => setRunning((r) => !r)} disabled={!paper}>
              {running ? "Pause" : "Start"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void generate()} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> New paper
            </Button>
            <Button size="sm" onClick={() => paper && downloadExamPaper(paper)} disabled={!paper}>
              <FileDown className="h-4 w-4" /> Download Paper
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => paper && downloadAnswerKey(paper)}
              disabled={!paper}
            >
              <FileCheck2 className="h-4 w-4" /> Download Answer Key
            </Button>

          </div>
        </header>

        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Sayar Owl is writing your Unit {unit} exam paper. This takes a minute — nine full
            sections are being set.
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
            <p className="font-semibold">Could not generate the paper.</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button className="mt-3" size="sm" onClick={() => void generate()}>
              Try again
            </Button>
          </div>
        )}

        {paper && (
          <>
            <div className="mt-6 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAnswers((v) => !v)}>
                {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showAnswers ? "Hide answer key" : "Show answer key"}
              </Button>
            </div>
            <div className="mt-2 space-y-6">
              {paper.sections.map((section) => (
                <SectionCard key={section.id} section={section} showAnswers={showAnswers} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Answer({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

function SectionCard({ section, showAnswers }: { section: ExamSection; showAnswers: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 pb-3">
        <h2 className="text-base font-bold tracking-tight">
          <span className="mr-2 text-primary">Section {section.id}.</span>
          {section.title}
        </h2>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {section.marks} marks
        </span>
      </header>
      <p className="mb-4 text-sm italic text-muted-foreground">{section.instructions}</p>
      <SectionBody section={section} showAnswers={showAnswers} />
    </section>
  );
}

function SectionBody({ section, showAnswers }: { section: ExamSection; showAnswers: boolean }) {
  switch (section.type) {
    case "fill":
      return (
        <ol className="space-y-2 text-sm">
          {section.items.map((i) => (
            <li key={i.number}>
              {i.number}. {i.sentence}
              {i.hint && <span className="text-muted-foreground"> ({i.hint}…)</span>}
              <Answer show={showAnswers}>{i.answer}</Answer>
            </li>
          ))}
        </ol>
      );
    case "mcq":
      return (
        <ol className="space-y-3 text-sm">
          {section.items.map((i) => (
            <li key={i.number}>
              <p>
                {i.number}. {i.sentence}
                <Answer show={showAnswers}>{i.answer}</Answer>
              </p>
              <p className="mt-1 flex flex-wrap gap-4 text-muted-foreground">
                {i.options.map((o) => (
                  <span key={o.label}>
                    ({o.label}) {o.text}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ol>
      );
    case "transformation":
      return (
        <ol className="space-y-2 text-sm">
          {section.items.map((i) => (
            <li key={i.number}>
              {i.number}. {i.sentence}{" "}
              <span className="font-medium text-primary">[{i.instruction}]</span>
              <Answer show={showAnswers}>{i.answer}</Answer>
            </li>
          ))}
        </ol>
      );
    case "poetry":
      return (
        <div className="space-y-4 text-sm">
          <p className="font-semibold">{section.poemTitle}</p>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Part A (5 marks)
            </p>
            <ol className="space-y-1.5 whitespace-pre-line">
              {section.partA.map((i) => (
                <li key={i.number}>
                  {i.number}. {i.sentence}
                  <Answer show={showAnswers}>{i.answer}</Answer>
                </li>
              ))}
            </ol>
          </div>
          <QaList title="Part B (5 marks)" items={section.partB} showAnswers={showAnswers} />
        </div>
      );
    case "passage":
      return (
        <div className="space-y-4 text-sm">
          <p className="rounded-xl bg-secondary/50 p-4 leading-relaxed">{section.passage}</p>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Part A (5 marks)
            </p>
            <ol className="space-y-1.5">
              {section.partA.map((i) => (
                <li key={i.number}>
                  {i.number}. {i.sentence}
                  <Answer show={showAnswers}>{i.answer}</Answer>
                </li>
              ))}
            </ol>
          </div>
          <QaList title="Part B (5 marks)" items={section.partB} showAnswers={showAnswers} />
        </div>
      );
    case "passage_extended":
      return (
        <div className="space-y-4 text-sm">
          <p className="rounded-xl bg-secondary/50 p-4 leading-relaxed">{section.passage}</p>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Part A (5 marks) — match each definition with a boldfaced word
            </p>
            <ol className="space-y-1.5">
              {section.definitions.map((d) => (
                <li key={d.number}>
                  {d.number}. {d.definition}
                  <Answer show={showAnswers}>{d.answer}</Answer>
                </li>
              ))}
              <li className="text-muted-foreground">
                {section.definitions.length + 1}. {section.distractorDefinition}
              </li>
            </ol>
          </div>
          <QaList title="Part B (10 marks)" items={section.partB} showAnswers={showAnswers} />
        </div>
      );
    case "functional":
      return (
        <div className="space-y-4 text-sm">
          <Bank title="Word bank" words={section.wordBank} />
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Part A (5 marks)
            </p>
            <ol className="space-y-1.5">
              {section.dialogue.map((t) => (
                <li key={t.number}>
                  <span className="font-medium">{t.speaker}:</span> {t.text}
                  {t.answer && <Answer show={showAnswers}>{t.answer}</Answer>}
                </li>
              ))}
            </ol>
          </div>
          <Bank title="Phrase bank" words={section.phraseBank} />
          <QaList title="Part B (5 marks)" items={section.matches} showAnswers={showAnswers} />
        </div>
      );
    case "writing":
      return (
        <div className="space-y-2 text-sm">
          <ol className="space-y-2">
            {section.prompts.map((p, i) => (
              <li key={i} className="rounded-lg bg-secondary/50 p-3">
                ({String.fromCharCode(97 + i)}) {p}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Maximum {section.maxWords} words.</p>
        </div>
      );
    default:
      return null;
  }
}

function Bank({ title, words }: { title: string; words: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-primary/40 p-3">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{title}</p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        {words.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </p>
    </div>
  );
}

function QaList({
  title,
  items,
  showAnswers,
}: {
  title: string;
  items: { number: number; question: string; answer: string }[];
  showAnswers: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">{title}</p>
      <ol className="space-y-2">
        {items.map((q) => (
          <li key={q.number}>
            {q.number}. {q.question}
            {showAnswers && (
              <span className="mt-0.5 flex items-start gap-1.5 text-xs text-primary">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                {q.answer}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
