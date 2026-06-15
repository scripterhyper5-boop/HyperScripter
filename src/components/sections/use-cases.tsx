import {
  Video,
  ShoppingBag,
  GraduationCap,
  Building2,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";

const useCases = [
  {
    icon: Video,
    title: "Content creators",
    description: "Batch a week of TikTok scripts in one sitting. Stay consistent without burning out.",
    stat: "10× faster scripting",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce brands",
    description: "Product demos, UGC-style scripts, and launch teasers that convert viewers to buyers.",
    stat: "3× engagement lift",
  },
  {
    icon: GraduationCap,
    title: "Educators & coaches",
    description: "Break down complex topics into retention-optimized short-form lessons.",
    stat: "85% watch-through",
  },
  {
    icon: Building2,
    title: "Agencies & teams",
    description: "Scale script production across clients with consistent quality and tone control.",
    stat: "50 scripts/day",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="section-padding" aria-labelledby="usecases-heading">
      <div className="container-wide">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="muted" className="mb-4 font-normal">Use cases</Badge>
          <h2 id="usecases-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for every creator workflow
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            From solo creators to agency teams — HyperScripter scales with you.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-16 grid gap-5 sm:grid-cols-2">
          {useCases.map((item) => (
            <StaggerItem key={item.title}>
              <article className="saas-card group flex h-full flex-col rounded-2xl p-6 transition-all hover:bg-gray-50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/10 ring-1 ring-cyan/20">
                  <item.icon className="h-5 w-5 text-cyan" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-4 text-xs font-medium text-violet">{item.stat}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
