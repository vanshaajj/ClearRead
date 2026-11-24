# Routing decisions

ClearRead never hides where work runs. The chip in the popup is the decision.

1. **Under 200 characters** — stay on-device and skip a model call. There is nothing to summarize.
2. **Compare / saved notes** — cloud. The local Nano window cannot see the library.
3. **No Gemini Nano** — cloud if the network is up; otherwise the extractive local fallback still produces a first read.
4. **Over the task's character budget** — cloud. Deep Read is the strictest (4,000), First Read the loosest (8,000).
5. **Offline with Nano ready** — on-device. That is the product: a bus ride, a campus dead zone, a rural link.
6. **Fits the local model** — on-device. Privacy and latency are the default, not a demo flag.

Cloud is a fallback, not the product. If Firebase AI is blocked, the same prompt is answered by the on-device extractive path so the reader is never stuck on a spinner.
