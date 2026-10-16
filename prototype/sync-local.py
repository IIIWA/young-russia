"""Sync only representative club and activity wireframes with the local build."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from lxml import etree, html

import build as wire


PROJECT = Path(__file__).resolve().parent.parent
PRODUCTION = PROJECT / "dist"
PROTOTYPE = PROJECT / "prototype" / "site"
TEMPLATE_ROUTES = (Path("clubs/morskoy.html"), Path("activities/morskoy-devyatyy-lad.html"))


def label_for(section: etree._Element, number: int) -> str:
    heading = section.xpath(".//h1|.//h2")
    if heading:
        return re.sub(r"\s+", " ", heading[0].text_content()).strip()
    return "Сведения о площадке" if number > 1 else "Обзор"


def annotation(route: Path, number: int) -> str:
    if number == 1:
        return "Заголовок, факты и основные действия соответствуют локальной сборке."
    if route.parts[0] == "districts":
        return "Карточки и фильтры соответствуют локальной сборке. Сведения уточняй у организаторов."
    if route.parts[0] == "clubs":
        return "Направления и контакты соответствуют локальной сборке. Условия участия уточняй у организатора."
    return "Сведения о занятии соответствуют локальной сборке. Расписание и запись уточняй у организатора."


def make_page(route: Path) -> str:
    document = html.fromstring((PRODUCTION / route).read_text(encoding="utf-8"))
    main = document.xpath('//main[@id="main"]')
    if len(main) != 1:
        raise ValueError(f"Expected one main in {route}")
    main = main[0]
    sections = main.xpath("./section")
    if not sections:
        raise ValueError(f"No content sections in {route}")

    for number, section in enumerate(sections, 1):
        title = label_for(section, number)
        section.set("class", "wire-section " + (section.get("class") or ""))
        section.set("data-section", f"block-{number}")
        section.set("data-section-label", title)
        label_row = html.fromstring(
            f'<div class="section-label-row"><span class="sec-label">'
            f'{number:02d} · {wire.text(title).upper()}</span></div>'
        )
        section.insert(0, label_row)
        note = html.fromstring(
            f'<p class="section-note">↳ {wire.text(annotation(route, number))}</p>'
        )
        section.append(note)

    for element in main.iter():
        for attribute in ("href", "src"):
            value = element.get(attribute)
            if value and value.startswith("/") and not value.startswith("//"):
                base = "../" * (len(route.parts) - 1)
                element.set(attribute, base + value.lstrip("/"))

    title_node = main.xpath(".//h1")
    if len(title_node) != 1:
        raise ValueError(f"Expected one h1 in {route}")
    title = re.sub(r"\s+", " ", title_node[0].text_content()).strip()
    base = "../" * (len(route.parts) - 1)
    content = "".join(html.tostring(child, encoding="unicode", method="html") for child in main)
    active = "districts" if route.parts[0] == "districts" else ""
    result = wire.page(title, f"Прототип страницы {title}", content, base=base, active=active)
    stylesheet = f'<link rel="stylesheet" href="{base}assets/wire.css">'
    result = result.replace(
        stylesheet,
        f'<link rel="stylesheet" href="{base}assets/local-base.css">'
        + stylesheet
        + f'<link rel="stylesheet" href="{base}assets/local-sync.css">',
        1,
    )
    result = result.replace(
        "</head>", f'<script src="{base}assets/local-site.js" defer></script></head>', 1
    )
    result = result.replace('class="wire-main"', 'class="wire-main local-sync"', 1)
    body_class = document.xpath("//body/@class")
    if body_class:
        result = result.replace("<body>", f'<body class="{wire.escape(body_class[0])}">', 1)
    return result


def main() -> None:
    if not PRODUCTION.is_dir():
        raise SystemExit("Build the local site before syncing the prototype.")
    for route in TEMPLATE_ROUTES:
        target = PROTOTYPE / route
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(make_page(route), encoding="utf-8")

    assets = PROTOTYPE / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PROJECT / "assets" / "style.css", assets / "local-base.css")
    source_script = (PROJECT / "assets" / "site.js").read_text(encoding="utf-8")
    analytics_end = source_script.index("const menuButton =")
    (assets / "local-site.js").write_text(
        "// Prototype: analytics disabled.\n" + source_script[analytics_end:], encoding="utf-8"
    )
    print(f"Synced {len(TEMPLATE_ROUTES)} representative prototype pages.")


if __name__ == "__main__":
    main()
