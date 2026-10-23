// S8: a new import of a component that is open in the editor is never copied into the importer's project.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const root = makeProject(tpl, {
  "package.json": '{"name":"s8","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/Other.svelte": `<p>other</p>\n`,
  "a/Plain.svelte": `<script lang="ts">\n\tconst n: number = 1;\n</script>\n\n<p>{n}</p>\n`,
  "b/tsconfig.json": cfg,
  "b/New.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n\n<p>{label}</p>\n`,
});
const s = await session(bin, root);
const out = {};
s.open("a/Other.svelte"); // loads a
await s.settle("a/Other.svelte");
s.open("b/New.svelte"); // the target is open in the editor (unchanged)
await s.settle("b/New.svelte");
const edited = `<script lang="ts">\n\timport New from '../b/New.svelte';\n\tconst n: number = 1;\n</script>\n\n<New label={n} />\n`;
s.write("a/Plain.svelte", edited); // a closed file gains the import on disk (another tool, git, ...)
s.watched([["a/Plain.svelte", 2]]);
await s.sleep(500);
s.open("a/Plain.svelte");
out.importerWhileTargetOpen = await s.settle("a/Plain.svelte", 6000);
s.close("b/New.svelte");
out.afterTargetClosed = await s.settle("a/Plain.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
