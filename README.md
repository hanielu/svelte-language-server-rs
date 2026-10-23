# svelte-language-server-rs

A fast, light Svelte language server written in Rust. Nothing runs in Node unless your project
uses preprocessors.

svelte-language-server-rs is [rsvelte](https://github.com/baseballyama/rsvelte)'s native language server (a Rust
port of the Svelte 5 compiler and its tools) with [tsrs](https://github.com/oxc-project/tsrs) (the
Rust port of the TypeScript 7 compiler and language server) as its type checker, plus a series of
patches that make it fast and light on large monorepos and keep it correct while you type.

On a Svelte 5 monorepo with 476 components in 12 TypeScript projects, against the official
`svelte-language-server` 0.18.5:

| | svelte-language-server-rs | official |
|---|---|---|
| open a component → type errors shown | ~0.2 s | ~2.1 s |
| edit → diagnostics updated | 10–12 ms | 260–280 ms |
| completion while typing, p50 / p95 | ~7 / ~17 ms | ~130–230 / ~330–360 ms |
| memory | ~290 MB with all 12 projects loaded | ~570–600 MB with one |

Methods and every recorded run: [docs/architecture.md](docs/architecture.md),
[docs/testing.md](docs/testing.md). Status: experimental, used daily in Zed. Formerly named svelte-rs.

## How it works

```
editor ──LSP──▶ svelte-language-server-rs (Rust) ──LSP──▶ tsrs --lsp --stdio (Rust)
                Svelte parser + svelte2tsx in Rust        type checks each component as a
                HTML / CSS / Svelte features              generated .svelte.tsx "shadow", cached
                compiler diagnostics, formatting          under <project>/.svelte-language-server-rs/
```

Each component is turned into TypeScript in Rust and checked by tsrs alongside your `.ts` files,
so props, imports and types flow between components and modules. Projects (tsconfigs) load when
you open a file in them, then the rest in the background. What the patches change, and why, is in
[docs/patches.md](docs/patches.md).

## Install

Requirements: Rust 1.95+, and [tsrs](https://github.com/oxc-project/tsrs) (`bun add -g tsrs`,
`npm i -g tsrs`, or a `tsrs` devDependency in your project). tsrs ships binaries for macOS arm64
and Linux x64/arm64. Node.js is needed only for projects with preprocessors.

Windows: it compiles and the known Windows issues are fixed, but it has not been run there yet
(see [docs/testing.md](docs/testing.md#testing-on-windows)). tsrs 0.18.0 has no Windows binary;
without one the server runs the project's TypeScript 7 (`@typescript/native-preview` installed in
the project) through Node, or set `TSGO_BIN` to a `tsgo.exe`.

Prebuilt binaries for macOS, Linux and Windows are attached to each
[release](https://github.com/hanielu/svelte-language-server-rs/releases): put
`svelte-language-server-rs` (or `.exe`) on your `PATH`. They are not code-signed: on macOS run
`xattr -d com.apple.quarantine svelte-language-server-rs` once on a binary a browser downloaded, and
Windows SmartScreen may ask before the first run. To build it yourself:

```sh
git clone --recurse-submodules --shallow-submodules https://github.com/hanielu/svelte-language-server-rs
cd svelte-language-server-rs
sh scripts/install.sh            # builds the dist profile, installs ~/.local/bin/svelte-language-server-rs
```

`svelte-language-server-rs --stdio` speaks LSP on stdin/stdout, so any editor with an LSP client can run it.

### Zed

Keep Zed's Svelte extension (it provides the language and grammar) and point its server at
svelte-language-server-rs in `~/.config/zed/settings.json`:

```jsonc
"lsp": {
  "svelte-language-server": {
    "binary": { "path": "/Users/you/.local/bin/svelte-language-server-rs", "arguments": ["--stdio"] },
    "settings": { "rsvelte": { "lint": { "enable": true } } } // optional, see Configuration
  }
}
```

Quit and reopen Zed after changing the path; after reinstalling the same path, "editor: restart
language server" is enough. Remove the entry to go back to the official server.

### VS Code

VS Code needs a client extension: the official Svelte extension starts its server as a Node module,
so it cannot run this binary. rsvelte's own extension ("rsvelte Language Tools",
`vendor/rsvelte/apps/npm/vscode`) runs any binary with `--stdio`. Install it, disable the official
Svelte extension in the workspace (two servers would both answer), and set:

```jsonc
"rsvelte.languageServer.path": "/Users/you/.local/bin/svelte-language-server-rs"
```

Not yet tried in VS Code.

### Neovim

```lua
vim.lsp.config('svelte_language_server_rs', {
  cmd = { 'svelte-language-server-rs', '--stdio' },
  filetypes = { 'svelte' },
  root_markers = { 'svelte.config.js', 'vite.config.ts', 'package.json', '.git' },
})
vim.lsp.enable('svelte_language_server_rs')
```

## Configuration

**TypeScript engine.** svelte-language-server-rs runs tsrs unless `TSGO_BIN` names another TypeScript 7 language
server (tsgo works too). tsrs is looked up as `SVELTE_LANGUAGE_SERVER_RS_TSRS`, then `node_modules/.bin/tsrs` in the
working directory or a parent, then `tsrs` on `PATH`, then `~/.bun/bin` and `~/.cargo/bin`. On Windows only
`tsrs.exe` or `tsrs.cmd` count, a project's `node_modules/@tsrs/win32-x64/tsrs.exe` comes first, and the home
folder is `%USERPROFILE%`. With no tsrs, the project's own TypeScript 7 is run through Node.

**Svelte config and preprocessors.** In each directory above a component, a `vite.config.*` whose
SvelteKit or vite-plugin-svelte plugin is configured inline (and whose text mentions `preprocess`)
is used first, resolved with your project's own Vite as the official server does, then a
`svelte.config.*`. Preprocessors run in a Node sidecar; TypeScript config files work because Vite
or Node loads them. Project code is never executed when the editor marks the workspace untrusted
(`initializationOptions.isTrusted: false`) or `rsvelte.preprocess.enable` is false.
`compilerOptions` such as `experimental.async` and `runes` are read statically from the same files.

**Diagnostics.** Like the official server, svelte-language-server-rs reports TypeScript, Svelte compiler and CSS
diagnostics. rsvelte's eslint-plugin-svelte rules are off unless the project has an
`rsvelte-lint.json` (`{}` enables the recommended preset).

**Settings** (`rsvelte` section, e.g. Zed's `lsp.svelte-language-server.settings.rsvelte`), each
`{ "enable": bool }`: `format`, `lint`, `completion`, `hover`, `foldingRange`, `selectionRange`,
`documentSymbol`, `runesLegacyModeCodeLens`, `preprocess`, `backgroundProjects` (load every project
after the first one is served; on by default). The official extension's `svelte.plugin.*` tree is
accepted too.

**Cache.** svelte-language-server-rs writes the generated TypeScript for closed components, an overlay
`tsconfig.json` and the Svelte type shims under `<workspace>/.svelte-language-server-rs/`, which carries its own
`.gitignore`. Deleting it is always safe.

## Differences from the official server

- Type checking is TypeScript 7 (tsrs). Options TypeScript 7 removed are rejected; `baseUrl` is
  translated into `paths` for components, but your `.ts` files are checked by whatever TypeScript
  server your editor runs for them.
- Svelte analysis follows rsvelte's target (Svelte 5.57). A project on an older Svelte can see
  warnings its own compiler version would not emit yet (e.g. `state_referenced_locally` on props).
- `.svelte.ts`/`.svelte.js` modules and plain `.ts` files are served by your TypeScript server, not
  by svelte-language-server-rs, so `.ts` files do not see named exports of `.svelte` components.
- Windows is untested.

## Contributing

Read [AGENTS.md](AGENTS.md) (written for people and for coding agents alike): how the repository
is laid out, how to build and test, and how a change becomes a documented patch.
[docs/testing.md](docs/testing.md) lists the test layers and tools.

## Credits and license

MIT, see [LICENSE](LICENSE). Built on rsvelte (MIT) by Yuichiro Yamashita and contributors and
tsrs (Apache-2.0) by the Oxc project; svelte2tsx's type shims (MIT) come from
sveltejs/language-tools.
