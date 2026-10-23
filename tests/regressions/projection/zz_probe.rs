//! Local probe (not committed): project every `.svelte` file under
//! `PROBE_ROOT` with the language server's options and write one dump per file
//! into `PROBE_OUT`, or project `PROBE_FILE` and print it.

use std::fmt::Write as _;
use std::path::{Path, PathBuf};

use rsvelte_projection::svelte2tsx::{
    RewriteExternalImportsOptions, Svelte2TsxMode, Svelte2TsxOptions, SvelteVersion,
};
use rsvelte_projection::{ProjectionEngine, is_typescript_component};

fn options(path: &Path, root: &Path, source: &str) -> Svelte2TsxOptions {
    Svelte2TsxOptions {
        filename: path.display().to_string(),
        is_ts_file: is_typescript_component(source),
        mode: Svelte2TsxMode::Ts,
        version: SvelteVersion::V5,
        runes: None,
        emit_jsdoc: true,
        emit_on_template_error: true,
        rewrite_external_imports: Some(RewriteExternalImportsOptions {
            source_path: path.display().to_string(),
            generated_path: root
                .join(".svelte-rs/shadow")
                .join(path.strip_prefix(root).unwrap_or(path))
                .with_extension("svelte.tsx")
                .display()
                .to_string(),
            workspace_path: root.display().to_string(),
        }),
        ..Svelte2TsxOptions::default()
    }
}

fn dump(path: &Path, root: &Path, source: &str) -> String {
    let result = std::panic::catch_unwind(|| {
        ProjectionEngine::new().project(source, options(path, root, source))
    });
    let mut out = String::new();
    match result {
        Err(_) => out.push_str("PANIC\n"),
        Ok(Err(error)) => {
            let _ = writeln!(out, "ERROR {error}");
        }
        Ok(Ok(artifact)) => {
            let _ = writeln!(out, "=== code\n{}", artifact.code);
            let _ = writeln!(out, "=== map\n{}", artifact.source_map.unwrap_or_default());
            let _ = writeln!(out, "=== exact");
            for segment in artifact
                .exact_mappings
                .as_ref()
                .map(|map| map.segments())
                .unwrap_or_default()
            {
                let _ = writeln!(
                    out,
                    "{}..{} -> {}..{}",
                    segment.source.start(),
                    segment.source.end(),
                    segment.generated.start(),
                    segment.generated.end()
                );
            }
            let _ = writeln!(out, "=== facts\n{:?}", artifact.facts);
        }
    }
    out
}

fn walk(dir: &Path, files: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let Ok(kind) = entry.file_type() else {
            continue;
        };
        let path = entry.path();
        if kind.is_dir() {
            walk(&path, files);
        } else if kind.is_file() && path.extension().is_some_and(|ext| ext == "svelte") {
            files.push(path);
        }
    }
}

#[test]
#[ignore = "local probe"]
fn probe() {
    if let Ok(dir) = std::env::var("PROBE_TIME") {
        let mut files: Vec<PathBuf> = std::fs::read_dir(&dir)
            .unwrap()
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|e| e == "svelte"))
            .collect();
        files.sort();
        for path in files {
            let source = std::fs::read_to_string(&path).unwrap();
            let started = std::time::Instant::now();
            let mut hoisted = 0;
            for _ in 0..5 {
                if let Ok(code) = project_code(&path, &source) {
                    hoisted = hoisted_imports(&code);
                }
            }
            println!(
                "{} {:?} per projection, hoisted {}",
                path.display(),
                started.elapsed() / 5,
                hoisted
            );
        }
        return;
    }
    if let Ok(root) = std::env::var("PROBE_TFUZZ") {
        template_fuzz(&PathBuf::from(root));
        return;
    }
    if let Ok(root) = std::env::var("PROBE_FUZZ") {
        fuzz(&PathBuf::from(root));
        return;
    }
    if let Ok(dir) = std::env::var("PROBE_DIR") {
        let mut files: Vec<PathBuf> = std::fs::read_dir(&dir)
            .unwrap()
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|e| e == "svelte"))
            .collect();
        files.sort();
        let diag = std::env::var("PROBE_DIAG").is_ok();
        for path in files {
            let source = std::fs::read_to_string(&path).unwrap();
            let root = path.parent().unwrap().to_path_buf();
            let mut opts = options(&path, &root, &source);
            opts.rewrite_external_imports = None;
            let out = match ProjectionEngine::new().project(&source, opts) {
                Ok(a) => a.code,
                Err(e) => format!("ERROR {e}"),
            };
            println!("=== {}\n{}", path.display(), out);
            if diag {
                let re = regex::Regex::new(r"(?s)<script[^>]*>(.*?)</script>").unwrap();
                for cap in re.captures_iter(&source) {
                    let body = cap.get(1).unwrap().as_str();
                    let alloc = oxc_allocator::Allocator::default();
                    let ret =
                        oxc_parser::Parser::new(&alloc, body, oxc_span::SourceType::ts()).parse();
                    for d in ret.diagnostics.iter() {
                        let labels: Vec<String> = d
                            .labels
                            .iter()
                            .map(|l| format!("{}+{} {:?}", l.offset(), l.len(), l.label()))
                            .collect();
                        println!("DIAG fatal={} {} {:?}", ret.fatal_error, d.message, labels);
                    }
                }
            }
        }
        return;
    }
    if let Ok(file) = std::env::var("PROBE_FILE") {
        let path = PathBuf::from(file);
        let source = std::fs::read_to_string(&path).unwrap();
        let root = path.parent().unwrap().to_path_buf();
        println!("{}", dump(&path, &root, &source));
        return;
    }
    let root = PathBuf::from(std::env::var("PROBE_ROOT").expect("PROBE_ROOT"));
    let out = PathBuf::from(std::env::var("PROBE_OUT").expect("PROBE_OUT"));
    let mut files = Vec::new();
    walk(&root, &mut files);
    files.sort();
    let mut count = 0;
    for path in &files {
        let Ok(source) = std::fs::read_to_string(path) else {
            continue;
        };
        let relative = path.strip_prefix(&root).unwrap();
        let target = out.join(relative).with_extension("svelte.dump");
        std::fs::create_dir_all(target.parent().unwrap()).unwrap();
        std::fs::write(&target, dump(path, &root, &source)).unwrap();
        count += 1;
    }
    println!("projected {count} files");
}

fn hoisted_imports(code: &str) -> usize {
    let head = code.split("function $$render").next().unwrap_or("");
    head.lines()
        .filter(|line| line.trim_start().starts_with("import "))
        .count()
}

fn project_code(path: &Path, source: &str) -> Result<String, String> {
    let root = path.parent().unwrap();
    let mut opts = options(path, root, source);
    opts.rewrite_external_imports = None;
    ProjectionEngine::new()
        .project(source, opts)
        .map(|a| a.code)
        .map_err(|e| e.to_string())
}

fn fuzz(root: &Path) {
    let mut files = Vec::new();
    walk(root, &mut files);
    files.retain(|p| !p.components().any(|c| c.as_os_str() == "node_modules"));
    let only_file = std::env::var("PROBE_FUZZ_FILE").ok();
    let only_line: Option<usize> = std::env::var("PROBE_FUZZ_LINE")
        .ok()
        .and_then(|v| v.parse().ok());
    if let Some(f) = &only_file {
        files.retain(|p| p.display().to_string().ends_with(f.as_str()));
    }
    files.sort();
    let re = regex::Regex::new(r"(?s)<script(\s[^>]*)?>(.*?)</script>").unwrap();
    let (mut cases, mut lost, mut slowest, mut slow_name) = (0usize, 0usize, 0u128, String::new());
    let mut total = std::time::Duration::ZERO;
    let mut lost_examples = Vec::new();
    let mut lost_kinds: std::collections::BTreeMap<usize, usize> = Default::default();
    for path in &files {
        let Ok(source) = std::fs::read_to_string(path) else {
            continue;
        };
        let Some(cap) = re
            .captures_iter(&source)
            .find(|c| !c.get(0).unwrap().as_str().contains("module"))
        else {
            continue;
        };
        let body = cap.get(2).unwrap();
        let Ok(original) = project_code(path, &source) else {
            continue;
        };
        let base_imports = hoisted_imports(&original);
        // line starts inside the script body
        let lines: Vec<usize> = std::iter::once(body.start())
            .chain(
                source[body.start()..body.end()]
                    .match_indices('\n')
                    .map(|(i, _)| body.start() + i + 1),
            )
            .filter(|&i| i < body.end())
            .collect();
        for (n, &line) in lines.iter().enumerate() {
            if only_line.is_some_and(|l| l != n) {
                continue;
            }
            let line_end = source[line..body.end()]
                .find('\n')
                .map_or(body.end(), |i| line + i);
            let text = &source[line..line_end];
            if text.trim().is_empty() {
                continue;
            }
            // imports above this line must survive
            let imports_before = source[body.start()..line]
                .lines()
                .filter(|l| {
                    l.trim_start().starts_with("import ")
                        && (l.contains(" from ")
                            || l.trim_start().starts_with("import '")
                            || l.trim_start().starts_with("import \""))
                })
                .count();
            let mut mutations: Vec<String> = Vec::new();
            // cut the line in the middle (statement in progress)
            let mut mid = line + text.len() / 2;
            while !source.is_char_boundary(mid) {
                mid += 1;
            }
            mutations.push(format!("{}{}", &source[..mid], &source[line_end..]));
            // a dangling member access appended to the line's first word
            let word_end = text
                .find(|c: char| {
                    !(c.is_alphanumeric() || c == '_' || c == '$') && !c.is_whitespace()
                })
                .unwrap_or(text.len());
            let mut w = line + word_end;
            while !source.is_char_boundary(w) {
                w += 1;
            }
            mutations.push(format!("{}.{}", &source[..w], &source[w..]));
            // a new statement in progress inserted before the line
            for snippet in [
                "runtime.\n",
                "foo(\n",
                "let x =\n",
                "import {\n",
                "import { a } from './\n",
                "if (\n",
                "const o = {\n",
                "`${a.\n",
            ] {
                mutations.push(format!(
                    "{}\t{}{}",
                    &source[..line],
                    snippet,
                    &source[line..]
                ));
            }
            // drop the line's last character (often a closing bracket or semicolon)
            let mut last = line_end.saturating_sub(1).max(line);
            while !source.is_char_boundary(last) {
                last -= 1;
            }
            mutations.push(format!("{}{}", &source[..last], &source[line_end..]));
            for (kind, mutated) in mutations.into_iter().enumerate() {
                cases += 1;
                let started = std::time::Instant::now();
                let result = std::panic::catch_unwind(|| project_code(path, &mutated));
                let took = started.elapsed();
                total += took;
                if took.as_micros() > slowest {
                    slowest = took.as_micros();
                    slow_name = format!("{}:{}", path.display(), n);
                }
                match result {
                    Err(_) => println!("PANIC {} line {}", path.display(), n),
                    Ok(Err(e)) => {
                        let _ = e;
                    }
                    Ok(Ok(code)) => {
                        let hoisted = hoisted_imports(&code);
                        let is_lost =
                            base_imports > 0 && hoisted < imports_before.min(base_imports);
                        if (only_line.is_some() && is_lost) || took.as_millis() > 20 {
                            println!(
                                "--- mutation hoisted {hoisted} before {imports_before} took {took:?}\n{}",
                                mutated.split("</script>").next().unwrap_or("")
                            );
                        }
                        if base_imports > 0 && hoisted < imports_before.min(base_imports) {
                            lost += 1;
                            let count = lost_kinds.entry(kind).or_insert(0usize);
                            *count += 1;
                            if *count <= 3 {
                                let at = source[..line].lines().count();
                                let context: Vec<&str> =
                                    mutated.lines().skip(at.saturating_sub(4)).take(8).collect();
                                println!(
                                    "=== LOST kind {kind} {}:{}\n{}",
                                    path.display(),
                                    n,
                                    context.join("\n")
                                );
                            }
                            if lost_examples.len() < 15 {
                                lost_examples.push(format!(
                                    "{}:{} kind {} hoisted {} < {} before",
                                    path.display(),
                                    n,
                                    kind,
                                    hoisted,
                                    imports_before
                                ));
                            }
                        }
                    }
                }
            }
        }
    }
    println!(
        "cases {cases} lost-imports {lost} total {:?} slowest {}us at {}",
        total, slowest, slow_name
    );
    println!(
        "lost by kind {lost_kinds:?} (0 cut, 1 dot, 2.. snippets runtime./foo(/let x =/import {{/import from/if (/const o = {{/`${{a., last drop)"
    );
    for e in lost_examples {
        println!("LOST {e}");
    }
}

fn brace_balance(code: &str) -> i64 {
    // generated code only: skip strings, template literals and comments roughly
    let b = code.as_bytes();
    let (mut i, mut depth) = (0usize, 0i64);
    while i < b.len() {
        match b[i] {
            b'"' | b'\'' => {
                let q = b[i];
                i += 1;
                while i < b.len() && b[i] != q && b[i] != b'\n' {
                    if b[i] == b'\\' {
                        i += 1;
                    }
                    i += 1;
                }
            }
            b'/' if b.get(i + 1) == Some(&b'*') => {
                i += 2;
                while i + 1 < b.len() && !(b[i] == b'*' && b[i + 1] == b'/') {
                    i += 1;
                }
                i += 1;
            }
            b'/' if b.get(i + 1) == Some(&b'/') => {
                while i < b.len() && b[i] != b'\n' {
                    i += 1;
                }
            }
            b'{' => depth += 1,
            b'}' => depth -= 1,
            _ => {}
        }
        i += 1;
    }
    depth
}

fn template_fuzz(root: &Path) {
    let mut files = Vec::new();
    walk(root, &mut files);
    files.retain(|p| !p.components().any(|c| c.as_os_str() == "node_modules"));
    files.sort();
    let close_block = regex::Regex::new(r"\{/(if|each|key|snippet|await)\s*\}").unwrap();
    let close_comp = regex::Regex::new(r"</[A-Z][A-Za-z0-9_.]*\s*>").unwrap();
    let (mut cases, mut unbalanced, mut errors) = (0usize, 0usize, 0usize);
    let mut error_kinds: std::collections::BTreeMap<String, usize> = Default::default();
    let mut examples = Vec::new();
    for path in &files {
        let Ok(source) = std::fs::read_to_string(path) else {
            continue;
        };
        let Ok(original) = project_code(path, &source) else {
            continue;
        };
        let base = brace_balance(&original);
        let ranges: Vec<std::ops::Range<usize>> = close_block
            .find_iter(&source)
            .chain(close_comp.find_iter(&source))
            .map(|m| m.range())
            .collect();
        for range in ranges {
            cases += 1;
            let mutated = format!("{}{}", &source[..range.start], &source[range.end..]);
            match std::panic::catch_unwind(|| project_code(path, &mutated)) {
                Err(_) => println!("PANIC {} at {}", path.display(), range.start),
                Ok(Err(e)) => {
                    errors += 1;
                    let key = e.chars().take(60).collect::<String>();
                    *error_kinds.entry(key).or_insert(0usize) += 1;
                }
                Ok(Ok(code)) => {
                    if brace_balance(&code) != base {
                        unbalanced += 1;
                        if examples.len() < 12 {
                            examples.push(format!(
                                "{} removed {:?} balance {} vs {}",
                                path.display(),
                                &source[range.clone()],
                                brace_balance(&code),
                                base
                            ));
                        }
                    }
                }
            }
        }
    }
    println!("template cases {cases} unbalanced {unbalanced} errors {errors}");
    for (k, v) in &error_kinds {
        println!("ERRKIND {v} {k}");
    }
    for e in examples {
        println!("UNBALANCED {e}");
    }
}
