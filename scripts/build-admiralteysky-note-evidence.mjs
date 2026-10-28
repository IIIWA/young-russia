import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = 'YoungRussiaOBS/Источники/ВК/ВК ПМК Адмиралтейского района.md';
const source = await fs.readFile(path.join(root, sourcePath), 'utf8');
const lines = source.replace(/\r\n/g, '\n').split('\n');
if (lines.at(-1) === '') lines.pop();
const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/clubs-admiralteysky.json'), 'utf8'));

// A section is tied to an exact heading, so adding more material to the note
// does not silently assign it to an adjacent club.
const definitions = [
  { id: 'center', heading: '#### Центр "Адмиралтейский"', kind: 'center' },
  { id: 'nadezhda', heading: '#### Молодежный клуб «Надежда»', club: 'Молодёжный клуб «Надежда»' },
  { id: 'selena', heading: '#### Молодёжный клуб "Селена" | Танцы', club: 'Молодёжный клуб «Селена»' },
  { id: 'potok', heading: '#### Молодёжное пространство «Поток»', club: 'Молодёжное пространство «Поток»' },
  { id: 'orfey', heading: '#### Молодежный клуб "Орфей" | танец для души', club: 'Молодёжный клуб «Орфей»' },
  { id: 'ellada', heading: '#### Клуб ЭЛЛАДА | Бесплатно для молодежи', club: 'Молодёжный клуб «Эллада»' },
  { id: 'vdohnovenie', heading: '#### Молодёжный клуб "Вдохновение"', club: 'Молодёжный клуб «Вдохновение»' },
  { id: 'tourist-vdohnovenie', heading: '#### Туристский клуб "Вдохновение"', club: 'Молодёжный клуб «Вдохновение»', relation: 'Отдельное сообщество туристского направления; связь с клубом требует сверки.' },
  { id: 'sozvuchie', heading: '#### Молодёжный клуб «Созвучие»', club: 'Молодёжный клуб «Созвучие»' },
  { id: 'studiya-tsveta', heading: '#### "Студия цвета" Бесплатные занятия творчеством', club: 'Молодёжный клуб «Созвучие»', relation: 'Сообщество отдельной студии; связь с конкретным занятием требует сверки.' },
  { id: 'peterburgskie-lvy', heading: '#### Клуб Петербургские львы', club: 'Молодёжный клуб «Петербургские львы»' },
  { id: 'gorod', heading: '#### Творческое пространство «Город»', club: 'Молодёжный клуб «Город»' },
  { id: 'meridian', heading: '#### Молодежный спортивный клуб «Меридиан»', club: 'Молодёжный клуб «Меридиан»' },
  { id: 'perspektiva', heading: '#### Арт-пространство Перспектива', club: 'Молодёжный клуб «Перспектива»' },
  { id: 'admiralteets', heading: '#### КЮМ «Адмиралтеец»| Адмиралтейский район', club: 'Клуб юных моряков «Адмиралтеец»' },
  { id: 'forward', heading: '#### Футбольный клуб Форвард | Адмиралтейский район', club: 'Молодёжный футбольный клуб «Форвард»' },
  { id: 'globus', heading: '#### Пространство "Глобус"/ Центр "Адмиралтейский"', club: 'Молодёжный клуб «Глобус»' },
  { id: 'palestra', heading: '#### Молодёжный клуб «Палестра» | Каратэ | СПб', club: 'Молодёжный клуб «Палестра»' },
  { id: 'ideal', heading: '#### Молодёжный клуб "Идеал" | Бесплатные занятия', club: 'Молодёжный клуб «Идеал»' },
  { id: 'poisk', heading: '#### Молодежный клуб «Поиск»', club: 'Молодёжный клуб «Поиск»' },
  { id: 'mozaika', heading: '#### Молодежная психологическая служба «Мозаика»', club: 'Психологическая служба «Мозаика»' },
  { id: 'teatralka', heading: '#### ТЕАТРАЛКА', club: 'Молодёжный клуб «Ритм»', relation: 'В каталоге у «Ритма» указано это сообщество; название и адрес площадки требуют сверки.' },
  { id: 'kamin', heading: '#### Студия КАМИН / бесплатно для молодёжи', club: 'Студия «КАМИН»' },
  { id: 'nashe-mesto', heading: '#### Наше место', club: 'Молодёжный клуб «Коломбина»', relation: 'В заметке прямо указано, что «Наше место» — ПМК «Коломбина».' },
];

function locate(heading) {
  const matches = lines.flatMap((line, index) => line.trimEnd() === heading ? [index] : []);
  if (matches.length !== 1) throw new Error(`Ожидался один заголовок «${heading}», найдено: ${matches.length}`);
  return matches[0];
}

const starts = definitions.map((definition) => locate(definition.heading));
if (starts.some((start, index) => index > 0 && start <= starts[index - 1])) {
  throw new Error('Порядок разделов заметки изменился; проверьте сопоставления.');
}

function normalizePhone(value) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function dedupe(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function linkKind(url) {
  if (/^https:\/\/vk\.(ru|com)\//i.test(url)) return 'vk';
  if (/^https:\/\/t\.me\//i.test(url)) return 'telegram';
  if (/^https:\/\/max\.ru\//i.test(url)) return 'max';
  if (/^https:\/\/yandex\.ru\/maps\//i.test(url)) return 'yandexMap';
  return 'website';
}

function unwrap(url) {
  if (!/^https:\/\/vk\.ru\/away\.php\?/i.test(url)) return url.replace(/\\([()])/g, '$1');
  try {
    return new URL(url.replace(/\\([()])/g, '$1')).searchParams.get('to') || url;
  } catch {
    return url;
  }
}

function parseSection(definition, start, end) {
  const rows = lines.slice(start, end + 1);
  const numbered = rows.map((text, offset) => ({ line: start + offset + 1, text: text.trim() }));
  const primaryPhone = numbered
    .filter(({ text }) => /^#### \[.*\]\(tel:/i.test(text))
    .map(({ line, text }) => ({ value: normalizePhone(text.match(/^#### \[([^\]]+)\]/)?.[1] || ''), line }));
  const phoneLinks = numbered.flatMap(({ line, text }) => [...text.matchAll(/\[([^\]]+)\]\(tel:[^)]+\)/gi)]
    .map((match) => ({ value: normalizePhone(match[1]), line })))
    .filter(({ value }) => /\d/.test(value));
  const emails = numbered.flatMap(({ line, text }) => [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)]
    .map((match) => ({ value: match[0], line })));
  const plainPhoneCandidates = numbered.flatMap(({ line, text }) => {
    if (/^!\[|^\]\(/.test(text)) return [];
    return [...text.matchAll(/(?:\+7[\s()\-]*|\b8[\s()\-]*)\d[\d\s()\-]{8,15}\d/g)]
      .map((match) => ({ value: normalizePhone(match[0]), line }))
      .filter(({ value }) => value.replace(/\D/g, '').length === 11);
  });
  const pageHandle = numbered.find(({ text }) => /^#### [a-z][a-z0-9_.-]*$/i.test(text) &&
    !/^(История|Туризм)$/i.test(text.slice(5)))?.text.slice(5) || '';

  const links = [];
  for (const { line, text } of numbered) {
    for (const match of text.matchAll(/\]\((https?:\/\/[^\s)]+(?:\\\)[^\s)]*)*)\)/g)) {
      const url = unwrap(match[1]);
      if (!/^https?:\/\//i.test(url) || /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(url)) continue;
      if (/^(https?:\/\/)(?:sun\d+-\d+\.|sun\d+\.|pp\.|iv\.)/i.test(url)) continue;
      links.push({ url, kind: linkKind(url), line });
    }
  }
  if (pageHandle) links.unshift({ url: `https://vk.ru/${pageHandle}`, kind: 'vk', line: numbered.find(({ text }) => text === `#### ${pageHandle}`).line, role: 'страница раздела' });

  const addressEvidence = numbered.filter(({ text }) => {
    if (!text || /^!\[|^\]\(|^\[/.test(text)) return false;
    return /(?:ул\.|улиц[аеыу]|наб\.|набережн|проспект|пр\.|переулок|пер\.|канала|линия)/i.test(text);
  }).map(({ line, text }) => ({ line, text: text.length <= 700 ? text : `${text.slice(0, 700)}…` }));

  const people = [];
  const contactsStart = numbered.findIndex(({ text }) => text === 'Контакты');
  for (let index = 0; index < numbered.length; index++) {
    if (contactsStart < 0 || index <= contactsStart) continue;
    const match = numbered[index].text.match(/^!\[([^\]]+)\]\(https?:\/\//);
    if (!match) continue;
    const name = match[1].trim();
    const close = numbered.slice(index + 1, Math.min(index + 12, numbered.length))
      .find((row) => /^\]\(https:\/\/vk\.ru\/(?!away\.php)/.test(row.text));
    if (!close) continue;
    const between = numbered.slice(index + 1, close.line - (start + 1));
    const role = between.map((row) => row.text).filter((value) => value && value !== name && !/^\[|^!|^\]|^\d+$/.test(value))[0];
    if (!role || !/директор|администратор|завед|руковод|специалист|тренер|педагог|волонт|художник|организатор|импровизац|вокал|танц|блог|туризм|гитар|английск|фото|йог|вышив|мастер|очага|психолог/i.test(role)) continue;
    people.push({ name, role, profileUrl: close.text.match(/^\]\((https:\/\/vk\.ru\/[^)]+)\)/)?.[1] || '', sourceLine: numbered[index].line });
  }

  const schedulePattern = /расписани|режим работы|график работы|\b(?:ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)\s*:|(?:понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)|\b\d{1,2}[.:]\s?\d{2}\s*[-–—]\s*\d{1,2}[.:]\s?\d{2}\b|с\s+\d{1,2}\s+до\s+\d{1,2}\s+час/gi;
  const scheduleEvidence = numbered.flatMap(({ line, text }) => {
    if (!text || /^!\[|^\]\(/.test(text)) return [];
    const matches = [...text.matchAll(schedulePattern)];
    if (!matches.length) return [];
    if (text.length <= 1200) return [{ line, text }];
    return matches.map((match) => ({ line, text: `${match.index > 160 ? '…' : ''}${text.slice(Math.max(0, match.index - 160), Math.min(text.length, match.index + 230))}${match.index + 230 < text.length ? '…' : ''}` }));
  });
  const contactEvidence = numbered.filter(({ text }) => text && text.length <= 800 &&
    !/^!\[|^\]\(/.test(text) &&
    /заведующ|специалист|руководител|педагог|тренер|по всем вопросам/i.test(text))
    .map(({ line, text }) => ({ line, text }));

  return {
    id: definition.id,
    title: definition.heading.slice(5),
    kind: definition.kind || 'clubOrCommunity',
    ...(definition.club ? { catalogClub: definition.club } : {}),
    ...(definition.relation ? { relationToCatalog: definition.relation } : {}),
    sourceLines: [start + 1, end + 1],
    pageHandle: pageHandle || null,
    primaryPhones: dedupe(primaryPhone, (item) => item.value),
    otherPhoneCandidates: dedupe([...phoneLinks, ...plainPhoneCandidates].filter((item) => !primaryPhone.some((primary) => primary.value === item.value)), (item) => item.value),
    emails: dedupe(emails, (item) => item.value.toLowerCase()),
    addressEvidence,
    links: dedupe(links, (item) => item.url),
    people: dedupe(people, (item) => `${item.name}|${item.profileUrl}`),
    contactEvidence,
    scheduleEvidence,
  };
}

const sections = definitions.map((definition, index) => parseSection(definition, starts[index], index + 1 < starts.length ? starts[index + 1] - 1 : lines.length - 1));
const clubNames = new Set(catalog.map((club) => club.name));
for (const definition of definitions) {
  if (definition.club && !clubNames.has(definition.club)) throw new Error(`Клуб отсутствует в каталоге: ${definition.club}`);
}

const centerClubLinks = sections[0].links.filter((link) => link.kind === 'vk' && link.line >= 40 && link.line <= 222)
  .map((link) => {
    const preceding = lines.slice(Math.max(0, link.line - 7), link.line - 1)
      .map((line) => line.trim()).filter((line) => line && !/^\[|^!|^\]|^\d+$/.test(line));
    const catalogClub = catalog.find((club) => club.vkUrl && new URL(club.vkUrl).pathname.toLowerCase() === new URL(link.url).pathname.toLowerCase());
    return {
      ...link,
      label: preceding.at(-1) || '',
      catalogClub: catalogClub?.name || (new URL(link.url).pathname.toLowerCase() === '/mkselena' ? 'Молодёжный клуб «Селена»' : null),
    };
  });

const catalogClubs = catalog.map((club, index) => ({
  catalogId: `admiralteysky:${index + 1}`,
  name: club.name,
  currentAddress: club.address,
  currentPhone: club.phone,
  currentVkUrl: club.vkUrl || '',
  activityPages: club.activityPages ?? [],
  activitySchedule: club.activitySchedule ?? [],
  noteSectionIds: sections.filter((section) => section.catalogClub === club.name).map((section) => section.id),
  centerLinkEvidence: centerClubLinks.filter((link) => link.catalogClub === club.name),
  reviewStatus: ['Молодёжное пространство «Поток»', 'Студия «КАМИН»'].includes(club.name)
    ? 'название и сведения из заметки подтверждены пользователем 18.10.2026'
    : ['Клуб юных моряков «Адмиралтеец»', 'Молодёжный клуб «Селена»', 'Молодёжный клуб «Поиск»', 'Молодёжный клуб «Ритм»'].includes(club.name)
      ? 'часть данных подтверждена пользователем 18.10.2026; остальные сведения требуют сверки'
      : 'данные из заметки требуют сверки до переноса на сайт',
}));

const reviewIssues = [];
for (const item of catalogClubs) {
  for (const section of sections.filter((candidate) => item.noteSectionIds.includes(candidate.id))) {
    if (section.primaryPhones.length && item.currentPhone && !section.primaryPhones.some(({ value }) => item.currentPhone.replace(/\D/g, '').endsWith(value.replace(/\D/g, '').slice(-7)))) {
      reviewIssues.push({ catalogClub: item.name, field: 'phone', catalogValue: item.currentPhone, noteValue: section.primaryPhones[0].value, sourceLine: section.primaryPhones[0].line });
    }
    if (!section.relationToCatalog && section.pageHandle && item.currentVkUrl && new URL(item.currentVkUrl).pathname.toLowerCase() !== `/${section.pageHandle.toLowerCase()}`) {
      reviewIssues.push({ catalogClub: item.name, field: 'vk', catalogValue: item.currentVkUrl, noteValue: `https://vk.ru/${section.pageHandle}`, sourceLine: section.links.find((link) => link.role === 'страница раздела')?.line });
    }
  }
}
const confirmedUpdates = [
  { catalogClub: 'Клуб юных моряков «Адмиралтеец»', fields: ['activities', 'activityPages', 'specialists', 'communityContact'], confirmedAt: '2026-10-18', source: 'сообщение пользователя', values: { thaiBoxing: { activity: 'Тайский бокс', vkUrl: 'https://vk.ru/club230671761', specialist: 'Корбат Евгений Евгениевич' }, boxing: { activity: 'Бокс', vkUrl: 'https://vk.ru/club227328252', specialist: 'Гасанов М. Р.', communityContact: { displayName: 'Mike Leon', profileUrl: 'https://vk.ru/id432011892', role: 'контакт сообщества; роль в секции не уточнена' } } } },
  { catalogClub: 'Клуб юных моряков «Адмиралтеец»', fields: ['activitySchedule'], confirmedAt: '2026-10-19', source: 'сообщение пользователя', values: { activity: 'Бокс', day: { mondayToFriday: '17:00', saturday: '16:00' }, evening: { mondayToFriday: '18:15' }, timeMeaning: 'время начала; окончание не указано' } },
  { catalogClub: 'Молодёжный клуб «Селена»', fields: ['vkUrl', 'phone'], confirmedAt: '2026-10-18', source: 'сообщение пользователя', values: { vkUrl: 'https://vk.ru/mkselena', phone: '+7 (812) 246-66-84' } },
  { catalogClub: 'Молодёжный клуб «Поиск»', fields: ['address', 'coordinates'], confirmedAt: '2026-10-18', source: 'сообщение пользователя', values: { address: 'ул. Розенштейна, д. 1', latitude: 59.908039, longitude: 30.292988, referenceUrl: 'https://yandex.ru/maps/-/CXFbzBZ7' } },
  { catalogClub: 'Молодёжный клуб «Ритм»', fields: ['address', 'entrance', 'coordinates'], confirmedAt: '2026-10-18', source: 'сообщение пользователя', values: { address: 'Галерная ул., д. 52', entrance: 'вход с наб. Адмиралтейского канала, д. 27, флигель во дворе', latitude: 59.930346, longitude: 30.286607, referenceUrl: 'https://yandex.ru/maps/-/CXFb7Q6z' } },
  { catalogClub: 'Молодёжное пространство «Поток»', fields: ['name', 'phone', 'vkUrl', 'openingHours', 'classSchedule', 'address'], confirmedAt: '2026-10-18', source: 'сообщение пользователя и его заметка', values: { name: 'Молодёжное пространство «Поток»', previousName: 'Молодёжный клуб «Славяне»', phone: '+7 (812) 246-34-45', vkUrl: 'https://vk.ru/mppotok', address: 'Рузовская ул., д. 25', openingHours: 'Пн–пт 12:30–22:00; сб 11:30–22:00; вс выходной', classSchedule: 'Брейкинг: пн–сб 16:00–21:00' } },
  { catalogClub: 'Студия «КАМИН»', fields: ['name', 'phone', 'vkUrl', 'address', 'activities', 'scheduleUrl'], confirmedAt: '2026-10-18', source: 'сообщение пользователя и его заметка', values: { name: 'Студия «КАМИН»', previousName: 'Молодёжный клуб «Ровесник»', phone: '+7 (812) 246-66-91', vkUrl: 'https://vk.ru/comein_studio', address: 'Наб. реки Фонтанки, д. 136, лит. А', scheduleUrl: 'https://vk.ru/comein_studio?z=article_edit-30065169_231445' } },
];

const output = {
  district: 'admiralteysky',
  importedAt: '2026-10-18',
  source: sourcePath,
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  purpose: 'Рабочая база контактов, ссылок, специалистов и расписаний из заметки пользователя и последующих уточнений. Сведения по «Потоку» и «КАМИНу», а также две ссылки секций «Адмиралтейца» предоставлены пользователем; остальные строки имеют отдельный статус сверки. На сервере эта база не опубликована.',
  center: sections[0],
  centerClubLinks,
  catalogClubs,
  sections: sections.slice(1),
  reviewIssues,
  confirmedUpdates,
};

const target = path.join(root, 'data/research/admiralteysky-note-evidence.json');
await fs.writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(csvCell).join(';');
}

const headers = [
  'Клуб / центр', 'Адрес в каталоге', 'Телефон в каталоге', 'Телефоны из заметки',
  'ВК в каталоге', 'Страница ВК из заметки', 'Дополнительные сообщества ВК',
  'ВК занятий из уточнений пользователя', 'Специалисты занятий из уточнений пользователя', 'Контакты сообществ занятий',
  'Электронная почта из заметки', 'Специалисты из заметки', 'Строки расписания',
  'Строки источника', 'Что проверить',
];

function rowForClub(club) {
  const clubSections = sections.filter((section) => club.noteSectionIds.includes(section.id));
  const notePhones = dedupe(clubSections.flatMap((section) => [...section.primaryPhones, ...section.otherPhoneCandidates]), (item) => item.value);
  const noteEmails = dedupe(clubSections.flatMap((section) => section.emails), (item) => item.value);
  const notePeople = dedupe(clubSections.flatMap((section) => section.people), (item) => item.name);
  const pageLinks = dedupe([
    ...club.centerLinkEvidence.map((link) => link.url),
    ...clubSections.filter((section) => !section.relationToCatalog && section.pageHandle).map((section) => `https://vk.ru/${section.pageHandle}`),
  ], (url) => url);
  const extraCommunities = dedupe(clubSections.filter((section) => section.relationToCatalog && section.pageHandle)
    .map((section) => `https://vk.ru/${section.pageHandle}`), (url) => url);
  const issues = reviewIssues.filter((issue) => issue.catalogClub === club.name);
  const approved = confirmedUpdates.filter((item) => item.catalogClub === club.name);
  return [
    club.name, club.currentAddress, club.currentPhone, notePhones.map((item) => item.value).join(' | '),
    club.currentVkUrl, pageLinks.join(' | '), extraCommunities.join(' | '),
    club.activityPages.map((page) => `${page.catalogActivity}: ${page.vkUrl}`).join(' | '),
    club.activityPages.filter((page) => page.specialist).map((page) => `${page.catalogActivity}: ${page.specialist}`).join(' | '),
    club.activityPages.flatMap((page) => (page.communityContacts ?? []).map((contact) => `${page.catalogActivity}: ${contact.displayName} (${contact.profileUrl}); ${contact.role}`)).join(' | '),
    noteEmails.map((item) => item.value).join(' | '),
    notePeople.map((item) => `${item.name} — ${item.role}`).join(' | '),
    clubSections.flatMap((section) => section.scheduleEvidence.map((row) => row.line)).filter((line, index, all) => all.indexOf(line) === index).join(', '),
    clubSections.map((section) => section.sourceLines.join('–')).join(', ') || club.centerLinkEvidence.map((link) => link.line).join(', '),
    [
      ...approved.map((item) => `Подтверждено пользователем ${item.confirmedAt}: ${item.fields.join(', ')}`),
      ...issues.map((issue) => `${issue.field}: ${issue.catalogValue} → ${issue.noteValue}`),
    ].join(' | ') || (clubSections.length || club.centerLinkEvidence.length ? 'Актуальность и принадлежность проверить' : 'В заметке данных нет'),
  ];
}

const centerRow = [
  'Центр «Адмиралтейский»', 'Верейская ул., д. 22–24', '',
  sections[0].primaryPhones.map((item) => item.value).join(' | '), '',
  'https://vk.ru/tsentr_admiralteisky', '', '', '', '', '',
  sections[0].people.map((item) => `${item.name} — ${item.role}`).join(' | '),
  sections[0].scheduleEvidence.map((item) => item.line).join(', '),
  sections[0].sourceLines.join('–'), 'Сверить актуальность перед публикацией',
];
const csvTarget = path.join(root, 'data/research/admiralteysky-note-contacts.csv');
await fs.writeFile(csvTarget, `\uFEFF${[headers, centerRow, ...catalogClubs.map(rowForClub)].map(csvRow).join('\r\n')}\r\n`, 'utf8');
console.log(`${path.relative(root, target)}: ${catalogClubs.length} карточек каталога, ${sections.length} разделов заметки, ${sections.filter((section) => section.catalogClub).length} связей разделов с клубами`);
console.log(`${path.relative(root, csvTarget)}: ${catalogClubs.length + 1} строк для Excel`);
