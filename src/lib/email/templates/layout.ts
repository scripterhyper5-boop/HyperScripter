import { siteConfig } from "@/lib/site-config";

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${siteConfig.name}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;color:#fafafa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#141414;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;font-size:18px;font-weight:700;color:#fafafa;">
              ${siteConfig.name}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-size:15px;line-height:1.6;color:#d4d4d8;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #27272a;font-size:12px;color:#71717a;">
              &copy; ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;">
  <a href="${href}" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
    ${label}
  </a>
</p>`;
}
