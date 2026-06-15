import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const clientRestrictedImports = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@/lib/db", "@/lib/db/*"],
          message:
            "Database modules are server-only. Use API routes or server components instead.",
        },
        {
          group: ["@/lib/supabase/server", "@/lib/supabase/server/*"],
          message:
            "Server Supabase client cannot be imported in client components or hooks.",
        },
      ],
    },
  ],
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    ignores: [
      "src/components/sections/site-navbar.tsx",
      "src/components/sections/site-footer.tsx",
    ],
    rules: clientRestrictedImports,
  },
];

export default eslintConfig;
