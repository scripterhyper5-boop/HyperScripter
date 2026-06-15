export function getMarkdownStats(content: string) {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~\-|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plain ? plain.split(" ").filter(Boolean).length : 0;
  const characters = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return { words, characters, readingTimeMinutes };
}

export function insertAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after = "",
  placeholder = "text"
) {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const next =
    value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const cursor = selectionStart + before.length + selected.length + after.length;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}

export function wrapLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string
) {
  const selected = value.slice(selectionStart, selectionEnd);
  const block = selected || "List item";
  const lines = block.split("\n").map((line) => `${prefix}${line || "item"}`);
  const wrapped = lines.join("\n");
  const next = value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);
  const cursor = selectionStart + wrapped.length;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}
