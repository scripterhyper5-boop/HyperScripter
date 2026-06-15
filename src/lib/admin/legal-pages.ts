export type LegalPageStatus = "draft" | "published";

export interface LegalPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  status: LegalPageStatus;
  updatedAt: string;
}

const defaultContent = (title: string, body: string) =>
  `<h1>${title}</h1><p>${body}</p>`;

export const DEFAULT_LEGAL_PAGES: Omit<LegalPage, "id" | "updatedAt">[] = [
  {
    name: "Privacy Policy",
    slug: "privacy-policy",
    status: "published",
    content: defaultContent(
      "Privacy Policy",
      "HyperScripter respects your privacy. This policy explains what data we collect, how we use it, and the choices you have regarding your information."
    ),
  },
  {
    name: "Terms of Service",
    slug: "terms-of-service",
    status: "published",
    content: defaultContent(
      "Terms of Service",
      "By using HyperScripter, you agree to these terms. Please read them carefully before using our AI TikTok script generation platform."
    ),
  },
  {
    name: "Cookie Policy",
    slug: "cookie-policy",
    status: "published",
    content: defaultContent(
      "Cookie Policy",
      "We use cookies and similar technologies to improve your experience, analyze usage, and personalize content on HyperScripter."
    ),
  },
  {
    name: "Refund Policy",
    slug: "refund-policy",
    status: "draft",
    content: defaultContent(
      "Refund Policy",
      "This policy outlines eligibility, timelines, and the process for requesting refunds on HyperScripter subscriptions."
    ),
  },
  {
    name: "DMCA Policy",
    slug: "dmca-policy",
    status: "draft",
    content: defaultContent(
      "DMCA Policy",
      "HyperScripter responds to notices of alleged copyright infringement in accordance with the Digital Millennium Copyright Act."
    ),
  },
  {
    name: "Contact Us",
    slug: "contact-us",
    status: "published",
    content: defaultContent(
      "Contact Us",
      "Have questions about HyperScripter? Reach our support team for billing, technical, or legal inquiries."
    ),
  },
];

export function createDefaultLegalPages(): LegalPage[] {
  const now = new Date().toISOString().slice(0, 10);
  return DEFAULT_LEGAL_PAGES.map((page, index) => ({
    ...page,
    id: `legal-${index + 1}`,
    updatedAt: now,
  }));
}

export const adminLegalPages = createDefaultLegalPages();

export function slugifyLegalPage(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
