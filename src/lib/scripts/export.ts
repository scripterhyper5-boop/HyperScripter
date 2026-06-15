import type { ScriptHistoryItem } from "@/lib/auth/script-history";

export function buildFullScriptText(item: ScriptHistoryItem): string {
  const { output } = item;
  return [
    `Title: ${item.topic}`,
    `\nHook:\n${output.hook}`,
    `\nIntro:\n${output.intro}`,
    `\nMain Script:\n${output.mainScript}`,
    `\nCall To Action:\n${output.cta}`,
    `\nCaption:\n${output.caption}`,
    `\nHashtags:\n${output.hashtags.join(" ")}`,
  ].join("\n");
}

export function downloadScriptExport(
  item: ScriptHistoryItem,
  format: "txt" | "docx"
) {
  const text = buildFullScriptText(item);
  const extension = format === "docx" ? "docx" : "txt";
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hyperscripter-${item.topic.slice(0, 30).replace(/\s+/g, "-")}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
