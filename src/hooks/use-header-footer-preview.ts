"use client";

import { useEffect, useState } from "react";
import {
  HEADER_FOOTER_PREVIEW_KEY,
  HEADER_FOOTER_PREVIEW_QUERY,
  type HeaderFooterSettingsView,
  type HeaderSettings,
  type FooterSettings,
} from "@/lib/header-footer/types";
import { sanitizeHeaderFooterSettings } from "@/lib/header-footer/validation";

export function useHeaderFooterPreview<K extends "header" | "footer">(
  section: K,
  initial: HeaderFooterSettingsView[K]
): HeaderFooterSettingsView[K] {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has(HEADER_FOOTER_PREVIEW_QUERY)) return;

    const raw = sessionStorage.getItem(HEADER_FOOTER_PREVIEW_KEY);
    if (!raw) return;

    try {
      const parsed = sanitizeHeaderFooterSettings(JSON.parse(raw));
      setValue(parsed[section]);
    } catch {
      // ignore invalid preview payload
    }
  }, [section]);

  return value;
}

export type { HeaderSettings, FooterSettings };
