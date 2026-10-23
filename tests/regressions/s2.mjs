// S2: a new cross-project import added in an open document is never followed after save
// (apply_file_changes skips editor-open paths before following imports).
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
import path from "node:path";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const root = makeProject(tpl, {
  "package.json": '{"name":"s2","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/Plain.svelte": `<script lang="ts">\n\tconst n: number = 1;\n</script>\n\n<p>{n}</p>\n`,
  "b/tsconfig.json": cfg,
  "b/New.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n\n<p>{label}</p>\n`,
});
const s = await session(bin, root);
const out = {};
s.open("a/Plain.svelte");
out.initial = await s.settle("a/Plain.svelte");
const edited = `<script lang="ts">\n\timport New from '../b/New.svelte';\n\tconst n: number = 1;\n</script>\n\n<New label={n} />\n`;
s.change("a/Plain.svelte", edited);
out.unsaved = await s.settle("a/Plain.svelte");
s.write("a/Plain.svelte", edited); // save
s.watched([["a/Plain.svelte", 2]]);
out.afterSaveEvent = await s.settle("a/Plain.svelte", 6000);
s.close("a/Plain.svelte");
s.open("a/Plain.svelte");
out.afterReopen = await s.settle("a/Plain.svelte", 6000);
fs.mkdirSync(path.join(root, "a/newdir"));
s.watched([["a/newdir", 1]]); // a directory event forces the full refresh
out.afterFullRefresh = await s.settle("a/Plain.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
