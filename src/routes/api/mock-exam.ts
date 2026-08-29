import { createFileRoute } from "@tanstack/react-router";

import { generateJson } from "@/lib/ai-json.server";
import type { MockExamPaper } from "@/lib/mockExam";

type Body = { unit?: number; unitTitle?: string; topics?: string };

/**
 * Sayar Owl mock-exam generation engine for the Syllabus Curriculum Explorer.
 * Dynamic across all 12 units — the unit number and topics are passed per request.
 */
export const Route = createFileRoute("/api/mock-exam")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const unit = Number(body.unit ?? 1);
        const topics = (body.topics ?? "").slice(0, 2000);
        const unitTitle = body.unitTitle ?? `Unit ${unit}`;

        const system = `You are Sayar Owl, the automated examination generation engine for Grade 10 English in Myanmar.
Generate a complete mock exam paper based strictly on the theme, reading materials and grammar targets of Unit ${unit} (${unitTitle}: ${topics}).

DIFFICULTY INDEX: Balanced / Standard Intermediate — match real Myanmar matriculation papers. No trivial items, no post-graduate or obscure terminology.

Generate ALL 9 sections, in order, with these exact ids and marks:
I Vocabulary Completion (Initial Letters Provided) — 10 marks, type "fill": 10 contextual sentences using unit vocabulary; each sentence contains a blank written as "______"; "hint" is the first letter of the missing word.
II Multiple Choice Vocabulary & Expressions — 10 marks, type "mcq": 10 sentences testing phrasal collocations or word forms from the unit text, options labelled A, B, C; "answer" is the label letter.
III Sentence Transformation & Grammar Rules — 10 marks, type "transformation": 10 rewriting items; "instruction" is the bracketed instruction text; at least 4-5 items must test the primary grammar focus of Unit ${unit}.
IV Poetry Text & Poetry Comprehension — 10 marks, type "poetry": partA = 5 fill-in-the-blank lines of verse (blank as "______"); partB = 5 comprehension questions on those exact lines with full-sentence answers.
V Reading Passage A — 10 marks, type "passage": an original unseen ~150-word passage expanding the unit theme; partA = 5 text-completion blanks; partB = 5 literal questions with strict ONE-SENTENCE answers.
VI Extended Reading Passage B — 15 marks, type "passage_extended": an original ~250-word text on the unit's broader themes with the target words written in **bold** inside the passage; "definitions" = 5 definitions whose answers are those boldfaced words; "distractorDefinition" = exactly 1 extra definition with no match; partB = 5 analytical questions with full-sentence answers.
VII Functional English & Situational Dialogues — 10 marks, type "functional": "dialogue" = one continuous 5-turn dialogue matching the unit's speaking themes, each turn containing a "______" blank filled from "wordBank" (word bank has 6 entries = 5 answers + 1 distractor); "matches" = 5 independent situational speaker prompts answered from "phraseBank" (6 entries).
VIII Directed Guided Writing (Letter) — 10 marks, type "writing", maxWords 200: 2 optional letter-writing scenarios matching the unit's communicative tasks.
IX Free Composition (Essay) — 10 marks, type "writing", maxWords 300: 3 thematic essay prompts rooted in the unit's core concept.

Return ONLY this JSON shape:
{"title":string,"unit":${unit},"unitTopics":string,"totalMarks":95,"durationMinutes":120,"sections":[
  {"id":"I","title":string,"marks":10,"instructions":string,"type":"fill","items":[{"number":1,"sentence":string,"hint":string,"answer":string}]},
  {"id":"II","title":string,"marks":10,"instructions":string,"type":"mcq","items":[{"number":1,"sentence":string,"options":[{"label":"A","text":string},{"label":"B","text":string},{"label":"C","text":string}],"answer":"A"}]},
  {"id":"III","title":string,"marks":10,"instructions":string,"type":"transformation","items":[{"number":1,"sentence":string,"instruction":string,"answer":string}]},
  {"id":"IV","title":string,"marks":10,"instructions":string,"type":"poetry","poemTitle":string,"partA":[{"number":1,"sentence":string,"answer":string}],"partB":[{"number":1,"question":string,"answer":string}]},
  {"id":"V","title":string,"marks":10,"instructions":string,"type":"passage","passage":string,"partA":[{"number":1,"sentence":string,"answer":string}],"partB":[{"number":1,"question":string,"answer":string}]},
  {"id":"VI","title":string,"marks":15,"instructions":string,"type":"passage_extended","passage":string,"definitions":[{"number":1,"definition":string,"answer":string}],"distractorDefinition":string,"partB":[{"number":1,"question":string,"answer":string}]},
  {"id":"VII","title":string,"marks":10,"instructions":string,"type":"functional","wordBank":[string],"dialogue":[{"number":1,"speaker":string,"text":string,"answer":string}],"phraseBank":[string],"matches":[{"number":1,"question":string,"answer":string}]},
  {"id":"VIII","title":string,"marks":10,"instructions":string,"type":"writing","maxWords":200,"prompts":[string,string],"sampleAnswers":[string,string]},
  {"id":"IX","title":string,"marks":10,"instructions":string,"type":"writing","maxWords":300,"prompts":[string,string,string],"sampleAnswers":[string,string,string]}
]}
For Section VIII and Section IX, generate a matching "sampleAnswers" array for every prompt. Each sample answer must be a complete, polished model response suitable for a Grade 10 Myanmar student, kept within the stated word limit, and aligned with the unit theme.
No conversational text.`;

        try {
          const paper = await generateJson<MockExamPaper>({
            system,
            prompt: `Generate the Unit ${unit} mock exam paper now. Unit title: ${unitTitle}. Unit topics: ${topics}`,
          });
          if (!paper?.sections?.length) throw new Error("Empty exam paper");
          return Response.json(paper);
        } catch (error) {
          console.error("[mock-exam]", error);
          const msg = error instanceof Error ? error.message : "unknown";
          const status =
            msg.includes("429") || msg.toLowerCase().includes("rate limit")
              ? 429
              : msg.includes("402") || msg.toLowerCase().includes("payment required")
                ? 402
                : 500;
          return Response.json({ error: msg }, { status });
        }
      },
    },
  },
});
