"""Add a content hash to every CSS, JS and image link in the HTML pages (site.css?v=1a2b3c4d),
so browsers pick up a changed file right away instead of using a cached copy.
Run it before committing: python3 tools/cache-bust.py"""

import hashlib
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent

def version(path):
    return hashlib.md5((root / path).read_bytes()).hexdigest()[:8]

pattern = re.compile(r'((?:href|src)=")(assets/[\w\-/]+\.(?:css|js|png|jpg|webp|woff2))(?:\?v=\w+)?(")')

for page in sorted(root.glob("*.html")):
    html = page.read_text()
    updated = pattern.sub(lambda m: f"{m[1]}{m[2]}?v={version(m[2])}{m[3]}", html)
    if updated != html:
        page.write_text(updated)
        print(f"updated {page.name}")
