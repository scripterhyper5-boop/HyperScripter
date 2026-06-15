import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in seconds. No credit card required to start generating scripts.",
  },
  {
    step: "02",
    title: "Define your brief",
    description: "Enter topic, tone, audience, and video length. HyperScripter handles the rest.",
  },
  {
    step: "03",
    title: "Generate & publish",
    description: "Copy hook, script, CTA, caption, and hashtags. Film and post immediately.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section-padding border-t border-border bg-white/[0.01]"
      aria-labelledby="how-heading"
    >
      <div className="container-wide">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="muted" className="mb-4 font-normal">How it works</Badge>
          <h2 id="how-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Idea to script in three steps
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            No templates. No blank pages. Just results.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((item) => (
            <StaggerItem key={item.step}>
              <article className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet/20 to-cyan/10 font-mono text-sm font-medium ring-1 ring-border">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
