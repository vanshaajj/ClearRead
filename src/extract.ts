const STRIP = "nav, header, footer, aside, script, style, form, noscript, iframe, svg, [aria-hidden='true'], [hidden]";

function pickRoot(doc: Document): Element {
  const article = doc.querySelector("article");
  if (article && (article.textContent?.length ?? 0) > 200) return article;
  const main = doc.querySelector("main, [role='main'], #content, .post, .entry-content");
  if (main && (main.textContent?.length ?? 0) > 200) return main;
  return doc.body;
}

export function readableText(doc: Document): string {
  if (!doc.body) return "";
  const clone = pickRoot(doc).cloneNode(true) as HTMLElement;
  clone.querySelectorAll(STRIP).forEach((n) => n.remove());
  return (clone.textContent ?? "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export const countChars = (s: string) => s.replace(/\s+/g, " ").trim().length;

export function selectedText(doc: Document): string {
  return (doc.getSelection()?.toString() ?? "").replace(/\s+/g, " ").trim();
}

export function extractPage(doc: Document): {
  title: string;
  url: string;
  text: string;
  charCount: number;
  selection: string;
} {
  const text = readableText(doc);
  return {
    title: doc.title,
    url: doc.location?.href ?? "",
    text,
    charCount: countChars(text),
    selection: selectedText(doc),
  };
}

/** Split page text into sentences without depending on Intl.Segmenter. */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);
}
