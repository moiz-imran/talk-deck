"""Make a shareable copy of a deck with speaker notes, cues and sources removed from the code.

Usage: python3 share_build.py <deck-folder> <output-folder>
Hiding the Notes button is not enough: notes live in app.js, so anyone could read them with View Source.
"""
import json, shutil, sys, pathlib

PRIVATE = ('notes', 'cue', 'source')
src, dst = map(pathlib.Path, sys.argv[1:3])
if dst.exists() and any(dst.iterdir()):
    sys.exit(f'{dst} is not empty. Use a new folder so no private files ride along.')
dst.mkdir(parents=True, exist_ok=True)
for f in ('index.html', 'style.css'):
    shutil.copy(src / f, dst / f)

s = (src / 'app.js').read_text()
start = s.index('[', s.index('const deck'))
end = s.index('];\n', start) + 1
deck = json.loads(s[start:end])
for section in deck:
    for state in section['states']:
        for key in PRIVATE:
            state.pop(key, None)
data = json.dumps(deck, indent=2, ensure_ascii=False)
assert not any(f'"{k}"' in data for k in PRIVATE)
out = s[:start] + data + s[end:]
(dst / 'app.js').write_text(out)

html = (dst / 'index.html').read_text()
html = html.replace(' · N notes', '').replace(
    '</head>', '<style>#notes,#notes-toggle,#presenter-toggle{display:none!important}</style></head>', 1)
(dst / 'index.html').write_text(html)
print(f'{dst}: {len(s)} -> {len(out)} bytes of app.js')
