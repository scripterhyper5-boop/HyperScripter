import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts, formatBlogDate } from "@/lib/blog";

export function BlogPreview() {
  const posts = blogPosts.slice(0, 3);

  return (
    <section
      className="section-padding border-t border-border bg-white/[0.01]"
      aria-labelledby="blog-heading"
    >
      <div className="container-wide">
        <FadeIn className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Badge variant="muted" className="mb-4 font-normal">
              Blog
            </Badge>
            <h2
              id="blog-heading"
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Creator insights
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Strategies, frameworks, and tips for growing on TikTok.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/blog">
              View all posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <StaggerItem key={post.slug}>
              <article className="group relative saas-card flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.07]">
                <div className="mb-4 flex items-center gap-3">
                  <Badge variant="muted" className="font-normal">
                    {post.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {post.readingTime}
                  </span>
                </div>
                <h3 className="text-lg font-semibold leading-snug transition-colors group-hover:text-foreground">
                  <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                    {post.title}
                  </Link>
                </h3>
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
    </section>
  );
}
