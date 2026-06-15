/**
 * RLS verification — tests anon key access to sensitive tables.
 * Run: node scripts/rls-verify.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing Supabase URL or anon key in .env.local");
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const service = serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;

const SENSITIVE_TABLES = [
  "users",
  "scripts",
  "subscriptions",
  "usage_records",
  "support_tickets",
  "support_messages",
  "referrals",
  "affiliate_payouts",
  "affiliate_payment_methods",
  "password_reset_tokens",
  "email_settings",
  "email_logs",
  "ai_settings",
  "site_settings",
  "header_footer_settings",
  "workspaces",
  "workspace_members",
  "workspace_invitations",
  "script_exports",
];

const PUBLIC_TABLES = ["blog_posts", "legal_pages"];

async function testSelect(client, table, label) {
  const { data, error, count } = await client
    .from(table)
    .select("*", { count: "exact", head: false })
    .limit(3);

  if (error) {
    return { label, table, status: "DENIED", error: error.message, rows: 0 };
  }
  const rows = data?.length ?? 0;
  const hasSensitive =
    table === "users" && data?.some((r) => r.password_hash);
  return {
    label,
    table,
    status: rows > 0 ? "ALLOWED" : "EMPTY",
    rows,
    hasSensitive,
    sample: rows > 0 ? Object.keys(data[0]) : [],
  };
}

async function testInsert(client, table, row, label) {
  const { error } = await client.from(table).insert(row);
  if (error) {
    return { label, table, op: "INSERT", status: "DENIED", error: error.message };
  }
  return { label, table, op: "INSERT", status: "ALLOWED" };
}

console.log("=== RLS Verification ===");
console.log("Service role configured:", Boolean(serviceKey));
console.log("");

const results = [];

for (const table of SENSITIVE_TABLES) {
  results.push(await testSelect(anon, table, "anon"));
}

for (const table of PUBLIC_TABLES) {
  results.push(await testSelect(anon, table, "anon"));
}

// Test anon write on users (should be denied after hardening)
const insertTest = await testInsert(
  anon,
  "users",
  {
    id: "rls-test-" + Date.now(),
    full_name: "RLS Test",
    email: `rls-test-${Date.now()}@example.com`,
    role: "user",
    plan: "free",
  },
  "anon"
);
results.push(insertTest);

// Cleanup test user if insert succeeded
if (insertTest.status === "ALLOWED" && service) {
  await service.from("users").delete().eq("email", insertTest.row?.email ?? "");
}

console.log(JSON.stringify(results, null, 2));
