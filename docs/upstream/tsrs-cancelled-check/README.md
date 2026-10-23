# tsrs: a cancelled diagnostic pull is checked to the end and thrown away

Not filed; possibly by design (typescript-go's checker may not poll cancellation inside a check).
Found while answering the fourth review (a component whose check takes 41 s), which made svelte-language-server-rs
stop cancelling and restarting tsgo for slow pulls (docs/patches.md, patch 50).

## Repro

```sh
node docs/upstream/tsrs-cancelled-check/repro.mjs                 # ~/.bun/bin/tsrs, 6 aliases
node docs/upstream/tsrs-cancelled-check/repro.mjs /path/to/tsgo 6 # same against typescript-go
```

`comp.ts` assigns every export of `heavy.ts` (3,000 constants typed through recursive tuple types) to
a `Record<string, number>`, so its check takes about 7 s. Two sessions: the pull left alone, and the
pull cancelled 1.5 s in. In each, a hover, a code action and an inlay hint request about `comp.ts`
and a pull of `other.ts` are sent 0.3 s after the pull; then `comp.ts` is pulled once more.

tsrs 0.18.0 (TypeScript 7.1.0-dev.20260930.4), `result-tsrs-0.18.0.json`:

| | pull of `comp.ts` | hover, code action, inlay hint | pull of `other.ts` | next pull of `comp.ts` |
|---|---|---|---|---|
| left alone | answered at 6.9 s | answered at once (≤ 1 ms) | answered at 6.9 s, with the slow one | 1 ms |
| cancelled at 1.6 s | RequestCancelled (-32800) at 6.9 s | answered at once | answered at 6.9 s | **6.8 s** (checked again) |

So a `$/cancelRequest` does not stop the check, the cancelled pull is answered only when the check is
done, and nothing of the check is kept: the next pull pays for it again, where after an uncancelled
pull it is instant. Pulls of other files wait for the slow one meanwhile.

## What svelte-language-server-rs does about it

A diagnostic pull is never cancelled, answered without tsgo or restarted for taking long (patch 50):
the editor gets tsgo's answer when the check is done. An editor that cancels its own stale pulls
still costs tsgo the check; svelte-language-server-rs forwards that cancellation as before.
