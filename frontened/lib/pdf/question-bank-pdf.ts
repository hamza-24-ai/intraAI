// lib/pdf/question-bank-pdf.ts
// jsPDF is imported dynamically: it stays out of the initial bundle and never runs on the server.
import type { jsPDF } from "jspdf";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import { slugifySkill } from "@/lib/question-bank-utils";
import type { Difficulty, QuestionSet } from "@/lib/schemas";

type PdfDoc = jsPDF;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = PAGE_HEIGHT - MARGIN - 7;
const FOOTER_Y = PAGE_HEIGHT - 11;

const VIOLET: [number, number, number] = [106, 47, 212];
const INK: [number, number, number] = [21, 23, 28];
const SLATE_DARK: [number, number, number] = [86, 89, 99];

const QUESTION_SIZE = 11;
const QUESTION_LINE = 5.2;
const HINT_SIZE = 9.5;
const HINT_LINE = 4.5;
const QUESTION_GAP = 6;
const HINT_GAP = 1.5;

/** jsPDF's standard fonts only cover Latin-1; keep everything else out of the PDF. */
function sanitize(value: string): string {
  return value
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function setText(doc: PdfDoc, size: number, color: [number, number, number], style: "normal" | "bold" | "italic") {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

interface RenderArgs {
  sets: QuestionSet[];
  difficulty: Difficulty;
  targetRole: string | null;
  footerLabel: string;
  filename: string;
}

async function renderAndSave({ sets, difficulty, targetRole, footerLabel, filename }: RenderArgs) {
  const { jsPDF: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  const difficultyLabel = DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.label ?? "Intermediate";
  const generated = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const role = sanitize(targetRole || "Software Engineer");

  const writeHeader = () => {
    setText(doc, 20, VIOLET, "bold");
    doc.text("IntraAI", MARGIN, MARGIN);
    const brandWidth = doc.getTextWidth("IntraAI");
    setText(doc, 20, INK, "bold");
    doc.text("Question Bank", MARGIN + brandWidth + 3, MARGIN);

    setText(doc, 10, SLATE_DARK, "normal");
    doc.text(sanitize(`${role} · ${difficultyLabel} · Generated ${generated}`), MARGIN, MARGIN + 8);
  };

  writeHeader();
  let y = MARGIN + 18;

  const writeSkillHeading = (skill: string, continued: boolean) => {
    setText(doc, 15, VIOLET, "bold");
    doc.text(sanitize(continued ? `${skill} (continued)` : skill), MARGIN, y);
    y += 9;
  };

  const startContinuedPage = (skill: string) => {
    doc.addPage();
    y = MARGIN;
    writeSkillHeading(skill, true);
  };

  for (const set of sets) {
    const skill = sanitize(set.skill) || "General";

    if (y + 20 > CONTENT_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
    writeSkillHeading(skill, false);

    set.questions.forEach((question, questionIndex) => {
      setText(doc, QUESTION_SIZE, INK, "normal");
      const questionLines = doc.splitTextToSize(
        sanitize(question.question_text) || "Question unavailable",
        CONTENT_WIDTH - 7
      ) as string[];
      const hintText = question.answer_hint ? sanitize(question.answer_hint) : "";
      setText(doc, HINT_SIZE, SLATE_DARK, "italic");
      const hintLines = hintText
        ? (doc.splitTextToSize(`What a strong answer covers: ${hintText}`, CONTENT_WIDTH - 7) as string[])
        : [];

      const blockHeight =
        questionLines.length * QUESTION_LINE +
        (hintLines.length > 0 ? HINT_GAP + hintLines.length * HINT_LINE : 0) +
        QUESTION_GAP;

      if (y + blockHeight > CONTENT_BOTTOM && y > MARGIN + 1) {
        startContinuedPage(skill);
      }

      setText(doc, QUESTION_SIZE, INK, "bold");
      doc.text(`${questionIndex + 1}.`, MARGIN, y);
      setText(doc, QUESTION_SIZE, INK, "normal");
      questionLines.forEach((line, lineIndex) => {
        doc.text(line, MARGIN + 7, y + lineIndex * QUESTION_LINE);
      });
      y += questionLines.length * QUESTION_LINE;

      if (hintLines.length > 0) {
        y += HINT_GAP;
        setText(doc, HINT_SIZE, SLATE_DARK, "italic");
        hintLines.forEach((line, lineIndex) => {
          doc.text(line, MARGIN + 7, y + lineIndex * HINT_LINE);
        });
        y += hintLines.length * HINT_LINE;
      }

      y += QUESTION_GAP;
    });

    y += 2;
  }

  const pageCount = doc.getNumberOfPages();
  const label = sanitize(footerLabel) || "All skills";
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    setText(doc, 9, SLATE_DARK, "normal");
    doc.text(`IntraAI · ${label} · Page ${page} of ${pageCount}`, PAGE_WIDTH / 2, FOOTER_Y, { align: "center" });
  }

  doc.save(filename);
}

export async function downloadSkillPdf({
  set,
  difficulty,
  targetRole,
}: {
  set: QuestionSet;
  difficulty: Difficulty;
  targetRole: string | null;
}) {
  await renderAndSave({
    sets: [set],
    difficulty,
    targetRole,
    footerLabel: set.skill,
    filename: `intraai-questions-${slugifySkill(set.skill)}-${difficulty}.pdf`,
  });
}

export async function downloadAllPdf({
  sets,
  difficulty,
  targetRole,
}: {
  sets: QuestionSet[];
  difficulty: Difficulty;
  targetRole: string | null;
}) {
  await renderAndSave({
    sets,
    difficulty,
    targetRole,
    footerLabel: "All skills",
    filename: `intraai-questions-all-${difficulty}.pdf`,
  });
}
