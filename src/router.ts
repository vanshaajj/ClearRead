import type { Decision, RouteContext, Task } from "./types";

const SHORT_PAGE = 200;

export function decideRoute(task: Task, ctx: RouteContext): Decision {
  if (ctx.charCount < SHORT_PAGE)
    return { route: "device", why: "page too short — no AI call needed" };
  if (task.needsUserHistory)
    return { route: "cloud", why: "needs your saved library" };
  if (!ctx.nanoAvailable)
    return { route: "cloud", why: "no local model on this device" };
  if (ctx.charCount > task.charLimit)
    return { route: "cloud", why: `over ${task.charLimit.toLocaleString("en-US")} chars` };
  if (ctx.offline)
    return { route: "device", why: "offline" };
  return { route: "device", why: "fits local model" };
}
