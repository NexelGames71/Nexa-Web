import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const frontendDir = process.cwd();
const clean = process.argv.includes("--clean");
const port = process.env.PORT || "3001";
const host = process.env.HOST || "127.0.0.1";

function runPowerShell(command, { captureOutput = false } = {}) {
  return spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    {
      cwd: frontendDir,
      stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
      encoding: "utf8",
    },
  );
}

function normalizeWindowsPath(value) {
  return value.replace(/\\/g, "\\\\");
}

async function stopExistingNextDevServers() {
  if (process.platform !== "win32") {
    return;
  }

  const frontendPath = normalizeWindowsPath(frontendDir);
  const command = `
$selfPid = $PID
$selfParentPid = (Get-CimInstance Win32_Process -Filter "ProcessId = $selfPid").ParentProcessId
$portOwners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq ${port} } |
  Select-Object -ExpandProperty OwningProcess -Unique
$targets = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object {
    (
      $_.CommandLine -like '*${frontendPath}*next*dev*' -or
      $_.CommandLine -like '*${frontendPath}*start-server.js*' -or
      $portOwners -contains $_.ProcessId
    ) -and
    $_.ProcessId -ne $selfPid -and
    $_.ProcessId -ne $selfParentPid
  } |
  Select-Object -ExpandProperty ProcessId
foreach ($targetPid in $targets) {
  try {
    Stop-Process -Id $targetPid -Force -ErrorAction Stop
  } catch {}
}
`.trim();

  runPowerShell(command);
}

async function cleanNextDir() {
  const nextDir = path.join(frontendDir, ".next");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      return;
    } catch (error) {
      if (error?.code !== "ENOTEMPTY" && error?.code !== "EPERM" && error?.code !== "EBUSY") {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  await fs.rm(nextDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}

async function main() {
  await stopExistingNextDevServers();

  if (clean) {
    await cleanNextDir();
  }

  const nextBin = path.join(frontendDir, "node_modules", "next", "dist", "bin", "next");
  const result = spawnSync(process.execPath, [nextBin, "dev", "-H", host, "-p", port], {
    cwd: frontendDir,
    stdio: "inherit",
    env: {
      ...process.env,
      HOST: host,
      PORT: port,
    },
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
