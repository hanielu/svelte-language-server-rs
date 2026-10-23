#!/usr/bin/env node
// End-to-end behavioural test of a Svelte language server against a real workspace.
//
// Drives the server over stdio like Zed does (rootUri = the repository root, pull diagnostics with
// refresh support, incremental didChange edits) through a fixed list of scenarios and records what
// it answers. Nothing is ever written to the workspace: every edit is an unsaved editor buffer.
//
// The scenarios name components of the monorepo the patches were developed against (see
// docs/testing.md); to use it elsewhere, adapt the file paths in the scenario list below.
//
// Usage (from anywhere):
//   E2E_WORKSPACE=<repository root> node tests/e2e.mjs run <patched|baseline> [--out <file.json>]
//   E2E_WORKSPACE=<repository root> node tests/e2e.mjs both     # baseline, then patched, then compare
//   node tests/e2e.mjs compare <a.json> <b.json>
//
//   patched  = target/release/svelte-rs                          (SVELTE_RS_BIN overrides)
//   baseline = an unpatched rsvelte-language-server               (RSVELTE_BIN; default
//              target-rsvelte/release/rsvelte-language-server)
//   Both use TSGO_BIN = tsrs (TSRS_BIN overrides, default ~/.bun/bin/tsrs). LOG=1 echoes the
//   server's stderr.
//
// `run` re-executes itself through bench/with-lock.sh, so sessions against the workspace never
// overlap. Results go to tests/results/e2e-<label>.json (+ .stderr.log; local, git-ignored); the
// process exits non-zero when a step fails. The recorded runs, and which patch fixed which step,
// are in docs/measurements/tests and docs/patches.md.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
if (process.argv[2] !== "compare" && !process.env.E2E_WORKSPACE) {
	console.error("set E2E_WORKSPACE to the repository root to test against");
	process.exit(2);
}
const WORKSPACE = path.resolve(process.env.E2E_WORKSPACE ?? ".");
const TSRS = process.env.TSRS_BIN ?? path.join(os.homedir(), ".bun/bin/tsrs");
const RESULTS = path.join(HERE, "results");
const SERVERS = {
	patched: { cmd: process.env.SVELTE_RS_BIN ?? path.join(REPO, "target/release/svelte-rs"), args: ["--stdio"], env: { TSGO_BIN: TSRS } },
	baseline: { cmd: process.env.RSVELTE_BIN ?? path.join(REPO, "target-rsvelte/release/rsvelte-language-server"), args: ["--stdio"], env: { TSGO_BIN: TSRS } },
};

const FIRST_OPEN_TIMEOUT = 180_000;
const STEP_TIMEOUT = 60_000;
const REQUEST_TIMEOUT = 90_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.error("[e2e]", ...a);

// ---------------------------------------------------------------------------------------------
// LSP client

function startClient(spec, stderrPath) {
	const child = spawn(spec.cmd, spec.args, { cwd: WORKSPACE, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...spec.env } });
	const stderr = fs.createWriteStream(stderrPath);
	let stderrBytes = 0;
	child.stderr.on("data", (d) => {
		if (process.env.LOG) process.stderr.write(d);
		if (stderrBytes < 8 << 20) { stderr.write(d); stderrBytes += d.length; }
	});
	let buf = Buffer.alloc(0), nextId = 1, exited = null;
	const pending = new Map();
	const counters = { diagnosticRefresh: 0, registrations: [], serverRequests: {} };
	const pushed = new Map();
	child.on("exit", (code, signal) => {
		exited = { code, signal };
		for (const [, p] of pending) p.reject(new Error(`server exited (${code ?? signal})`));
		pending.clear();
	});
	const send = (msg) => {
		if (exited) return;
		const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...msg }));
		child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
		child.stdin.write(body);
	};
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
				const p = pending.get(msg.id);
				pending.delete(msg.id);
				if (p) { clearTimeout(p.timer); msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); }
			} else if (msg.id !== undefined) {
				counters.serverRequests[msg.method] = (counters.serverRequests[msg.method] ?? 0) + 1;
				if (msg.method === "workspace/diagnostic/refresh") counters.diagnosticRefresh++;
				if (msg.method === "client/registerCapability") for (const r of msg.params.registrations) counters.registrations.push(r.method);
				send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null });
			} else if (msg.method === "textDocument/publishDiagnostics") {
				pushed.set(msg.params.uri, msg.params.diagnostics);
			}
		}
	});
	return {
		child, counters, pushed,
		get exited() { return exited; },
		request(method, params, timeout = REQUEST_TIMEOUT) {
			return new Promise((resolve, reject) => {
				if (exited) return reject(new Error("server exited"));
				const id = nextId++;
				const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}`)); }, timeout);
				pending.set(id, { resolve, reject, timer });
				send({ id, method, params });
			});
		},
		notify: (method, params) => send({ method, params }),
		closeStderr: () => new Promise((r) => stderr.end(r)),
	};
}

// ---------------------------------------------------------------------------------------------
// Text helpers

const abs = (rel) => path.join(WORKSPACE, rel);
const uriOf = (rel) => pathToFileURL(abs(rel)).href;
function relOf(uri) {
	let p;
	try { p = fileURLToPath(uri); } catch { return uri; }
	const r = path.relative(WORKSPACE, p);
	return r.startsWith("..") ? p : r;
}
function posAt(text, offset) {
	const before = text.slice(0, offset);
	const line = before.split("\n").length - 1;
	return { line, character: offset - (before.lastIndexOf("\n") + 1) };
}
// Position of the nth occurrence of needle (+ delta characters into it).
function locate(text, needle, { nth = 0, delta = 0 } = {}) {
	let idx = -1;
	for (let i = 0, from = 0; i <= nth; i++) {
		idx = text.indexOf(needle, from);
		if (idx < 0) throw new Error(`needle not found: ${JSON.stringify(needle)} #${nth}`);
		from = idx + 1;
	}
	return posAt(text, idx + delta);
}
const rangeStr = (r) => `${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}`;
function spanOf(text, needle, { nth = 0, delta = 0, length } = {}) {
	const start = locate(text, needle, { nth, delta });
	return rangeStr({ start, end: { line: start.line, character: start.character + (length ?? needle.length - delta) } });
}
function replaceNth(text, from, to, nth = 0) {
	let idx = -1;
	for (let i = 0, f = 0; i <= nth; i++) {
		idx = text.indexOf(from, f);
		if (idx < 0) throw new Error(`cannot replace ${JSON.stringify(from)} #${nth}`);
		f = idx + 1;
	}
	return text.slice(0, idx) + to + text.slice(idx + from.length);
}
// Line index of the instance script's closing tag (same rule as bench/bench.mjs).
function instanceScriptEndLine(lines) {
	let inInstance = false;
	for (let i = 0; i < lines.length; i++) {
		const open = /<script\b([^>]*)>/.exec(lines[i]);
		if (open && !/\bmodule\b|context\s*=\s*["']module/.test(open[1])) inInstance = true;
		if (inInstance && /<\/script>/.test(lines[i])) return i;
	}
	throw new Error("no instance <script>");
}
function insertBeforeScriptEnd(text, line) {
	const lines = text.split("\n");
	const at = instanceScriptEndLine(lines);
	return { text: [...lines.slice(0, at), line, ...lines.slice(at)].join("\n"), line: at };
}
// One incremental edit turning oldText into newText (what an editor sends for a typed change).
function diffEdit(oldText, newText) {
	const max = Math.min(oldText.length, newText.length);
	let p = 0;
	while (p < max && oldText.charCodeAt(p) === newText.charCodeAt(p)) p++;
	let s = 0;
	while (s < max - p && oldText.charCodeAt(oldText.length - 1 - s) === newText.charCodeAt(newText.length - 1 - s)) s++;
	return { range: { start: posAt(oldText, p), end: posAt(oldText, oldText.length - s) }, text: newText.slice(p, newText.length - s) };
}

const normDiag = (d) => ({ range: rangeStr(d.range), sev: d.severity ?? 1, code: d.code ?? null, source: d.source ?? null, msg: String(d.message).split("\n")[0] });
const fmtDiag = (d) => `${d.range} ${["", "E", "W", "I", "H"][d.sev] ?? d.sev} ${d.source ?? ""} ${d.code ?? ""} ${d.msg}`.replace(/\s+/g, " ");
const sortDiags = (ds) => ds.map(fmtDiag).sort();
const errorsAndWarnings = (ds) => ds.filter((d) => d.sev === 1 || d.sev === 2);
const atLine = (ds, line) => ds.filter((d) => Number(d.range.split(":")[0]) === line);

function hoverText(h) {
	if (!h) return null;
	const c = h.contents;
	const one = (x) => (typeof x === "string" ? x : x?.value ?? "");
	return (Array.isArray(c) ? c.map(one).join("\n") : one(c)).trim();
}
function normLocations(res) {
	if (!res) return [];
	const arr = Array.isArray(res) ? res : [res];
	return arr.map((l) => {
		const uri = l.targetUri ?? l.uri;
		const range = l.targetSelectionRange ?? l.range;
		return `${relOf(uri)}:${range.start.line}:${range.start.character}`;
	}).sort();
}

// ---------------------------------------------------------------------------------------------
// The run

async function run(label, outPath) {
	const spec = SERVERS[label];
	fs.mkdirSync(RESULTS, { recursive: true });
	const stderrPath = outPath.replace(/\.json$/, "") + ".stderr.log";
	const gitStatus = () => execFileSync("git", ["-C", WORKSPACE, "status", "--porcelain", "--untracked-files=all"], { encoding: "utf8", maxBuffer: 64 << 20 });
	const statusBefore = gitStatus();
	const result = {
		label, cmd: spec.cmd, env: spec.env, workspace: WORKSPACE, started: new Date().toISOString(),
		loadavg: os.loadavg().map((x) => Math.round(x * 10) / 10), steps: [],
	};
	const lsp = startClient(spec, stderrPath);
	process.on("exit", () => killTree(lsp.child.pid)); // never leave a server (or its tsrs) behind
	const docs = new Map(); // rel -> { text, version }
	const original = (rel) => fs.readFileSync(abs(rel), "utf8");
	const open = (rel, text) => {
		docs.set(rel, { text, version: 1 });
		lsp.notify("textDocument/didOpen", { textDocument: { uri: uriOf(rel), languageId: "svelte", version: 1, text } });
	};
	const setText = (rel, text) => {
		const doc = docs.get(rel);
		if (doc.text === text) return;
		const change = diffEdit(doc.text, text);
		doc.text = text;
		lsp.notify("textDocument/didChange", { textDocument: { uri: uriOf(rel), version: ++doc.version }, contentChanges: [change] });
	};
	const close = (rel) => { docs.delete(rel); lsp.notify("textDocument/didClose", { textDocument: { uri: uriOf(rel) } }); };
	const watched = (rel, type) => lsp.notify("workspace/didChangeWatchedFiles", { changes: [{ uri: uriOf(rel), type }] });
	const textOf = (rel) => docs.get(rel).text;

	let pullMode = false;
	async function diagnostics(rel) {
		if (pullMode) {
			const r = await lsp.request("textDocument/diagnostic", { textDocument: { uri: uriOf(rel) } });
			return (r?.items ?? []).map(normDiag);
		}
		return (lsp.pushed.get(uriOf(rel)) ?? []).map(normDiag);
	}
	// Poll until pred(diags) holds; then keep polling until two pulls 600 ms apart agree.
	async function waitDiags(rel, pred, timeout = STEP_TIMEOUT) {
		const start = performance.now();
		let diags = [];
		for (;;) {
			diags = await diagnostics(rel);
			if (pred(diags)) break;
			if (performance.now() - start > timeout) return { ok: false, ms: Math.round(performance.now() - start), diags, timedOut: true };
			await sleep(150);
		}
		const ms = Math.round(performance.now() - start);
		for (let i = 0; i < 10; i++) {
			await sleep(600);
			const next = await diagnostics(rel);
			const same = JSON.stringify(sortDiags(next)) === JSON.stringify(sortDiags(diags));
			diags = next;
			if (same) break;
		}
		return { ok: pred(diags), ms, diags };
	}
	const CANARY = "__e2eCanary";
	const canaryLine = `\tconst ${CANARY}: number = "x";`;
	const isCanary = (line) => (d) => Number(d.range.split(":")[0]) === line && String(d.code) === "2322" && d.msg.includes("not assignable to type 'number'");
	// Open a file with a canary type error, wait for it (proves the TypeScript side answers for this
	// file and maps lines), remove it and record the file's real diagnostics.
	async function openVerified(rel) {
		const text = original(rel);
		const { text: withCanary, line } = insertBeforeScriptEnd(text, canaryLine);
		const expectedRange = spanOf(withCanary, CANARY);
		open(rel, withCanary);
		const t0 = performance.now();
		const first = await waitDiags(rel, (ds) => ds.some(isCanary(line)), FIRST_OPEN_TIMEOUT);
		const canary = first.diags.filter(isCanary(line)).map((d) => d.range);
		setText(rel, text);
		const settled = await waitDiags(rel, (ds) => !ds.some(isCanary(line)));
		return {
			canarySeen: first.ok, canaryMs: first.ms, canaryRange: canary[0] ?? null, canaryRangeExpected: expectedRange,
			canaryRangeOk: canary[0] === expectedRange, totalMs: Math.round(performance.now() - t0),
			diags: sortDiags(settled.diags), errors: sortDiags(errorsAndWarnings(settled.diags)),
			canaryDiagsWhileOpen: first.ok ? undefined : sortDiags(first.diags),
		};
	}

	async function step(id, title, fn) {
		const t0 = performance.now();
		let rec;
		try {
			rec = await fn();
		} catch (error) {
			rec = { ok: false, error: String(error?.message ?? error) };
		}
		rec = { id, title, ok: !!rec.ok, ms: Math.round(performance.now() - t0), ...rec };
		result.steps.push(rec);
		log(`${label}: ${rec.ok ? "PASS" : "FAIL"} ${id} ${title} (${rec.ms} ms)${rec.ok ? "" : " " + JSON.stringify(rec.observed ?? rec.error ?? "").slice(0, 400)}`);
		return rec;
	}

	// ---- initialize (the same capabilities and options as bench/bench.mjs, plus refresh support)
	const inlay = {
		parameterNames: { enabled: "all", suppressWhenArgumentMatchesName: false }, parameterTypes: { enabled: true },
		variableTypes: { enabled: true, suppressWhenTypeMatchesName: false }, propertyDeclarationTypes: { enabled: true },
		functionLikeReturnTypes: { enabled: true }, enumMemberValues: { enabled: true },
	};
	const zedInit = { provideFormatter: true, dontFilterIncompleteCompletions: true, configuration: { typescript: { inlayHints: inlay }, javascript: { inlayHints: inlay } } };
	const sessionStart = Date.now();
	const t0 = performance.now();
	const init = await lsp.request("initialize", {
		processId: process.pid,
		rootUri: pathToFileURL(WORKSPACE).href,
		workspaceFolders: [{ uri: pathToFileURL(WORKSPACE).href, name: path.basename(WORKSPACE) }],
		initializationOptions: zedInit,
		capabilities: {
			window: { workDoneProgress: true },
			workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true }, diagnostics: { refreshSupport: true } },
			textDocument: {
				synchronization: { dynamicRegistration: true, didSave: true },
				publishDiagnostics: { relatedInformation: true, versionSupport: true },
				diagnostic: { dynamicRegistration: true },
				hover: { contentFormat: ["markdown", "plaintext"] },
				definition: { linkSupport: true },
				references: {},
				completion: { completionItem: { snippetSupport: true, documentationFormat: ["markdown", "plaintext"] }, contextSupport: true },
			},
		},
	});
	pullMode = !!init?.capabilities?.diagnosticProvider;
	lsp.notify("initialized", {});
	lsp.notify("workspace/didChangeConfiguration", { settings: zedInit.configuration });
	result.initMs = Math.round(performance.now() - t0);
	result.pullMode = pullMode;

	const F = {
		layout: "admin/src/app/admin-layout.svelte",
		renderer: "admin/src/fields/field-renderer.svelte",
		radio: "admin/src/components/ui/radio-group/radio-group.svelte",
		jsonNode: "admin/src/components/json-tree/json-tree-node.svelte",
		nav: "admin/src/features/navigation/admin-navigation.svelte",
		dialog: "packages/ui/src/lib/confirmation-dialog/confirmation-dialog.svelte",
		contract: "tests/contracts/admin_app/navigation-note.svelte",
		typesColor: "tests/types/svelte/src/ColorField.svelte",
		playground: "playground/shadcn-rhea/src/components/ui/sidebar/sidebar-menu-sub.svelte",
		example: "examples/blocks/render/Callout.svelte",
		dist: "packages/ui/dist/menu/menu-trigger.svelte",
		newFile: "admin/src/app/__e2e_new__.svelte",
		rootFile: "__e2e_root__.svelte",
	};
	for (const f of [F.newFile, F.rootFile]) if (fs.existsSync(abs(f))) throw new Error(`${f} must not exist on disk`);

	// ---- 1. several admin components + one packages/ui component: no errors (svelte-check: 0)
	const opened = {};
	for (const [key, rel] of [["layout", F.layout], ["renderer", F.renderer], ["radio", F.radio], ["jsonNode", F.jsonNode], ["dialog", F.dialog]]) {
		await step(`1.${key}`, `open ${rel}: no errors or warnings (svelte-check reports 0 errors)`, async () => {
			const r = (opened[key] = await openVerified(rel));
			return { ok: r.canarySeen && r.canaryRangeOk && r.errors.length === 0, observed: r };
		});
	}

	// ---- 2. type errors in the instance script and in a template expression
	await step("2.script+template", "injected script and template type errors are reported at the right ranges", async () => {
		const text = original(F.layout);
		const scriptLine = `\tconst __e2eScript: number = "x";`;
		const { text: t1, line: sLine } = insertBeforeScriptEnd(text, scriptLine);
		const t2 = t1.replace(/\n?$/, "\n") + `<p>{Math.round("e2e")}</p>\n`;
		const tLine = t2.split("\n").length - 2;
		const expected = { script: spanOf(t2, "__e2eScript"), template: spanOf(t2, `"e2e"`) };
		setText(F.layout, t2);
		const pick = (ds) => ({
			script: ds.filter((d) => String(d.code) === "2322" && Number(d.range.split(":")[0]) === sLine).map((d) => d.range),
			template: ds.filter((d) => String(d.code) === "2345" && Number(d.range.split(":")[0]) === tLine).map((d) => d.range),
		});
		const r = await waitDiags(F.layout, (ds) => { const p = pick(ds); return p.script.length > 0 && p.template.length > 0; });
		const p = pick(r.diags);
		const others = sortDiags(errorsAndWarnings(r.diags)).filter((d) => !d.startsWith(`${p.script[0]} `) && !d.startsWith(`${p.template[0]} `));
		setText(F.layout, text);
		const back = await waitDiags(F.layout, (ds) => errorsAndWarnings(ds).length === 0);
		return {
			ok: r.ok && p.script[0] === expected.script && p.template[0] === expected.template && others.length === 0 && back.ok,
			expected, observed: { script: p.script, template: p.template, otherErrors: others, all: sortDiags(r.diags), revertedClean: back.ok, msToReport: r.ms },
		};
	});

	// ---- 3. cross-component props: parent admin-layout -> child admin-navigation (via @admin alias)
	const layoutText = original(F.layout);
	const navText = original(F.nav);
	const usage = "<AdminNavigation onNavigate={closeMobileNavigation} />";
	const wrongLayout = replaceNth(layoutText, usage, "<AdminNavigation onNavigate={42} />", 0);
	const L1 = locate(wrongLayout, "onNavigate={42}").line;
	const L2 = locate(wrongLayout, usage).line; // the second usage, still correct
	const propErr = (line, type) => (d) => Number(d.range.split(":")[0]) === line && d.sev === 1 && d.msg.includes(`not assignable to type '${type}'`);
	await step("3a.wrong-prop", "a wrong-typed prop on an imported child is an error on the prop", async () => {
		setText(F.layout, wrongLayout);
		const r = await waitDiags(F.layout, (ds) => ds.some(propErr(L1, "() => void")));
		const hit = r.diags.filter(propErr(L1, "() => void"));
		const attr = locate(wrongLayout, "onNavigate={42}");
		const within = hit.length > 0 && Number(hit[0].range.split(":")[1].split("-")[0]) >= attr.character && Number(hit[0].range.split(":")[1].split("-")[0]) < attr.character + "onNavigate={42}".length;
		return { ok: r.ok && within, expected: `error on line ${L1} inside ${spanOf(wrongLayout, "onNavigate={42}")}`, observed: { hits: sortDiags(hit), all: sortDiags(r.diags), ms: r.ms } };
	});
	await step("3b.child-buffer-change", "changing the child's Props in an unsaved buffer updates the parent's diagnostics", async () => {
		open(F.nav, navText);
		await waitDiags(F.nav, () => true);
		const refreshBefore = lsp.counters.diagnosticRefresh;
		setText(F.nav, navText.replace("{ onNavigate: () => void }", "{ onNavigate: number }"));
		const r = await waitDiags(F.layout, (ds) => !ds.some(propErr(L1, "() => void")) && !ds.some((d) => Number(d.range.split(":")[0]) === L1 && d.sev === 1) && ds.some(propErr(L2, "number")));
		return {
			ok: r.ok, expected: `no error on line ${L1}; error "not assignable to type 'number'" on line ${L2}`,
			observed: { line1: sortDiags(atLine(r.diags, L1)), line2: sortDiags(atLine(r.diags, L2)), all: sortDiags(r.diags), ms: r.ms, diagnosticRefreshRequests: lsp.counters.diagnosticRefresh - refreshBefore },
		};
	});
	await step("3c.child-close-reverts", "closing the unsaved child reverts the parent to the child on disk", async () => {
		close(F.nav);
		const r = await waitDiags(F.layout, (ds) => ds.some(propErr(L1, "() => void")) && !ds.some((d) => Number(d.range.split(":")[0]) === L2 && d.sev === 1));
		setText(F.layout, layoutText);
		const back = await waitDiags(F.layout, (ds) => errorsAndWarnings(ds).length === 0);
		return { ok: r.ok && back.ok, observed: { line1: sortDiags(atLine(r.diags, L1)), line2: sortDiags(atLine(r.diags, L2)), ms: r.ms, revertedClean: back.ok } };
	});

	// ---- 4. hover, definition, references, completion
	const at = (rel, needle, opts) => ({ textDocument: { uri: uriOf(rel) }, position: locate(textOf(rel), needle, opts) });
	await step("4a.hover-identifier", "hover on a script identifier (runtime) shows its type", async () => {
		const h = hoverText(await lsp.request("textDocument/hover", at(F.layout, "const runtime = getAdminRuntime()", { delta: 7 })));
		return { ok: !!h && h.includes("AdminRuntime"), expected: "contains AdminRuntime", observed: h };
	});
	await step("4b.hover-component-tag", "hover on a component tag (<AdminBreadcrumbs />)", async () => {
		const h = hoverText(await lsp.request("textDocument/hover", at(F.layout, "<AdminBreadcrumbs />", { delta: 3 })));
		return { ok: !!h && /AdminBreadcrumbs|Component/.test(h) && !/\bany\b/.test(h), expected: "mentions AdminBreadcrumbs / Component, not any", observed: h };
	});
	await step("4c.definition-component-tag", "go-to-definition from a component tag opens the child .svelte file", async () => {
		const res = await lsp.request("textDocument/definition", at(F.layout, "<AdminNavigation onNavigate", { delta: 3 }));
		const locs = normLocations(res);
		return { ok: locs.length > 0 && locs.every((l) => l.startsWith(`${F.nav}:`)), expected: `${F.nav}:*`, observed: locs };
	});
	await step("4c2.definition-component-import", "go-to-definition on the component's import binding opens the child .svelte file", async () => {
		const res = await lsp.request("textDocument/definition", at(F.layout, "import AdminNavigation from", { delta: 9 }));
		const locs = normLocations(res);
		return { ok: locs.length > 0 && locs.every((l) => l.startsWith(`${F.nav}:`)), expected: `${F.nav}:*`, observed: locs };
	});
	await step("4d.definition-import", "go-to-definition on an aliased import (getAdminRuntime) reaches the .svelte.ts module", async () => {
		const res = await lsp.request("textDocument/definition", at(F.layout, "const runtime = getAdminRuntime()", { delta: 18 }));
		const locs = normLocations(res);
		return { ok: locs.some((l) => l.startsWith("admin/src/core/runtime/admin-runtime.svelte.ts:")), observed: locs };
	});
	const grepRefs = (name) => execFileSync("git", ["-C", WORKSPACE, "grep", "-n", "-w", name, "--", "*.ts", "*.svelte"], { encoding: "utf8" })
		.trim().split("\n").filter((l) => !/^[^:]+:\d+:\s*(\/\/|\*)/.test(l));
	await step("4e.references-small", "references of an exported function (adminPathResource) used by .svelte files", async () => {
		const res = await lsp.request("textDocument/references", { ...at(F.layout, "adminPathResource(location", { delta: 3 }), context: { includeDeclaration: true } });
		const locs = normLocations(res);
		const files = [...new Set(locs.map((l) => l.replace(/:\d+:\d+$/, "")))].sort();
		const grep = grepRefs("adminPathResource");
		const grepFiles = [...new Set(grep.map((l) => l.split(":")[0]))].sort();
		const expectedFiles = grepFiles.filter((f) => f.startsWith("admin/src/"));
		const missing = expectedFiles.filter((f) => !files.includes(f));
		return {
			ok: missing.length === 0 && files.some((f) => f.endsWith(".svelte")) && locs.every((l) => !l.includes(".svelte-rs") && !l.includes(".rsvelte-language-server") && !l.includes(".svelte.tsx")),
			expected: { filesInAdminSrc: expectedFiles, allGrepFiles: grepFiles, grepOccurrences: grep.length },
			observed: { count: locs.length, files, missingFromAdminSrc: missing, notInGrep: files.filter((f) => !grepFiles.includes(f)), locations: locs },
		};
	});
	await step("4f.references-large", "references of getAdminRuntime (used by ~60 .svelte files)", async () => {
		const res = await lsp.request("textDocument/references", { ...at(F.layout, "const runtime = getAdminRuntime()", { delta: 18 }), context: { includeDeclaration: true } });
		const locs = normLocations(res);
		const files = [...new Set(locs.map((l) => l.replace(/:\d+:\d+$/, "")))].sort();
		const grepFiles = [...new Set(grepRefs("getAdminRuntime").map((l) => l.split(":")[0]))].sort();
		const missing = grepFiles.filter((f) => !files.includes(f));
		const adminSrcMissing = missing.filter((f) => f.startsWith("admin/src/"));
		return {
			ok: adminSrcMissing.length === 0 && locs.every((l) => !l.includes(".svelte.tsx")),
			expected: { grepFiles: grepFiles.length },
			observed: { count: locs.length, files: files.length, svelteFiles: files.filter((f) => f.endsWith(".svelte")).length, missing, extra: files.filter((f) => !grepFiles.includes(f)) },
		};
	});
	// Completion on runtime's members: `typed` is the edited document, `pos` the cursor.
	async function memberCompletion(typed, pos, context) {
		setText(F.layout, typed);
		const res = await lsp.request("textDocument/completion", { textDocument: { uri: uriOf(F.layout) }, position: pos, context });
		// What the editor shows meanwhile: the half-typed document's errors.
		const whileTyped = sortDiags(errorsAndWarnings(await diagnostics(F.layout)));
		setText(F.layout, layoutText);
		await waitDiags(F.layout, (ds) => errorsAndWarnings(ds).length === 0);
		const items = Array.isArray(res) ? res : res?.items ?? [];
		const labels = items.map((i) => (typeof i.label === "string" ? i.label : i.label?.label));
		const want = ["i18n", "manifest", "session", "bootstrap", "config"];
		const missing = want.filter((w) => !labels.includes(w));
		const junk = labels.filter((l) => ["div", "script", "Array", "window"].includes(l));
		return { ok: missing.length === 0 && junk.length === 0, expected: want, observed: { count: labels.length, missing, unexpectedGlobals: junk, sample: labels.slice(0, 12), isIncomplete: res?.isIncomplete ?? null, errorsWhileTyped: whileTyped } };
	}
	await step("4g.completion-member", "completions right after typing `runtime.` in the instance script", async () => {
		const { text: typed, line } = insertBeforeScriptEnd(layoutText, "\truntime.");
		return memberCompletion(typed, { line, character: "\truntime.".length }, { triggerKind: 2, triggerCharacter: "." });
	});
	await step("4h.completion-member-partial", "invoked completion in `runtime.i` (syntactically valid script)", async () => {
		const { text: typed, line } = insertBeforeScriptEnd(layoutText, "\truntime.i");
		return memberCompletion(typed, { line, character: "\truntime.".length }, { triggerKind: 1 });
	});
	await step("4i.completion-member-template", "completions after `runtime.` in a template expression", async () => {
		const typed = layoutText.replace(/\n?$/, "\n") + "<p>{runtime.}</p>\n";
		const line = typed.split("\n").length - 2;
		return memberCompletion(typed, { line, character: "<p>{runtime.".length }, { triggerKind: 2, triggerCharacter: "." });
	});

	// Renamed at a use in the .svelte file: TypeScript's default (prefix/suffix text) renames the local
	// import binding (`adminPathResource as X`) rather than the export across files.
	await step("4j.rename", "rename at an imported function's use in a .svelte file edits exactly the identifier occurrences", async () => {
		const res = await lsp.request("textDocument/rename", { ...at(F.layout, "adminPathResource(location", { delta: 3 }), newName: "adminPathResourceE2e" });
		const edits = [];
		for (const [u, list] of Object.entries(res?.changes ?? {})) for (const e of list) edits.push({ uri: u, ...e });
		for (const dc of res?.documentChanges ?? []) for (const e of dc.edits ?? []) edits.push({ uri: dc.textDocument.uri, ...e });
		const bad = [];
		const locs = edits.map((e) => {
			const rel = relOf(e.uri);
			let covered = null;
			try {
				const lines = fs.readFileSync(fileURLToPath(e.uri), "utf8").split("\n");
				covered = lines[e.range.start.line]?.slice(e.range.start.character, e.range.end.character);
			} catch {}
			if (covered !== "adminPathResource" || !e.newText.endsWith("adminPathResourceE2e")) bad.push({ rel, covered, newText: e.newText });
			return `${rel}:${e.range.start.line}:${e.range.start.character}`;
		}).sort();
		const files = [...new Set(locs.map((l) => l.replace(/:\d+:\d+$/, "")))].sort();
		const crossFile = [...new Set(grepRefs("adminPathResource").map((l) => l.split(":")[0]))].filter((f) => f.startsWith("admin/src/")).sort();
		const localOnly = files.length === 1 && files[0] === F.layout && locs.length === 2;
		return {
			ok: bad.length === 0 && (localOnly || crossFile.every((f) => files.includes(f))) && files.every((f) => !f.includes(".svelte-rs") && !f.includes(".rsvelte-language-server")),
			expected: { localOnly: `${F.layout} (2 edits)`, orCrossFile: crossFile }, observed: { count: locs.length, files, edits: edits.map((e) => `${relOf(e.uri)}:${rangeStr(e.range)} -> ${e.newText}`).sort() },
		};
	});
	const symbolQuery = async (query) => {
		const res = await lsp.request("workspace/symbol", { query });
		return [...new Set((res ?? []).filter((x) => x.name === query).map((x) => relOf(x.location?.uri ?? "")))].sort();
	};
	await step("4k.workspace-symbol-loaded", "workspace symbol search finds a function of an opened project", async () => {
		const found = await symbolQuery("adminPathResource");
		return { ok: found.includes("admin/src/core/routing/admin-paths.ts"), observed: found };
	});
	await step("4l.workspace-symbol-unopened", "workspace symbol search finds functions of projects nothing was opened in", async () => {
		const found = { lengthState: await symbolQuery("lengthState"), decodeColor: await symbolQuery("decodeColor") };
		return {
			ok: found.lengthState.includes("packages/plugin-seo/src/lib/length-indicator.ts") && found.decodeColor.includes("examples/documentation/custom-components/color/admin/src/value.ts"),
			observed: found,
		};
	});

	// ---- 5. a component in a different tsconfig project (packages/ui) works after admin
	await step("5a.ui-hover-#lib-import", "packages/ui: hover on a #lib (package imports) binding resolves", async () => {
		const h = hoverText(await lsp.request("textDocument/hover", at(F.dialog, "{ buttonVariants }", { delta: 3 })));
		const usage = hoverText(await lsp.request("textDocument/hover", at(F.dialog, "class={buttonVariants(", { delta: 9 })));
		const good = (x) => !!x && x.includes("buttonVariants") && !/: any\b/.test(x);
		return { ok: good(h) && good(usage), observed: { importSpecifier: h, usage } };
	});
	await step("5b.ui-hover-bits-ui", "packages/ui: hover on a bits-ui namespace import resolves", async () => {
		const h = hoverText(await lsp.request("textDocument/hover", at(F.dialog, "AlertDialog as AlertDialogPrimitive", { delta: 18 })));
		return { ok: !!h && !/: any\b/.test(h) && !/Cannot find/.test(h), observed: h };
	});
	await step("5c.ui-injected-error", "packages/ui: an injected script error is reported at its range, then clears", async () => {
		const text = original(F.dialog);
		const { text: t1, line } = insertBeforeScriptEnd(text, `\tconst __e2eUi: string = 1;`);
		setText(F.dialog, t1);
		const want = spanOf(t1, "__e2eUi");
		const r = await waitDiags(F.dialog, (ds) => ds.some((d) => Number(d.range.split(":")[0]) === line && String(d.code) === "2322"));
		const got = r.diags.filter((d) => Number(d.range.split(":")[0]) === line && String(d.code) === "2322").map((d) => d.range);
		setText(F.dialog, text);
		const back = await waitDiags(F.dialog, (ds) => !ds.some((d) => Number(d.range.split(":")[0]) === line && String(d.code) === "2322"));
		return { ok: r.ok && got[0] === want && back.ok, expected: want, observed: { got, ms: r.ms, injectedCleared: back.ok, errorsAfter: sortDiags(errorsAndWarnings(back.diags)) } };
	});

	// ---- 6. later-opened files in other projects (tests/, playground/)
	const hoverChecks = {
		contract: ["{manifest.application", 2, /manifest/, "tests/contracts/admin_app (paths alias to admin/src, @riducms/plugin)"],
		typesColor: ["{field.schema.id}", 2, /field/, "tests/types/svelte"],
		playground: ["}: WithElementRef<", 4, /WithElementRef/, "playground/shadcn-rhea (solution-style tsconfig, @/ alias)"],
		example: ["{block.title", 2, /Callout/, "examples/blocks (relative component import, paths)"],
		dist: ["}: DropdownMenu.TriggerProps", 4, /dropdown-menu|DropdownMenu/, "packages/ui/dist, outside its tsconfig include"],
	};
	for (const key of ["contract", "typesColor", "playground", "example", "dist"]) {
		const rel = F[key];
		const [needle, delta, re, what] = hoverChecks[key];
		await step(`6.${key}`, `later open ${rel} (${what}): TypeScript answers, no errors, imports resolve`, async () => {
			const r = await openVerified(rel);
			const h = hoverText(await lsp.request("textDocument/hover", at(rel, needle, { delta })));
			const hoverOk = !!h && re.test(h) && !/: any\b/.test(h);
			return { ok: r.canarySeen && r.canaryRangeOk && r.errors.length === 0 && hoverOk, observed: { ...r, hover: h } };
		});
	}

	// ---- 7. a new, unsaved .svelte file (didOpen + watched-file create) gets diagnostics
	const newText = [
		`<script lang="ts">`,
		`\timport AdminNavigation from "@admin/features/navigation/admin-navigation.svelte";`,
		`\timport { getAdminRuntime } from "@admin/core/runtime/admin-runtime.svelte";`,
		``,
		`\tlet { count }: { count: number } = $props();`,
		`\tconst runtime = getAdminRuntime();`,
		`\tconst wrong: number = "x";`,
		`</script>`,
		``,
		`<AdminNavigation onNavigate={count} />`,
		`<p>{runtime.i18n.direction} {wrong}</p>`,
		``,
	].join("\n");
	await step("7a.new-file-diagnostics", "a new unsaved file gets script + prop diagnostics and resolves its imports", async () => {
		open(F.newFile, newText);
		watched(F.newFile, 1);
		const want = { script: spanOf(newText, "wrong"), propLine: locate(newText, "onNavigate={count}").line };
		const pick = (ds) => ({
			script: ds.filter((d) => String(d.code) === "2322" && d.range === want.script),
			prop: ds.filter(propErr(want.propLine, "() => void")),
			unresolved: ds.filter((d) => String(d.code) === "2307"),
		});
		const r = await waitDiags(F.newFile, (ds) => { const p = pick(ds); return p.script.length > 0 && p.prop.length > 0; });
		const p = pick(r.diags);
		return { ok: r.ok && p.unresolved.length === 0, expected: want, observed: { all: sortDiags(r.diags), ms: r.ms } };
	});
	const layoutImportingNew = insertBeforeScriptEnd(layoutText, `\timport E2eNew from "./__e2e_new__.svelte";`).text.replace(/\n?$/, "\n") + `<E2eNew count="x" />\n`;
	const newUseLine = layoutImportingNew.split("\n").length - 2;
	const newImportLine = locate(layoutImportingNew, "./__e2e_new__.svelte").line;
	await step("7b.parent-sees-new-file", "a parent importing the unsaved new file type-checks its props", async () => {
		setText(F.layout, layoutImportingNew);
		const r = await waitDiags(F.layout, (ds) => ds.some(propErr(newUseLine, "number")) && !ds.some((d) => String(d.code) === "2307"));
		return { ok: r.ok, expected: `2322 on line ${newUseLine}, no 2307`, observed: { all: sortDiags(r.diags), ms: r.ms } };
	});
	await step("7c.new-file-fixed", "fixing the new file clears its errors", async () => {
		setText(F.newFile, newText.replace(`const wrong: number = "x";`, `const wrong: number = 1;`).replace("onNavigate={count}", "onNavigate={() => count}"));
		const r = await waitDiags(F.newFile, (ds) => errorsAndWarnings(ds).length === 0);
		return { ok: r.ok, observed: { all: sortDiags(r.diags), ms: r.ms } };
	});
	await step("7d.new-file-discarded", "closing the never-saved file (+ watched delete) makes the parent's import unresolved", async () => {
		close(F.newFile);
		watched(F.newFile, 3);
		const r = await waitDiags(F.layout, (ds) => ds.some((d) => String(d.code) === "2307" && Number(d.range.split(":")[0]) === newImportLine));
		setText(F.layout, layoutText);
		const back = await waitDiags(F.layout, (ds) => errorsAndWarnings(ds).length === 0);
		return { ok: r.ok && back.ok, expected: `2307 on line ${newImportLine}`, observed: { all: sortDiags(r.diags), ms: r.ms, revertedClean: back.ok } };
	});

	await step("7e.new-file-without-project", "a new unsaved file at the workspace root (no tsconfig above it) gets TypeScript diagnostics", async () => {
		const text = `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n\tconst size: number = "x";\n</script>\n\n<p>{label} {size}</p>\n`;
		open(F.rootFile, text);
		watched(F.rootFile, 1);
		const want = spanOf(text, "size");
		const r = await waitDiags(F.rootFile, (ds) => ds.some((d) => String(d.code) === "2322" && d.range === want), 30000);
		close(F.rootFile);
		watched(F.rootFile, 3);
		return { ok: r.ok, expected: want, observed: { all: sortDiags(r.diags) } };
	});

	// ---- 8. the earlier documents still answer after everything above
	for (const [key, rel] of [["layout", F.layout], ["renderer", F.renderer]]) {
		await step(`8.${key}`, `${rel} still reports a fresh error and clears it`, async () => {
			const text = original(rel);
			const { text: t1, line } = insertBeforeScriptEnd(text, canaryLine);
			setText(rel, t1);
			const r = await waitDiags(rel, (ds) => ds.some(isCanary(line)));
			setText(rel, text);
			const back = await waitDiags(rel, (ds) => !ds.some(isCanary(line)));
			return { ok: r.ok && back.ok && errorsAndWarnings(back.diags).length === 0, observed: { ms: r.ms, after: sortDiags(back.diags) } };
		});
	}

	// ---- 9. watched-file events (Zed's **/* watcher reports every write, the servers' own too)
	await step("9a.event-for-dirty-buffer", "a watched-file change for an open, modified document keeps the editor buffer", async () => {
		const { text: t1, line } = insertBeforeScriptEnd(layoutText, canaryLine);
		setText(F.layout, t1);
		const r = await waitDiags(F.layout, (ds) => ds.some(isCanary(line)));
		watched(F.layout, 2);
		watched(F.nav, 2);
		await sleep(1500);
		const after = await waitDiags(F.layout, (ds) => ds.some(isCanary(line)), 5000);
		return { ok: r.ok && after.ok, expected: `canary still reported on line ${line}`, observed: { before: r.ok, after: sortDiags(after.diags) } };
	});
	// Type the canary again (an editor keystroke), so each step starts from a synced buffer.
	async function retypeCanary() {
		const { text: t1, line } = insertBeforeScriptEnd(layoutText, canaryLine);
		setText(F.layout, layoutText);
		await waitDiags(F.layout, (ds) => !ds.some(isCanary(line)));
		setText(F.layout, t1);
		return (await waitDiags(F.layout, (ds) => ds.some(isCanary(line)))).ok;
	}
	await step("9b.echo-own-cache-writes", "echoing the server's own cache writes as watched-file events changes nothing", async () => {
		const files = [];
		const walk = (dir) => {
			for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
				const p = path.join(dir, e.name);
				if (e.isDirectory()) walk(p);
				else if (e.isFile()) files.push({ p, fresh: fs.statSync(p).mtimeMs >= sessionStart });
			}
		};
		// Only this server's own cache directory (the other server's may exist from an earlier run).
		const cache = label === "baseline" ? ".rsvelte-language-server" : ".svelte-rs";
		if (fs.existsSync(path.join(WORKSPACE, cache))) walk(path.join(WORKSPACE, cache));
		const line = instanceScriptEndLine(layoutText.split("\n"));
		if (!(await retypeCanary())) throw new Error("canary not reported before the echo");
		const before = { layout: sortDiags(await diagnostics(F.layout)), renderer: sortDiags(await diagnostics(F.renderer)) };
		// Every file of the cache (a superset of what Zed would echo after the server's own writes).
		const changes = files.slice(0, 3000).map((f) => ({ uri: pathToFileURL(f.p).href, type: 2 }));
		const t = performance.now();
		if (changes.length) lsp.notify("workspace/didChangeWatchedFiles", { changes });
		const firstPull = await diagnostics(F.layout);
		const firstPullMs = Math.round(performance.now() - t);
		// Unchanged by the echo: the same diagnostics as just before it (the canary still in the buffer).
		const r = await waitDiags(F.layout, (ds) => ds.some(isCanary(line)) && ds.filter((d) => d.sev === 1).length === 1);
		const renderer = await waitDiags(F.renderer, (ds) => JSON.stringify(sortDiags(ds)) === JSON.stringify(before.renderer));
		const hover = hoverText(await lsp.request("textDocument/hover", at(F.layout, "const runtime = getAdminRuntime()", { delta: 7 })));
		return {
			ok: r.ok && renderer.ok && !!hover && hover.includes("AdminRuntime"),
			observed: { before, layout: sortDiags(r.diags), renderer: sortDiags(renderer.diags), hoverOk: !!hover && hover.includes("AdminRuntime") },
			timing: { events: changes.length, writtenThisSession: files.filter((f) => f.fresh).length, firstPullMs, firstPullHadCanary: firstPull.some(isCanary(line)), settledMs: r.ms },
		};
	});
	await step("9c.directory-event", "a directory-level watched-file event (full refresh) keeps buffers and answers", async () => {
		const line = instanceScriptEndLine(layoutText.split("\n"));
		if (!(await retypeCanary())) throw new Error("canary not reported before the event");
		lsp.notify("workspace/didChangeWatchedFiles", { changes: [{ uri: pathToFileURL(path.join(WORKSPACE, "admin/src/app")).href, type: 2 }] });
		await sleep(500);
		const r = await waitDiags(F.layout, (ds) => ds.some(isCanary(line)) && ds.filter((d) => d.sev === 1).length === 1);
		setText(F.layout, layoutText);
		const back = await waitDiags(F.layout, (ds) => errorsAndWarnings(ds).length === 0);
		return { ok: r.ok && back.ok, observed: { layout: sortDiags(r.diags), revertedClean: back.ok } };
	});

	// ---- 10. a component closed earlier (after unsaved edits) reopens with its disk content
	await step("10.reopen-closed-child", `reopen ${F.nav}: TypeScript answers with the disk content, no errors`, async () => {
		const r = await openVerified(F.nav);
		return { ok: r.canarySeen && r.canaryRangeOk && r.errors.length === 0, observed: r };
	});

	// ---- shut down and record side effects
	result.counters = { diagnosticRefresh: lsp.counters.diagnosticRefresh, serverRequests: lsp.counters.serverRequests, registrations: lsp.counters.registrations };
	result.serverExited = lsp.exited;
	try { await Promise.race([lsp.request("shutdown", null, 5000), sleep(5000)]); lsp.notify("exit", null); } catch {}
	await sleep(500);
	killTree(lsp.child.pid);
	await lsp.closeStderr();
	const statusAfter = gitStatus();
	result.workspaceSourceChanges = diffLines(statusBefore, statusAfter);
	result.cacheDirs = [".svelte-rs", ".rsvelte-language-server"].filter((d) => fs.existsSync(path.join(WORKSPACE, d)));
	result.passed = result.steps.filter((s) => s.ok).length;
	result.failed = result.steps.filter((s) => !s.ok).map((s) => s.id);
	fs.writeFileSync(outPath, JSON.stringify(result, null, 1));
	log(`${label}: ${result.passed}/${result.steps.length} passed; failed: ${result.failed.join(", ") || "none"}; results in ${outPath}`);
	return result.failed.length === 0 ? 0 : 1;
}

function diffLines(a, b) {
	const sa = new Set(a.split("\n").filter(Boolean)), sb = new Set(b.split("\n").filter(Boolean));
	return { added: [...sb].filter((l) => !sa.has(l)), removed: [...sa].filter((l) => !sb.has(l)) };
}

function killTree(root) {
	try {
		const out = execFileSync("ps", ["-axo", "pid=,ppid="], { encoding: "utf8" });
		const kids = new Map();
		for (const line of out.trim().split("\n")) {
			const [pid, ppid] = line.trim().split(/\s+/).map(Number);
			if (!kids.has(ppid)) kids.set(ppid, []);
			kids.get(ppid).push(pid);
		}
		const stack = [root], all = [];
		while (stack.length) { const p = stack.pop(); all.push(p); stack.push(...(kids.get(p) ?? [])); }
		for (const p of all) try { process.kill(p, "SIGKILL"); } catch {}
	} catch {}
}

// ---------------------------------------------------------------------------------------------
// Compare two result files step by step (ok flags and observed values, timings ignored).

function compare(aPath, bPath) {
	const a = JSON.parse(fs.readFileSync(aPath, "utf8")), b = JSON.parse(fs.readFileSync(bPath, "utf8"));
	const strip = (o) => JSON.stringify(o ?? null, (k, v) => (/^(ms|msToReport|canaryMs|totalMs)$/.test(k) ? undefined : v));
	const ids = [...new Set([...a.steps.map((s) => s.id), ...b.steps.map((s) => s.id)])];
	let differences = 0;
	console.log(`compare ${a.label} (${path.basename(aPath)}) vs ${b.label} (${path.basename(bPath)})`);
	console.log(`  init ${a.initMs} ms vs ${b.initMs} ms; passed ${a.passed}/${a.steps.length} vs ${b.passed}/${b.steps.length}`);
	for (const id of ids) {
		const sa = a.steps.find((s) => s.id === id), sb = b.steps.find((s) => s.id === id);
		const same = sa && sb && sa.ok === sb.ok && strip(sa.observed) === strip(sb.observed) && sa.error === sb.error;
		if (sa?.timing || sb?.timing) console.log(`         timing ${a.label} ${JSON.stringify(sa?.timing)} vs ${b.label} ${JSON.stringify(sb?.timing)}`);
		const tag = `${sa?.ok ? "PASS" : "FAIL"} -> ${sb?.ok ? "PASS" : "FAIL"}`;
		console.log(`${same ? "  same" : "* DIFF"} ${id.padEnd(28)} ${tag.padEnd(12)} ${sa?.ms ?? "-"} ms vs ${sb?.ms ?? "-"} ms`);
		if (!same) {
			differences++;
			console.log(`    ${a.label}: ${strip(sa?.error ?? sa?.observed).slice(0, 1500)}`);
			console.log(`    ${b.label}: ${strip(sb?.error ?? sb?.observed).slice(0, 1500)}`);
		}
	}
	console.log(`${differences} step(s) differ`);
	return 0;
}

async function main() {
	const [command = "both", ...rest] = process.argv.slice(2);
	if (command === "compare") {
		process.exit(compare(rest[0], rest[1]));
	} else if (command === "both") {
		let code = 0;
		for (const label of ["baseline", "patched"]) {
			const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "run", label], { stdio: "inherit" });
			code ||= r.status ?? 1;
		}
		compare(path.join(RESULTS, "e2e-baseline.json"), path.join(RESULTS, "e2e-patched.json"));
		process.exit(code);
	} else if (command === "run") {
		const label = rest[0];
		if (!SERVERS[label]) throw new Error(`unknown server ${label} (patched|baseline)`);
		const outIdx = rest.indexOf("--out");
		const out = outIdx >= 0 ? path.resolve(rest[outIdx + 1]) : path.join(RESULTS, `e2e-${label}.json`);
		if (!process.env.SVELTE_RS_E2E_LOCKED) {
			// Hold the machine-wide session lock for the whole run.
			const r = spawnSync(path.join(REPO, "bench/with-lock.sh"), [process.execPath, fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
				stdio: "inherit",
				env: { ...process.env, SVELTE_RS_E2E_LOCKED: "1" },
			});
			process.exit(r.status ?? 1);
		}
		const code = await run(label, out);
		process.exit(code);
	} else {
		throw new Error(`unknown command ${command}`);
	}
}

await main();
