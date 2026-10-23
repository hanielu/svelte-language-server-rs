# Testing and measuring svelte-language-server-rs

## The reference workspace

The patches in `docs/patches.md` were developed and measured against **zeno**, the private
development repository of [Ridu](https://github.com/riducms/ridu): a Svelte 5.57 / TypeScript 6
monorepo with 476 components in 12 TypeScript projects (an admin app, several packages, tests and
playgrounds). It is not public, so its paths in `docs/measurements/` and in `tests/e2e.mjs` serve
as a record; to reproduce a measurement on your own code, point the tools below at any Svelte
project of similar size.

Other projects checked while fixing real-use reports (patches 81–83): a SvelteKit app (remote
functions, `experimental.async`, `./$types`), a Svelte animation library monorepo (`svelte-ignore`
comments with prose), an Overwolf app (`baseUrl`-rooted imports in a nested app), and zeno's
rich-text package (a Vite-config preprocessor for `$`-prefixed imports).

## Test layers

| layer | where | what it proves |
|---|---|---|
| rsvelte's suites | `vendor/rsvelte/crates/*/src`, `tests/` | unit behaviour, LSP protocol (`tests/protocol.rs`), robustness against fake/stalled tsgo (`tests/robustness.rs`) |
| regression scripts | `tests/regressions/` | every bug a reviewer reproduced, against a real binary and real tsrs, on throwaway projects built from `tests/regressions/tpl` (a project with `svelte` installed) |
| review tools | `tests/review3/` | keystroke fuzzers (`lsfuzz.mjs`), large-component typing (`bigtype.mjs`), diagnostic-position sweeps |
| comparison | `tests/diagproj.mjs` | every diagnostic of a file under svelte-language-server-rs vs the official server |
| end to end | `tests/e2e.mjs` | 41 scenarios as Zed drives the server (diagnostics, cross-component props, hover, definition, references, completion, other projects, new files) |
| benchmarks | `bench/` | open → diagnostics, edit → diagnostics, typing/completion latency, memory |

### Commands

```sh
# rsvelte's own suites (its workspace has its own lockfile; keep the build outside the source tree)
cd vendor/rsvelte
CARGO_TARGET_DIR=../../target-tests cargo test -p rsvelte_language_server --lib --test protocol --test robustness
# 5 tests in tests/upstream_fixture_manifest.rs need the language-tools submodule and fail without it.

# Regression scripts against a build
cargo build --release -p svelte_language_server_rs
sh tests/regressions/runall.sh target/release/svelte-language-server-rs dev

# Diagnostics of real files, svelte-language-server-rs vs the official server (Zed's install)
node tests/diagproj.mjs svelte-language-server-rs <project> <file.svelte>...
node tests/diagproj.mjs svelte-ls <project> <file.svelte>...

# End to end (scenarios name the reference workspace's files; adapt them for another project)
E2E_WORKSPACE=<repository root> node tests/e2e.mjs run patched --out tests/results/e2e-dev.json

# Benchmarks
node bench/bench.mjs svelte-language-server-rs <project> <file.svelte>...
BENCH_PROJECT=<project> BENCH_FILES="a.svelte b.svelte" bench/final.sh 3
```

Sessions against a project that another language-server session also uses must go through
`bench/with-lock.sh`: both write the overlay cache under `<project>/.svelte-language-server-rs/`. When the project is
open in your editor with svelte-language-server-rs running, test on a copy instead (rsync it without
`node_modules`, then symlink each `node_modules` back).

## Testing on Windows

`sh scripts/check-windows.sh` (after `rustup target add x86_64-pc-windows-msvc`) proves the binary and
the server's tests compile for Windows from macOS or Linux; only a run on Windows tests behaviour.
On a Windows PC:

1. **Get the source**, in PowerShell:

   ```powershell
   git clone --recurse-submodules https://github.com/hanielu/svelte-language-server-rs
   cd svelte-language-server-rs
   ```

   (or `git pull --recurse-submodules` in an existing clone). Without network access, two
   `git archive` zips of the repository and of `vendor/rsvelte`, extracted into one folder, build
   just as well.

2. **Install the tools**: Rust through [rustup](https://rustup.rs) (the default MSVC toolchain; it
   offers the Visual Studio Build Tools, "Desktop development with C++", which linking and mimalloc's
   C build need), Git, and Node.js.

3. **Build and run the tests**:

   ```powershell
   cargo build --release -p svelte_language_server_rs   # target\release\svelte-language-server-rs.exe
   cargo test -p svelte_language_server_rs              # the wrapper's tsrs lookup
   cd vendor\rsvelte
   $env:CARGO_TARGET_DIR = "..\..\target-tests"
   cargo test -p rsvelte_language_server --lib --test protocol --test robustness --no-fail-fast
   ```

   The Windows-specific ones: `uri::tests` and
   `tsgo_overlay::tests::a_node_modules_link_is_placed_replaced_and_removed`, which makes real
   junctions. Tests written with Unix paths (`/w/…`) may fail for that reason alone, and the
   end-to-end robustness tests that need Unix (`#[cfg(unix)]`) do not run; keep the full list of
   failures and their messages.

4. **TypeScript**: tsrs 0.18.0 has no Windows binary. In the Svelte project to test with, run
   `npm i -D @typescript/native-preview`; the server runs it through Node when it finds no tsrs (or
   set `TSGO_BIN` to a `tsgo.exe`).

5. **Editor**: in Zed's `settings.json` (command palette: "zed: open settings"):

   ```jsonc
   "lsp": {
     "svelte-language-server": {
       "binary": {
         "path": "C:\\src\\svelte-language-server-rs\\target\\release\\svelte-language-server-rs.exe",
         "arguments": ["--stdio"]
       }
     }
   }
   ```

   or in VS Code rsvelte's extension with `rsvelte.languageServer.path` (README, VS Code).

6. **What to check**, best in a monorepo with a nested package: hover on a component prop; go to
   definition into another `.svelte` file (the URIs patch 93 fixes); diagnostics appearing and
   clearing while editing; `<Comp` completion with its auto-import; renaming a prop; an import of a
   package only the nested project installs resolving (patch 94's junctions:
   `Get-ChildItem -Recurse -Attributes ReparsePoint .svelte-language-server-rs` lists them). Read the
   language server's log (Zed: "debug: open language server logs") for errors, and for any path
   with `\\?\` or URI with `%3F` in it.

## Recorded measurements

`docs/measurements/bench/` holds every benchmark line (`final.jsonl`, tagged by build and variant),
the first baseline of the official server, svelte-check's run on the admin app, and the evidence
tools of the first patch round. `docs/measurements/tests/` holds every end-to-end run and
comparison, and the regression-script outputs per round. `docs/reviews/` keeps the findings of each
review round that the patches answer. Records made before 2026-10-23 name the project, its binary and
its cache folder svelte-rs (`.svelte-rs/`), its former name, as do the vendor branch names
`svelte-rs` and `svelte-rs-projection` in `docs/patches.md`'s history.

Notes on the numbers:

* Memory is ps RSS of the whole process tree unless a line says phys_footprint; macOS compresses
  idle pages, so RSS can read low (`bench/allprojects.mjs` reports both).
* Many runs happened while other builds were running; each line records the load average. Compare
  runs from the same session.
* The typing runs used `TYPED=runtime.config.exten`, `FINAL_MSG="Property 'exten' does not exist"`,
  `EXPECT=runtime,config,extensions` on the admin app's layout component; `bench/typing.mjs`'s
  defaults (`document.body.child`) work in any component.
