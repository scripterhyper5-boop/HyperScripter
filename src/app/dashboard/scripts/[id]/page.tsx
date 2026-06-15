"use client";

import { use } from "react";
import { ScriptDetailView } from "@/components/dashboard/script-detail-view";

interface ScriptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ScriptDetailPage({ params }: ScriptDetailPageProps) {
  const { id } = use(params);
  return <ScriptDetailView scriptId={id} />;
}
