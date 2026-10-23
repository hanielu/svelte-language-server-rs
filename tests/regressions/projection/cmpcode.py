# cmpcode.py <before> <after>: compare the code / map / exact / facts sections of every dump
import os, sys
a, b = sys.argv[1], sys.argv[2]
def sections(path):
    text = open(path, encoding='utf8').read()
    out, cur = {}, None
    for line in text.split('\n'):
        if line.startswith('=== ') and line[4:] in ('code', 'map', 'exact', 'facts'):
            cur = line[4:]; out[cur] = []
            continue
        if cur: out[cur].append(line)
        else: out.setdefault('other', []).append(line)
    return {k: '\n'.join(v) for k, v in out.items()}
counts = {}
diff_files = {}
total = 0
for root, _, files in os.walk(a):
    for f in files:
        pa = os.path.join(root, f); pb = os.path.join(b, os.path.relpath(pa, a))
        total += 1
        if not os.path.exists(pb):
            counts['missing'] = counts.get('missing', 0) + 1; continue
        sa, sb = sections(pa), sections(pb)
        for k in set(sa) | set(sb):
            if sa.get(k) != sb.get(k):
                counts[k] = counts.get(k, 0) + 1
                diff_files.setdefault(k, []).append(os.path.relpath(pa, a))
print('files', total, 'differing sections', counts)
for k, v in diff_files.items():
    print(k, v[:8])
