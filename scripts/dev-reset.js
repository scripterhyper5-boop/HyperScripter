/**
 * Stops dev servers on ports 3000–3010, removes .next, starts a single dev server.
 * Use when pages look unstyled or layout.css returns 404.
 *
 * Do NOT run `npm run build` while `npm run dev` is active — it corrupts .next.
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function killPorts(start = 3000, end = 3010) {
  if (process.platform !== "win32") {
    for (let port = start; port <= end; port++) {
      try {
        execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
          stdio: "ignore",
          shell: true,
        });
      } catch {
        /* ignore */
      }
    }
    return;
  }

  for (let port = start; port <= end; port++) {
    try {
      const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split("\n")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`Stopped PID ${pid} (port ${port})`);
        } catch {
          /* already stopped */
        }
      }
    } catch {
      /* no listener on port */
    }
  }
}

console.log("Stopping dev servers on ports 3000–3010...");
killPorts();

console.log("Waiting for processes to exit...");
if (process.platform === "win32") {
  execSync("ping -n 3 127.0.0.1 >nul", { stdio: "ignore", shell: true });
} else {
  execSync("sleep 2", { stdio: "ignore", shell: true });
}

const nextDir = path.join(root, ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
}

console.log("");
console.log("Starting dev server at http://localhost:3000");
console.log("Hard-refresh browser: Ctrl+Shift+R");
console.log("Do not start a second dev server or run `npm run build` while this runs.");
console.log("");

const child = spawn("npm", ["run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
