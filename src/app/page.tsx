import { SiteNavbar } from "@/components/sections/site-navbar";
import { Hero } from "@/components/sections/hero";
import { GeneratedScriptPreview } from "@/components/sections/generated-script-preview";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Pricing } from "@/components/sections/pricing";
import { FAQ, faqItems } from "@/components/sections/faq";
import { SiteFooter } from "@/components/sections/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  organizationSchema,
  websiteSchema,
  faqSchema,
  softwareApplicationSchema,
} from "@/lib/seo";

export default async function HomePage() {
  const orgSchema = await organizationSchema();
  const schemas: Record<string, unknown>[] = [
    await websiteSchema(),
    await softwareApplicationSchema(),
    faqSchema(faqItems),
  ];
  if (orgSchema) schemas.unshift(orgSchema);

  return (
    <>
      <JsonLd data={schemas} />
      <SiteNavbar />
      <main className="bg-white">
        <Hero />
        <GeneratedScriptPreview />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <SiteFooter />
    </>
  );
}
