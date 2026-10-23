// Two packages that both map "#lib/*" to their own src/lib: a component of one, held as a copy by the
// other's project, imports its own #lib module. Does the copy resolve #lib in its own package?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, via = "relative"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src"] });
const imports = { "#lib": "./src/lib/index.js", "#lib/*": "./src/lib/*" };
const root = makeProject(tpl, {
  "package.json": '{"name":"root","private":true,"workspaces":["packages/*"]}',
  "packages/ui/package.json": JSON.stringify({ name: "@x/ui", type: "module", imports }),
  "packages/ui/tsconfig.json": cfg,
  "packages/ui/src/lib/index.ts": "export type Kind = 'primary' | 'ghost';\n",
  "packages/ui/src/lib/util.ts": "export type Size = 'sm' | 'lg';\n",
  "packages/ui/src/lib/Button.svelte": `<script lang="ts">\n\timport type { Kind } from '#lib';\n\timport type { Size } from '#lib/util.js';\n\tlet { kind, size }: { kind: Kind; size: Size } = $props();\n</script>\n<button class={kind + size}>x</button>\n`,
  "packages/rt/package.json": JSON.stringify({ name: "@x/rt", type: "module", imports }),
  "packages/rt/tsconfig.json": cfg,
  "packages/rt/src/lib/index.ts": "export type Kind = number;\n",
  "packages/rt/src/lib/util.ts": "export type Size = boolean;\n",
  "packages/rt/src/lib/Editor.svelte": `<script lang="ts">\n\timport Button from '../../../ui/src/lib/Button.svelte';\n</script>\n<Button kind="primary" size="sm" />\n<Button kind="nope" size="xl" />\n`,
});
const s = await session(bin, root);
s.open("packages/rt/src/lib/Editor.svelte");
const out = { editor: await s.settle("packages/rt/src/lib/Editor.svelte", 10000) };
// Expected as svelte-check sees it: line 3 is fine; line 4 has two errors ("nope" not a Kind, "xl" not a Size).
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
