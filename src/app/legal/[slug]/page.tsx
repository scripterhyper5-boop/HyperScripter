import { notFound } from "next/navigation";
import { SiteNavbar } from "@/components/sections/site-navbar";
import { SiteFooter } from "@/components/sections/site-footer";
import { getPublishedLegalPageBySlug } from "@/lib/db/legal-pages";
import { createMetadata } from "@/lib/seo";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params;
  const page = await getPublishedLegalPageBySlug(slug);
  if (!page) return {};

  return createMetadata({
    title: page.name,
    description: `${page.name} for HyperScripter`,
    path: `/legal/${page.slug}`,
  });
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const page = await getPublishedLegalPageBySlug(slug);

  if (!page) notFound();

  return (
    <>
      <SiteNavbar />
      <main className="pt-28 pb-20 sm:pt-32">
        <article className="container-narrow px-4 sm:px-6 lg:px-8">
          <div
            className="legal-html-preview prose-custom"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
