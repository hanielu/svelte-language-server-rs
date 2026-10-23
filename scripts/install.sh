#!/bin/sh
# Build svelte-language-server-rs with the distribution profile (fat LTO) and install it as
# $PREFIX/bin/svelte-language-server-rs (default ~/.local/bin). The binary is replaced atomically, so an
# editor that is running the old one keeps working until it restarts the language server.
set -eu
cd "$(dirname "$0")/.."
prefix=${PREFIX:-$HOME/.local}
CARGO_TARGET_DIR=target cargo build --profile dist -p svelte_language_server_rs
mkdir -p "$prefix/bin"
tmp="$prefix/bin/.svelte-language-server-rs.$$"
cp target/dist/svelte-language-server-rs "$tmp"
chmod 755 "$tmp"
mv -f "$tmp" "$prefix/bin/svelte-language-server-rs"
echo "installed $prefix/bin/svelte-language-server-rs ($("$prefix/bin/svelte-language-server-rs" --version))"
