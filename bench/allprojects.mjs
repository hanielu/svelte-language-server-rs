// Memory and workspace-symbol coverage with every TypeScript project loaded.
//
// Usage (through the lock when another session may use <root>):
//   [OPEN_FILE=<component, relative to root>] [QUERIES=a,b,c] \
//     bench/with-lock.sh node bench/allprojects.mjs <server-binary> <root> <mode> [idleMs]
//   mode "open-all":   open one component of every project that owns one, pull its diagnostics,
//                      then ask workspace/symbol (every project is loaded because a document of it is open)
//   mode "background": open one component (OPEN_FILE, else the first one found), pull its diagnostics, stay idle for idleMs (default 20000)
//                      but for a hover every HOVER_EVERY_MS (default 2500), so the server can load the
//                      other projects in the background, then ask workspace/symbol
//   mode "lazy":       like "background" with `rsvelte.backgroundProjects.enable: false`, so the
//                      first workspace/symbol loads the other projects
// Prints one JSON line: timings, workspace/symbol hits, process-tree RSS and phys_footprint (MB).
// QUERIES are the workspace/symbol names to look up; pick ones declared in different projects.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [bin, rootArg, mode = "open-all", idleArg = "20000"] = process.argv.slice(2);
const root = fs.realpathSync(rootArg);
const idleMs = Number(idleArg);
const QUERIES = (process.env.QUERIES ?? "").split(",").filter(Boolean);

function owners() {
	const byProject = new Map();
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name.endsWith(".svelte")) {
				let d = path.dirname(full);
				while (d !== root && !fs.existsSync(path.join(d, "tsconfig.json")) && !fs.existsSync(path.join(d, "jsconfig.json"))) d = path.dirname(d);
				if (!byProject.has(d)) byProject.set(d, []);
				byProject.get(d).push(full);
			}
		}
	};
	walk(root);
	return [...byProject.entries()].sort().map(([project, files]) => ({ project, file: files.sort()[0] }));
}

const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env } });
const stderr = [];
child.stderr.on("data", (d) => { stderr.push(d.toString()); if (process.env.LOG) process.stderr.write(d); });
let buf = Buffer.alloc(0), nextId = 1;
const pending = new Map();
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); send({ id, method, params }); });
const rsvelte = { backgroundProjects: { enable: mode !== "lazy" } };
child.stdout.on("data", (c) => {
	buf = Buffer.concat([buf, c]);
	for (;;) {
		const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return;
		const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]);
		if (buf.length < sep + 4 + len) return;
		const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString());
		buf = buf.subarray(sep + 4 + len);
		if (msg.id !== undefined && msg.method === undefined) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p?.rej(new Error(JSON.stringify(msg.error))) : p?.res(msg.result); }
		else if (msg.id !== undefined) send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map((i) => (i.section === "rsvelte" ? rsvelte : null)) : null });
	}
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tree() {
	const out = execFileSync("ps", ["-axo", "pid=,ppid=,rss=,comm="], { encoding: "utf8" });
	const kids = new Map(), info = new Map();
	for (const line of out.trim().split("\n")) {
		const [pid, ppid, rss, ...comm] = line.trim().split(/\s+/);
		info.set(Number(pid), { rss: Number(rss), comm: path.basename(comm.join(" ")) });
		if (!kids.has(Number(ppid))) kids.set(Number(ppid), []);
		kids.get(Number(ppid)).push(Number(pid));
	}
	const pids = [], stack = [child.pid];
	while (stack.length) { const p = stack.pop(); pids.push(p); stack.push(...(kids.get(p) ?? [])); }
	return pids.map((pid) => ({ pid, ...info.get(pid) }));
}
function memory() {
	const rss = {}, fp = {};
	for (const { pid, rss: kb, comm } of tree()) {
		rss[comm] = (rss[comm] ?? 0) + Math.round(kb / 1024);
		try {
			const t = execFileSync("footprint", [String(pid)], { encoding: "utf8" });
			const m = /Footprint: ([\d.]+) (KB|MB|GB)/.exec(t);
			if (m) fp[comm] = (fp[comm] ?? 0) + Math.round(Number(m[1]) * (m[2] === "GB" ? 1024 : m[2] === "KB" ? 1 / 1024 : 1));
		} catch {}
	}
	const total = (o) => Object.values(o).reduce((a, b) => a + b, 0);
	return { rssMB: total(rss), footprintMB: total(fp), rss, footprint: fp };
}

const result = { mode, bin: path.basename(bin) };
const t0 = performance.now();
await request("initialize", {
	processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "root" }],
	capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true }, symbol: {} }, textDocument: { synchronization: { dynamicRegistration: true }, diagnostic: { dynamicRegistration: true } } },
});
send({ method: "initialized", params: {} });
const projects = owners();
result.projects = projects.length;
const wanted = process.env.OPEN_FILE && path.resolve(root, process.env.OPEN_FILE);
const opened = mode === "open-all" ? projects : (wanted ? projects.filter((p) => p.file === wanted) : []).concat(projects).slice(0, 1);
const firstDiagnostics = [];
for (const { file } of opened) {
	const uri = pathToFileURL(file).href;
	const t = performance.now();
	send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: "svelte", version: 1, text: fs.readFileSync(file, "utf8") } } });
	await request("textDocument/diagnostic", { textDocument: { uri } });
	firstDiagnostics.push(Math.round(performance.now() - t));
}
result.firstDiagnosticsMs = firstDiagnostics;
if (mode !== "open-all") {
	// Idle, but with an occasional request on the open document, as an editor would send.
	const uri = pathToFileURL(opened[0].file).href;
	const hovers = [];
	const end = performance.now() + idleMs;
	const every = Number(process.env.HOVER_EVERY_MS ?? 2500);
	while (performance.now() < end) {
		await sleep(every);
		const t = performance.now();
		await request("textDocument/hover", { textDocument: { uri }, position: { line: 1, character: 2 } });
		hovers.push(Math.round(performance.now() - t));
	}
	result.idleHoverMs = { every, max: Math.max(...hovers), median: hovers.sort((a, b) => a - b)[hovers.length >> 1] };
	result.loadsBeforeSymbols = stderr.join("").split("\n").filter((l) => /loaded TypeScript project/.test(l)).length;
	result.memoryBeforeSymbols = memory();
}
const symbols = {};
for (const query of QUERIES) {
	const t = performance.now();
	const r = (await request("workspace/symbol", { query })) ?? [];
	symbols[query] = { ms: Math.round(performance.now() - t), files: [...new Set(r.filter((s) => s.name === query).map((s) => path.relative(root, new URL(s.location.uri).pathname)))].sort() };
}
result.symbols = symbols;
await sleep(2000);
result.memory = memory();
result.loads = stderr.join("").split("\n").filter((l) => /loaded TypeScript project/.test(l)).length;
result.totalMs = Math.round(performance.now() - t0);
console.log(JSON.stringify(result));
try { await Promise.race([request("shutdown", null), sleep(3000)]); send({ method: "exit" }); } catch {}
await sleep(300);
child.kill("SIGKILL");
