#!/bin/sh
# Build svelte-rs with the distribution profile (fat LTO) and install it as $PREFIX/bin/svelte-rs
# (default ~/.local/bin). The binary is replaced atomically, so an editor that is running the old one
# keeps working until it restarts the language server.
set -eu
cd "$(dirname "$0")/.."
prefix=${PREFIX:-$HOME/.local}
CARGO_TARGET_DIR=target cargo build --profile dist -p svelte_rs
mkdir -p "$prefix/bin"
tmp="$prefix/bin/.svelte-rs.$$"
cp target/dist/svelte-rs "$tmp"
chmod 755 "$tmp"
mv -f "$tmp" "$prefix/bin/svelte-rs"
echo "installed $prefix/bin/svelte-rs ($("$prefix/bin/svelte-rs" --version))"
