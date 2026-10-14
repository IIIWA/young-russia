"""Small integrity check for generated wireframe pages."""

import re
from pathlib import Path
from urllib.parse import unquote, urlsplit


root = Path(__file__).resolve().parent / "site"
pages = sorted(root.rglob("*.html"))
errors = []
if len(pages) != 108:
    errors.append(f"Expected 108 pages, found {len(pages)}")

for page in pages:
    markup = page.read_text(encoding="utf-8")
    sections = markup.count('class="wire-section ')
    if markup.count('class="sec-label"') != sections or markup.count('class="section-note"') != sections:
        errors.append(f"Missing label or annotation: {page.relative_to(root)}")
    if markup.count("<h1>") != 1:
        errors.append(f"Expected one page title: {page.relative_to(root)}")
    if 'assets/comments.js' not in markup:
        errors.append(f"Comments script missing: {page.relative_to(root)}")
    if re.search(r"моя инициатива|моя жена|пет.проект", markup, re.I):
        errors.append(f"Personal attribution found: {page.relative_to(root)}")
    for target in re.findall(r'(?:href|src)="([^"]+)"', markup):
        parsed = urlsplit(target)
        if parsed.scheme or target.startswith("#"):
            continue
        resolved = (page.parent / unquote(parsed.path)).resolve()
        if not resolved.is_relative_to(root.resolve()) or not resolved.is_file():
            errors.append(f"Broken link: {page.relative_to(root)} -> {target}")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"Checked {len(pages)} pages: links, labels and annotations are present.")
