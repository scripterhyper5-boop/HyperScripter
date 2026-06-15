import {
  DEFAULT_FAVICON,
  getFaviconMimeType,
  resolveFaviconForSite,
  type FaviconSettings,
} from "@/lib/favicon/types";

interface SiteFaviconLinksProps {
  favicon?: FaviconSettings | null;
}

export function SiteFaviconLinks({ favicon }: SiteFaviconLinksProps) {
  const settings = resolveFaviconForSite(favicon);
  const mime = getFaviconMimeType(settings.type);
  const icon16 = settings.icon16Url ?? settings.url;
  const icon32 = settings.icon32Url ?? settings.url;
  const apple = settings.appleTouchIconUrl ?? settings.url;

  return (
    <>
      {settings.icon16Url && (
        <link rel="icon" href={icon16} sizes="16x16" type="image/png" />
      )}
      {settings.icon32Url && (
        <link rel="icon" href={icon32} sizes="32x32" type="image/png" />
      )}
      <link rel="icon" href={settings.url} type={mime} />
      <link rel="shortcut icon" href={settings.url} type={mime} />
      <link rel="apple-touch-icon" href={apple} sizes="180x180" />
    </>
  );
}

export { DEFAULT_FAVICON };
