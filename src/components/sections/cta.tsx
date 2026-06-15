import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="section-padding" aria-labelledby="cta-heading">
      <div className="container-narrow">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet/10 via-transparent to-cyan/10 p-8 sm:p-12 lg:p-16 glow-violet">
            <div
              className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet/20 blur-[80px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan/15 blur-[80px]"
              aria-hidden="true"
            />

            <div className="relative text-center">
              <h2 id="cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Start creating viral content today
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                Join thousands of creators using HyperScripter to ship scroll-stopping
                TikTok scripts faster than ever.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="violet-glow" size="lg" asChild>
                  <Link href="/signup">
                    <Sparkles className="h-4 w-4" />
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
