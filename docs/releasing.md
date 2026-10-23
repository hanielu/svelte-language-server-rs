# Releasing

Releases are built by GitHub Actions (`.github/workflows/release.yml`), which only compiles and
packages. Every test runs on the maintainer's own machines first: macOS for the suites and
regressions, a Windows PC for the Windows build, and optionally Linux in a local container.

The repository is <https://github.com/hanielu/svelte-language-server-rs>. The rsvelte patches live
on the `svelte-language-server-rs` branch of the fork <https://github.com/hanielu/rsvelte>, which the
`vendor/rsvelte` submodule points at.

## 1. On the Mac: test, then push

```sh
cd vendor/rsvelte
CARGO_TARGET_DIR=../../target-tests cargo test -p rsvelte_language_server --lib --test protocol --test robustness
CARGO_TARGET_DIR=../../target-tests cargo test -p rsvelte_projection   # if the projection changed
cd ../..
CARGO_TARGET_DIR=target-tests cargo test -p svelte_language_server_rs
sh tests/regressions/runall.sh "$PWD/target/release/svelte-language-server-rs" <label>
sh scripts/check-windows.sh
```

Push the patch branch before the repository that points at it, or a checkout of the new submodule
commit fails:

```sh
git -C vendor/rsvelte push fork svelte-language-server-rs
git push origin main
```

(`fork` is `https://github.com/hanielu/rsvelte`; add it with
`git -C vendor/rsvelte remote add fork https://github.com/hanielu/rsvelte` in a fresh clone.)

Linux, optionally, in a container (OrbStack or Docker), from the repository root (not run yet):

```sh
docker run --rm -v "$PWD":/src -w /src/vendor/rsvelte -e CARGO_TARGET_DIR=/src/target-linux rust:1 \
  cargo test -p rsvelte_language_server --lib --test protocol --test robustness
```

## 2. On the Windows PC: pull and test

The first time:

```powershell
git clone --recurse-submodules https://github.com/hanielu/svelte-language-server-rs
```

After that, in the clone:

```powershell
git pull --recurse-submodules
```

Then build, test and try it in an editor as `docs/testing.md` ("Testing on Windows") describes.

## 3. Tag the release

When both machines pass, bump `version` under `[workspace.package]` in `Cargo.toml` (the tag must
name it, or the workflow stops), build once so `Cargo.lock` follows, commit, push, then tag:

```sh
cargo build -p svelte_language_server_rs
git commit -am "Release v0.1.1"
git push origin main
git tag v0.1.1
git push origin v0.1.1
```

The workflow builds macOS (arm64 and x64), Linux (x64 and arm64, glibc 2.35 or later) and Windows
(x64), and attaches the archives and `SHA256SUMS` to a **draft** release. Review it under Releases,
download one archive to check, then publish it. To try the build without a tag, run the workflow by
hand (Actions → Release → Run workflow): it uploads the archives as workflow artifacts and creates no
release.

The binaries do not include tsrs (or tsgo): users install it as the README says. tsrs 0.18.0 has no
Windows or Intel macOS binary, where the server runs the project's own TypeScript 7 instead.
