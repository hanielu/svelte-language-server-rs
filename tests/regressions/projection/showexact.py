# showexact.py <file.svelte> <dumpfile> [filter-substring]: print exact segments that fall in the template (after </script>) or match filter
import sys
src = open(sys.argv[1], 'rb').read()
text = open(sys.argv[2], 'rb').read().decode('utf8')
code = text[text.index('=== code\n')+9:text.index('\n=== map\n')].encode('utf8')
exact = text[text.index('=== exact\n') + 10:text.index('\n=== facts')].strip().split('\n')
flt = sys.argv[3] if len(sys.argv) > 3 else None
def lc(b, o):
    pre = b[:o]; line = pre.count(b'\n'); col = o - (pre.rfind(b'\n') + 1); return f"{line}:{col}"
for line in exact:
    if not line: continue
    s, g = line.split(' -> ')
    ss, se = map(int, s.split('..')); gs, ge = map(int, g.split('..'))
    t = src[ss:se].decode('utf8', 'replace')
    if flt and flt not in t: continue
    print(f"{lc(src, ss)} {t!r} -> gen {lc(code, gs)}")
