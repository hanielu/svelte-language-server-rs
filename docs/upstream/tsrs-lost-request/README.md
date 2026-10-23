# tsrs: a completion or signature help request is never answered and spins a core

Not filed. Found by `tests/review3/lsfuzz.mjs` (seeds 22 and 38) through svelte-language-server-rs; minimized here
to a one-file project that talks to tsrs directly.

## Repro

```sh
node docs/upstream/tsrs-lost-request/repro.mjs                 # ~/.bun/bin/tsrs
node docs/upstream/tsrs-lost-request/repro.mjs /path/to/tsgo   # same cases against typescript-go
node docs/upstream/tsrs-lost-request/loopprobe.mjs docs/upstream/tsrs-lost-request/cases.json
node docs/upstream/tsrs-lost-request/minimize.mjs docs/upstream/tsrs-lost-request/cases.json <index>
```

The script spawns `<server> --lsp --stdio` on a throwaway project with one file, opens it, sends one
request, waits 5 s, sends `$/cancelRequest`, then reads the server's CPU use (`ps %cpu`) and checks
that a later hover is still answered. Exit code 1 when a request goes unanswered.

| file | text | request | tsrs 0.18.0 (TS 7.1.0-dev.20260930.4) | tsgo 7.1.0-dev.20260930.4 |
|---|---|---|---|---|
| a.tsx | `<}{` | signatureHelp at 0:2 | never answered, ~100% CPU after cancel | never answered, ~310% CPU |
| b.tsx | `}i<{` | completion at 0:3 (between `<` and `{`) | never answered, 100% CPU | never answered, ~180% CPU |
| c.tsx | `}⏎foo<{` | completion at 1:4 | never answered, 99% CPU | never answered, ~170% CPU |
| d.ts | `{}i<{` | completion at 0:4 | never answered, 100% CPU | never answered, ~170% CPU |
| e.tsx | `<{` | signatureHelp at 0:1 | 13 ms | 22 ms |
| f.tsx | `i<{` | completion at 0:2 | 16 ms | 33 ms |
| g.ts | `f();i<{` | completion at 0:6 | 17 ms | 33 ms |

(`result-tsrs-0.18.0.json`, `result-tsgo-7.1.0-dev.20260930.4.json`.) Other requests keep being
answered, so the server looks healthy; each such request leaves one thread looping for the rest of
the session (tsgo's memory also grows while it loops: 134 → 140 MB in 1.5 s), and `$/cancelRequest`
neither stops it nor produces a response.

## What loops (measured, round 6)

The table's cases are minimized; the requests the fuzzers actually lost (`lsfuzz.mjs` seeds 22 and
38, `lsfuzz2.mjs` seed 12, texts in `cases.json`) have no `}i<{` at their position. 199 texts ×
2 requests probed with `loopprobe.mjs` (`node loopprobe.mjs cases.json`; 145 of the 398 requests loop)
fit one mechanism without exception:

* Both requests walk back from the position over the tokens a type argument list can hold
  (identifiers, literals, `.`, `,`, `|`, `?`, `:`, `=>`, `>`), to decide whether a `<` before them
  opens one: Strada's `getPossibleTypeArgumentsInfo`. Completion also walks again from the identifier
  before that `<` (`isPossiblyTypeArgumentPosition` recurses on `called`).
* The walk jumps from a `}`, `)` or `]` to the bracket that opens it (`findPrecedingMatchingToken`).
  Its fast path searches for that opener with `lastIndexOf(open, tokenFullStart)`; the port evidently
  searches the whole text instead: when the last `{` of the text comes after its last `}` (likewise
  `(`/`)`, `[`/`]`), every closer "matches" that last opener, after it. A walk that reaches a closer
  again from there never ends (`}c|{`, `}a<b>|{`, `]a|[`, `q<w;⏎}a|{}{`), and memory grows (deep
  recursion for completion). A `'}'` in a string or `// }` in a comment after the last `{` stops it
  (the raw-text search sees it), as does a `;` or a keyword between the opener and the closer.
* The walk starts only if the text has a `<` anywhere: the same whole-text search for the check that
  opens it (`}b|{` is answered, `}a|{⏎<` loops).
* Tokens are the parser's: a template's text stops the walk, the `}` that ends a substitution is more
  template text, and a substitution the parser gives up on (a `;` in it) ends the template, so the
  rest is script again (`lsfuzz2.mjs` seed 12: ``fr`${om 'sve…';`` at the top of the text). A regular
  expression is one token too, so a quote, `//` or `/*` in it opens no string or comment (review 6:
  `/'/` and `/\/*/` on the walk's line); an unterminated one ends at the first bracket it does not
  open, as the scanner's recovery reads it (`/'; }c|{` loops). 36 texts × 2 requests in round 7
  (`regex` cases in `cases.json`) add 66 loops: 470 requests, 211 loops.

So the bug needs an opener after the text's last closer of its kind. A projected Svelte shadow ends
with generated code that closes every brace and parenthesis after the author's text, so only its
brackets can meet it (`let q = [1]a[` at the end of a script); the script body a document svelte2tsx
rejects is answered from, and a plain TypeScript buffer, can meet all three. All three fuzzer cases were
rejected documents. For upstream: `findPrecedingMatchingToken`'s `lastIndexOf` calls need the
`tokenFullStart` bound (the `<` check in `getPossibleTypeArgumentsInfo` too).

## How svelte-language-server-rs copes

`crates/rsvelte_language_server/src/tsgo_loop.rs` models the walk on the text tsgo has
(`tests/data/tsrs-lost-requests.json` there holds every measured request: every loop is found, and no
answered request is counted as one except 5 signature helps next to a call's parentheses, which tsrs
answers for the call, and a `.tsx` type assertion that is an element there). The server
(`expire_tsgo_requests`, docs/patches.md, rounds 6 and 7):

* answers any request tsgo has not answered in 30 s (`RSVELTE_TSGO_REQUEST_TIMEOUT_MS`) without it
  and cancels it; a diagnostic pull never expires (a check can take that long:
  `../tsrs-cancelled-check/`);
* restarts tsgo only for an overdue request the model says tsrs loops on, never while a pull of its
  document is with tsgo (tsrs answers a request on a document being checked only after the check),
  with a backoff that doubles per restart for the same method and document and resets after eight
  quiet timeouts; any other overdue request is slow, not lost;
* sends tsgo one request it loops on per document at a time: each holds one of tsrs's few workers for
  good, and with three looping it answers nothing else; the editor's others there are answered at
  once without tsgo;
* (round 7, patch 68) keeps every overdue request tracked until tsgo answers it late or restarts, and
  restarts tsgo whatever the model says when an overdue completion or signature help is still
  unanswered after four timeouts, when tsgo has answered nothing for a timeout since a request it was
  sent, or when three requests are overdue at once (each project's checker pool runs three requests
  besides diagnostics: `tsrs_project` `checkerpool.rs`, 4 checkers); a pull of the request's
  document defers these, as above. A loop the model misses (`if (r) /'/; }c|{`: a regular expression
  after a statement's parenthesis, read as a division) costs one timeout when it holds tsrs back, four
  when it does not.

The background project loading stops waiting for an editor request after 2 s (patch 44).
