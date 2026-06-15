import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { SiteNavbar } from "@/components/sections/site-navbar";
import { SiteFooter } from "@/components/sections/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/motion/fade-in";
import { getPublishedBlogPost, getAllPublishedBlogSlugs, formatBlogDate } from "@/lib/blog";
import { createMetadata, articleSchema, breadcrumbSchema } from "@/lib/seo";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) return {};

  return createMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
  });
}

function renderMarkdown(content: string) {
  return content.split("\n\n").map((block, index) => {
    if (block.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mt-10 text-2xl font-bold tracking-tight first:mt-0"
        >
          {block.replace("## ", "")}
        </h2>
      );
    }
    return (
      <p key={index} className="mt-4 text-base leading-relaxed text-muted-foreground">
        {block}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) notFound();

  const article = await articleSchema({
            title: post.title,
            description: post.description,
            slug: post.slug,
            publishedAt: post.publishedAt,
            author: post.author,
          });
  const breadcrumb = await breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Blog", url: "/blog" },
            { name: post.title, url: `/blog/${post.slug}` },
          ]);

  return (
    <>
      <JsonLd
        data={[article, breadcrumb]}
      />
      <SiteNavbar />
      <main className="pt-28 pb-20 sm:pt-32">
        <article className="container-narrow px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Badge variant="muted" className="mb-4 font-normal">
              {post.category}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden="true" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={post.publishedAt}>
                  {formatBlogDate(post.publishedAt)}
                </time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {post.readingTime}
              </span>
            </div>
          </FadeIn>

          <Separator className="my-10 bg-white/5" />

          <FadeIn delay={0.2}>
            <div className="prose-custom">{renderMarkdown(post.content)}</div>
          </FadeIn>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
