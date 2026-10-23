#!/bin/sh
# Type-check the binary and the language server's tests for x86_64-pc-windows-msvc from macOS or
# Linux, without a Windows SDK: `cargo check` never links, so mimalloc's C build (the one C
# dependency) gets a stand-in compiler and archiver that write empty files, and every line of Rust
# is still compiled for Windows. This catches Unix-only code; only a run on Windows tests behaviour
# (docs/testing.md, "Testing on Windows").
# Needs: rustup target add x86_64-pc-windows-msvc
set -eu
cd "$(dirname "$0")/.."
repo=$PWD
tools=$(mktemp -d)
trap 'rm -rf "$tools"' EXIT
cat > "$tools/cc" <<'EOF'
#!/bin/sh
out=""
while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; -o*) out="${1#-o}"; shift;; /Fo*) out="${1#/Fo}"; shift;; *) shift;; esac; done
[ -n "$out" ] && : > "$out"
exit 0
EOF
cat > "$tools/ar" <<'EOF'
#!/bin/sh
for arg in "$@"; do case "$arg" in /OUT:*|-out:*|-OUT:*) : > "${arg#*:}";; esac; done
exit 0
EOF
chmod +x "$tools/cc" "$tools/ar"
export CC_x86_64_pc_windows_msvc="$tools/cc" CXX_x86_64_pc_windows_msvc="$tools/cc" AR_x86_64_pc_windows_msvc="$tools/ar"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$repo/target-windows}"
cargo check --target x86_64-pc-windows-msvc -p svelte_language_server_rs --all-targets
cd vendor/rsvelte
cargo check --target x86_64-pc-windows-msvc -p rsvelte_language_server --all-targets
echo "windows check: ok"
