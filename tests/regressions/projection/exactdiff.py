# exactdiff.py <before> <after> <sourceroot>: exact-mapping coverage lost or gained per source byte between two dump trees
import os, sys, collections
a, b = sys.argv[1], sys.argv[2]; Z = sys.argv[3]
def segs(p):
    t = open(p, encoding='utf8').read()
    if '=== exact\n' not in t: return set()
    return set(l for l in t[t.index('=== exact\n')+10:t.index('\n=== facts')].strip().split('\n') if l)
removed = added = 0; kinds = collections.Counter(); rem_ex = []
for root, _, fs in os.walk(a):
    for f in fs:
        pa = os.path.join(root, f); pb = os.path.join(b, os.path.relpath(pa, a))
        sa, sb = segs(pa), segs(pb)
        if sa == sb: continue
        src = open(os.path.join(Z, os.path.relpath(pa, a))[:-len('.dump')], 'rb').read()
        # compare as source-byte coverage, since a split may replace one segment by several
        def cov(s):
            m = {}
            for l in s:
                x, y = l.split(' -> '); ss, se = map(int, x.split('..')); gs, ge = map(int, y.split('..'))
                for o in range(ss, se): m[o] = gs + o - ss
            return m
        ca, cb = cov(sa), cov(sb)
        lost = [o for o in ca if cb.get(o) != ca[o]]
        if lost:
            removed += len(lost); rem_ex.append((os.path.relpath(pa, a), lost[:3]))
        new = sorted(o for o in cb if o not in ca)
        added += len(new)
        # group new runs
        run = []
        for o in new:
            if run and o == run[-1] + 1: run.append(o)
            else:
                if run: kinds[src[max(0,run[0]-2):run[0]].decode('utf8','replace')] += 1
                run = [o]
        if run: kinds[src[max(0,run[0]-2):run[0]].decode('utf8','replace')] += 1
print('source bytes no longer mapped the same:', removed, rem_ex[:5])
print('newly mapped source bytes:', added)
print('new runs by the two bytes before them:', kinds.most_common(15))
