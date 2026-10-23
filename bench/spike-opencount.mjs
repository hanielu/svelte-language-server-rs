// How does tsrs LSP memory/time scale with the number of open shadow documents?
import { startServer, sleep } from "./lspc.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
const root = path.resolve(process.argv[2]);
const files = execFileSync("find", [path.join(root, "svelte"), "-name", "*.tsx"], { encoding: "utf8" }).trim().split("\n").sort();
const s = startServer(process.env.TSRS ?? `${process.env.HOME}/.bun/bin/tsrs`, ["--lsp", "--stdio"], root);
await s.init(root);
const rss = () => Math.round(Number(execFileSync("ps", ["-o", "rss=", "-p", String(s.child.pid)], { encoding: "utf8" }).trim()) / 1024);
const target = files.find((f) => f.endsWith("app/admin-layout.svelte.tsx"));
const order = [target, ...files.filter((f) => f !== target)];
let opened = 0;
const t0 = performance.now();
for (const k of (process.env.STEPS ?? "1,20,80,166").split(",").map(Number)) {
	while (opened < Math.min(k, order.length)) { s.open(order[opened], readFileSync(order[opened], "utf8"), "typescriptreact"); opened++; }
	const t = performance.now();
	const d = await s.pull(target);
	await sleep(1500);
	console.log(`open=${opened} pull(target)=${Math.round(performance.now() - t)}ms items=${d?.items?.length} rss=${rss()}MB`);
}
console.log(`total ${Math.round(performance.now() - t0)}ms`);
s.kill(); process.exit(0);
