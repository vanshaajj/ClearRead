import { sentences } from "../extract";
import type { TaskId } from "../types";

const SIMPLE: Record<string, string> = {
  approximately: "about",
  utilize: "use",
  utilisation: "use",
  subsequently: "later",
  therefore: "so",
  however: "but",
  additional: "more",
  demonstrate: "show",
  significant: "big",
  sufficient: "enough",
  require: "need",
  requirements: "needs",
  individuals: "people",
  commence: "start",
  terminate: "end",
  obtain: "get",
  currently: "now",
  previously: "before",
  regarding: "about",
  concerning: "about",
  numerous: "many",
  facilitate: "help",
  implement: "do",
  implementation: "doing",
  consequently: "so",
};

function scoreSentences(text: string): string[] {
  const list = sentences(text);
  if (!list.length) return text.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const freq = new Map<string, number>();
  const words = (s: string) => s.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
  for (const s of list) for (const w of words(s)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const ranked = list
    .map((s, i) => {
      const ws = words(s);
      const score = ws.reduce((n, w) => n + (freq.get(w) ?? 0), 0) / Math.max(ws.length, 1);
      const position = 1 - i / list.length;
      return { s, score: score + position * 4 };
    })
    .sort((a, b) => b.score - a.score);
  return ranked.map((r) => r.s);
}

function simplifyLexicon(s: string): string {
  return s.replace(/\b([A-Za-z]+)\b/g, (word) => {
    const hit = SIMPLE[word.toLowerCase()];
    if (!hit) return word;
    return word[0] === word[0].toUpperCase() ? hit[0].toUpperCase() + hit.slice(1) : hit;
  });
}

export function localGenerate(prompt: string, task: TaskId): string {
  const page = prompt.split("\n\n").slice(1).join("\n\n") || prompt;
  const top = scoreSentences(page);
  if (task === "simplify") {
    const body = (top.length ? top.slice(0, 12) : [page]).map(simplifyLexicon).join(" ");
    return body.length > 1800 ? `${body.slice(0, 1800).trim()}…` : body;
  }
  if (task === "deepRead") {
    const bullets = top.slice(0, 4).map((s) => `• ${s}`);
    return [
      ...bullets,
      "",
      "Assumptions: this local pass only uses what is written on the page.",
      "Gaps: citations, numbers, and opposing views may be missing — connect to the internet for a full deep read.",
    ].join("\n");
  }
  if (task === "compare") {
    return [
      "Agrees with: (offline) ClearRead can only compare once notes are saved and you are online for the cloud model.",
      "Contradicts: —",
      "New information:",
      ...top.slice(0, 4).map((s) => `• ${s}`),
    ].join("\n");
  }
  const bullets = top.slice(0, 5).map((s) => `• ${s}`);
  const verdict = top[0] ? top[0].slice(0, 140) : "Not enough text to judge.";
  return `${bullets.join("\n")}\nVerdict: ${verdict}`;
}
