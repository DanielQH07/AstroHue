import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-python.mjs <script.py> [args]");
  process.exit(2);
}

const candidates = process.env.PYTHON
  ? [[process.env.PYTHON, []]]
  : process.platform === "win32"
    ? [
        ["conda.bat", ["run", "-n", "base", "python"]],
        ["python", []],
        ["py", ["-3"]],
      ]
    : [
        ["python3", []],
        ["python", []],
        ["conda", ["run", "-n", "base", "python"]],
      ];

for (const [command, prefix] of candidates) {
  const result = spawnSync(command, [...prefix, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error || result.status === 9009) continue;
  process.exit(result.status ?? 1);
}

console.error("Python 3.11+ was not found. Set the PYTHON environment variable.");
process.exit(1);
