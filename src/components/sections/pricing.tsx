import Link from "next/link";
import { Check, X } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_LIST } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="section-padding border-t border-border bg-white/[0.01]"
      aria-labelledby="pricing-heading"
    >
      <div className="container-wide">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="muted" className="mb-4 font-normal">
            Pricing
          </Badge>
          <h2
            id="pricing-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Start free. Upgrade when you&apos;re ready to scale.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLAN_LIST.map((plan) => (
            <StaggerItem key={plan.id}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-6 sm:p-8",
                  plan.highlighted
                    ? "saas-card glow-violet ring-1 ring-violet/20"
                    : "glass"
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet text-white">
                    Most popular
                  </Badge>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{plan.priceLabel}</span>
                    <span className="text-sm text-muted-foreground">{plan.periodLabel}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{plan.monthlyLimitLabel}</p>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.enabledFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                  {plan.disabledFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground/70"
                    >
                      <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlighted ? "violet-glow" : "outline"}
                  className="mt-8 w-full"
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
