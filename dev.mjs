// ლოკალური გაშვება ერთი ბრძანებით: npm start
// ერთად რთავს API-ს (python dev_server.py, პორტი 3001) და საიტს (vite, პორტი 5173).
import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const procs = [
  spawn("python", ["dev_server.py"], { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } }),
  spawn(isWin ? "npx.cmd" : "npx", ["vite"], { stdio: "inherit", shell: isWin }),
];

const stop = () => {
  for (const p of procs) p.kill();
  process.exit();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const p of procs) p.on("exit", (code) => code && stop());
