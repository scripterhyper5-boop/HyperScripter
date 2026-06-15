import "server-only";

import { parseHeadSnippet } from "@/lib/site-settings/parse-head-snippet";

interface BodySnippetProps {
  html: string;
}

/** Injects admin-controlled HTML immediately after `<body>` or before `</body>`. */
export function SiteBodySnippet({ html }: BodySnippetProps) {
  if (!html.trim()) return null;

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ display: "contents" }}
      aria-hidden="true"
      data-site-injection="body"
    />
  );
}

/** Injects admin-controlled tags into `<head>` (meta, script, link, etc.). */
export function SiteHeadSnippet({ html }: BodySnippetProps) {
  const nodes = parseHeadSnippet(html);
  if (!nodes.length) return null;
  return <>{nodes}</>;
}
