import { cache } from "react";
import { getHeaderFooterSettings as loadHeaderFooterSettings } from "@/lib/db/header-footer-settings";
import { Navbar } from "@/components/sections/navbar";

export const SiteNavbar = cache(async function SiteNavbar() {
  const settings = await loadHeaderFooterSettings();
  return <Navbar header={settings.header} />;
});
