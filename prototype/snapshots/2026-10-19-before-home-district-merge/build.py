"""Build the editable black-and-white PMK wireframe from one data source."""

from __future__ import annotations

import html
import json
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
OUTPUT = ROOT / "site"
CLUBS = json.loads((PROJECT / "data" / "clubs-vo.json").read_text(encoding="utf-8"))
ADMIRAL_CLUBS = json.loads((ROOT / "data" / "clubs-admiralteysky.json").read_text(encoding="utf-8"))
VYBORG_CLUBS = json.loads((PROJECT / "data" / "clubs-vyborgsky.json").read_text(encoding="utf-8"))
KALININ_CLUBS = json.loads((PROJECT / "data" / "clubs-kalininsky.json").read_text(encoding="utf-8"))
OPEN_DISTRICTS = {"vasileostrovsky", "admiralteysky", "vyborgsky", "kalininsky"}
ADMIRAL_SOURCE = "https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/"
ADMIRAL_SOURCE_DATE = "18.04.2025"
ADMIRAL_ORGANIZATIONS = {
    "admiralteysky": {
        "name": "Центр «Адмиралтейский»",
        "address": "Верейская ул., д. 22-24",
        "phone": "(812) 246-39-87",
        "email": "admiral_06@inbox.ru",
        "site": "https://admiralteisky.admiral.gov.spb.ru/",
        "vk": "https://vk.com/tsentr_admiralteisky",
        "telegram": "https://t.me/tsentr_admiralteisky",
        "count": 22,
    },
    "record": {
        "name": "Дом молодёжи «Рекорд»",
        "address": "Садовая ул., д. 55-57, лит. А",
        "phone": "246-58-80; 246-58-82",
        "email": "dm-record@mail.ru",
        "site": "http://dmrecord.admiral.gov.spb.ru/",
        "vk": "https://vk.com/dmrecord",
        "telegram": "https://t.me/dmrecord",
        "count": 4,
    },
}
VYBORG_ORGANIZATIONS = {
    "mir": {
        "name": "ПМЦ «МИР»",
        "address": "пр. Энгельса, д. 147, к. 1, лит. Д",
        "phone": "409-80-36",
        "email": "pmc-mir@yandex.ru",
        "vk": "https://vk.com/pmcmir",
        "count": 6,
    },
    "forpost": {
        "name": "Дом молодёжи «Форпост»",
        "address": "Большой Сампсониевский пр., д. 37",
        "phone": "542-24-07",
        "email": "dm_forpost@mail.ru",
        "vk": "https://vk.com/dm_forpost",
        "count": 3,
    },
}
KALININ_SOURCE = "https://www.gov.spb.ru/gov/terr/reg_kalinin/podvedomstvennye-uchrezhdeniya/uchrezhdeniya-molodyozhnoj-politiki/"
KALININ_ORGANIZATIONS = {
    "kalininsky": {
        "name": "ПМЦ «Калининский»",
        "address": "ул. Руставели, д. 37",
        "phone": "(812) 298-88-76",
        "email": "5564920@mail.ru",
        "site": "https://pmc-kalininsky.spb.ru/?page_id=219450",
        "count": 21,
    },
}

DISTRICTS = [
    ("Адмиралтейский", "admiralteysky"),
    ("Василеостровский", "vasileostrovsky"),
    ("Выборгский", "vyborgsky"),
    ("Калининский", "kalininsky"),
    ("Кировский", "kirovsky"),
    ("Колпинский", "kolpinsky"),
    ("Красногвардейский", "krasnogvardeysky"),
    ("Красносельский", "krasnoselsky"),
    ("Кронштадтский", "kronshtadtsky"),
    ("Курортный", "kurortny"),
    ("Московский", "moskovsky"),
    ("Невский", "nevsky"),
    ("Петроградский", "petrogradsky"),
    ("Петродворцовый", "petrodvortsovy"),
    ("Приморский", "primorsky"),
    ("Пушкинский", "pushkinsky"),
    ("Фрунзенский", "frunzensky"),
    ("Центральный", "tsentralny"),
]

TOPICS = [
    ("knowledge", "Знания и технологии", "Языки, цифровые и прикладные навыки"),
    ("sport", "Спорт и движение", "Игры, танцы, фитнес и активный отдых"),
    ("creative", "Творчество", "Рисование, ремёсла, фото и дизайн"),
    ("stage", "Сцена и музыка", "Музыка, вокал, театр и кино"),
    ("community", "Общение и проекты", "Клубы, добровольчество и встречи"),
]

KNOWN_SLUGS = {
    "Морской": "morskoy",
    "Аврора": "avrora",
    "Витана": "vitana",
    "Притяжение": "prityazhenie",
    "Белый медведь": "belyy-medved",
}
TRANSLIT = dict(zip(
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    ["a", "b", "v", "g", "d", "e", "yo", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "h", "ts", "ch", "sh", "sch", "", "y", "", "e", "yu", "ya"],
))
SHORT_WORDS = re.compile(r"(?<![\w])((?:в|во|с|со|к|ко|о|об|у|и|а|но|из|от|до|по|за|на|под|над|при|про|без|для|не|ни|что|как|или|чем|где|если|через))\s+(?=\S)", re.I)


def escape(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def text(value: object) -> str:
    value = str(value or "").replace("—", ":").replace("–", "-")
    value = SHORT_WORDS.sub(lambda match: match.group(1) + "\u00a0", value)
    value = re.sub(r"(\d+)\s+(лет|клубов|клуба|районов|площадок|площадки|пространство)", lambda match: match.group(1) + "\u00a0" + match.group(2), value, flags=re.I)
    return escape(value)


def slug(value: str) -> str:
    if value in KNOWN_SLUGS:
        return KNOWN_SLUGS[value]
    raw = "".join(TRANSLIT.get(char, char) for char in value.lower())
    return re.sub(r"(^-+|-+$)", "", re.sub(r"[^a-z0-9]+", "-", raw))


def club_topics(club: dict) -> list[str]:
    content = " ".join(club["activities"]).lower()
    rules = {
        "languages": r"англий|немец|корей|француз|япон|билингв|иностранн|язык|лингвист",
        "sport": r"спорт|бокс|борьб|самбо|айкидо|дзюдо|джиу|карат|фитнес|йога|теннис|хоккей|атлет|пауэр|бодибилд|футбол|шахмат|бильярд|гребл|парус|лазертаг|туризм|единобор|дартс|офп|самооборон|городош|скалолаз|тхэквондо|армрестлинг|акробат|гимнастик|волейбол|стрельб|кик.бокс|аэробик|рукопаш",
        "dance": r"тан|хореограф|брейк|зумб|чирлидинг|контемп|хиллс|хип-хоп|k-pop|джаз-модерн",
        "creative": r"изо|рисован|живопис|лепк|флорист|арт|дпи|кукл|творч|фотограф|дизайн|вышив|апсайкл|мастерск|граффити|керамик|швейн|роспис|батик|график|декор|акварел|фото|костюм|фелтинг",
        "stage": r"вокал|хор|гитар|театр|актёр|песн|музык|кино|речь|спектакл|сценическ|звук|барабан|инструментальн|цирков",
        "community": r"волонт|добровол|добро\.центр|скаут|проект|коворкинг|мероприят|настольные игры|семь|общени|разговорн|квест|психолог|медиастудия|игровой клуб|квн|реконструк",
    }
    return [key for key, pattern in rules.items() if re.search(pattern, content)]


def section(number: int, title: str, key: str, body: str, note: str, variant: str = "") -> str:
    return (
        f'<section class="wire-section {variant}" id="{escape(key)}" '
        f'data-section="{escape(key)}" data-section-label="{escape(title)}">'
        f'<div class="section-label-row"><span class="sec-label">{number:02d} · {text(title).upper()}</span></div>'
        f'<div class="section-body">{body}</div>'
        f'<p class="section-note">↳ {text(note)}</p>'
        '</section>'
    )


def button(label: str, href: str, secondary: bool = False) -> str:
    css = "button-outline" if secondary else "button-dark"
    return f'<a class="wire-button {css}" href="{escape(href)}">{text(label)} <span aria-hidden="true">→</span></a>'


def landmark_placeholder(lines: tuple[str, ...], statistic: tuple[str, str] | None = None) -> str:
    caption = "<br>".join(text(line) for line in lines)
    badge = ""
    if statistic:
        value, label = statistic
        badge = f'<figcaption class="landmark-count"><strong>{text(value)}</strong><span>{text(label)}</span></figcaption>'
    return (
        '<figure class="wire-placeholder landmark-placeholder">'
        f'<span class="landmark-label">Фото-заглушка<br>{caption}</span>{badge}</figure>'
    )


def district_photo_backdrop(lines: tuple[str, ...], generated: bool = True) -> str:
    caption = " · ".join(text(line) for line in lines)
    label = "МАКЕТ ФОНОВОГО ИЗОБРАЖЕНИЯ" if generated else "ФОТО-ЗАГЛУШКА · ИЗОБРАЖЕНИЕ ЕЩЁ НЕ ВЫБРАНО"
    return (
        '<div class="district-photo-placeholder" aria-hidden="true">'
        f'<span>ФОН НА ВСЮ ШИРИНУ HERO · {label}<br>{caption}</span></div>'
    )


def header(base: str, active: str = "") -> str:
    links = [
        ("Главная", f"{base}index.html", "home"),
        ("Занятия", f"{base}index.html#topics", "topics"),
        ("Районы", f"{base}districts/index.html", "districts"),
        ("Васильевский остров", f"{base}districts/vasileostrovsky.html", "vo"),
        ("Как участвовать", f"{base}index.html#join", "join"),
    ]
    nav = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if key == active else ""}>{text(label)}</a>'
        for label, href, key in links
    )
    return (
        '<header class="site-header"><div class="header-inner">'
        f'<a class="wordmark" href="{base}index.html">ПМК Петербурга<span> / прототип</span></a>'
        f'<nav class="main-nav" aria-label="Основная навигация">{nav}</nav>'
        '<button class="header-comment" type="button" data-page-comment>Обсудить страницу</button>'
        '<button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button>'
        '</div>'
        f'<nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden>{nav}<button type="button" data-page-comment>Обсудить страницу</button></nav>'
        '</header>'
    )


def footer(base: str) -> str:
    return (
        '<footer class="site-footer"><div class="footer-inner">'
        f'<a class="wordmark" href="{base}index.html">ПМК Петербурга<span> / прототип</span></a>'
        '<p>Сведения о программах и записи нужно проверить у организаторов перед публикацией.</p>'
        f'<a href="{base}districts/index.html">Все районы →</a>'
        '</div></footer>'
    )


def page(title: str, description: str, content: str, base: str = "", active: str = "") -> str:
    return (
        '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow">'
        f'<meta name="description" content="{escape(description)}">'
        f'<title>{escape(title)} | Прототип ПМК Петербурга</title>'
        f'<link rel="stylesheet" href="{base}assets/wire.css">'
        f'<script src="{base}assets/app.js" defer></script>'
        f'<script src="{base}assets/comments.js" defer></script>'
        '</head><body>'
        '<a class="skip-link" href="#main">Перейти к содержимому</a>'
        f'{header(base, active)}<main id="main" class="wire-main">{content}</main>{footer(base)}'
        '</body></html>'
    )


def linked_card(title: str, subtitle: str, href: str, badge: str = "КЛИК · СТРАНИЦА", needs_review: bool = False) -> str:
    card_class = "linked-card needs-review" if needs_review else "linked-card"
    tooltip = ' title="Состав площадок, контакты, расписание и возрастные условия нужно уточнять у организаторов."' if needs_review else ""
    return (
        f'<a class="{card_class}" href="{escape(href)}"{tooltip}>'
        f'<span class="click-badge">{text(badge)}</span>'
        f'<strong>{text(title)}</strong><span class="card-subtitle">{text(subtitle)}</span>'
        '<span class="card-go">Смотреть <span aria-hidden="true">→</span></span></a>'
    )


def club_card(club: dict, base: str, club_path: str = "clubs") -> str:
    directions = ", ".join(club["activities"][:3]) or "Направления уточняются"
    content = f'{club["name"]} {club["address"]} {" ".join(club["activities"])}'.lower()
    badge = "КЛИК · КАРТОЧКА КЛУБА" if club["type"] == "Подростково-молодёжный клуб" else "КЛИК · КАРТОЧКА ПЛОЩАДКИ"
    return (
        f'<a class="club-card linked-card" href="{base}{club_path}/{slug(club["name"])}.html" '
        f'data-search="{escape(content)}" data-center="{escape(club.get("organization", ""))}" '
        f'data-topics="{escape(" ".join(club_topics(club)))}">'
        f'<span class="click-badge">{badge}</span>'
        f'<strong>{text(club["name"])}</strong><span class="card-address">{text(club["address"])}</span>'
        f'<span class="card-subtitle">{text(directions)}</span>'
        '<span class="card-go">Подробнее <span aria-hidden="true">→</span></span></a>'
    )


def breadcrumb(items: list[tuple[str, str | None]]) -> str:
    parts = []
    for name, href in items:
        parts.append(f'<a href="{escape(href)}">{text(name)}</a>' if href else f'<span>{text(name)}</span>')
    return '<nav class="breadcrumbs" aria-label="Навигационная цепочка">' + '<span aria-hidden="true">/</span>'.join(parts) + '</nav>'


def make_home() -> str:
    hero = section(1, "Первый экран", "hero",
        '<div class="hero-center"><p class="eyebrow">Бесплатные возможности для молодёжи 14-35 лет</p>'
        '<h1>Найди своё занятие в Петербурге</h1>'
        '<p class="lead">Спорт, творчество, языки и общение рядом с домом. Выбери то, что тебе интересно, и узнай, куда прийти.</p>'
        '<div class="button-row">'
        + button("Выбрать район", "districts/index.html")
        + button("Смотреть занятия", "#topics", True)
        + '</div></div>',
        "Задача блока: сразу объяснить, что можно найти. Возраст и условия участия проверяем для каждой программы.",
        "hero-band")

    offer = section(2, "Кратко о каталоге", "about-catalog",
        '<div class="simple-grid three">'
        '<div class="info-card"><b>14-35&nbsp;лет</b><h3>Возможности для&nbsp;молодёжи</h3></div>'
        '<div class="info-card"><b>Бесплатно</b><h3>Направления каталога</h3></div>'
        '<div class="info-card"><b>Рядом</b><h3>Начни поиск со&nbsp;своего района</h3></div>'
        '</div>',
        "Три кратких факта расположены между первым экраном и&nbsp;направлениями.")

    topic_cards = "".join(
        linked_card(name, subtitle, f"directions/index.html?topic={key}", "КЛИК · СТРАНИЦА ЗАНЯТИЙ")
        for key, name, subtitle in TOPICS
    )
    topics = section(3, "Выбор направления", "topics",
        '<div class="section-heading"><div><h2>Чем хочется заняться?</h2><p>Выбери направление. На&nbsp;следующей странице можно уточнить занятие и&nbsp;район.</p></div></div>'
        f'<div class="linked-grid three">{topic_cards}</div>',
        "Пять направлений ведут на&nbsp;одну страницу. Подгруппы и&nbsp;клубы меняются при выборе темы.")

    featured = [next(item for item in CLUBS if item["name"] == name) for name in ["Морской", "Аврора", "Витана"]]
    vo = section(4, "Каталоги районов", "vasileostrovsky",
        '<div class="split-block"><div><p class="eyebrow">Каталоги уже открыты</p><h2>Начни с восемнадцати районов</h2>'
        '<p>Каталоги всех районов Петербурга открыты. Ищи площадку по названию, адресу и направлению.</p>'
        + button("Выбрать район", "districts/index.html") + '</div>'
        '<div class="stat-box"><strong>18</strong><span>районов города</span></div></div>',
        "Список всех районов доступен ниже. Клубы показаны на страницах районов.",
        "gray-band")

    district_cards = "".join(
        linked_card(name, "Данные уточняются" if code == "vyborgsky" else "Каталог района открыт", f"districts/{code}.html", "ДАННЫЕ УТОЧНЯЮТСЯ" if code == "vyborgsky" else "КЛИК · СТРАНИЦА РАЙОНА", code == "vyborgsky")
        for name, code in DISTRICTS
    )
    districts = section(5, "Все районы", "districts",
        '<div class="section-heading"><div><h2>Выбери свой район</h2><p>Для каждого района Петербурга открыт каталог клубов.</p></div>'
        + button("Список районов", "districts/index.html", True) + '</div>'
        f'<div class="linked-grid four compact">{district_cards}</div>',
        "Каталоги восемнадцати районов собраны по&nbsp;открытым материалам. Контакты и&nbsp;программы сверять перед обновлениями.")

    club_map = section(6, "Карта Петербурга", "map",
        '<div class="section-heading"><div><h2>Клубы на&nbsp;карте</h2><p>В&nbsp;локальной сборке здесь показаны площадки Василеостровского района.</p></div></div>'
        '<div class="wire-map-placeholder" role="img" aria-label="Место для интерактивной карты Петербурга">'
        '<span>Карта Петербурга</span><small>Схема места интерактивной карты</small></div>',
        "В&nbsp;прототипе показана схема блока. В&nbsp;локальной сборке работает карта с&nbsp;метками клубов.")

    join = section(7, "Как участвовать", "join",
        '<div class="center-copy"><h2>Как попасть в клуб</h2><p>Короткий путь от интереса до первого занятия.</p></div>'
        '<div class="simple-grid three">'
        '<div class="info-card"><b>01</b><h3>Выбери</h3><p>Найди направление или клуб рядом с домом.</p></div>'
        '<div class="info-card"><b>02</b><h3>Проверь</h3><p>Открой адрес и страницу организатора.</p></div>'
        '<div class="info-card"><b>03</b><h3>Уточни</h3><p>Спроси про возраст, расписание, набор и запись.</p></div>'
        '</div>',
        "Для конкретных групп условия могут отличаться. На карточках нужны подтверждённые правила записи.")

    sources = section(8, "Источники и актуальность", "sources",
        '<div class="split-block"><div><h2>Проверь детали перед визитом</h2>'
        '<p>Направления и контакты могут меняться. Карточки связывают с источником, а расписание и наличие мест нужно уточнять у организатора.</p></div>'
        '<div class="source-links"><a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a>'
        '<a href="https://www.pmcvo.ru/" target="_blank" rel="noopener noreferrer">ПМЦ Василеостровского района ↗</a></div></div>',
        "Перед запуском добавить дату последней проверки каждой карточки и порядок обновления данных.")
    return page("Главная", "Прототип каталога подростково-молодёжных клубов Петербурга", hero + offer + topics + vo + districts + club_map + join, active="home")


def make_district_index() -> str:
    hero = section(1, "Вход в каталог районов", "districts-intro",
        breadcrumb([("Главная", "../index.html"), ("Районы", None)])
        + '<div class="hero-center"><p class="eyebrow">18 районов Петербурга</p><h1>Районы Петербурга</h1>'
        '<p class="lead">Открой страницу района, чтобы найти клубы и направления рядом.</p></div>',
        "Понятная точка входа в городской каталог.", "hero-band")
    cards = "".join(
        linked_card(name, "Данные уточняются" if code == "vyborgsky" else "Каталог района открыт", f"{code}.html", "ДАННЫЕ УТОЧНЯЮТСЯ" if code == "vyborgsky" else "КЛИК · РАЙОН", code == "vyborgsky")
        for name, code in DISTRICTS
    )
    listing = section(2, "Список районов", "district-list",
        '<div class="section-heading"><div><p>Начни с поиска по названию или выбери карточку.</p></div>'
        '<label class="search-label">Поиск района<input id="district-search" type="search" placeholder="Например, Василеостровский"></label></div>'
        f'<div class="linked-grid four compact" id="district-grid">{cards}</div>'
        '<p class="empty-message" id="district-empty" hidden>Район не найден. Проверь название.</p>',
        "Каталоги всех восемнадцати районов открыты. Контакты и&nbsp;программы нужно подтверждать перед обновлениями.")
    status = section(3, "Статус наполнения", "status",
        '<div class="split-block"><div><h2>Данные добавляются поэтапно</h2>'
        '<p>Для каждого района сначала сверяются учреждения, адреса, программы и контакты. Готовые страницы будут вести к клубам.</p></div>'
        + '<div class="button-column">' + button("Адмиралтейский", "admiralteysky.html")
        + button("Василеостровский", "vasileostrovsky.html", True)
        + button("Выборгский", "vyborgsky.html", True)
        + button("Калининский", "kalininsky.html", True) + '</div></div>',
        "Не показывать неподтверждённые числа клубов в других районах.")
    return page("Районы", "Страницы районов Петербурга", hero + listing, base="../", active="districts")


def make_vo() -> str:
    hero = section(1, "Обзор района", "vo-intro",
        breadcrumb([("Главная", "../index.html"), ("Районы", "index.html"), ("Василеостровский", None)])
        + '<div class="district-photo-stage">'
        + district_photo_backdrop(("Стрелка Васильевского острова", "здание Биржи", "Ростральные колонны"))
        + '<div class="district-photo-foreground"><div><p class="eyebrow">Каталог района</p><h1>Василеостровский район</h1>'
        '<p class="lead">31 клуб и пространство «Притяжение»: адреса, направления и ссылки на организаторов.</p>'
        + button("Перейти к списку", "#club-list") + '</div>'
        + '<div class="stat-box"><strong>32</strong><span>площадки в списке</span></div></div></div>',
        "Знаковая архитектура на&nbsp;всю ширину hero с&nbsp;полупрозрачным затемнением. Состав сверить с&nbsp;ПМЦ ВО.", "hero-band district-photo-wire")
    filters = "".join(
        f'<button class="filter-chip" type="button" data-topic="{key}" aria-pressed="false">{text(name)}</button>'
        for key, name, _ in TOPICS
    )
    finder = section(2, "Поиск и фильтры", "vo-search",
        '<div class="section-heading"><div><h2>Выбери подходящее место</h2><p>Поиск работает по названию, адресу и направлениям.</p></div>'
        '<label class="search-label">Поиск клуба<input id="club-search" type="search" placeholder="Название, направление или адрес"></label></div>'
        '<div class="filter-row" role="group" aria-label="Направления">'
        '<button class="filter-chip active" type="button" data-topic="all" aria-pressed="true">Все</button>' + filters + '</div>'
        '<p class="result-counter" id="club-count" aria-live="polite">Показано 32 площадки</p>',
        "Фильтры прототипные: категории сверить с действующими программами.")
    listing = section(3, "Карточки клубов", "club-list",
        '<div class="section-heading"><div><p>Открой карточку, чтобы увидеть направления, адрес и контакты.</p></div></div>'
        f'<div class="linked-grid three" id="club-grid">{"".join(club_card(club, "../") for club in CLUBS)}</div>'
        '<p class="empty-message" id="club-empty" hidden>Подходящих клубов не найдено. Измени запрос или тему.</p>',
        "У части клубов прямые контакты и статус требуют уточнения. Нельзя подменять отсутствие данных догадками.")
    catalog = section(2, "Поиск и клубы", "club-list",
        '<div class="section-heading"><div><h2>Выбери подходящее место</h2><p>Поиск работает по названию, адресу и направлениям.</p></div>'
        '<label class="search-label">Поиск клуба<input id="club-search" type="search" placeholder="Название, направление или адрес"></label></div>'
        '<div class="filter-row" role="group" aria-label="Направления">'
        '<button class="filter-chip active" type="button" data-topic="all" aria-pressed="true">Все</button>' + filters + '</div>'
        '<p class="result-counter" id="club-count" aria-live="polite">Показано 32 площадки</p>'
        '<div class="linked-grid three" id="club-grid">' + "".join(club_card(club, "../") for club in CLUBS) + '</div>'
        '<p class="empty-message" id="club-empty" hidden>Подходящих клубов не найдено. Измени запрос или тему.</p>',
        "Поиск и карточки находятся в&nbsp;одном блоке, как в&nbsp;локальной сборке. Актуальность условий уточняй у&nbsp;организаторов.")
    questions = section(4, "Перед посещением", "before-visit",
        '<div class="center-copy"><h2>Что уточнить у организатора</h2><p>Одна и та же площадка может вести разные группы с разными условиями.</p></div>'
        '<div class="simple-grid four">'
        '<div class="info-card"><b>01</b><h3>Возраст</h3><p>Для кого открыта конкретная группа.</p></div>'
        '<div class="info-card"><b>02</b><h3>Набор</h3><p>Есть ли свободные места сейчас.</p></div>'
        '<div class="info-card"><b>03</b><h3>Время</h3><p>Когда проходят занятия.</p></div>'
        '<div class="info-card"><b>04</b><h3>Запись</h3><p>Что нужно для участия.</p></div>'
        '</div>',
        "После подтверждения условий добавить поля на уровне отдельной программы.")
    source = section(5, "Источник сведений", "vo-sources",
        '<div class="split-block"><div><h2>Основа списка</h2><p>Адреса, телефоны и направления обновлены по списку ПМЦ Василеостровского района от 12.10.2026. Документ предоставлен для проекта и не размещён на сайте.</p></div>'
        '<div class="source-links"><a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база ↗</a>'
        '<a href="https://www.pmcvo.ru/" target="_blank" rel="noopener noreferrer">Сайт ПМЦ ВО ↗</a></div></div>',
        "Дата документа не означает, что каждая группа открыта для записи. Стоимость, расписание и набор нужно уточнять у ПМЦ.")
    return page("Василеостровский район", "Клубы Василеостровского района", hero + catalog, base="../", active="vo")


def make_admiralteysky() -> str:
    clubs = ADMIRAL_CLUBS
    total = len(clubs)
    centers = "".join(
        f'<button class="filter-chip{" active" if key == "all" else ""}" type="button" data-center="{key}" aria-pressed="{str(key == "all").lower()}">{text(label)}</button>'
        for key, label in [("all", "Все"), ("admiralteysky", "Центр «Адмиралтейский»"), ("record", "Дом молодёжи «Рекорд»")]
    )
    topics = "".join(
        f'<button class="filter-chip" type="button" data-topic="{key}" aria-pressed="false">{text(label)}</button>'
        for key, label, _ in TOPICS
    )
    hero = section(1, "Обзор района", "admiral-intro",
        breadcrumb([("Главная", "../index.html"), ("Районы", "index.html"), ("Адмиралтейский", None)])
        + '<div class="district-photo-stage">'
        + district_photo_backdrop(("Адмиралтейство", "Исаакиевский собор"))
        + '<div class="district-photo-foreground"><div><p class="eyebrow">Клубы и молодёжные пространства</p><h1>Адмиралтейский район</h1>'
        '<p class="lead">В открытом списке администрации: 22 клуба Центра «Адмиралтейский» и 4 площадки Дома молодёжи «Рекорд».</p>'
        + button("Перейти к клубам", "#club-list") + '</div>'
        + f'<div class="stat-box"><strong>{total}</strong><span>клубов в макете</span></div></div></div>',
        "Сгенерированное изображение на всю ширину hero с полупрозрачным затемнением. Данные источника от 18.04.2025 сверить перед публикацией.", "hero-band district-photo-wire")
    finder = section(2, "Поиск по клубам", "admiral-search",
        '<div class="section-heading"><div><h2>Выбери занятие или площадку</h2><p>Ищи по названию, адресу, направлению или выбери организацию.</p></div>'
        '<label class="search-label">Поиск клуба<input id="club-search" type="search" placeholder="Например, танцы или Мойка"></label></div>'
        '<h3 class="filter-title">Организация</h3><div class="filter-row" id="center-filters" role="group" aria-label="Организация">' + centers + '</div>'
        '<h3 class="filter-title">Направление</h3><div class="filter-row" role="group" aria-label="Направление">'
        '<button class="filter-chip active" type="button" data-topic="all" aria-pressed="true">Все</button>' + topics + '</div>'
        f'<p class="result-counter" id="club-count" aria-live="polite">Показано {total} площадок</p>',
        "Фильтры сгруппированы по двум учреждениям. Категории занятий предварительные.")
    listing = section(3, "Список клубов", "club-list",
        '<div class="section-heading"><div><h2>Клубы района</h2><p>Открой карточку, чтобы увидеть адрес, направления и контакты.</p></div></div>'
        f'<div class="linked-grid three" id="club-grid">{"".join(club_card(club, "../", "clubs/admiralteysky") for club in clubs)}</div>'
        '<p class="empty-message" id="club-empty" hidden>Подходящих клубов не найдено. Измени запрос или фильтр.</p>',
        "Состав и названия секций перенесены из опубликованного перечня. Набор и расписание отдельно не подтверждены.")
    organizations = []
    for key, org in ADMIRAL_ORGANIZATIONS.items():
        links = [
            f'<a href="{escape(org["site"])}" target="_blank" rel="noopener noreferrer">Сайт учреждения ↗</a>',
            f'<a href="{escape(org["vk"])}" target="_blank" rel="noopener noreferrer">ВКонтакте ↗</a>',
            f'<a href="{escape(org["telegram"])}" target="_blank" rel="noopener noreferrer">Телеграм ↗</a>',
            f'<a href="mailto:{escape(org["email"])}">{text(org["email"])}</a>',
        ]
        organizations.append(
            f'<article class="organization-card"><p class="eyebrow">{org["count"]} клубных страниц в источнике</p><h3>{text(org["name"])}</h3>'
            f'<div class="contact-row"><span>Адрес</span><strong>{text(org["address"])}</strong></div>'
            f'<div class="contact-row"><span>Телефон</span><strong>{text(org["phone"])}</strong></div>'
            f'<div class="source-links">{"".join(links)}</div></article>'
        )
    contacts = section(4, "Контакты учреждений", "admiral-centers",
        '<div class="section-heading"><div><h2>К кому обратиться</h2><p>Общие контакты учреждений, которые ведут клубы района.</p></div></div>'
        f'<div class="organization-grid">{"".join(organizations)}</div>',
        "Контакты учреждения не заменяют прямую связь с конкретной секцией. Перед публикацией проверить номера и ссылки.")
    join = section(5, "Условия участия", "admiral-visit",
        '<div class="center-copy"><h2>Перед первым занятием</h2><p>Клубы работают в разных направлениях, а условия могут отличаться у каждой группы.</p></div>'
        '<div class="simple-grid four">'
        '<div class="info-card"><b>01</b><h3>Бесплатно</h3><p>Занятия ПМК для молодёжи 14-35 лет.</p></div>'
        '<div class="info-card"><b>02</b><h3>Возраст</h3><p>Уточни возраст участников конкретной группы.</p></div>'
        '<div class="info-card"><b>03</b><h3>Расписание</h3><p>Спроси, когда проходят занятия и есть ли места.</p></div>'
        '<div class="info-card"><b>04</b><h3>Запись</h3><p>Уточни, как присоединиться и что взять с собой.</p></div>'
        '</div>',
        "На странице администрации указаны часы работы клубов: 6 дней в неделю с 12:30 до 22:00. Источник обновлялся 18.04.2025, режим нужно подтвердить.")
    source = section(6, "Источники и дата данных", "admiral-sources",
        '<div class="split-block"><div><h2>Данные для макета</h2><p>Список клубов, адреса, телефоны и направления собраны с официальной страницы Администрации Адмиралтейского района.</p>'
        f'<p>Дата изменения страницы: {ADMIRAL_SOURCE_DATE}. Это дата источника, а не дата проверки каждой карточки.</p></div>'
        '<div class="source-links">'
        f'<a href="{ADMIRAL_SOURCE}" target="_blank" rel="noopener noreferrer">Страница администрации района ↗</a>'
        '<a href="https://sc256.adm-edu.spb.ru/doc/pmk_adm.pdf" target="_blank" rel="noopener noreferrer">Дополнительный PDF со списком ПМК ↗</a>'
        '</div></div>',
        "Сверить количество площадок, актуальные адреса, телефоны, набор и направления с руководством перед переносом в прод.")
    return page("Адмиралтейский район", "Клубы и молодёжные пространства Адмиралтейского района", hero + finder + listing + contacts + join + source, base="../", active="districts")


def make_vyborgsky() -> str:
    clubs = VYBORG_CLUBS
    total = len(clubs)
    centers = "".join(
        f'<button class="filter-chip{" active" if key == "all" else ""}" type="button" data-center="{key}" aria-pressed="{str(key == "all").lower()}">{text(label)}</button>'
        for key, label in [("all", "Все"), ("mir", "ПМЦ «МИР»"), ("forpost", "Дом молодёжи «Форпост»")]
    )
    topics = "".join(
        f'<button class="filter-chip" type="button" data-topic="{key}" aria-pressed="false">{text(label)}</button>'
        for key, label, _ in TOPICS
    )
    hero = section(1, "Обзор района", "vyborg-intro",
        breadcrumb([("Главная", "../index.html"), ("Районы", "index.html"), ("Выборгский", None)])
        + '<div class="district-photo-stage">'
        + district_photo_backdrop(("Выборгский район", "Сампсониевский собор"), generated=False)
        + '<div class="district-photo-foreground"><div><p class="eyebrow">Клубы и молодёжные пространства</p><h1>Выборгский район</h1>'
        '<p class="lead">Девять площадок двух учреждений: ПМЦ «МИР» и Дома молодёжи «Форпост». Ищи занятия и адреса рядом с собой.</p>'
        + button("Перейти к площадкам", "#club-list") + '</div>'
        + f'<div class="stat-box"><strong>{total}</strong><span>площадок в макете</span></div></div></div>',
        "На всю ширину hero запланировано изображение Сампсониевского собора. Пока это подписанная фото-заглушка, не фотография. Сверить изображение перед продом.",
        "hero-band district-photo-wire")
    finder = section(2, "Поиск по площадкам", "vyborg-search",
        '<div class="section-heading"><div><h2>Найди занятие или площадку</h2><p>Ищи по названию, адресу, направлению или выбери учреждение.</p></div>'
        '<label class="search-label">Поиск площадки<input id="club-search" type="search" placeholder="Например, гитара или Просвещения"></label></div>'
        '<h3 class="filter-title">Учреждение</h3><div class="filter-row" id="center-filters" role="group" aria-label="Учреждение">' + centers + '</div>'
        '<h3 class="filter-title">Направление</h3><div class="filter-row" role="group" aria-label="Направление">'
        '<button class="filter-chip active" type="button" data-topic="all" aria-pressed="true">Все</button>' + topics + '</div>'
        f'<p class="result-counter" id="club-count" aria-live="polite">Показано {total} площадок</p>',
        "Поиск и фильтры доступны в прототипе. Категории направлений предварительные.")
    listing = section(3, "Площадки района", "club-list",
        '<div class="section-heading"><div><h2>Клубы и пространства</h2><p>Открой карточку: там есть адрес, направления и доступные контакты.</p></div></div>'
        f'<div class="linked-grid three" id="club-grid">{"".join(club_card(club, "../", "clubs/vyborgsky") for club in clubs)}</div>'
        '<p class="empty-message" id="club-empty" hidden>Подходящих площадок не найдено. Измени запрос или фильтр.</p>',
        "Шесть площадок «МИРа» и три «Форпоста» перечислены в городских PDF. Адрес на проспекте Просвещения, 54 без названия и контактов пока не включён.")
    organizations = []
    for org in VYBORG_ORGANIZATIONS.values():
        links = [
            f'<a href="{escape(org["vk"])}" target="_blank" rel="noopener noreferrer">Сообщество ВКонтакте ↗</a>',
            f'<a href="mailto:{escape(org["email"])}">{text(org["email"])}</a>',
        ]
        organizations.append(
            f'<article class="organization-card"><p class="eyebrow">{org["count"]} площадок в документах</p><h3>{text(org["name"])}</h3>'
            f'<div class="contact-row"><span>Адрес</span><strong>{text(org["address"])}</strong></div>'
            f'<div class="contact-row"><span>Телефон</span><strong>{text(org["phone"])}</strong></div>'
            f'<div class="source-links">{"".join(links)}</div></article>'
        )
    contacts = section(4, "Контакты учреждений", "vyborg-centers",
        '<div class="section-heading"><div><h2>К кому обратиться</h2><p>Общие контакты двух учреждений, которые ведут площадки района.</p></div></div>'
        f'<div class="organization-grid">{"".join(organizations)}</div>',
        "У «Феникса» и «Фестиваля» нет прямых телефонов в городском PDF. Общий телефон «Форпоста» нужно проверить перед публикацией.")
    join = section(5, "Условия участия", "vyborg-visit",
        '<div class="center-copy"><h2>Перед первым занятием</h2><p>Направления указаны как бесплатные. Уточни условия конкретной группы перед визитом.</p></div>'
        '<div class="simple-grid four">'
        '<div class="info-card"><b>01</b><h3>Стоимость</h3><p>Бесплатные направления для молодёжи.</p></div>'
        '<div class="info-card"><b>02</b><h3>Возраст</h3><p>Спроси, подходит ли группа тебе.</p></div>'
        '<div class="info-card"><b>03</b><h3>Расписание</h3><p>Уточни дни, время и наличие мест.</p></div>'
        '<div class="info-card"><b>04</b><h3>Запись</h3><p>Узнай, как присоединиться к занятиям.</p></div>'
        '</div>',
        "Общее правило проекта: ПМК работают бесплатно для молодёжи 14-35 лет. Возраст и набор отдельных программ, включая ДМ и МДЦ, требуют подтверждения.")
    source = section(6, "Источники и уточнения", "vyborg-sources",
        '<div class="split-block"><div><h2>Данные для макета</h2><p>Список площадок, направления и контакты взяты из двух документов городской базы учреждений.</p>'
        '<p>Дата загрузки PDF в базе: 01.06.2026. Она не означает, что каждая секция и контакт проверены в этот день.</p>'
        '<p>В документе «МИРа» есть адрес: пр. Просвещения, д. 54, лит. А. Название площадки и другие сведения не указаны. Нужно уточнить её статус.</p></div>'
        '<div class="source-links">'
        '<a href="https://www.spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a>'
        '<a href="https://www.spbdm.ru/upload/iblock/063/7051ownqhxd54askq58jiy80ekffhbrl/%D0%9F%D0%9C%D0%A6%20%D0%9C%D0%98%D0%A0.pdf" target="_blank" rel="noopener noreferrer">PDF ПМЦ «МИР» ↗</a>'
        '<a href="https://www.spbdm.ru/upload/iblock/3e0/xu0334gk9w5a3qy2t6vlchha49a4j7kt/%D0%94%D0%9C%20%D0%A4%D0%9E%D0%A0%D0%9F%D0%9E%D0%A1%D0%A2.pdf" target="_blank" rel="noopener noreferrer">PDF Дома молодёжи «Форпост» ↗</a>'
        '</div></div>',
        "Сверить состав площадок, адреса, входы, контакты, возраст, запись, набор и права на будущий фон hero.")
    return page("Выборгский район", "Клубы и молодёжные площадки Выборгского района", hero + finder + listing + contacts + join + source, base="../", active="districts")


def make_kalininsky() -> str:
    total = len(KALININ_CLUBS)
    topics = "".join(
        f'<button class="filter-chip" type="button" data-topic="{key}" aria-pressed="false">{text(label)}</button>'
        for key, label, _ in TOPICS
    )
    hero = section(1, "Обзор района", "kalinin-intro",
        breadcrumb([("Главная", "../index.html"), ("Районы", "index.html"), ("Калининский", None)])
        + '<div class="district-photo-stage">'
        + district_photo_backdrop(("Калининский район", "Финляндский вокзал"), generated=False)
        + '<div class="district-photo-foreground"><div><p class="eyebrow">Бесплатные возможности для молодёжи 14-35 лет</p><h1>Калининский район</h1>'
        '<p class="lead">19 клубов и молодёжных пространств, центр #Водинголос и Дом молодёжи «Атлант». Найди площадку по интересу.</p>'
        + button("Смотреть площадки", "#club-list") + '</div>'
        + f'<div class="stat-box"><strong>{total}</strong><span>площадка в макете</span></div></div></div>',
        "Финляндский вокзал: знаковая архитектура района. Здесь подписанная фото-заглушка на всю ширину hero. Изображение ещё нужно выбрать и согласовать.",
        "hero-band district-photo-wire")
    finder = section(2, "Поиск по площадкам", "kalinin-search",
        '<div class="section-heading"><div><h2>Что тебе интересно?</h2><p>Ищи по названию, адресу или занятию. Можно выбрать тему.</p></div>'
        '<label class="search-label">Поиск площадки<input id="club-search" type="search" placeholder="Например, керамика или Руставели"></label></div>'
        '<div class="filter-row" role="group" aria-label="Направление">'
        '<button class="filter-chip active" type="button" data-topic="all" aria-pressed="true">Все</button>' + topics + '</div>'
        f'<p class="result-counter" id="club-count" aria-live="polite">Показана {total} площадка</p>',
        "Фильтр работает по направлениям из открытых материалов ПМЦ. Действующий набор нужно проверять отдельно.")
    listing = section(3, "Площадки района", "club-list",
        '<div class="section-heading"><div><h2>Клубы и пространства</h2><p>В карточке площадки: занятия, адрес, телефон и ссылка на ПМЦ.</p></div></div>'
        f'<div class="linked-grid three" id="club-grid">{"".join(club_card(club, "../", "clubs/kalininsky") for club in KALININ_CLUBS)}</div>'
        '<p class="empty-message" id="club-empty" hidden>Подходящих площадок не найдено. Попробуй другой запрос.</p>',
        "Список 19 клубов и пространств, #Водинголос и «Атлант» сверён со страницей администрации. Типы отдельных площадок уточнены по сайту ПМЦ.")
    org = KALININ_ORGANIZATIONS["kalininsky"]
    contacts = section(4, "Контакты ПМЦ", "kalinin-contact",
        '<div class="section-heading"><div><h2>К кому обратиться</h2><p>Общий контакт центра и телефоны отдельных площадок в карточках.</p></div></div>'
        '<div class="organization-grid"><article class="organization-card">'
        f'<p class="eyebrow">Учреждение района</p><h3>{text(org["name"])}</h3>'
        f'<div class="contact-row"><span>Адрес</span><strong>{text(org["address"])}</strong></div>'
        f'<div class="contact-row"><span>Телефон</span><strong>{text(org["phone"])}</strong></div>'
        f'<div class="contact-row"><span>Почта</span><strong><a href="mailto:{escape(org["email"])}">{text(org["email"])}</a></strong></div>'
        f'<div class="source-links"><a href="{escape(org["site"])}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ ↗</a></div>'
        '</article></div>',
        "Контакты центра взяты со страницы администрации района. Телефоны «Атланта» в разных источниках расходятся: перед продом нужна сверка.")
    join = section(5, "Условия участия", "kalinin-visit",
        '<div class="center-copy"><h2>Перед первым занятием</h2><p>ПМЦ сообщает о бесплатных занятиях для молодёжи 14-35 лет. Условия группы лучше уточнить перед визитом.</p></div>'
        '<div class="simple-grid four">'
        '<div class="info-card"><b>01</b><h3>Возраст</h3><p>Узнай возраст группы.</p></div>'
        '<div class="info-card"><b>02</b><h3>Расписание</h3><p>Проверь дни и время.</p></div>'
        '<div class="info-card"><b>03</b><h3>Набор</h3><p>Спроси про свободные места.</p></div>'
        '<div class="info-card"><b>04</b><h3>Допуск</h3><p>Уточни, нужна ли справка для спорта и танцев.</p></div>'
        '</div>',
        "В каталоге перечислены направления бесплатных занятий. ПМЦ также ведёт платные детские студии; их сюда не включали.")
    source = section(6, "Источники и сверка", "kalinin-sources",
        '<div class="split-block"><div><h2>Что взято из открытых материалов</h2>'
        '<p>Состав площадок, адреса и телефоны: страница администрации района. Примеры занятий: сайт ПМЦ «Калининский».</p>'
        '<p>Действующее расписание, набор и условия участия могут отличаться. Контакты некоторых площадок в источниках расходятся.</p></div>'
        '<div class="source-links">'
        f'<a href="{KALININ_SOURCE}" target="_blank" rel="noopener noreferrer">Администрация района ↗</a>'
        '<a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a>'
        f'<a href="{escape(org["site"])}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ ↗</a>'
        '</div></div>',
        "Перед переносом в прод проверить состав площадок, название «Пионера», номера телефонов, программы, набор и изображение вокзала.")
    return page("Калининский район", "Клубы и молодёжные площадки Калининского района", hero + finder + listing + contacts + join + source, base="../", active="districts")


def make_pending_district(name: str, code: str) -> str:
    hero = section(1, "Страница района", "district-intro",
        breadcrumb([("Главная", "../index.html"), ("Районы", "index.html"), (name, None)])
        + f'<div class="split-block hero-split district-hero"><div><p class="eyebrow">Район Петербурга</p><h1>{text(name)} район</h1>'
        '<p class="lead">Здесь появятся проверенные адреса, направления и контакты подростково-молодёжных клубов.</p></div>'
        + landmark_placeholder(("Знаковое место района", "выберем при наполнении страницы"))
        + '</div>',
        "Страница предусмотрена в структуре. Образ для hero выберем, когда начнём собирать сведения о районе.", "hero-band")
    pending = section(2, "Наполнение в работе", "pending",
        '<div class="split-block"><div><h2>Список клубов готовится</h2>'
        '<p>Пока можно открыть районный список или городскую базу учреждений.</p></div>'
        '<div class="button-column">' + button("Все районы", "index.html")
        + button("Городская база ↗", "https://spbdm.ru/baza-uchrezhdeniy/", True) + '</div></div>',
        "Добавить клубы только после проверки адресов, программ и контактов.")
    example = section(3, "Пример готового района", "example",
        '<div class="split-block"><div><h2>Смотри Василеостровский район</h2>'
        '<p>Уже открыты каталоги четырёх районов. В Василеостровском есть поиск, карточки клубов и ссылки на организаторов.</p></div>'
        + button("Открыть район", "vasileostrovsky.html") + '</div>',
        "Показываем рабочий сценарий, пока этот район наполняется.")
    return page(f"{name} район", f"Прототип страницы района: {name}", hero + pending + example, base="../", active="districts")


def make_club(
    club: dict,
    district_name: str = "Василеостровский",
    district_code: str = "vasileostrovsky",
    base: str = "../",
) -> str:
    name = club["name"]
    activity_items = "".join(f'<li>{text(item)}</li>' for item in club["activities"])
    activities = f'<ul class="activity-list">{activity_items}</ul>' if activity_items else '<p>Направления уточняются у организатора.</p>'
    club_type = club["type"]
    organizations = {"vyborgsky": VYBORG_ORGANIZATIONS, "admiralteysky": ADMIRAL_ORGANIZATIONS, "kalininsky": KALININ_ORGANIZATIONS}.get(district_code, {})
    organization = organizations.get(club.get("organization", ""))
    if organization:
        club_type += f' · {organization["name"]}'
    institution_url = club.get("officialUrl") or (organization.get("site", "") if organization else "")
    district_href = f'{base}districts/{district_code}.html'
    activity_intro = (
        "ПМЦ относит эти направления к бесплатным занятиям для молодёжи. Возраст и набор каждой группы нужно уточнить."
        if district_code == "kalininsky" else
        "Направления указаны в списке ПМЦ от 12.10.2026. Условия участия и действующие группы нужно уточнить."
        if district_code == "vasileostrovsky" else
        "Направления из открытых материалов по этой площадке."
    )
    hero = section(1, "Кратко о площадке", "club-intro",
        breadcrumb([("Главная", f"{base}index.html"), (f"{district_name} район", district_href), (name, None)])
        + f'<div class="club-hero-copy"><p class="eyebrow">{text(club_type)}</p><h1>{text(name)}</h1>'
        f'<p class="lead">{text(club["address"])}</p></div>',
        "Тип площадки и адрес должны быть сразу видны. Проверить действующий адрес и вход.", "hero-band")
    directions = section(2, "Направления", "activities",
        f'<div class="split-block"><div><h2>Чем можно заняться</h2><p>{text(activity_intro)}</p></div>{activities}</div>',
        "Подтвердить, какие группы работают сейчас, возраст, расписание и наличие мест.")
    phone = club.get("phone") or ""
    phone_label = "Телефон из списка ПМЦ" if district_code == "vasileostrovsky" else "Телефон из открытого источника"
    phone_html = f'<div class="contact-row"><span>{phone_label}</span><strong>{text(phone)}</strong></div>' if phone else '<div class="contact-row"><span>Телефон</span><strong>Уточняется</strong></div>'
    email = club.get("email") or ""
    email_html = f'<div class="contact-row"><span>Email из документа</span><strong><a href="mailto:{escape(email)}">{text(email)}</a></strong></div>' if email else ""
    links = []
    if institution_url:
        links.append(button("Сайт учреждения ↗", institution_url))
    if club.get("vkUrl"):
        links.append(button("Сообщество ВКонтакте ↗", club["vkUrl"], True))
    elif organization and organization.get("vk"):
        links.append(button("Сообщество учреждения ↗", organization["vk"], True))
    contacts = section(3, "Адрес и контакты", "contacts",
        f'<div class="split-block"><div><h2>Как связаться</h2><div class="contact-row"><span>Адрес</span><strong>{text(club["address"])}</strong></div>{phone_html}{email_html}</div>'
        f'<div class="button-column">{"".join(links)}</div></div>',
        "Проверить актуальность телефона, адреса, входа и страниц организатора.")
    join = section(4, "Порядок участия", "how-to-join",
        '<div class="center-copy"><h2>Перед первым визитом</h2><p>Открой страницу организатора и уточни четыре вещи.</p></div>'
        '<div class="simple-grid four">'
        '<div class="info-card"><b>01</b><h3>Возраст</h3><p>Для кого группа.</p></div>'
        '<div class="info-card"><b>02</b><h3>Время</h3><p>Когда занятия.</p></div>'
        '<div class="info-card"><b>03</b><h3>Набор</h3><p>Есть ли места.</p></div>'
        '<div class="info-card"><b>04</b><h3>Запись</h3><p>Как присоединиться.</p></div>'
        '</div>',
        "Сейчас нет подтверждённого расписания и формы записи. Добавить их после сверки.")
    source_copy = (text("Адрес, телефон и направления обновлены по списку ПМЦ от 12.10.2026. Перед поездкой проверь их у организатора.")
                   if district_code == "vasileostrovsky" else
                   "Список направлений и контактов составлен по открытым материалам. Перед поездкой проверь их у организатора.")
    source_link_label = "Сайт ПМЦ ВО ↗" if district_code == "vasileostrovsky" else "Источник направлений ↗"
    source = section(5, "Основа карточки", "source",
        f'<div class="split-block"><div><h2>Откуда сведения</h2><p>{source_copy}</p></div>'
        '<div class="source-links">'
        f'<a href="{escape(club.get("sourceUrl", "https://spbdm.ru/baza-uchrezhdeniy/"))}" target="_blank" rel="noopener noreferrer">{source_link_label}</a>'
        + (f'<a href="{KALININ_SOURCE}" target="_blank" rel="noopener noreferrer">Адрес и телефон ↗</a>' if district_code == "kalininsky" else '')
        + f'<a href="{escape(district_href)}">Все клубы района →</a></div></div>',
        "Добавить дату проверки и подтверждённого ответственного за обновления.")
    active = "districts" if district_code != "vasileostrovsky" else "vo"
    return page(name, f"Прототип карточки клуба {name}", hero + directions + contacts + join + source, base=base, active=active)


def write(relative: str, content: str) -> None:
    target = OUTPUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def main() -> None:
    assert len(CLUBS) == 32
    assert len(DISTRICTS) == 18
    # The remaining district and club wireframes are synchronized from dist/
    # by sync-local.py. Keep their saved pages intact here.
    write("index.html", make_home())
    write("districts/index.html", make_district_index())
    write("districts/vasileostrovsky.html", make_vo())
    assets = OUTPUT / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    for asset in ["wire.css", "app.js", "comments.js", "map-preview.js"]:
        shutil.copy2(ROOT / "assets" / asset, assets / asset)
    api = OUTPUT / "api"
    api.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "api" / "comments.php", api / "comments.php")
    print(f"Built 3 custom prototype pages in {OUTPUT}")


if __name__ == "__main__":
    main()
