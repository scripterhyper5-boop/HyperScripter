/**
 * Rate limit verification script.
 * Run: node scripts/rate-limit-verify.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const baseUrl = process.env.APP_URL || "http://localhost:3000";

function loadEnv() {
  try {
    const text = readFileSync(resolve(root, ".env.local"), "utf8");
    const env = {};
    for (const line of text.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const storage = env.UPSTASH_REDIS_REST_URL
  ? "upstash"
  : env.SUPABASE_SERVICE_ROLE_KEY
    ? "database (if migration applied)"
    : "memory (dev fallback)";

async function testLoginLimit() {
  const results = [];
  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "wrong" }),
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      attempt: i,
      status: res.status,
      code: data.code ?? null,
      blocked: res.status === 429,
    });
    if (res.status === 429) break;
  }
  return results;
}

console.log("=== Rate Limit Verification ===");
console.log("Base URL:", baseUrl);
console.log("Storage:", storage);
console.log("");

try {
  const loginResults = await testLoginLimit();
  console.log("Login brute-force test (expect block on attempt 6):");
  console.log(JSON.stringify(loginResults, null, 2));

  const blocked = loginResults.some((r) => r.blocked);
  console.log(blocked ? "\n✅ Rate limiting active" : "\n⚠️  No 429 observed (server may be down or limits not reached)");
} catch (error) {
  console.error("Test failed — is the dev server running?", error.message);
  process.exit(1);
}
