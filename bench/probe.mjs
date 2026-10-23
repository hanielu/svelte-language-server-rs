// Cost of component-attribute completion (`<Component |`), which asks tsgo about the component's
// props through a probe document, and of the next request after it.
//
// Usage: [BACKGROUND=0] bench/with-lock.sh node bench/probe.mjs <server-binary> <root> <file.svelte> <needle> [rounds]
//   <needle>: text of the component start tag to complete in, e.g. "<AdminNavigation onNavigate"; the
//   cursor goes right after the tag name plus one space.
// Prints one JSON line: per-round completion and follow-up hover latency, the props offered, and the
// process-tree memory before and after.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [bin, rootArg, fileArg, needle, roundsArg = "8"] = process.argv.slice(2);
const root = fs.realpathSync(rootArg);
const file = path.resolve(root, fileArg);
const rounds = Number(roundsArg);
const text = fs.readFileSync(file, "utf8");
const at = text.indexOf(needle);
if (at < 0) throw new Error(`needle not found: ${needle}`);
const nameEnd = at + needle.split(/\s/)[0].length;
const before = text.slice(0, nameEnd);
const position = { line: before.split("\n").length - 1, character: nameEnd - before.lastIndexOf("\n") - 1 + 1 };

// BACKGROUND=0 turns background project loading off, so memory is the completions' own.
const rsvelte = process.env.BACKGROUND === "0" ? { backgroundProjects: { enable: false } } : null;
const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env } });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));
let buf = Buffer.alloc(0), nextId = 1;
const pending = new Map();
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); send({ id, method, params }); });
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
function treeMB() {
	const out = execFileSync("ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8" });
	const kids = new Map(), rss = new Map();
	for (const line of out.trim().split("\n")) { const [pid, ppid, r] = line.trim().split(/\s+/).map(Number); rss.set(pid, r); if (!kids.has(ppid)) kids.set(ppid, []); kids.get(ppid).push(pid); }
	let total = 0; const stack = [child.pid];
	while (stack.length) { const p = stack.pop(); total += rss.get(p) ?? 0; stack.push(...(kids.get(p) ?? [])); }
	return Math.round(total / 1024);
}

await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "root" }],
	capabilities: { workspace: { configuration: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { diagnostic: { dynamicRegistration: true }, completion: { completionItem: { snippetSupport: true } } } } });
send({ method: "initialized", params: {} });
const uri = pathToFileURL(file).href;
send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: "svelte", version: 1, text } } });
await request("textDocument/diagnostic", { textDocument: { uri } });
await sleep(1500);
const result = { file: fileArg, position, memoryBeforeMB: treeMB(), completionMs: [], nextHoverMs: [] };
for (let i = 0; i < rounds; i++) {
	let t = performance.now();
	const r = await request("textDocument/completion", { textDocument: { uri }, position, context: { triggerKind: 1 } });
	result.completionMs.push(Math.round(performance.now() - t));
	const items = Array.isArray(r) ? r : r?.items ?? [];
	result.items = items.length;
	result.sample = items.slice(0, 6).map((item) => item.label);
	t = performance.now();
	await request("textDocument/hover", { textDocument: { uri }, position: { line: 1, character: 2 } });
	result.nextHoverMs.push(Math.round(performance.now() - t));
	await sleep(300);
}
result.memoryAfterMB = treeMB();
console.log(JSON.stringify(result));
try { await Promise.race([request("shutdown", null), sleep(3000)]); send({ method: "exit" }); } catch {}
await sleep(300);
child.kill("SIGKILL");
