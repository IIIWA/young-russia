import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = 'YoungRussiaOBS/Источники/ВК/ВК ПМК Выборгского района.md';
const text = (await fs.readFile(path.join(root, sourceFile), 'utf8')).replace(/\r\n/g, '\n');
const lines = text.split('\n');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/clubs-vyborgsky.json'), 'utf8'));
const centerContacts = JSON.parse(await fs.readFile(path.join(root, 'data/research/pmc-centers-contacts.json'), 'utf8'));
const clubNames = new Set(catalog.map(club => club.name));
const entry = (club, title, from, to, scheduleFrom = from, scheduleTo = to) => ({ club, title, from, to, scheduleFrom, scheduleTo });

// The VK export repeats the parent page title before every post. These ranges
// attach each named post to its explicitly stated venue, not to a guessed club.
const sections = [
  entry('Форпост', 'Театр-студия «Возвращение»', 192, 240),
  entry('Форпост', 'Студия оригинального жанра Way OUT', 241, 282),
  entry('Форпост', 'Студия танца Just Dance', 283, 322),
  entry('Форпост', 'Ирландские танцы Fianna', 323, 360),
  entry('Форпост', 'Студия интерьерного вязания', 361, 408, 373, 376),
  entry('Фестиваль', 'Студия интерьерного вязания', 361, 408, 377, 380),
  entry('Форпост', 'Добровольцы Дома молодёжи', 409, 428),
  entry('Форпост', 'Вокальная студия «Созвучие»', 429, 463),
  entry('Форпост', 'Коллектив «Феерия», студия «Ударная»', 464, 505),
  entry('Форпост', 'Студия керамики «АРТ-формула»', 506, 550),
  entry('Феникс', 'Медиаклуб «ФОРПОСТ-ТВ»', 551, 577),
  entry('Феникс', 'Цирковая студия «Ника»', 607, 644),
  entry('Феникс', 'Военно-исторический клуб «6-й егерский»', 645, 671),
  entry('Феникс', 'Клуб «Живая история»', 672, 694),
  entry('Феникс', 'Исторический клуб', 695, 724),
  entry('Феникс', 'Клуб видеоблогинга «Фокус»', 725, 747),
  entry('Форпост', 'Танцевальное сообщество LOVA', 748, 785),
  entry('Форпост', 'Молодёжный театр ТИК', 786, 834),
  entry('Форпост', 'Jumpstyle SPB', 835, 867),
  entry('Фестиваль', 'Английский язык', 868, 906),
  entry('Фестиваль', 'Клуб журналистики «Медиа Взгляд»', 907, 937),
  entry('Фестиваль', 'Школа КВН', 938, 982, 953, 953),
  entry('Форпост', 'Школа КВН', 938, 982, 954, 955),
  entry('Фестиваль', 'Студия росписи фарфора', 983, 1010),
  entry('Фестиваль', 'Студия «Ар-деко»', 1011, 1043),
  entry('Фестиваль', 'Студия HIP-HOP «База»', 1044, 1116),
  entry('Форпост', 'Пространство «Незнакомый Выборгский»', 1117, 1152),
  entry('Фестиваль', 'Танцевальная студия «Кинетика»', 1153, 1185),
  entry('Форпост', 'Вокальная студия «Пульс»', 1186, 1223),
  entry('Форпост', 'Студия авторской песни', 1224, 1259),
  entry('Форпост', 'Клуб йоги', 1291, 1324),
  entry('Феникс', 'Японские танцы «Серебряный веер»', 1325, 1364),
  entry('Феникс', 'Ролевой клуб «Гильдия хроник»', 1365, 1385),
  entry('Центральный', 'Студия вокала FORTE', 1519, 1528),
  entry('Центральный', 'Импровизация «Путь игры»', 1529, 1538),
  entry('Центральный', 'Единоборства MIR', 1539, 1550),
  entry('Центральный', 'Концертный хор «Исток»', 1551, 1560),
  entry('Центральный', 'Фольклорная студия «Оберег»', 1561, 1568),
  entry('Патриот', 'Кружок «Декоретто»', 1600, 1602),
  entry('Патриот', 'Игровой клуб «Игрополис»', 1603, 1605),
  entry('Патриот', 'Кружок «Фантазия»', 1606, 1608),
  entry('Патриот', 'Пространство «Мы вместе»', 1609, 1611),
  entry('Перекрёсток', 'Вокальная студия «Класс сопрано»', 1612, 1627),
  entry('Перекрёсток', 'Семейный клуб «КРУГ»', 1628, 1637),
  entry('Перекрёсток', 'Арт-терапия «Мамина гавань»', 1638, 1649),
  entry('Перекрёсток', 'Этно-мастерская «Божатка»', 1650, 1661),
  entry('Перекрёсток', 'Мастерская живописи «Мультфабрика»', 1662, 1669),
  entry('Перекрёсток', 'Танец «Фламенко»', 1670, 1679),
  entry('Перекрёсток', 'Танцы «Комьюнити Дэнс»', 1680, 1700),
  entry('Перекрёсток', 'Творческая мастерская «Памье-М»', 1701, 1712),
  entry('Перекрёсток', 'Клуб настольных игр «Игротека»', 1713, 1723),
  entry('Перекрёсток', 'Студия «Мастерская искусств»', 1724, 1755),
  entry('Перекрёсток', 'Студия ИЗО «Арт-пространство»', 1756, 1768),
  entry('Перекрёсток', 'Вокальная студия «Вокализ»', 1769, 1810),
  entry('Перекрёсток', 'Студия вокала «Хрустальный голос»', 1811, 1818),
  entry('Перекрёсток', 'Студия вокала «Успех»', 1819, 1830),
  entry('Перекрёсток', 'Музыкальная мастерская «Экспромт»', 1831, 1842),
  entry('Перекрёсток', 'Студия «Орнаменты России»', 1843, 1855),
  entry('Перекрёсток', 'Арт-терапевтическая мастерская', 1856, 1867),
  entry('Перекрёсток', 'Театр-студия «Дель арте»', 1868, 1879),
  entry('Перекрёсток', 'Студия кройки и шитья «Ателье»', 1880, 1893),
  entry('Перекрёсток', 'Семейный клуб «Здоровая семья»', 1894, 1903),
  entry('Перекрёсток', 'Секция «Разумное тело»', 1904, 1917),
  entry('Перекрёсток', 'Студия слова «Диалог»', 1918, 1931),
];

const raw = (from, to) => lines.slice(from - 1, to).join('\n');
const vkUrls = value => [...value.matchAll(/https?:\/\/(?:vk\.ru|vk\.com)\/[^\s<>)"\]]+/g)]
  .map(match => match[0].replace(/[.,;]+$/, ''));
const allowedGroup = url => !/^\/(?:id\d+|video|photo|emoji|wall|away\.php|market|dm_forpost|pmcmir|mirpr46|vredina__milka|danceulitka|lyrevega|aku2013)(?:[/-]|$)/.test(new URL(url).pathname)
  && !/\.(?:png|jpe?g|webp)$/.test(new URL(url).pathname);
const scheduleRows = (from, to) => {
  const rows = [];
  for (let number = from; number <= to; number++) {
    const value = (lines[number - 1] ?? '').trim();
    if (!/\b\d{1,2}[.:]\d{2}\b/.test(value) || /^(?:Отредактировал|#### Открыто|\d+\s+[а-я]{3}\s+20\d\d)/i.test(value)) continue;
    // These are video durations, contact hours and an audition window, not class schedules.
    if (/^\d{1,2}:\d{2}$/.test(value) || /^\d{1,2}\s+[а-я]{3}\s+в\s+\d{1,2}:\d{2}$/i.test(value) || [1196, 1775].includes(number)) continue;
    if (number === 1861) {
      const start = value.indexOf('по понедельника');
      if (start < 0) throw new Error('Missing art therapy schedule on source line 1861');
      rows.push({ line: number, text: value.slice(start).replace(/\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)/g, '[ссылка на запись]') });
      continue;
    }
    if (value.length <= 260) rows.push({ line: number, text: value });
    else {
      const anchorPattern = /(?:📅|РАСПИСАНИЕ:?|Расписание:?|Занятия проходят:?|Наш график|Время:|\b(?:по\s+)?(?:понедельник(?:ам)?|вторник(?:ам)?|сред[ауеы]|средам|четверг(?:ам)?|пятниц[ауеы]|пятницам|суббот[ауеы]|воскресень[еюя]|ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)\b)/gi;
      const anchors = [...value.matchAll(anchorPattern)].map(match => match.index)
        .filter((start, index, all) => index === 0 || start - all[index - 1] > 22);
      const snippets = [];
      for (const [index, start] of anchors.entries()) {
        const end = anchors[index + 1] ?? value.length;
        const part = value.slice(start, end);
        const times = [...part.matchAll(/\b\d{1,2}[.:]\d{2}\b/g)];
        if (!times.length) continue;
        const last = times.at(-1);
        let excerpt = part.slice(0, Math.min(part.length, Math.max(last.index + last[0].length + 35, 90), 320)).trim();
        if (excerpt.length < part.trim().length) excerpt = excerpt.replace(/\s+\S*$/, '') + '…';
        if (!snippets.includes(excerpt)) snippets.push(excerpt);
      }
      if (!snippets.length) {
        const time = value.match(/\b\d{1,2}[.:]\d{2}\b/);
        const start = Math.max(0, value.lastIndexOf(' ', Math.max(0, time.index - 70)) + 1);
        snippets.push(`${start ? '…' : ''}${value.slice(start, Math.min(value.length, time.index + 100)).trim()}…`);
      }
      for (const snippet of snippets) rows.push({ line: number, text: snippet });
    }
  }
  return rows;
};
const candidatePage = (url, sourceStart, sourceEnd) => {
  const fragment = raw(sourceStart, sourceEnd);
  if (!fragment.includes(url)) throw new Error(`VK link missing from note: ${url}`);
  const line = lines.findIndex((item, index) => index + 1 >= sourceStart && index + 1 <= sourceEnd && item.includes(url)) + 1;
  return { url, line, status: 'из заметки; доступность и принадлежность не проверены' };
};
const clubVk = new Map([
  ['Центральный', candidatePage('https://vk.ru/pmk_centerclub', 1440, 1515)],
  ['Ритм', candidatePage('https://vk.ru/club154413619', 1440, 1490)],
  ['Перекрёсток', candidatePage('https://vk.ru/mklub461', 1440, 1490)],
  ['Лидер', candidatePage('https://vk.ru/pmk_leader', 1440, 1490)],
  ['Патриот', candidatePage('https://vk.ru/mirpatriot', 1440, 1580)],
  ['Перспектива', candidatePage('https://vk.ru/mk_perspektiva', 1440, 1490)],
]);

const evidenceSections = sections.map(spec => {
  if (!clubNames.has(spec.club)) throw new Error(`Unknown club: ${spec.club}`);
  const fragment = raw(spec.from, spec.to);
  const candidates = [...new Set(vkUrls(fragment).filter(allowedGroup).map(url => url.split('?')[0]))];
  const product = [...fragment.matchAll(/https?:\/\/vk\.ru\/market\/product\/[^\s<>)"\]]+/g)].map(match => match[0].replace(/[.,;]+$/, ''));
  const groupLinks = candidates.map(url => ({ url, line: lines.findIndex((line, index) => index + 1 >= spec.from && index + 1 <= spec.to && line.includes(url)) + 1 }));
  const productLink = product.find(url => fragment.includes(url));
  const publishedAt = lines.slice(spec.from - 1, spec.to).map(line => line.trim())
    .find(line => /^\d{1,2}\s+(?:янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)\b/i.test(line)) ?? '';
  const people = [];
  const personPattern = /(?:[Рр]уководител(?:ь|я|ем)(?:\s+студии|\s+секции)?|[Хх]удожественный руководитель|[Пп]реподаватель|педагог и хореограф)\s*[:—–-]?\s*\[?([А-ЯЁ][а-яё-]+(?:\s+[А-ЯЁ][а-яё-]+){1,2})/g;
  for (let number = spec.from; number <= spec.to; number++) {
    for (const match of (lines[number - 1] ?? '').matchAll(personPattern)) {
      if (!people.some(person => person.name === match[1])) people.push({ name: match[1], line: number, role: 'упоминание в заметке' });
    }
  }
  let scheduleEvidence = scheduleRows(spec.scheduleFrom, spec.scheduleTo);
  if (spec.title === 'Семейный клуб «КРУГ»') {
    const line = lines[1630] ?? '';
    const named = [
      ['Детский круг (3–7 лет)', 'Среда и пятница: 10:00–12:00 и 15:00–16:00'],
      ['Школьный круг (7–14 лет)', 'Пятница: 13:00–15:00'],
      ['Женский круг', 'Среда: 13:00–15:00'],
    ];
    for (const [activity, schedule] of named) if (!line.includes(activity.split(' (')[0]) || !line.includes(schedule)) {
      throw new Error(`Changed schedule wording for ${activity} on line 1631`);
    }
    scheduleEvidence = named.map(([activity, text]) => ({ activity, line: 1631, text }));
  }
  return {
    catalogClub: spec.club,
    title: spec.title,
    sourceLines: [spec.from, spec.to],
    publishedAt,
    groupLinks,
    productPage: productLink ? { url: productLink, line: lines.findIndex((line, index) => index + 1 >= spec.from && index + 1 <= spec.to && line.includes(productLink)) + 1 } : null,
    people,
    scheduleEvidence,
    status: 'из пользовательской заметки; расписание, условия и актуальность требуют проверки',
  };
});

const centers = [
  { id: 'mir', name: 'ПМЦ «МИР»', vk: candidatePage('https://vk.ru/pmcmir', 2028, 2030), site: 'https://мц-мир.рф/', phone: '', sourceLines: [1386, 1498] },
  { id: 'forpost', name: 'Дом молодёжи «Форпост»', vk: candidatePage('https://vk.ru/dm_forpost', 1, 175), site: 'http://дм-форпост.рф/', phone: '+7 (812) 542-24-07', sourceLines: [1, 171] },
];
for (const center of centers) {
  const canonical = centerContacts.find(item => item.id === center.id);
  if (canonical?.links.site) {
    center.site = canonical.links.site;
    center.siteSource = canonical.siteSource;
    center.siteCheckedAt = canonical.siteCheckedAt;
  }
}
if (evidenceSections.length < 60) throw new Error('Incomplete Vyborgsky note segmentation');
const result = {
  sourceFile,
  created: '2026-10-21',
  purpose: 'Внутреннее исследование из присланной заметки; данные не подтверждены для публикации.',
  centers,
  unassigned: [
    { title: 'Военно-исторический клуб «6-й егерский»', sourceLines: [578, 606], reason: 'площадка в этой публикации не названа; другой раздел прямо указывает «Феникс»' },
    { title: 'Молодёжное объединение «ДВИЖ»', sourceLines: [1260, 1290], reason: 'публикация относится к учреждению, площадка не указана' },
    { title: 'Список сообществ «Перекрёстка»', sourceLines: [1932, 2100], reason: 'связи с отдельными направлениями требуют ручной сверки' },
  ],
  clubVk: Object.fromEntries(clubVk),
  clubVkAlternates: { 'Перекрёсток': [candidatePage('https://vk.com/mirpr46', 1769, 1810)] },
  sections: evidenceSections,
  summary: {
    catalogClubs: catalog.length,
    sections: evidenceSections.length,
    withSections: catalog.filter(club => evidenceSections.some(section => section.catalogClub === club.name)).length,
    withClubVk: clubVk.size,
    scheduleFragments: evidenceSections.reduce((sum, section) => sum + section.scheduleEvidence.length, 0),
  },
};
await writeGeneratedFile(path.join(root, 'data/research/vyborgsky-note-evidence.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result.summary));
