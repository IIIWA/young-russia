"""Small integrity check for generated wireframe pages."""

import re
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


root = Path(__file__).resolve().parent / "site"
production_root = root.parent.parent / "dist"
pages = sorted(root.rglob("*.html"))
errors = []


# Soft hyphen (U+00AD) is a typographic line-break hint, not part of the page
# structure: the production build puts it into long headings, while the saved
# wireframe keeps plain text. Compare headings without it, otherwise one
# invisible character looks like a structural difference.
def heading_text(words):
    return " ".join(unescape("".join(words)).replace("\u00ad", "").split())


class Outline(HTMLParser):
    def __init__(self):
        super().__init__()
        self.heading = None
        self.words = []
        self.headings = []
        self.sections = 0

    def handle_starttag(self, tag, attrs):
        if tag == "section":
            self.sections += 1
        if tag in {"h1", "h2"}:
            self.heading = tag
            self.words = []

    def handle_data(self, value):
        if self.heading:
            self.words.append(value)

    def handle_endtag(self, tag):
        if tag == self.heading:
            self.headings.append((tag, heading_text(self.words)))
            self.heading = None


def outline(page):
    result = Outline()
    result.feed(page.read_text(encoding="utf-8"))
    return result
template_routes = (
    "index.html",
    "districts/index.html",
    "districts/vasileostrovsky.html",
    "clubs/morskoy.html",
    "directions/index.html",
    "activities/morskoy-devyatyy-lad.html",
)
existing_routes = {page.relative_to(root).as_posix() for page in pages}
for route in template_routes:
    if route not in existing_routes:
        errors.append(f"Missing saved prototype: {route}")
    elif (production_root / route).is_file():
        local = outline(production_root / route)
        prototype = outline(root / route)
        if local.headings != prototype.headings or local.sections != prototype.sections:
            errors.append(f"Prototype structure differs from local build: {route}")

for page in pages:
    markup = page.read_text(encoding="utf-8")
    sections = len(re.findall(r'class="wire-section(?:\s|")', markup))
    if markup.count('class="sec-label"') != sections or markup.count('class="section-note"') != sections:
        errors.append(f"Missing label or annotation: {page.relative_to(root)}")
    if len(re.findall(r"<h1(?:\s[^>]*)?>", markup)) != 1:
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
