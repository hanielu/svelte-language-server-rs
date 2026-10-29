// Go to definition at one position, as an editor asks it, with what the TypeScript engine answered.
// Works on Windows and macOS; for a definition that works on one and not the other.
//
//   node tests/regressions/defprobe.mjs <server> <projectRoot> <file.svelte> <line:col> [--tsgo <engine>]
//
// <line:col> is 1-based, as Zed's status bar shows it. With --tsgo (the TypeScript 7 or tsrs executable
// the server runs; on Windows the `tsgo.exe` or `tsrs.exe`), the engine is started behind a pass-through
// that records its traffic, and the engine's own definition answer is printed next to the server's.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = process.argv.slice(2);
if (process.argv[2] === "--tee") {
	// The pass-through: start the engine, copy both directions, log each.
	const [, , , engine, log, ...rest] = process.argv;
	const child = spawn(engine, rest, { stdio: ["pipe", "pipe", "inherit"] });
	const inLog = fs.createWriteStream(`${log}.in`);
	const outLog = fs.createWriteStream(`${log}.out`);
	process.stdin.on("data", (chunk) => {
		inLog.write(chunk);
		child.stdin.write(chunk);
	});
	process.stdin.on("end", () => child.stdin.end());
	child.stdout.on("data", (chunk) => {
		outLog.write(chunk);
		process.stdout.write(chunk);
	});
	child.on("exit", (code) => process.exit(code ?? 0));
} else {
	const tsgoAt = args.indexOf("--tsgo");
	const engine = tsgoAt === -1 ? undefined : path.resolve(args.splice(tsgoAt, 2)[1]);
	const [server, rootArg, file, at] = args;
	if (!server || !rootArg || !file || !at) {
		console.error("usage: node defprobe.mjs <server> <projectRoot> <file.svelte> <line:col> [--tsgo <engine>]");
		process.exit(2);
	}
	const root = path.resolve(rootArg);
	const env = { ...process.env };
	const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "defprobe-"));
	const log = path.join(scratch, "engine");
	if (engine) {
		const self = fileURLToPath(import.meta.url);
		if (process.platform === "win32") {
			const wrapper = path.join(scratch, "engine.cmd");
			fs.writeFileSync(wrapper, `@"${process.execPath}" "${self}" --tee "${engine}" "${log}" %*\r\n`);
			env.TSGO_BIN = wrapper;
		} else {
			const wrapper = path.join(scratch, "engine.sh");
			fs.writeFileSync(wrapper, `#!/bin/sh\nexec "${process.execPath}" "${self}" --tee "${engine}" "${log}" "$@"\n`);
			fs.chmodSync(wrapper, 0o755);
			env.TSGO_BIN = wrapper;
		}
	}
	const c = spawn(path.resolve(server), ["--stdio"], { cwd: root, env });
	let stderr = "";
	c.stderr.on("data", (chunk) => (stderr += chunk));
	let buf = Buffer.alloc(0), id = 1;
	const pend = new Map();
	const send = (m) => {
		const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m }));
		c.stdin.write(`Content-Length: ${b.length}\r\n\r\n`);
		c.stdin.write(b);
	};
	const req = (method, params) => new Promise((r) => { const i = id++; pend.set(i, r); send({ id: i, method, params }); });
	c.stdout.on("data", (chunk) => {
		buf = Buffer.concat([buf, chunk]);
		for (;;) {
			const s = buf.indexOf("\r\n\r\n");
			if (s < 0) return;
			const n = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, s))[1]);
			if (buf.length < s + 4 + n) return;
			const m = JSON.parse(buf.subarray(s + 4, s + 4 + n));
			buf = buf.subarray(s + 4 + n);
			if (m.id !== undefined && !m.method) pend.get(m.id)?.(m.result ?? { error: m.error });
			else if (m.id !== undefined) send({ id: m.id, result: m.method === "workspace/configuration" ? m.params.items.map(() => null) : null });
		}
	});
	const rootUri = pathToFileURL(root).href;
	await req("initialize", {
		processId: process.pid,
		rootUri,
		workspaceFolders: [{ uri: rootUri, name: path.basename(root) }],
		capabilities: { textDocument: { definition: { linkSupport: true }, hover: { contentFormat: ["markdown"] } }, workspace: { configuration: true } },
	});
	send({ method: "initialized", params: {} });
	const uri = pathToFileURL(path.join(root, file)).href;
	const text = fs.readFileSync(path.join(root, file), "utf8");
	send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: "svelte", version: 1, text } } });
	await new Promise((r) => setTimeout(r, Number(process.env.SETTLE_MS ?? 15000)));
	const [line, col] = at.split(":").map(Number);
	const position = { line: line - 1, character: col - 1 };
	console.log(`line ${line}: ${JSON.stringify(text.split(/\r?\n/)[line - 1])}`);
	console.log("server definition:", JSON.stringify(await req("textDocument/definition", { textDocument: { uri }, position }), null, 1));
	console.log("server hover:", JSON.stringify(await req("textDocument/hover", { textDocument: { uri }, position })));
	await new Promise((r) => setTimeout(r, 500));
	if (engine) {
		const frames = (file) => {
			const data = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0);
			const out = [];
			for (let i = 0; ; ) {
				const s = data.indexOf("\r\n\r\n", i);
				if (s < 0) break;
				const n = Number(/Content-Length: (\d+)/i.exec(data.subarray(i, s))[1]);
				out.push(JSON.parse(data.subarray(s + 4, s + 4 + n)));
				i = s + 4 + n;
			}
			return out;
		};
		const asked = frames(`${log}.in`).filter((m) => m.method === "textDocument/definition");
		const answers = frames(`${log}.out`);
		for (const request of asked) {
			const answer = answers.find((m) => m.id === request.id && !m.method);
			console.log("engine asked:", JSON.stringify(request.params));
			console.log("engine answered:", JSON.stringify(answer?.result ?? answer?.error ?? null, null, 1));
		}
		if (asked.length === 0) console.log("the engine was never asked for a definition");
	}
	console.log("server log (stderr):\n" + stderr.split("\n").slice(-15).join("\n"));
	c.kill();
	process.exit(0);
}
