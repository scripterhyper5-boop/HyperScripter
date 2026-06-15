import "server-only";

import type { ReactElement } from "react";

const ALLOWED_HEAD_TAGS = new Set(["script", "meta", "link", "style", "noscript"]);
const VOID_TAGS = new Set(["meta", "link", "base", "br", "hr", "img", "input"]);

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=>]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(attrString)) !== null) {
    const name = match[1].toLowerCase();
    attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attrs;
}

function createHeadElement(
  tag: string,
  attrs: Record<string, string>,
  content: string,
  key: number
): ReactElement | null {
  if (!ALLOWED_HEAD_TAGS.has(tag)) return null;

  if (tag === "script") {
    return (
      <script
        key={key}
        {...attrs}
        {...(content ? { dangerouslySetInnerHTML: { __html: content } } : {})}
        suppressHydrationWarning
      />
    );
  }

  if (tag === "meta") {
    return <meta key={key} {...attrs} suppressHydrationWarning />;
  }

  if (tag === "link") {
    return <link key={key} {...attrs} suppressHydrationWarning />;
  }

  if (tag === "style") {
    return (
      <style
        key={key}
        {...attrs}
        dangerouslySetInnerHTML={{ __html: content }}
        suppressHydrationWarning
      />
    );
  }

  if (tag === "noscript") {
    return (
      <noscript
        key={key}
        dangerouslySetInnerHTML={{ __html: content }}
        suppressHydrationWarning
      />
    );
  }

  return null;
}

/**
 * Parses common head snippets (script, meta, link, style, noscript) into React elements
 * so verification meta tags and analytics scripts render in the initial HTML response.
 */
export function parseHeadSnippet(html: string): ReactElement[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const nodes: ReactElement[] = [];
  const tagRe =
    /<(\/?)(script|meta|link|style|noscript)\b([^>]*?)(\/>|>([\s\S]*?)<\/\2>)/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = tagRe.exec(trimmed)) !== null) {
    if (match[1]) continue;

    const tag = match[2].toLowerCase();
    const attrString = match[3] ?? "";
    const content = match[5] ?? "";
    const selfClosing = match[4] === "/>" || VOID_TAGS.has(tag);
    const attrs = parseAttributes(attrString.trim());
    const element = createHeadElement(tag, attrs, selfClosing ? "" : content, index);

    if (element) {
      nodes.push(element);
      index += 1;
    }
  }

  return nodes;
}
