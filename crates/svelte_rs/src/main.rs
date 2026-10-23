//! `svelte-rs`: rsvelte's native Svelte language server (stdio), with tsrs as the TypeScript 7
//! engine when one can be found.
//!
//! rsvelte talks to a TypeScript 7 language server child (`tsgo --lsp --stdio`) and honours the
//! `TSGO_BIN` environment variable. tsrs speaks the same protocol, so when `TSGO_BIN` is not set
//! this binary looks for tsrs and points `TSGO_BIN` at it before starting the server. Set
//! `TSGO_BIN` yourself to use tsgo (or a specific tsrs) instead.

use std::env;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

fn main() -> ExitCode {
    if env::args().any(|arg| arg == "--version" || arg == "-V") {
        println!("svelte-rs {} (rsvelte_language_server)", env!("CARGO_PKG_VERSION"));
        return ExitCode::SUCCESS;
    }
    if env::var_os("TSGO_BIN").is_none_or(|value| value.is_empty()) {
        if let Some(tsrs) = find_tsrs() {
            // SAFETY: still single-threaded; nothing else reads or writes the environment yet.
            unsafe { env::set_var("TSGO_BIN", &tsrs) };
            eprintln!("svelte-rs: using tsrs at {}", tsrs.display());
        }
    }
    match rsvelte_language_server::run_stdio() {
        Ok(code) => code,
        Err(err) => {
            rsvelte_language_server::log::warn(format_args!("{err:#}"));
            ExitCode::FAILURE
        }
    }
}

/// `SVELTE_RS_TSRS`, then `node_modules/.bin/tsrs` in the working directory or any ancestor (a
/// project-pinned tsrs wins), then `tsrs` on `PATH`, then the default global install locations.
fn find_tsrs() -> Option<PathBuf> {
    if let Some(explicit) = env::var_os("SVELTE_RS_TSRS").filter(|value| !value.is_empty()) {
        return Some(PathBuf::from(explicit));
    }
    if let Ok(cwd) = env::current_dir() {
        for dir in cwd.ancestors() {
            let candidate = dir.join("node_modules/.bin/tsrs");
            if is_file(&candidate) {
                return Some(candidate);
            }
        }
    }
    if let Some(path) = env::var_os("PATH") {
        for dir in env::split_paths(&path) {
            let candidate = dir.join("tsrs");
            if is_file(&candidate) {
                return Some(candidate);
            }
        }
    }
    let home = env::var_os("HOME").map(PathBuf::from)?;
    [".bun/bin/tsrs", ".cargo/bin/tsrs"].into_iter().map(|rel| home.join(rel)).find(|p| is_file(p))
}

fn is_file(path: &Path) -> bool {
    path.metadata().is_ok_and(|m| m.is_file())
}
