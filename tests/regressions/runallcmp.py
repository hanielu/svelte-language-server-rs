# runallcmp.py <a.txt> <b.txt>: which runall.sh sections (the first line after each "== name @ label") are byte-identical in two records.
import sys, re
def load(p, limit=None):
    out = {}; name = None
    for line in open(p):
        line = line.rstrip('\n')
        m = re.match(r'^== (.*) @ (.*)$', line)
        if m: name = m.group(1); continue
        if line.startswith('## '): name = None; continue
        if name and name not in out: out[name] = line
    return out
a = load(sys.argv[1]); b = load(sys.argv[2])
for k in a:
    if k not in b: print('MISSING in B', k); continue
    print(('same ' if a[k] == b[k] else 'DIFF ') + k)
for k in b:
    if k not in a: print('NEW in B', k)
