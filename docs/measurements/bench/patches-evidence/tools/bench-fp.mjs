// Svelte language-server benchmark: open -> diagnostics, edit -> diagnostics, process-tree RSS.
//
// Usage: node bench/bench.mjs <server> <projectRoot> <file.svelte> [<file.svelte>...]
//   server: "svelte-ls" (the Node svelte-language-server Zed installs) or "svelte-rs" (this repo's release build)
// Prints one JSON line.
//
// For each file it inserts `const __benchN: number = "x";` as the last line of the instance
// <script>, waits for that type error to arrive as a diagnostic, then alternates the line between
// two different type errors and times each round trip.
import { spawn, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const [serverName, root, ...files] = process.argv.slice(2);
const HERE = "/Users/hyprsonic/Developer/adroyt/svelte-rs/bench";
const ZED = `${process.env.HOME}/Library/Application Support/Zed`;
const EDITS = Number(process.env.EDITS ?? 5);
const TIMEOUT_MS = 180_000;

const inlay = {
	parameterNames: { enabled: "all", suppressWhenArgumentMatchesName: false },
	parameterTypes: { enabled: true },
	variableTypes: { enabled: true, suppressWhenTypeMatchesName: false },
	propertyDeclarationTypes: { enabled: true },
	functionLikeReturnTypes: { enabled: true },
	enumMemberValues: { enabled: true },
};
// Same initialization options Zed's Svelte extension sends.
const zedInit = { provideFormatter: true, dontFilterIncompleteCompletions: true, configuration: { typescript: { inlayHints: inlay }, javascript: { inlayHints: inlay } } };

const TSRS = process.env.TSRS_BIN ?? `${process.env.HOME}/.bun/bin/tsrs`;
const RSVELTE = process.env.RSVELTE_BIN ?? path.join(HERE, "../target-rsvelte/release/rsvelte-language-server");
const servers = {
	"svelte-ls": { cmd: "node", args: [`${ZED}/extensions/work/svelte/node_modules/svelte-language-server/bin/server.js`, "--stdio"] },
	"svelte-rs": { cmd: process.env.SVELTE_RS_BIN ?? path.join(HERE, "../target/release/svelte-rs"), args: ["--stdio"] },
	// rsvelte's native language server with tsrs as its TypeScript 7 child.
	"rsvelte-tsrs": { cmd: RSVELTE, args: ["--stdio"], env: { TSGO_BIN: TSRS } },
	// The same server with tsgo (TypeScript 7 in Go); set TSGO_BIN to a tsgo binary.
	"rsvelte-tsgo": { cmd: RSVELTE, args: ["--stdio"], env: { TSGO_BIN: process.env.TSGO_BIN ?? "tsgo" } },
};
const spec = servers[serverName];
if (!spec) throw new Error(`unknown server ${serverName}`);

const child = spawn(spec.cmd, spec.args, { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...spec.env } });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));

function treePids() {
	const out = execFileSync("ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8" });
	const kids = new Map(), rss = new Map();
	for (const line of out.trim().split("\n")) {
		const [pid, ppid, r] = line.trim().split(/\s+/).map(Number);
		rss.set(pid, r);
		if (!kids.has(ppid)) kids.set(ppid, []);
		kids.get(ppid).push(pid);
	}
	const tree = [], stack = [child.pid];
	while (stack.length) { const p = stack.pop(); tree.push(p); stack.push(...(kids.get(p) ?? [])); }
	return { tree, rss };
}
function treeFootprint() {
	const { tree } = treePids();
	const out = {};
	for (const pid of tree) {
		try {
			const t = execFileSync("footprint", [String(pid)], { encoding: "utf8" });
			const m = /^(\S+) \[\d+\]: .*Footprint: ([\d.]+) (KB|MB|GB)/m.exec(t);
			if (m) out[m[1]] = (out[m[1]] ?? 0) + Math.round(Number(m[2]) * (m[3] === "GB" ? 1024 : m[3] === "KB" ? 1 / 1024 : 1));
		} catch {}
	}
	return out;
}
const treeRssKb = () => { const { tree, rss } = treePids(); return tree.reduce((s, p) => s + (rss.get(p) ?? 0), 0); };
let peakKb = 0;
const sampler = setInterval(() => { try { peakKb = Math.max(peakKb, treeRssKb()); } catch {} }, 100);

let buf = Buffer.alloc(0), nextId = 1, pullMode = false;
const pending = new Map(), pushed = new Map(), waiters = new Set();
const send = (msg) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...msg })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((resolve, reject) => { const id = nextId++; pending.set(id, { resolve, reject }); send({ id, method, params }); });
const notify = (method, params) => send({ method, params });
child.stdout.on("data", (chunk) => {
	buf = Buffer.concat([buf, chunk]);
	for (;;) {
		const sep = buf.indexOf("\r\n\r\n");
		if (sep < 0) return;
		const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]);
		if (buf.length < sep + 4 + len) return;
		const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString());
		buf = buf.subarray(sep + 4 + len);
		if (msg.id !== undefined && msg.method === undefined) {
			const p = pending.get(msg.id); pending.delete(msg.id);
			msg.error ? p?.reject(new Error(JSON.stringify(msg.error))) : p?.resolve(msg.result);
		} else if (msg.id !== undefined) {
			if (msg.method === "client/registerCapability") for (const r of msg.params.registrations) if (r.method === "textDocument/diagnostic") pullMode = true;
			send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null });
		} else if (msg.method === "textDocument/publishDiagnostics") {
			pushed.set(msg.params.uri, msg.params.diagnostics);
			for (const w of waiters) w();
		}
	}
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MSG = { num: "not assignable to type 'number'", str: "not assignable to type 'string'" };
const benchLine = (kind, n) => kind === "num" ? `const __bench${n}: number = "x";` : `const __bench${n}: string = 1;`;
const matches = (diags, kind, line) => (diags ?? []).some((d) => d.range.start.line === line && String(d.message).includes(MSG[kind]));
async function waitForDiag(uri, kind, line) {
	const start = performance.now();
	if (pullMode) {
		for (;;) {
			const res = await request("textDocument/diagnostic", { textDocument: { uri } });
			if (res?.kind === "full" && matches(res.items, kind, line)) return performance.now() - start;
			if (performance.now() - start > TIMEOUT_MS) throw new Error("timeout (pull)");
			await sleep(25);
		}
	}
	return new Promise((resolve, reject) => {
		const check = () => { if (matches(pushed.get(uri), kind, line)) { waiters.delete(check); clearTimeout(t); resolve(performance.now() - start); } };
		const t = setTimeout(() => { waiters.delete(check); reject(new Error(`timeout (push) waiting for ${kind} on line ${line} in ${uri}; last: ${JSON.stringify(pushed.get(uri))?.slice(0, 400)}`)); }, TIMEOUT_MS);
		waiters.add(check);
	});
}

// Index of the line holding the instance script's closing tag.
function instanceScriptEndLine(lines) {
	let inInstance = false;
	for (let i = 0; i < lines.length; i++) {
		const open = /<script\b([^>]*)>/.exec(lines[i]);
		if (open && !/\bmodule\b|context\s*=\s*["']module/.test(open[1])) inInstance = true;
		if (inInstance && /<\/script>/.test(lines[i])) return i;
	}
	throw new Error("no instance <script>");
}

const result = { server: serverName, files: [] };
const t0 = performance.now();
const init = await request("initialize", {
	processId: process.pid,
	rootUri: pathToFileURL(root).href,
	workspaceFolders: [{ uri: pathToFileURL(root).href, name: path.basename(root) }],
	initializationOptions: zedInit,
	capabilities: {
		window: { workDoneProgress: true },
		workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } },
		textDocument: {
			synchronization: { dynamicRegistration: true, didSave: true },
			publishDiagnostics: { relatedInformation: true, versionSupport: true },
			diagnostic: { dynamicRegistration: true },
			hover: { contentFormat: ["markdown", "plaintext"] },
			completion: { completionItem: { snippetSupport: true } },
		},
	},
});
if (init?.capabilities?.diagnosticProvider) pullMode = true;
notify("initialized", {});
notify("workspace/didChangeConfiguration", { settings: zedInit.configuration });
result.initMs = Math.round(performance.now() - t0);

for (const rel of files) {
	const abs = path.join(root, rel), uri = pathToFileURL(abs).href;
	const lines = readFileSync(abs, "utf8").split("\n");
	const line = instanceScriptEndLine(lines); // the bench line goes here, pushing </script> down
	const textWith = (l) => [...lines.slice(0, line), l, ...lines.slice(line)].join("\n");
	let version = 1, kind = "num";
	notify("textDocument/didOpen", { textDocument: { uri, languageId: "svelte", version, text: textWith(benchLine(kind, 0)) } });
	const openMs = await waitForDiag(uri, kind, line);
	await sleep(3000);
	const afterOpenMb = Math.round(treeRssKb() / 1024);
	const afterOpenFp = treeFootprint();
	const edits = [];
	for (let i = 1; i <= EDITS; i++) {
		const prev = benchLine(kind, i - 1);
		kind = kind === "num" ? "str" : "num";
		notify("textDocument/didChange", {
			textDocument: { uri, version: ++version },
			contentChanges: [{ range: { start: { line, character: 0 }, end: { line, character: prev.length } }, text: benchLine(kind, i) }],
		});
		edits.push(await waitForDiag(uri, kind, line));
		await sleep(300);
	}
	edits.sort((a, b) => a - b);
	result.files.push({ file: rel, openMs: Math.round(openMs), editMedianMs: Math.round(edits[Math.floor(edits.length / 2)]), afterOpenMb, afterOpenFp });
}
await sleep(3000);
result.settledMb = Math.round(treeRssKb() / 1024);
result.settledFp = treeFootprint();
result.peakMb = Math.round(peakKb / 1024);
{
	// Per-process breakdown of the settled memory (server vs. TypeScript child, sidecars).
	const { tree, rss } = treePids();
	const cmds = execFileSync("ps", ["-o", "pid=,comm=", "-p", tree.join(",")], { encoding: "utf8" });
	result.processes = cmds.trim().split("\n").map((l) => {
		const [pid, ...comm] = l.trim().split(/\s+/);
		return { name: path.basename(comm.join(" ")), mb: Math.round((rss.get(Number(pid)) ?? 0) / 1024) };
	});
}
clearInterval(sampler);
try { await Promise.race([request("shutdown", null), sleep(3000)]); notify("exit", null); } catch {}
await sleep(300);
const { tree } = treePids();
for (const p of tree) try { process.kill(p, "SIGKILL"); } catch {}
console.log(JSON.stringify(result));
process.exit(0);
