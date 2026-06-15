import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { SiteNavbar } from "@/components/sections/site-navbar";
import { SiteFooter } from "@/components/sections/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { getPublishedBlogPosts, formatBlogDate } from "@/lib/blog";
import { createMetadata, breadcrumbSchema } from "@/lib/seo";

export async function generateMetadata() {
  return createMetadata({
    title: "Blog",
    description:
      "Creator insights, TikTok growth strategies, and scriptwriting tips from the HyperScripter team.",
    path: "/blog",
  });
}

export default async function BlogPage() {
  const blogPosts = await getPublishedBlogPosts();
  const breadcrumb = await breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <SiteNavbar />
      <main className="pt-28 pb-20 sm:pt-32">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Badge variant="muted" className="mb-4 font-normal">
              Blog
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Creator insights
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Strategies, frameworks, and tips for growing on TikTok and creating
              content that converts.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <StaggerItem key={post.slug}>
                <article className="group saas-card relative flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.07]">
                  <div className="mb-4 flex items-center gap-3">
                    <Badge variant="muted" className="font-normal">
                      {post.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug transition-colors group-hover:text-foreground">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    <time dateTime={post.publishedAt}>
                      {formatBlogDate(post.publishedAt)}
                    </time>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
