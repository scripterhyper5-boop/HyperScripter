import { cache } from "react";
import { getUserServerSession } from "@/lib/auth/session";
import { getHeaderFooterSettings as loadHeaderFooterSettings } from "@/lib/db/header-footer-settings";
import { Navbar } from "@/components/sections/navbar";

export const SiteNavbar = cache(async function SiteNavbar() {
  const [settings, session] = await Promise.all([
    loadHeaderFooterSettings(),
    getUserServerSession(),
  ]);

  return (
    <Navbar header={settings.header} initialAuthenticated={Boolean(session)} />
  );
});
