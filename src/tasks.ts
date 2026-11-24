import type { Task } from "./types";

export const TASKS: Task[] = [
  { id: "firstRead", label: "First Read", hint: "Five bullets + a verdict", needsUserHistory: false, charLimit: 8000 },
  { id: "simplify", label: "Simplify", hint: "Rewrite the page in plainer English", needsUserHistory: false, charLimit: 6000 },
  { id: "deepRead", label: "Deep Read", hint: "Assumptions and gaps", needsUserHistory: false, charLimit: 4000 },
  { id: "compare", label: "Compare", hint: "Against your saved notes", needsUserHistory: true, charLimit: 0 },
];

export const taskById = (id: string): Task => TASKS.find((t) => t.id === id) ?? TASKS[0];
