import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { FAQAccordion } from "@/components/sections/faq-accordion";

export { faqItems } from "@/components/sections/faq-data";

export function FAQ() {
  return (
    <section id="faq" className="section-padding" aria-labelledby="faq-heading">
      <div className="container-narrow">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="muted" className="mb-4 font-normal">
            FAQ
          </Badge>
          <h2 id="faq-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Everything you need to know before getting started.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-12">
          <FAQAccordion />
        </FadeIn>
      </div>
    </section>
  );
}
