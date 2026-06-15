import { cache } from "react";
import { getHeaderFooterSettings } from "@/lib/db/header-footer-settings";
import { Footer } from "@/components/sections/footer";

export const SiteFooter = cache(async function SiteFooter() {
  const settings = await getHeaderFooterSettings();
  return <Footer footer={settings.footer} logoText={settings.header.logoText} />;
});
