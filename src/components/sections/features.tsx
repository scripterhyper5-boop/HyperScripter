import {
  Zap,
  Target,
  Layers,
  Clock,
  Hash,
  BarChart3,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Zap,
    title: "Instant generation",
    description: "From brief to full script package in under 3 seconds. Ship content daily without writer's block.",
  },
  {
    icon: Target,
    title: "Audience-aware writing",
    description: "Scripts adapt to your niche, tone, and target viewer — not generic AI filler.",
  },
  {
    icon: Layers,
    title: "Complete output",
    description: "Hook, script, CTA, caption, and hashtags in one generation. Copy and film.",
  },
  {
    icon: Clock,
    title: "Length-calibrated",
    description: "Optimized pacing for 15s, 30s, 60s, or 3-minute formats with natural flow.",
  },
  {
    icon: Hash,
    title: "Smart hashtags",
    description: "Niche-specific tag mixes that complement your content strategy.",
  },
  {
    icon: BarChart3,
    title: "Script history",
    description: "Every generation saved to your dashboard. Revisit, refine, and repurpose.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-padding" aria-labelledby="features-heading">
      <div className="container-wide">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="muted" className="mb-4 font-normal">Features</Badge>
          <h2 id="features-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for creators who ship
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Everything you need to go from idea to published video — faster than ever.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <article className="group saas-card h-full rounded-2xl p-6 transition-all duration-300 hover:bg-gray-50 hover:glow-violet">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 ring-1 ring-violet/20 transition-all group-hover:bg-violet/20">
                  <feature.icon className="h-5 w-5 text-violet" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
