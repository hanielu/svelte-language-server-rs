//! `svelte-language-server-rs`: rsvelte's native Svelte language server (stdio), with tsrs as the
//! TypeScript 7 engine when one can be found.
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
        println!(
            "svelte-language-server-rs {} (rsvelte_language_server)",
            env!("CARGO_PKG_VERSION")
        );
        return ExitCode::SUCCESS;
    }
    if env::var_os("TSGO_BIN").is_none_or(|value| value.is_empty())
        && let Some(tsrs) = find_tsrs()
    {
        // SAFETY: still single-threaded; nothing else reads or writes the environment yet.
        unsafe { env::set_var("TSGO_BIN", &tsrs) };
        eprintln!(
            "svelte-language-server-rs: using tsrs at {}",
            tsrs.display()
        );
    }
    match rsvelte_language_server::run_stdio() {
        Ok(code) => code,
        Err(err) => {
            rsvelte_language_server::log::warn(format_args!("{err:#}"));
            ExitCode::FAILURE
        }
    }
}

/// Look for tsrs as [`search_tsrs`] describes, in this process's environment.
fn find_tsrs() -> Option<PathBuf> {
    let windows = cfg!(windows);
    // `HOME` is usually unset on Windows; `USERPROFILE` names the home folder there.
    let home = if windows {
        env::var_os("USERPROFILE").or_else(|| env::var_os("HOME"))
    } else {
        env::var_os("HOME")
    };
    let search = Search {
        windows,
        explicit: env::var_os("SVELTE_LANGUAGE_SERVER_RS_TSRS").filter(|value| !value.is_empty()),
        cwd: env::current_dir().ok(),
        path: env::var_os("PATH").map_or_else(Vec::new, |path| env::split_paths(&path).collect()),
        home: home.filter(|value| !value.is_empty()).map(PathBuf::from),
    };
    search_tsrs(&search, is_file)
}

/// What [`search_tsrs`] reads from the environment, so the search itself can be tested for
/// either platform anywhere.
struct Search {
    windows: bool,
    explicit: Option<std::ffi::OsString>,
    cwd: Option<PathBuf>,
    path: Vec<PathBuf>,
    home: Option<PathBuf>,
}

/// `SVELTE_LANGUAGE_SERVER_RS_TSRS`, then a tsrs installed in the working directory or any
/// ancestor (a project-pinned tsrs wins), then `tsrs` on `PATH`, then the default global install
/// locations (`~/.bun/bin`, `~/.cargo/bin`).
///
/// On Windows only a name Windows can run counts: `tsrs.exe`, then the `tsrs.cmd` launcher npm
/// writes, never the extensionless shell script npm puts beside them. In a project the platform
/// package's own `@tsrs/win32-x64/tsrs.exe` comes first: the npm launcher cannot replace itself
/// with the binary there, as it does elsewhere, and would stay running as a Node process.
fn search_tsrs(search: &Search, exists: impl Fn(&Path) -> bool) -> Option<PathBuf> {
    if let Some(explicit) = &search.explicit {
        return Some(PathBuf::from(explicit));
    }
    let names: &[&str] = if search.windows {
        &["tsrs.exe", "tsrs.cmd"]
    } else {
        &["tsrs"]
    };
    let in_project = |dir: &Path| {
        let package = search
            .windows
            .then(|| dir.join("node_modules/@tsrs/win32-x64/tsrs.exe"));
        package
            .into_iter()
            .chain(
                names
                    .iter()
                    .map(|name| dir.join("node_modules/.bin").join(name)),
            )
            .find(|candidate| exists(candidate))
    };
    if let Some(found) = search
        .cwd
        .iter()
        .flat_map(|cwd| cwd.ancestors())
        .find_map(in_project)
    {
        return Some(found);
    }
    let global = search
        .home
        .iter()
        .flat_map(|home| [home.join(".bun/bin"), home.join(".cargo/bin")]);
    search
        .path
        .iter()
        .cloned()
        .chain(global)
        .flat_map(|dir| names.iter().map(move |name| dir.join(name)))
        .find(|candidate| exists(candidate))
}

fn is_file(path: &Path) -> bool {
    path.metadata().is_ok_and(|m| m.is_file())
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;

    /// Search `files` (paths that exist) the way tsrs is looked for on `windows` or elsewhere.
    fn found(windows: bool, files: &[&str], path: &[&str], home: Option<&str>) -> Option<PathBuf> {
        let files: HashSet<PathBuf> = files.iter().map(PathBuf::from).collect();
        let search = Search {
            windows,
            explicit: None,
            cwd: Some(PathBuf::from("/work/app/src")),
            path: path.iter().map(PathBuf::from).collect(),
            home: home.map(PathBuf::from),
        };
        search_tsrs(&search, |candidate| files.contains(candidate))
    }

    /// npm puts an extensionless shell script, `tsrs.cmd` and `tsrs.ps1` in `.bin`; Windows can
    /// run only the `.cmd`, and the platform package's `tsrs.exe` needs no Node launcher at all.
    #[test]
    fn windows_runs_an_executable_name_only() {
        let bin = [
            "/work/node_modules/.bin/tsrs",
            "/work/node_modules/.bin/tsrs.cmd",
        ];
        assert_eq!(
            found(true, &bin, &[], None),
            Some(PathBuf::from("/work/node_modules/.bin/tsrs.cmd"))
        );
        let with_package = [
            bin[0],
            bin[1],
            "/work/node_modules/@tsrs/win32-x64/tsrs.exe",
        ];
        assert_eq!(
            found(true, &with_package, &[], None),
            Some(PathBuf::from("/work/node_modules/@tsrs/win32-x64/tsrs.exe"))
        );
        assert_eq!(
            found(true, &["/work/node_modules/.bin/tsrs"], &[], None),
            None
        );
    }

    /// On `PATH` and in the home folder (`USERPROFILE` on Windows), likewise only `.exe` or
    /// `.cmd`, the first directory first.
    #[test]
    fn windows_finds_a_global_executable() {
        let files = [
            "/bin-a/tsrs",
            "/bin-b/tsrs.exe",
            "/home/u/.bun/bin/tsrs.exe",
        ];
        assert_eq!(
            found(true, &files, &["/bin-a", "/bin-b"], Some("/home/u")),
            Some(PathBuf::from("/bin-b/tsrs.exe"))
        );
        assert_eq!(
            found(true, &files, &["/bin-a"], Some("/home/u")),
            Some(PathBuf::from("/home/u/.bun/bin/tsrs.exe"))
        );
    }

    /// Elsewhere the project's `.bin/tsrs` launcher, then `PATH`, then the home folder, and the
    /// environment variable before all of them.
    #[test]
    fn elsewhere_the_project_launcher_wins() {
        let files = ["/work/app/node_modules/.bin/tsrs", "/usr/local/bin/tsrs"];
        assert_eq!(
            found(false, &files, &["/usr/local/bin"], None),
            Some(PathBuf::from("/work/app/node_modules/.bin/tsrs"))
        );
        assert_eq!(
            found(false, &files[1..], &["/usr/local/bin"], None),
            Some(PathBuf::from("/usr/local/bin/tsrs"))
        );
        let explicit = Search {
            windows: false,
            explicit: Some("/opt/tsrs".into()),
            cwd: None,
            path: Vec::new(),
            home: None,
        };
        assert_eq!(
            search_tsrs(&explicit, |_| false),
            Some(PathBuf::from("/opt/tsrs"))
        );
    }
}
