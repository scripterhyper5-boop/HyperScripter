"use client";

import Link from "next/link";
import {
  Sparkles,
  Twitter,
  Youtube,
  Linkedin,
  Facebook,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useHeaderFooterPreview } from "@/hooks/use-header-footer-preview";
import {
  DEFAULT_FOOTER_SETTINGS,
  type FooterSettings,
} from "@/lib/header-footer/types";

interface FooterProps {
  footer?: FooterSettings;
  logoText?: string;
}

const socialConfig = [
  { key: "twitter" as const, label: "Twitter/X", Icon: Twitter },
  { key: "youtube" as const, label: "YouTube", Icon: Youtube },
  { key: "linkedin" as const, label: "LinkedIn", Icon: Linkedin },
  { key: "facebook" as const, label: "Facebook", Icon: Facebook },
  { key: "instagram" as const, label: "Instagram", Icon: Instagram },
  { key: "discord" as const, label: "Discord", Icon: MessageCircle },
];

export function Footer({
  footer: initialFooter = DEFAULT_FOOTER_SETTINGS,
  logoText = DEFAULT_FOOTER_SETTINGS.companyName,
}: FooterProps) {
  const footer = useHeaderFooterPreview("footer", initialFooter);
  const brandName = logoText || footer.companyName;

  const visibleSocial = socialConfig.filter(
    ({ key }) => footer.socialLinks[key]?.trim().length > 0
  );

  return (
    <footer className="border-t border-border" role="contentinfo">
      <div className="container-wide px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/20 ring-1 ring-violet/30">
                <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" />
              </div>
              <span className="text-base font-semibold tracking-tight">{brandName}</span>
            </Link>

            {footer.showDescription && footer.description && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {footer.description}
              </p>
            )}

            {footer.showSocialLinks && visibleSocial.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {visibleSocial.map(({ key, label, Icon }) => (
                  <Link
                    key={key}
                    href={footer.socialLinks[key]}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {footer.showQuickLinks && footer.quickLinks.length > 0 && (
            <nav className="sm:col-span-1 lg:col-span-3" aria-label="Quick links">
              <h3 className="text-sm font-semibold">Quick Links</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {footer.quickLinks.map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <Link
                      href={link.url}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <Separator className="my-10 bg-gray-50" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">{footer.copyright}</p>
          {footer.showLegalLinks && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {footer.privacyPolicyUrl && (
                <Link
                  href={footer.privacyPolicyUrl}
                  className="transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              )}
              {footer.termsOfServiceUrl && (
                <Link
                  href={footer.termsOfServiceUrl}
                  className="transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
