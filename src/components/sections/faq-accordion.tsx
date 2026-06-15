"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClientOnly } from "@/components/client-only";
import { faqItems } from "@/components/sections/faq-data";

function FAQAccordionInteractive() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqItems.map((item, index) => (
        <AccordionItem key={item.question} value={`item-${index}`}>
          <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Native HTML fallback — same content for SSR/crawlers, no Radix hydration. */
function FAQAccordionFallback() {
  return (
    <div className="w-full divide-y divide-border">
      {faqItems.map((item) => (
        <details key={item.question} className="group py-1">
          <summary className="cursor-pointer list-none py-5 text-left text-base font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-4">
              {item.question}
              <span
                aria-hidden="true"
                className="text-muted-foreground transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </span>
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export function FAQAccordion() {
  return (
    <ClientOnly fallback={<FAQAccordionFallback />}>
      <FAQAccordionInteractive />
    </ClientOnly>
  );
}
