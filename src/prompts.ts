import type { TaskId } from "./types";

const LEVEL = (level: string) =>
  ({ simple: "a motivated 13-year-old", plain: "an educated adult", eli5: "a 5-year-old" }[level] ??
    "a motivated 13-year-old");

export function clipText(text: string, maxChars: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, maxChars)}…`;
}

export function buildPrompt(task: TaskId, text: string, level: string, history?: string[]): string {
  const body = history?.length
    ? `MY SAVED NOTES:\n${history.map((h) => `- ${h}`).join("\n")}\n\nPAGE:\n${text}`
    : text;

  const instruction: Record<TaskId, string> = {
    firstRead:
      "You are ClearRead. Return exactly 5 short bullets a student can scan, then one line starting with 'Verdict:'. No preamble.",
    simplify: `You are ClearRead. Rewrite the whole page for ${LEVEL(level)}. Keep every factual detail. No preamble.`,
    deepRead:
      "You are ClearRead. Summarize in 4 bullets, then list 'Assumptions:' and 'Gaps:' the author left unstated. No preamble.",
    compare:
      "You are ClearRead. Compare the page against MY SAVED NOTES. Return three sections: 'Agrees with', 'Contradicts', 'New information'.",
  };

  return `${instruction[task]}\n\n${body}`;
}
