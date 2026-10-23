// Self-name import (package "exports") from a component in a nested workspace package.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
import path from "node:path";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, allowImportingTsExtensions: true, noEmit: true, types: [] }, include: ["src"] });
const root = makeProject(tpl, {
  "package.json": '{"name":"root","private":true,"workspaces":["packages/*"]}',
  "packages/ui/package.json": JSON.stringify({ name: "@x/ui", type: "module", exports: { "./utils": "./src/utils.ts", "./Button.svelte": "./src/Button.svelte" } }),
  "packages/ui/tsconfig.json": cfg,
  "packages/ui/src/utils.ts": "export const n: number = 1;\n",
  "packages/ui/src/Button.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n\n<button>{label}</button>\n`,
  "packages/ui/src/Comp.svelte": `<script lang="ts">\n\timport { n } from '@x/ui/utils';\n\timport Button from '@x/ui/Button.svelte';\n\tconst s: string = n;\n</script>\n\n<Button label={1} />\n`,
});
fs.mkdirSync(path.join(root, "node_modules/@x"), { recursive: true });
fs.symlinkSync("../../packages/ui", path.join(root, "node_modules/@x/ui"));
const s = await session(bin, root);
s.open("packages/ui/src/Comp.svelte");
const out = { comp: await s.settle("packages/ui/src/Comp.svelte", 10000) };
console.log(JSON.stringify(out));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
