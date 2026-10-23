// Print every diagnostic a server reports for files of a real project, to compare svelte-language-server-rs with the
// official svelte-language-server.
// Usage: node tests/diagproj.mjs <svelte-language-server-rs|svelte-ls> <projectRoot> <file.svelte>...   (SVELTE_LANGUAGE_SERVER_RS_BIN overrides the binary)
// Waits until diagnostics have been quiet for 2 s (at least 4 s), then also pulls them when the server supports it.
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";

const [serverName, rootArg, ...files] = process.argv.slice(2);
const root = path.resolve(rootArg);
const ZED = `${process.env.HOME}/Library/Application Support/Zed`;
const servers = {
	"svelte-ls": { cmd: "node", args: [`${ZED}/extensions/work/svelte/node_modules/svelte-language-server/bin/server.js`, "--stdio"] },
	"svelte-language-server-rs": { cmd: process.env.SVELTE_LANGUAGE_SERVER_RS_BIN ?? `${process.env.HOME}/.local/bin/svelte-language-server-rs`, args: ["--stdio"] },
};
const spec = servers[serverName];
const child = spawn(spec.cmd, spec.args, { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));
let buf = Buffer.alloc(0), nextId = 1, last = Date.now(), pull = false;
const pending = new Map(), pushed = new Map();
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((resolve) => { const id = nextId++; pending.set(id, resolve); send({ id, method, params }); });
child.stdout.on("data", (chunk) => {
	buf = Buffer.concat([buf, chunk]);
	for (;;) {
		const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return;
		const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]);
		if (buf.length < sep + 4 + len) return;
		const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
		if (msg.id !== undefined && msg.method === undefined) { pending.get(msg.id)?.(msg.result ?? { error: msg.error }); pending.delete(msg.id); }
		else if (msg.id !== undefined) {
			if (msg.method === "client/registerCapability") for (const r of msg.params.registrations) if (r.method === "textDocument/diagnostic") pull = true;
			send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null });
		} else if (msg.method === "textDocument/publishDiagnostics") { pushed.set(msg.params.uri, msg.params.diagnostics); last = Date.now(); }
	}
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const init = await request("initialize", {
	processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: path.basename(root) }],
	initializationOptions: { configuration: {} },
	capabilities: { workspace: { configuration: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { publishDiagnostics: { relatedInformation: true }, diagnostic: { dynamicRegistration: true }, hover: { contentFormat: ["markdown"] } } },
});
if (init?.capabilities?.diagnosticProvider) pull = true;
send({ method: "initialized", params: {} });
for (const f of files) send({ method: "textDocument/didOpen", params: { textDocument: { uri: pathToFileURL(path.join(root, f)).href, languageId: "svelte", version: 1, text: readFileSync(path.join(root, f), "utf8") } } });
const t0 = Date.now();
while (Date.now() - t0 < 4000 || Date.now() - last < 2000) await sleep(200);
const fmt = (d) => `${d.range.start.line + 1}:${d.range.start.character + 1} ${d.severity === 1 ? "error" : d.severity === 2 ? "warning" : "info"} [${d.source ?? ""}${d.code !== undefined ? " " + d.code : ""}] ${String(d.message).split("\n")[0].slice(0, 160)}`;
const out = {};
for (const f of files) {
	const uri = pathToFileURL(path.join(root, f)).href;
	const items = [...(pushed.get(uri) ?? [])];
	if (pull) { const r = await request("textDocument/diagnostic", { textDocument: { uri } }); items.push(...(r?.items ?? [])); }
	const seen = new Set();
	out[f] = items.map(fmt).filter((l) => !seen.has(l) && seen.add(l)).sort();
}
for (const [f, lines] of Object.entries(out)) { console.log(`== ${f} (${lines.length})`); for (const l of lines) console.log("  " + l); }
child.kill("SIGKILL");
process.exit(0);
