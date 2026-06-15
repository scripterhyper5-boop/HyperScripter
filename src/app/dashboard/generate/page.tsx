"use client";

import { ScriptGeneratorForm } from "@/components/dashboard/script-generator-form";

export default function GeneratePage() {
  return (
    <div className="-mx-4 flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center px-4 py-8 lg:-mx-8 lg:py-12">
      <div className="w-full max-w-5xl">
        <ScriptGeneratorForm />
      </div>
    </div>
  );
}
