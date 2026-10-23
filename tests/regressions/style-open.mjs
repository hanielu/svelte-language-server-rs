// A <style> block whose closing tag is not typed yet: native CSS diagnostics slice past the end.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const text = `<script lang="ts">\n\tconst n: string = 1;\n</script>\n\n<p>{n}</p>\n<style>\n\tp { colr: red; }\n`;
const root = makeProject(tpl, { "package.json": '{"name":"st","private":true,"type":"module"}', "tsconfig.json": cfg, "Doc.svelte": text });
const s = await session(bin, root);
s.open("Doc.svelte", text);
const out = { unclosedStyle: await s.settle("Doc.svelte", 6000) };
s.change("Doc.svelte", text + "</style>\n");
out.closedStyle = await s.settle("Doc.svelte", 6000);
out.panics = s.log.join("").split("\n").filter((l) => /panicked/.test(l)).length;
console.log(JSON.stringify(out));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
