// Typing benchmark: single-character edits at typing speed, then member-expression completions.
//
// Usage: [BACKGROUND=0] [SETTLE_MS=3000] bench/with-lock.sh node bench/typing.mjs <server> <projectRoot> <file.svelte>
//   server: "svelte-ls" or "svelte-rs" (same table and Zed initialization options as bench/bench.mjs)
// Prints one JSON line.
//
// 1. Opens the file with a canary type error on a new line right before the instance script's
//    </script>, waits for it (TypeScript is answering), empties the line to a tab, waits for the
//    canary to clear, then pauses SETTLE_MS.
// 2. Types TYPED (default `document.body.child`, which works in any component) into that line,
//    one character per incremental didChange edit, one every 50 ms. After each edit it sends what Zed sends while typing: a
//    completion request at the cursor (trigger character "." after a dot, invoked otherwise) and,
//    for a pull-diagnostics server, a diagnostic pull. Completions are not awaited before the next
//    keystroke; each one's latency is recorded.
// 3. finalDiagMs: time from the last edit to diagnostics that show the final text's own error,
//    FINAL_MSG (default `Property 'child' does not exist`) on the typed line. No intermediate state
//    can produce that message (each prefix names a different property).
// 4. memberCompletion: ROUNDS rounds, after the typing settled, of one keystroke at the end of the
//    member expression (`child` <-> `chil`) followed by an invoked completion there, awaited before
//    the next round; p50/p95/max and in how many rounds the last EXPECT member was offered.
//    EXPECT (default `document,body,children`) names the member expected after 0, 1, 2... dots.
//    The runs recorded in docs/measurements used TYPED=runtime.config.exten
//    FINAL_MSG="Property 'exten' does not exist" EXPECT=runtime,config,extensions.
//    memberCompletionUnchanged: the same request ROUNDS more times without an edit.
// keystrokeCompletion (step 2) is the as-you-type latency, including any queueing behind edits.
import { spawn, execFile, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const [serverName, root, rel] = process.argv.slice(2);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ZED = `${process.env.HOME}/Library/Application Support/Zed`;
const TYPED = process.env.TYPED ?? "document.body.child";
const FINAL_MSG = process.env.FINAL_MSG ?? "Property 'child' does not exist";
const EXPECTED = (process.env.EXPECT ?? "document,body,children").split(",");
const EXPECT = (typed) => EXPECTED[Math.min(typed.split(".").length - 1, EXPECTED.length - 1)];
const INTERVAL_MS = 50;
const ROUNDS = Number(process.env.ROUNDS ?? 20);
const SETTLE_MS = Number(process.env.SETTLE_MS ?? 3000);
const TIMEOUT_MS = 180_000;
const rsvelteSettings = process.env.BACKGROUND === "0" ? { backgroundProjects: { enable: false } } : null;

const inlay = {
	parameterNames: { enabled: "all", suppressWhenArgumentMatchesName: false },
	parameterTypes: { enabled: true },
	variableTypes: { enabled: true, suppressWhenTypeMatchesName: false },
	propertyDeclarationTypes: { enabled: true },
	functionLikeReturnTypes: { enabled: true },
	enumMemberValues: { enabled: true },
};
const zedInit = { provideFormatter: true, dontFilterIncompleteCompletions: true, configuration: { typescript: { inlayHints: inlay }, javascript: { inlayHints: inlay } } };
const servers = {
	"svelte-ls": { cmd: "node", args: [`${ZED}/extensions/work/svelte/node_modules/svelte-language-server/bin/server.js`, "--stdio"] },
	"svelte-rs": { cmd: process.env.SVELTE_RS_BIN ?? path.join(HERE, "../target/release/svelte-rs"), args: ["--stdio"] },
};
const spec = servers[serverName];
if (!spec) throw new Error(`unknown server ${serverName}`);

const child = spawn(spec.cmd, spec.args, { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...spec.env } });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));

function treePids(out = execFileSync("ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8" })) {
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
const treeRssKb = () => { const { tree, rss } = treePids(); return tree.reduce((s, p) => s + (rss.get(p) ?? 0), 0); };
// The peak sampler runs ps asynchronously: a synchronous ps blocks this process's event loop for
// ~30 ms, which delayed about a quarter of the measured responses by that much.
let peakKb = 0, sampling = false;
const sampler = setInterval(() => {
	if (sampling) return;
	sampling = true;
	execFile("ps", ["-axo", "pid=,ppid=,rss="], { encoding: "utf8" }, (error, out) => {
		sampling = false;
		if (error) return;
		try { const { tree, rss } = treePids(out); peakKb = Math.max(peakKb, tree.reduce((s, p) => s + (rss.get(p) ?? 0), 0)); } catch {}
	});
}, 100);

let buf = Buffer.alloc(0), nextId = 1, pullMode = false;
const pending = new Map(), pushed = new Map(), waiters = new Set();
const send = (msg) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...msg })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params, timeout = TIMEOUT_MS) => new Promise((resolve, reject) => {
	const id = nextId++;
	const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}`)); }, timeout);
	pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
	send({ id, method, params });
});
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
			send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map((i) => (i.section === "rsvelte" ? rsvelteSettings : null)) : null });
		} else if (msg.method === "textDocument/publishDiagnostics") {
			pushed.set(msg.params.uri, msg.params.diagnostics);
			for (const w of waiters) w();
		}
	}
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Resolves with the elapsed time once `pred(diagnostics)` holds for the document.
async function waitForDiags(uri, pred, what) {
	const start = performance.now();
	if (pullMode) {
		for (;;) {
			const res = await request("textDocument/diagnostic", { textDocument: { uri } });
			if (res?.kind === "full" && pred(res.items)) return { ms: performance.now() - start, items: res.items };
			if (performance.now() - start > TIMEOUT_MS) throw new Error(`timeout (pull) waiting for ${what}`);
			await sleep(25);
		}
	}
	return new Promise((resolve, reject) => {
		const check = () => { const d = pushed.get(uri); if (d && pred(d)) { waiters.delete(check); clearTimeout(t); resolve({ ms: performance.now() - start, items: d }); } };
		const t = setTimeout(() => { waiters.delete(check); reject(new Error(`timeout (push) waiting for ${what}; last: ${JSON.stringify(pushed.get(uri))?.slice(0, 400)}`)); }, TIMEOUT_MS);
		waiters.add(check);
		check();
	});
}
const labelsOf = (res) => (Array.isArray(res) ? res : res?.items ?? []).map((i) => (typeof i.label === "string" ? i.label : i.label?.label));
function stats(ms) {
	const s = [...ms].sort((a, b) => a - b);
	const at = (q) => s[Math.max(0, Math.ceil(q * s.length) - 1)];
	return { n: s.length, p50: Math.round(at(0.5) * 10) / 10, p95: Math.round(at(0.95) * 10) / 10, max: Math.round(s[s.length - 1] * 10) / 10, ms: ms.map(Math.round) };
}
function instanceScriptEndLine(lines) {
	let inInstance = false;
	for (let i = 0; i < lines.length; i++) {
		const open = /<script\b([^>]*)>/.exec(lines[i]);
		if (open && !/\bmodule\b|context\s*=\s*["']module/.test(open[1])) inInstance = true;
		if (inInstance && /<\/script>/.test(lines[i])) return i;
	}
	throw new Error("no instance <script>");
}

const result = { scenario: "typing", server: serverName, file: rel, typed: TYPED, intervalMs: INTERVAL_MS, sampler: "async" };
const t0 = performance.now();
await request("initialize", {
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
}).then((init) => { if (init?.capabilities?.diagnosticProvider) pullMode = true; });
notify("initialized", {});
notify("workspace/didChangeConfiguration", { settings: zedInit.configuration });
result.initMs = Math.round(performance.now() - t0);

const abs = path.join(root, rel), uri = pathToFileURL(abs).href;
const lines = readFileSync(abs, "utf8").split("\n");
const line = instanceScriptEndLine(lines); // the typed line goes here, pushing </script> down
const canary = `\tconst __typingCanary: number = "x";`;
let version = 1;
notify("textDocument/didOpen", { textDocument: { uri, languageId: "svelte", version, text: [...lines.slice(0, line), canary, ...lines.slice(line)].join("\n") } });
const onLine = (ds, re) => (ds ?? []).some((d) => d.range.start.line === line && re.test(String(d.message)));
result.openMs = Math.round((await waitForDiags(uri, (ds) => onLine(ds, /not assignable to type 'number'/), "canary")).ms);
notify("textDocument/didChange", { textDocument: { uri, version: ++version }, contentChanges: [{ range: { start: { line, character: 1 }, end: { line, character: canary.length } }, text: "" }] });
await waitForDiags(uri, (ds) => !onLine(ds, /not assignable to type 'number'/), "canary to clear");
await sleep(SETTLE_MS);
const baseMb = Math.round(treeRssKb() / 1024);

// Typing.
const keystroke = [];
const pulls = [];
const tStart = performance.now();
let tLast = tStart;
for (let i = 0; i < TYPED.length; i++) {
	const due = tStart + i * INTERVAL_MS;
	const wait = due - performance.now();
	if (wait > 0) await sleep(wait);
	const ch = TYPED[i];
	tLast = performance.now();
	notify("textDocument/didChange", { textDocument: { uri, version: ++version }, contentChanges: [{ range: { start: { line, character: 1 + i }, end: { line, character: 1 + i } }, text: ch }] });
	const typed = TYPED.slice(0, i + 1);
	const expect = EXPECT(typed);
	const context = ch === "." ? { triggerKind: 2, triggerCharacter: "." } : { triggerKind: 1 };
	const ts = performance.now();
	keystroke.push(request("textDocument/completion", { textDocument: { uri }, position: { line, character: 2 + i }, context }, 60_000)
		.then((r) => { const labels = labelsOf(r); return { ms: performance.now() - ts, items: labels.length, hit: labels.includes(expect) }; })
		.catch((e) => ({ ms: performance.now() - ts, error: String(e.message ?? e).slice(0, 200) })));
	if (pullMode) pulls.push(request("textDocument/diagnostic", { textDocument: { uri } }, 60_000).catch(() => null));
}
const final = await waitForDiags(uri, (ds) => onLine(ds, new RegExp(FINAL_MSG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))), "final diagnostics");
const tFinal = performance.now();
result.finalDiagMs = Math.round(tFinal - tLast);
result.finalDiagSinceFirstKeyMs = Math.round(tFinal - tStart);
result.finalDiagnostics = final.items.filter((d) => d.severity === 1 || d.severity === undefined).map((d) => `${d.range.start.line}:${d.code ?? ""}:${String(d.message).split("\n")[0].slice(0, 80)}`);
const ks = await Promise.all(keystroke);
await Promise.all(pulls);
result.keystrokeCompletion = { ...stats(ks.map((k) => k.ms)), expectedOffered: ks.filter((k) => k.hit).length, offeredByKey: ks.map((k) => (k.hit ? "1" : "0")).join(""), errors: ks.filter((k) => k.error).map((k) => k.error) };
result.beforeTypingMb = baseMb;
result.peakMbThroughTyping = Math.round(peakKb / 1024);

// Completion at the end of the member expression, after the typing settled. Each round first
// deletes or retypes the expression's last character (`child` <-> `chil`, as a keystroke would),
// then asks for completions at its end and waits for them; a pull follows, as in the typing phase.
// The repeat rounds ask again without an edit (the cost of an unchanged document).
await sleep(1000);
const member = [], repeat = [];
let memberLabels = [], hits = 0;
const end = 1 + TYPED.length;
for (let i = 0; i < ROUNDS; i++) {
	const shorter = i % 2 === 0;
	notify("textDocument/didChange", { textDocument: { uri, version: ++version }, contentChanges: [shorter
		? { range: { start: { line, character: end - 1 }, end: { line, character: end } }, text: "" }
		: { range: { start: { line, character: end - 1 }, end: { line, character: end - 1 } }, text: TYPED[TYPED.length - 1] }] });
	const ts = performance.now();
	const r = await request("textDocument/completion", { textDocument: { uri }, position: { line, character: shorter ? end - 1 : end }, context: { triggerKind: 1 } }, 60_000);
	member.push(performance.now() - ts);
	memberLabels = labelsOf(r);
	if (memberLabels.includes(EXPECTED[EXPECTED.length - 1])) hits++;
	if (pullMode) await request("textDocument/diagnostic", { textDocument: { uri } }, 60_000).catch(() => null);
	await sleep(INTERVAL_MS);
}
result.memberCompletion = { ...stats(member), items: memberLabels.length, offersExtensions: hits };
for (let i = 0; i < ROUNDS; i++) {
	const ts = performance.now();
	await request("textDocument/completion", { textDocument: { uri }, position: { line, character: end }, context: { triggerKind: 1 } }, 60_000);
	repeat.push(performance.now() - ts);
	await sleep(INTERVAL_MS);
}
result.memberCompletionUnchanged = stats(repeat);

await sleep(1000);
result.settledMb = Math.round(treeRssKb() / 1024);
result.peakMb = Math.round(peakKb / 1024);
{
	const { tree, rss } = treePids();
	const cmds = execFileSync("ps", ["-o", "pid=,comm=", "-p", tree.join(",")], { encoding: "utf8" });
	result.processes = cmds.trim().split("\n").map((l) => {
		const [pid, ...comm] = l.trim().split(/\s+/);
		return { name: path.basename(comm.join(" ")), mb: Math.round((rss.get(Number(pid)) ?? 0) / 1024) };
	});
}
result.pullMode = pullMode;
clearInterval(sampler);
try { await Promise.race([request("shutdown", null), sleep(3000)]); notify("exit", null); } catch {}
await sleep(300);
const { tree } = treePids();
for (const p of tree) try { process.kill(p, "SIGKILL"); } catch {}
console.log(JSON.stringify(result));
process.exit(0);
