// Tiny LSP client for spikes: spawn a server over stdio and talk JSON-RPC.
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export function startServer(cmd, args, cwd, { settings = {}, log = false } = {}) {
	const child = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
	child.stderr.on("data", (d) => log && process.stderr.write(`[stderr] ${d}`));
	let buf = Buffer.alloc(0), nextId = 1;
	const pending = new Map(), handlers = [], pushed = new Map();
	const send = (msg) => {
		const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...msg }));
		child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
		child.stdin.write(body);
	};
	const lookup = (obj, section) => !section ? obj : section.split(".").reduce((o, k) => (o == null ? null : o[k] ?? null), obj);
	child.stdout.on("data", (chunk) => {
		buf = Buffer.concat([buf, chunk]);
		for (;;) {
			const sep = buf.indexOf("\r\n\r\n");
			if (sep < 0) return;
			const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]);
			if (buf.length < sep + 4 + len) return;
			const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString());
			buf = buf.subarray(sep + 4 + len);
			if (log) console.error("<-", JSON.stringify(msg).slice(0, 300));
			if (msg.id !== undefined && msg.method === undefined) {
				const p = pending.get(msg.id); pending.delete(msg.id);
				msg.error ? p?.reject(new Error(JSON.stringify(msg.error))) : p?.resolve(msg.result);
			} else if (msg.id !== undefined) {
				const result = msg.method === "workspace/configuration" ? msg.params.items.map((i) => lookup(settings, i.section)) : null;
				send({ id: msg.id, result });
			} else {
				if (msg.method === "textDocument/publishDiagnostics") pushed.set(msg.params.uri, msg.params.diagnostics);
				for (const h of handlers) h(msg);
			}
		}
	});
	const api = {
		child, pushed,
		request: (method, params) => new Promise((resolve, reject) => { const id = nextId++; pending.set(id, { resolve, reject }); send({ id, method, params }); }),
		notify: (method, params) => send({ method, params }),
		onNotification: (h) => handlers.push(h),
		async init(root, initializationOptions = settings) {
			const res = await api.request("initialize", {
				processId: process.pid, rootUri: pathToFileURL(root).href,
				workspaceFolders: [{ uri: pathToFileURL(root).href, name: "root" }],
				initializationOptions,
				capabilities: {
					workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } },
					textDocument: { publishDiagnostics: { relatedInformation: true }, diagnostic: { dynamicRegistration: true }, hover: { contentFormat: ["markdown", "plaintext"] }, completion: { completionItem: { snippetSupport: true } } },
				},
			});
			api.notify("initialized", {});
			api.notify("workspace/didChangeConfiguration", { settings });
			return res;
		},
		open(path, text, languageId = "typescript", version = 1) {
			api.notify("textDocument/didOpen", { textDocument: { uri: pathToFileURL(path).href, languageId, version, text } });
		},
		pull: (path) => api.request("textDocument/diagnostic", { textDocument: { uri: pathToFileURL(path).href } }),
		kill: () => child.kill("SIGKILL"),
	};
	return api;
}
export const uri = (p) => pathToFileURL(p).href;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
