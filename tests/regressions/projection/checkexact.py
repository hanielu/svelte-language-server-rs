# checkexact.py <dumpdir> <sourceroot>: every exact segment must copy source bytes verbatim into the code
import os, sys
d = sys.argv[1]; Z = sys.argv[2]
bad = 0; segs = 0; files = 0; copies = 0
for root, _, fs in os.walk(d):
    for f in fs:
        p = os.path.join(root, f)
        src = open(os.path.join(Z, os.path.relpath(p, d))[:-len('.dump')], 'rb').read()
        text = open(p, 'rb').read().decode('utf8')
        if not text.startswith('=== code\n'): continue
        code = text[len('=== code\n'):text.index('\n=== map\n')].encode('utf8')
        exact = text[text.index('=== exact\n') + 10:text.index('\n=== facts')].strip().split('\n')
        files += 1
        seen = {}
        for line in exact:
            if not line: continue
            s, g = line.split(' -> ')
            ss, se = map(int, s.split('..')); gs, ge = map(int, g.split('..'))
            segs += 1
            if src[ss:se] != code[gs:ge]:
                bad += 1
                if bad < 5: print('BAD', p, line)
            for o in range(ss, se):
                seen[o] = seen.get(o, 0) + 1
        copies += sum(1 for v in seen.values() if v > 1) > 0
print('files', files, 'segments', segs, 'bad', bad, 'files with a doubly-mapped source byte', copies)
