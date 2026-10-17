// ლოკალური გაშვება ერთი ბრძანებით: npm start
// ერთად რთავს API-ს (python dev_server.py, პორტი 3001) და საიტს (vite, პორტი 5173).
import { execSync, spawn } from "node:child_process";

const isWin = process.platform === "win32";
const sh = (c) => execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

/** თუ პორტი ამ პროექტის ძველ (დაკიდებულ) სერვერს უჭირავს — ვთიშავთ, რომ ახალი კოდი ჩაიტვირთოს.
 *  სხვა პროგრამას არ ვეხებით. */
function freePort(port, match) {
  try {
    const pids = isWin
      ? sh("netstat -ano")
          .split(/\r?\n/)
          .filter((l) => l.includes("LISTENING") && new RegExp(`:${port}\\s`).test(l))
          .map((l) => l.trim().split(/\s+/).pop())
      : sh(`lsof -ti tcp:${port} -sTCP:LISTEN`).split("\n").filter(Boolean);
    for (const pid of new Set(pids)) {
      const cmd = isWin
        ? sh(`powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`)
        : sh(`ps -o command= -p ${pid}`);
      if (match.test(cmd)) {
        if (isWin) sh(`taskkill /PID ${pid} /T /F`);
        else process.kill(Number(pid));
        console.log(`[dev] პორტი ${port}: ძველი სერვერი (PID ${pid}) გაითიშა`);
      }
    }
  } catch {
    /* პორტი თავისუფალია */
  }
}
freePort(3001, /dev_server\.py/);
freePort(5173, /wcf-site[\\/]node_modules[\\/].*vite/i);

const procs = [
  spawn("python", ["dev_server.py"], { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } }),
  spawn(isWin ? "npx.cmd" : "npx", ["vite"], { stdio: "inherit", shell: isWin }),
];

// Windows-ზე p.kill() shell-ის შვილებს ვერ თიშავს — taskkill /T მთელ ხეს თიშავს
const stop = () => {
  for (const p of procs) {
    try {
      if (isWin) sh(`taskkill /PID ${p.pid} /T /F`);
      else p.kill();
    } catch {
      /* უკვე გათიშულია */
    }
  }
  process.exit();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const p of procs) p.on("exit", (code) => code && stop());
