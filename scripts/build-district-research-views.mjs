import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';
import {officialDistrictRows} from './official-district-research.mjs';
import {remainingDistrictRows} from './remaining-district-research.mjs';
import {enrichRowsWithVk,vkOnlyDistrictRows} from './vk-note-research.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = path.join(root, 'YoungRussiaOBS');
const outputDir = path.join(vault, 'База данных', 'Каталог клубов Санкт-Петербурга');
const basePath = path.join(vault, 'База данных', 'Каталог клубов Санкт-Петербурга.base');
const csvPath = path.join(vault, 'База данных', 'Каталог клубов Санкт-Петербурга.csv');
const imageSchedulesPath = path.join(vault, 'База данных', 'Расписания по снимкам 2026-10-19.json');
const admiralteyskyDetailDir = path.join(vault, 'База данных', 'ПМК Адмиралтейского района');
const admiralteyskyBasePath = path.join(vault, 'База данных', 'ПМК Адмиралтейского района.base');
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const escapeYaml = value => JSON.stringify(String(value ?? ''));
const escapeCsv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const unique = values => [...new Set(values.filter(Boolean))];
const imageSchedules = JSON.parse(await fs.readFile(imageSchedulesPath, 'utf8'));
const imageScheduleByClub = new Map(imageSchedules.clubs.map(item => [`${item.district}:${item.club}`, item]));
const scheduleSessionText = item => `${(item.days ?? [item.day]).join(', ')} ${item.time}${item.group ? `, группа ${item.group}` : ''}${item.program ? `, ${item.program}` : ''}${item.room ? `, кабинет ${item.room}` : ''}`;
const imageScheduleLines = item => item ? [
  ...(item.activitySchedules ?? []).flatMap(activity => activity.sessions.map(session => `- **${activity.activity}:** ${scheduleSessionText({ ...session, group: session.group ?? activity.defaultGroup })}.`)),
  ...(item.otherSchedule ?? []).map(other => `- **${other.label}:** ${scheduleSessionText(other)}.`),
  ...(item.clubSectionHours ?? []).map(hours => `- **Время работы секций:** ${scheduleSessionText(hours)}.`),
  ...(item.clubClosedDays ?? []).map(day => `- **Время работы секций:** ${day.day} — ${day.status} (${day.source}).`),
] : [];
const sentence = value => /[.!?]$/.test(value) ? value : `${value}.`;
const sourceLines = new Map();
for (const note of [
  'YoungRussiaOBS/Источники/ВК/ВК ПМК Василеостровского района.md',
  'YoungRussiaOBS/Источники/ВК/ВК ПМК Адмиралтейского района.md',
  'YoungRussiaOBS/Источники/ВК/ВК ПМК Выборгского района.md',
]) sourceLines.set(note, (await fs.readFile(path.join(root, note), 'utf8')).replace(/\r\n/g, '\n').split('\n'));
const voDetailNames = new Set((await fs.readdir(path.join(vault, 'База данных', 'ПМК Василеостровского района')))
  .filter(name => name.endsWith('.md')).map(name => path.basename(name, '.md')));
const sameLineOffsets = new Map();
function isStaffSchedule(note, sourceLine) {
  const lines = sourceLines.get(note);
  const previous = lines?.slice(Math.max(0, sourceLine - 5), sourceLine - 1)
    .reverse().find(line => line.trim())?.trim() ?? '';
  return /^\*\*(?:Специалист|Гардеробщик|Руководитель|Заведующ)/i.test(previous);
}
function activityNearSchedule(note, sourceLine, scheduleText) {
  const lines = sourceLines.get(note);
  const raw = lines?.[sourceLine - 1] ?? '';
  const expanded = raw.replace(/<br\s*\/?>/gi, '\n');
  const key = `${note}:${sourceLine}`;
  const from = sameLineOffsets.get(key) ?? 0;
  let position = expanded.indexOf(scheduleText.trim(), from);
  if (position < 0) position = expanded.indexOf(scheduleText.trim().slice(0, 24), from);
  if (position >= 0) sameLineOffsets.set(key, position + Math.max(1, scheduleText.trim().length));
  const candidates = position >= 0
    ? expanded.slice(0, position).split('\n').slice(-12).reverse()
    : [];
  if (raw.length < 1000) {
    for (let index = sourceLine - 2; index >= Math.max(0, sourceLine - 22); index--) {
      if (/^#\s+[«"]/.test(lines[index])) break;
      candidates.push(lines[index].trim());
    }
  }
  for (const candidate of candidates) {
    const bold = /\*\*[^*]{2,100}\*\*/.test(candidate) && candidate.length <= 110
      ? candidate.replace(/^#{2,5}\s*/, '').replaceAll('**', '') : '';
    const heading = candidate.match(/^#{2,5}\s+(.{2,100})$/)?.[1];
    const plain = candidate.trim().length <= 75 && !/[.:!?]$/.test(candidate.trim()) ? candidate.trim() : '';
    const label = (bold || heading || plain).replace(/\*|\s+/g, ' ').trim();
    if (!label || /^\d+$|^#|^\||^•|^\[$|^---+$|^(?:расписание|возраст|контакт|телефон|педагог|руководитель|заведующ|специалист|тренер|гардеробщик|адрес|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|наб\.|набережн|бесплатн|молод[её]жн.*клуб|творческое пространство|футбольный клуб|клуб(?:\s|$))/i.test(label)) continue;
    if (/участник|Полный ход!|Помогаем заботиться|^ТЕАТРАЛКА$|^Студия КАМИН|💚/.test(label)) continue;
    if (/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?$|^[A-Z][a-z]+\s+[A-Z][a-z]+$|\s\|\s|_/.test(label)) continue;
    if (/\d{1,2}[.:]\d{2}|https?:\/\/|\]\(/i.test(label)) continue;
    return label;
  }
  return '';
}

const centers = await readJson('data/research/pmc-centers-contacts.json');
const officialNote = await fs.readFile(path.join(vault, 'Источники', 'Официальные сайты', 'Адмиралтейский район — исходные сведения.md'), 'utf8');
const officialPages = [...officialNote.matchAll(/^## \[\s*([^\]]+?)\s*\]\((https:\/\/admiralteisky\.admiral\.gov\.spb\.ru\/molodezhnye-kluby-centra\/\d+\/)\)/gm)]
  .map((match) => ({ name: match[1].trim(), url: match[2], line: officialNote.slice(0, match.index).split('\n').length }));
const normalizeName = name => name.toLowerCase().replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
function officialPageFor(club) {
  const names = [club.name, club.previousName].filter(Boolean).map(normalizeName);
  const matches = officialPages.filter(page => names.some(name => name.includes(normalizeName(page.name))));
  if (matches.length > 1) throw new Error(`Several official pages matched ${club.name}`);
  return matches[0] ?? null;
}
const configs = [
  { code: 'vasileostrovsky', short: 'ВО', label: 'Василеостровский', catalog: 'data/clubs-vo.json', evidence: 'data/research/vo-note-evidence.json', sourceNote: 'YoungRussiaOBS/Источники/ВК/ВК ПМК Василеостровского района.md' },
  { code: 'admiralteysky', short: 'АД', label: 'Адмиралтейский', catalog: 'data/clubs-admiralteysky.json', evidence: 'data/research/admiralteysky-note-evidence.json', sourceNote: 'YoungRussiaOBS/Источники/ВК/ВК ПМК Адмиралтейского района.md' },
  { code: 'vyborgsky', short: 'ВЫ', label: 'Выборгский', catalog: 'data/clubs-vyborgsky.json', evidence: 'data/research/vyborgsky-note-evidence.json', sourceNote: 'YoungRussiaOBS/Источники/ВК/ВК ПМК Выборгского района.md' },
];

async function voSpecialists() {
  const folder = path.join(vault, 'База данных', 'Специалисты Василеостровского района');
  const byClub = new Map();
  for (const filename of (await fs.readdir(folder)).filter(name => name.endsWith('.md'))) {
    const content = await fs.readFile(path.join(folder, filename), 'utf8');
    const field = key => content.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1];
    const club = field('club');
    const person = field('person');
    if (!club || !person) throw new Error(`Specialist note missing club or person: ${filename}`);
    const clubName = JSON.parse(club);
    byClub.set(clubName, [...(byClub.get(clubName) ?? []), {
      name: JSON.parse(person), role: JSON.parse(field('roles') ?? '""'),
      phone: JSON.parse(field('phones') ?? '""'), activities: JSON.parse(field('activities') ?? '""'),
    }]);
  }
  return byClub;
}

const voPeople = await voSpecialists();
const rows = [];
for (const config of configs) {
  const [clubs, evidence] = await Promise.all([readJson(config.catalog), readJson(config.evidence)]);
  if (!Array.isArray(clubs)) throw new Error(`Missing club list: ${config.code}`);
  for (const [index, club] of clubs.entries()) {
    const centerId = config.code === 'vyborgsky' ? club.organization : config.code;
    const noteCenter = evidence.centers?.find(item => item.id === centerId);
    const center = centers.find(item => item.id === centerId) ?? (noteCenter ? {
      name: noteCenter.name, phones: noteCenter.phone ? [noteCenter.phone] : [], emails: [],
      links: { vk: noteCenter.vk.url, site: noteCenter.site }, source: config.sourceNote,
    } : null);
    if (!center) throw new Error(`Missing center for ${club.name}: ${centerId}`);
    if (/[\\/:*?"<>|]/.test(club.name)) throw new Error(`Club name cannot be used as note filename: ${club.name}`);
    const id = `${config.short}-${String(index + 1).padStart(3, '0')}`;
    const official = config.code === 'admiralteysky' ? officialPageFor(club) : null;
    const sections = config.code === 'admiralteysky' || config.code === 'vyborgsky'
      ? evidence.sections.filter(section => section.catalogClub === club.name)
      : [];
    const specialists = config.code === 'admiralteysky' || config.code === 'vyborgsky'
      ? sections.flatMap(section => (section.people ?? []).map(person => ({ name: person.name, role: person.role ?? '', profile: person.profileUrl ?? '', phone: '' })))
      : voPeople.get(club.name) ?? [];
    for (const page of club.activityPages ?? []) {
      if (page.specialist && !specialists.some(person => person.name === page.specialist)) specialists.push({ name: page.specialist, role: page.title ?? '', phone: '' });
    }
    const scheduleEvidence = config.code === 'admiralteysky' || config.code === 'vyborgsky'
      ? sections.flatMap(section => section.scheduleEvidence.map(item => ({ text: item.text, line: item.line, catalogActivity: config.code === 'vyborgsky' ? item.activity || section.title : '', sectionId: section.id })))
      : evidence.scheduleEvidence.filter(item => item.club === club.name).map(item => ({ text: item.text, line: item.sourceLine, catalogActivity: item.catalogActivity || '' }));
    const scheduleDetails = scheduleEvidence.map(item => {
      const clubHours = /(?:режим|график) работы клуба|(?:режим|график|расписание) работы:|работаем:/i.test(item.text);
      const headingOnly = /^\s*#{0,5}\s*расписание(?:\s+(?:занятий|работы секций))?\s*:?\s*$/i.test(item.text);
      const activity = config.code === 'vyborgsky' ? item.catalogActivity : headingOnly ? 'Заголовок расписания' : item.sectionId === 'forward' && item.line >= 1280
        ? 'Мини-футбол' : clubHours ? 'Режим работы клуба' : isStaffSchedule(config.sourceNote, item.line)
          ? 'График сотрудника, не расписание занятия' : activityNearSchedule(config.sourceNote, item.line, item.text) || item.catalogActivity;
      return { ...item, activity: activity || 'Фрагмент без однозначного названия направления' };
    });
    for(const record of (club.activitySchedule??[]).filter(r=>r.sourceType==='user_confirmed'))for(const slot of record.schedule)scheduleDetails.push({activity:record.activity,text:`${slot.day}: ${slot.time}; ${record.source}; подтверждено ${record.confirmedAt}`,line:'уточнение пользователя',sourceNote:record.sourceFile});
    const scheduleLines = scheduleDetails.length;
    const researchStatus = config.code === 'vyborgsky'
      ? sections.length ? 'данные из заметки; актуальность требует сверки' : 'в заметке есть только ссылка клуба; направления и расписание не разобраны'
      : config.code === 'admiralteysky'
      ? sections.length ? evidence.catalogClubs.find(item => item.name === club.name)?.reviewStatus ?? 'Требует сверки'
        : 'для клуба нет отдельного раздела в заметке; сведения каталога требуют сверки'
      : club.vkUrlApprovedAt ? 'ВК клуба утверждена; остальные сведения требуют сверки' : 'Требует сверки';
    const activityPages = config.code === 'vyborgsky'
      ? sections.flatMap(section => {
        const candidate = section.groupLinks[0]?.url || section.productPage?.url;
        return candidate ? [{ title: section.title, vkUrl: candidate, catalogActivity: '' }] : [];
      }) : (club.activityPages ?? []).filter(page => page.vkUrl);
    const imageSchedule = imageScheduleByClub.get(`${config.label}:${club.name}`);
    for (const page of activityPages) {
      if (page.catalogActivity && !club.activities.includes(page.catalogActivity)) throw new Error(`${club.name}: missing catalog activity ${page.catalogActivity}`);
    }
    rows.push({
      id, district: config.label, club: club.name, address: club.address, phone: club.phone ?? '',
      clubVk: club.vkUrl || evidence.clubVk?.[club.name]?.url || '', officialPage: club.officialUrl || official?.url || club.organizationInfo?.site || '',
      center: center.name, centerPhone: center.phones.join('; '), centerEmail: center.emails.join('; '),
      centerVk: center.links?.vk ?? noteCenter?.vk.url ?? '', centerSite: center.links?.site ?? noteCenter?.site ?? '', centerSource: center.source ?? '',
      activities: club.activities ?? [], activityPages, specialists, scheduleLines, scheduleDetails,
      imageSchedule, imageScheduleLines: imageScheduleLines(imageSchedule),
      scheduleActivities: unique(scheduleDetails.map(item => item.activity).filter(name =>
        !/^(?:Режим работы клуба|Заголовок расписания|График сотрудника, не расписание занятия|Фрагмент без однозначного названия направления)$/.test(name))),
      catalogScheduleCount: (club.activitySchedule ?? []).length + (club.classSchedule ? 1 : 0),
      reviewStatus: club.activityCatalogConfirmedAt ? `Действующие направления и новые часы подтверждены пользователем ${club.activityCatalogConfirmedAt}; старые заметки сохранены для истории` : researchStatus, sourceNote: config.sourceNote, sourceCatalog: config.catalog,
      sections, reviewIssues: config.code === 'admiralteysky' ? evidence.reviewIssues.filter(item => item.catalogClub === club.name) : [],
      officialNoteLine: official?.line ?? null,
      detailNote: config.code === 'vasileostrovsky' && voDetailNames.has(club.name) ? `ПМК Василеостровского района/${club.name}`
        : config.code === 'admiralteysky' ? `ПМК Адмиралтейского района/${club.name}`
          : config.code === 'vyborgsky' ? `ПМК Выборгского района/${club.name}` : '',
      detailBase: config.code === 'vasileostrovsky' ? 'ПМК Василеостровского района.base'
        : config.code === 'admiralteysky' ? 'ПМК Адмиралтейского района.base' : 'ПМК Выборгского района.base',
      updatedAt: club.activityCatalogConfirmedAt ?? club.noteConfirmedAt ?? club.contactConfirmedAt ?? club.addressConfirmedAt ?? club.nameConfirmedAt ?? activityPages.map(page => page.providedAt).filter(Boolean).sort().at(-1) ?? '',
    });
  }
}

rows.push(...await officialDistrictRows());
rows.push(...await remainingDistrictRows());
await enrichRowsWithVk(rows);
rows.push(...await vkOnlyDistrictRows());
const base = `filters:
  and:
    - file.inFolder("База данных/Каталог клубов Санкт-Петербурга")
    - record_type == "pmk_catalog_research"
properties:
  district:
    displayName: Район
  club:
    displayName: Клуб
  address:
    displayName: Адрес
  phone:
    displayName: Телефон клуба
  club_vk:
    displayName: ВК клуба
  official_page:
    displayName: Страница клуба
  center:
    displayName: Центр
  center_phone:
    displayName: Телефон центра
  center_email:
    displayName: Почта центра
  activity_count:
    displayName: Занятий
  activity_link_count:
    displayName: Ссылок занятий
  specialist_count:
    displayName: Специалистов в исследовании
  schedule_line_count:
    displayName: Строк расписания из заметки
  schedule_activities:
    displayName: Направления с расписанием в заметке
  catalog_schedule_count:
    displayName: Занятий с расписанием в каталоге
  image_schedule_count:
    displayName: Строк по снимку и уточнениям
  image_schedule_source:
    displayName: Снимок расписания
  review_status:
    displayName: Статус сверки
  detail_note:
    displayName: Подробная карточка
  detail_base:
    displayName: Подробная база
  research_source:
    displayName: Исходная заметка
  official_source:
    displayName: Официальные страницы
views:
  - type: table
    name: Все клубы
    order:
      - district
      - club
      - detail_note
      - detail_base
      - research_source
      - official_source
      - address
      - club_vk
      - activity_count
      - activity_link_count
      - specialist_count
      - schedule_line_count
      - schedule_activities
      - catalog_schedule_count
      - image_schedule_count
      - image_schedule_source
      - review_status
    sort:
      - property: district
        direction: ASC
      - property: club
        direction: ASC
  - type: table
    name: Требуют сверки
    filters:
      and:
        - review_status != "Подтверждено"
    order:
      - district
      - club
      - detail_note
      - schedule_activities
      - review_status
`;

await fs.mkdir(outputDir, { recursive: true });
await writeGeneratedFile(basePath, base);
for (const row of rows) {
  const frontmatter = [
    '---', 'record_type: pmk_catalog_research', `catalog_id: ${escapeYaml(row.id)}`,
    `district: ${escapeYaml(row.district)}`, `club: ${escapeYaml(row.club)}`,
    `address: ${escapeYaml(row.address)}`, `phone: ${escapeYaml(row.phone)}`,
    `club_vk: ${escapeYaml(row.clubVk)}`, `official_page: ${escapeYaml(row.officialPage)}`,
    `center: ${escapeYaml(row.center)}`, `center_phone: ${escapeYaml(row.centerPhone)}`,
    `center_email: ${escapeYaml(row.centerEmail)}`, `activity_count: ${row.activities.length}`,
    `activity_link_count: ${row.activityPages.length}`, `specialist_count: ${row.specialists.length}`,
    `schedule_line_count: ${row.scheduleLines}`, `review_status: ${escapeYaml(row.reviewStatus)}`,
    `schedule_activities: ${escapeYaml(row.scheduleActivities.join('; '))}`,
    `catalog_schedule_count: ${row.catalogScheduleCount}`,
    `image_schedule_count: ${row.imageScheduleLines.length}`,
    `image_schedule_source: ${escapeYaml(row.imageSchedule?.sourceImage ? `[[${path.basename(row.imageSchedule.sourceImage)}]]` : '')}`,
    `detail_note: ${escapeYaml(row.detailNote ? `[[База данных/${row.detailNote}]]` : '')}`,
    `detail_base: ${escapeYaml(row.detailBase ? `[[База данных/${row.detailBase}]]` : '')}`,
    `research_source: ${escapeYaml(row.researchSourceUrl || `[[${row.sourceNote.replace(/^YoungRussiaOBS\//, '').replace(/\.md$/, '')}]]`)}`,
    `official_source: ${escapeYaml(row.district === 'Адмиралтейский' ? '[[Источники/Официальные сайты/Адмиралтейский район — исходные сведения]]' : '')}`,
    `source_catalog: ${escapeYaml(row.sourceCatalog)}`, `source_note: ${escapeYaml(row.sourceNote)}`,
    `updated_at: ${escapeYaml(row.updatedAt)}`, '---', '',
  ];
  const body = [
    `# ${row.club}`, '',
    `**Район:** ${row.district}  `, `**Адрес:** ${row.address}  `,
    `**Телефон клуба:** ${row.phone || 'не указан'}  `,
    `**ВК клуба:** ${row.clubVk ? `[открыть](${row.clubVk})${row.district === 'Выборгский' ? ' (из заметки; доступность не проверена)' : ''}` : 'не указан'}  `,
    `**Центр:** ${row.center} (${row.centerPhone || 'телефон не указан'})  `,
    ...(row.detailNote ? [`**Подробная карточка:** [[${row.detailNote}]]  `, `**Подробная база:** [[${row.detailBase}]]`] : []), '',
    row.researchOnly ? '## Предложения из исследования' : '## Занятия по каталогу', '', ...row.activities.map(item => `- ${item}`), '',
    row.researchOnly ? '## Ссылки направлений из исследования (вид ссылки в подробной карточке)' : row.district === 'Выборгский' ? '## Ссылки направлений из заметки' : '## Сообщества занятий', '',
    ...(row.activityPages.length ? row.activityPages.map(page => `- ${sentence(`${page.catalogActivity || page.title}: [${page.title}](${page.vkUrl || page.officialUrl})${page.specialist ? `; специалист ${page.specialist}` : ''}`)}`) : ['- Ссылки не указаны.']), '',
    ...(row.vkSection??[]),
    '## Исследование', '',
    `- Упоминаний специалистов: ${row.specialists.length}.`,
    `- Строк расписания ${row.researchOnly ? 'в исследовательских источниках (включая архив)' : 'в исходной заметке'}: ${row.scheduleLines}.`,
    `- Занятий с расписанием в каталоге: ${row.catalogScheduleCount}.`,
    '', '### Специалисты и контакты из исследования', '',
    ...(row.specialists.length ? row.specialists.map(person => `- ${person.name}${person.role ? `, ${person.role}` : ''}${person.activities ? `; занятие: ${person.activities}` : ''}${person.phone ? `; телефон: ${person.phone}` : ''}${person.profile ? `; [ВК](${person.profile})` : ''}`) : ['- Сведений пока нет.']),
    '', row.researchOnly ? '### Графики из исследования, включая архив' : '### Расписание из исходной заметки', '',
    '> [!warning] Для сверки',
    row.researchOnly ? '> У каждой строки сохранены период, финансирование и источник. Полнота исследования не означает подтверждение текущего бесплатного набора. Подробные группы, условия и вопросы находятся в районной карточке.' : '> Название направления берётся из текста заметки рядом со временем. Оно и само расписание требуют проверки перед переносом на сайт.', '',
    ...(row.scheduleDetails.length ? row.scheduleDetails.map(item => `- **${item.activity}**: ${item.text.replaceAll('\n', ' ')} (строка ${item.line})`) : ['- Строк расписания не найдено.']),
    ...(row.imageSchedule ? [
      '', '### Расписание по снимку и уточнениям', '',
      '> [!warning] Для сверки',
      '> Данные расшифрованы со снимка; отдельные уточнения пользователя помечены своим источником. Актуальность остальных сведений, места проведения и набор отдельно не проверены.', '',
      `- Источник: [[${path.basename(row.imageSchedule.sourceImage)}]]${row.imageSchedule.sourceEffectiveFrom ? `; на снимке указана дата начала ${row.imageSchedule.sourceEffectiveFrom}` : ''}.`,
      ...row.imageScheduleLines,
      ...(row.imageSchedule.notes ?? []).map(note => `- Примечание: ${note}`),
    ] : []),
    `- Статус: ${row.reviewStatus}.`,
    row.researchSourceUrl ? `- [Официальный источник](${row.researchSourceUrl}).` : `- [Исходная заметка](../../${encodeURI(row.sourceNote.replace(/^YoungRussiaOBS\//, ''))}).`,
    ...(row.district === 'Выборгский' ? [`- [Вторая заметка: сюда добавляются новые данные по району](../../Источники/ВК/${encodeURIComponent('ВК ПМК Выборгского района — дополнение.md')}).`] : []),
    ...(row.district === 'Адмиралтейский' ? ['- [Официальные страницы из второй заметки](../../%D0%98%D1%81%D1%82%D0%BE%D1%87%D0%BD%D0%B8%D0%BA%D0%B8/%D0%9E%D1%84%D0%B8%D1%86%D0%B8%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B5%20%D1%81%D0%B0%D0%B9%D1%82%D1%8B/%D0%90%D0%B4%D0%BC%D0%B8%D1%80%D0%B0%D0%BB%D1%82%D0%B5%D0%B9%D1%81%D0%BA%D0%B8%D0%B9%20%D1%80%D0%B0%D0%B9%D0%BE%D0%BD%20%E2%80%94%20%D0%B8%D1%81%D1%85%D0%BE%D0%B4%D0%BD%D1%8B%D0%B5%20%D1%81%D0%B2%D0%B5%D0%B4%D0%B5%D0%BD%D0%B8%D1%8F.md).'] : []),
    `- Исходные данные сайта: \`${row.sourceCatalog}\`.`,
    '- Эта карточка генерируется автоматически. Исправляй исходные данные, затем пересобирай представления.', '',
  ];
  await writeGeneratedFile(path.join(outputDir, `${row.id}.md`), `${frontmatter.concat(body).join('\n')}\n`);
}

const headers = ['ID', 'Район', 'Клуб', 'Подробная карточка', 'Подробная база', 'Адрес', 'Телефон клуба', 'ВК клуба', 'Страница клуба', 'Центр', 'Телефон центра', 'Почта центра', 'Занятий', 'Занятия', 'Ссылки занятий', 'Специалистов в исследовании', 'Специалисты и контакты', 'Строк расписания из заметки', 'Направления с расписанием в заметке', 'Расписание из заметки', 'Занятий с расписанием в каталоге', 'Статус сверки', 'Источник', 'Дата обновления', 'Строк по снимку и уточнениям', 'Расписание по снимку и уточнениям', 'Снимок расписания'];
const csvRows = rows.map(row => [row.id, row.district, row.club, row.detailNote, row.detailBase, row.address, row.phone, row.clubVk, row.officialPage, row.center, row.centerPhone, row.centerEmail, row.activities.length, row.activities.join(' | '), row.activityPages.map(page => `${page.catalogActivity || page.title}: ${page.vkUrl || page.officialUrl}`).join(' | '), row.specialists.length, row.specialists.map(person => `${person.name}${person.role ? ` (${person.role})` : ''}${person.phone ? `; телефон ${person.phone}` : ''}${person.profile ? `; ВК ${person.profile}` : ''}`).join(' | '), row.scheduleLines, row.scheduleActivities.join(' | '), row.scheduleDetails.map(item => `${item.activity}: ${item.text} (строка ${item.line})`).join(' | '), row.catalogScheduleCount, row.reviewStatus, row.sourceNote, row.updatedAt, row.imageScheduleLines.length, row.imageScheduleLines.join(' | '), row.imageSchedule?.sourceImage ?? '']);
await writeGeneratedFile(csvPath, `\uFEFF${[headers, ...csvRows].map(values => values.map(escapeCsv).join(';')).join('\r\n')}\r\n`);
console.log(JSON.stringify({ clubs: rows.length, districts: new Set(rows.map(r => r.district)).size, obsidian: outputDir, csv: csvPath }));
