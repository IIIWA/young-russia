import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = path.join(root, 'YoungRussiaOBS');
const database = path.join(vault, 'База данных');
const outputDir = path.join(database, 'ПМК Адмиралтейского района');
const basePath = path.join(database, 'ПМК Адмиралтейского района.base');
const readJson = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const imageSchedules = await readJson('YoungRussiaOBS/База данных/Расписания по снимкам 2026-10-19.json');
const yaml = value => JSON.stringify(String(value ?? ''));
const [clubs, evidence, centers, officialNote] = await Promise.all([
  readJson('data/clubs-admiralteysky.json'),
  readJson('data/research/admiralteysky-note-evidence.json'),
  readJson('data/research/pmc-centers-contacts.json'),
  fs.readFile(path.join(vault, 'Задачи', 'Адмиралтейский район официальные стр.md'), 'utf8'),
]);
const center = centers.find(item => item.id === 'admiralteysky');
if (!center || !Array.isArray(clubs) || !Array.isArray(evidence.sections)) throw new Error('Missing Admiralteysky research sources');

const officialPages = [...officialNote.matchAll(/^## \[\s*([^\]]+?)\s*\]\((https:\/\/admiralteisky\.admiral\.gov\.spb\.ru\/molodezhnye-kluby-centra\/\d+\/)\)/gm)]
  .map(match => ({ name: match[1].trim(), url: match[2], line: officialNote.slice(0, match.index).split('\n').length }));
const normalizeName = name => name.toLowerCase().replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
const officialPageFor = club => {
  const names = [club.name, club.previousName].filter(Boolean).map(normalizeName);
  const matches = officialPages.filter(page => names.some(name => name.includes(normalizeName(page.name))));
  if (matches.length > 1) throw new Error(`Several official pages matched ${club.name}`);
  return matches[0] ?? null;
};

const base = `filters:
  and:
    - file.inFolder("База данных/ПМК Адмиралтейского района")
    - record_type == "pmk_admiralteysky_research"
formulas:
  vk_link: if(club_vk, link(club_vk, "Открыть VK"), "")
  official_link: if(official_page, link(official_page, "Открыть страницу"), "")
properties:
  file.name:
    displayName: Клуб
  address:
    displayName: Адрес
  club_phone:
    displayName: Телефон по каталогу
  center_phone:
    displayName: Телефон центра
  center_email:
    displayName: Почта центра
  center_vk:
    displayName: ВК центра
  center_site:
    displayName: Сайт центра
  contact_status:
    displayName: Проверка контактов
  formula.vk_link:
    displayName: ВК клуба
  formula.official_link:
    displayName: Официальная страница
  official_page_status:
    displayName: Проверка официальной страницы
  activity_count:
    displayName: Направлений в каталоге
  activity_link_count:
    displayName: Ссылок направлений
  specialist_record_count:
    displayName: Упоминаний специалистов
  schedule_line_count:
    displayName: Строк расписания
  schedule_activities:
    displayName: Направления с расписанием в заметке
  image_schedule_count:
    displayName: Строк по присланному снимку
  source_section_count:
    displayName: Разделов в заметке
  review_issue_count:
    displayName: Расхождений для сверки
  review_status:
    displayName: Статус сверки
views:
  - type: table
    name: Все клубы
    order:
      - file.name
      - address
      - formula.vk_link
      - formula.official_link
      - activity_count
      - activity_link_count
      - specialist_record_count
      - schedule_line_count
      - schedule_activities
      - image_schedule_count
      - source_section_count
      - review_issue_count
      - review_status
    sort:
      - property: address
        direction: ASC
  - type: table
    name: Контакты
    order:
      - file.name
      - address
      - club_phone
      - center_phone
      - center_email
      - center_vk
      - center_site
      - formula.vk_link
      - formula.official_link
      - contact_status
  - type: table
    name: Ссылки направлений
    filters:
      and:
        - activity_link_count > 0
    order:
      - file.name
      - activity_link_count
      - review_status
  - type: table
    name: Требует уточнения
    filters:
      or:
        - review_issue_count > 0
        - source_section_count == 0
        - official_page_status == "страница клуба не найдена в заметке"
    order:
      - file.name
      - source_section_count
      - review_issue_count
      - official_page_status
      - review_status
`;

await fs.mkdir(outputDir, { recursive: true });
await writeGeneratedFile(basePath, base);
for (const [index, club] of clubs.entries()) {
  if (/[\\/:*?"<>|]/.test(club.name)) throw new Error(`Club name cannot be used as note filename: ${club.name}`);
  const id = `АД-${String(index + 1).padStart(3, '0')}`;
  const sections = evidence.sections.filter(section => section.catalogClub === club.name);
  const issues = evidence.reviewIssues.filter(issue => issue.catalogClub === club.name);
  const official = officialPageFor(club);
  const officialUrl = club.officialUrl || official?.url || '';
  const officialStatus = official ? 'ссылка из заметки; доступность не проверена'
    : officialUrl ? 'ссылка из каталога; доступность не проверена' : 'страница клуба не найдена в заметке';
  const generalCard = await fs.readFile(path.join(database, 'Каталог клубов Санкт-Петербурга', `${id}.md`), 'utf8');
  const scheduleActivities = JSON.parse(generalCard.match(/^schedule_activities: (.+)$/m)?.[1] ?? '""');
  const scheduleRows = [...generalCard.matchAll(/^- \*\*.+\*\*: .+\(строка \d+\)$/gm)].map(match => match[0]);
  const imageSchedule = imageSchedules.clubs.find(item => item.district === 'Адмиралтейский' && item.club === club.name);
  const imageScheduleLines = imageSchedule ? [
    ...(imageSchedule.activitySchedules ?? []).flatMap(activity => activity.sessions.map(session => `- **${activity.activity}:** ${session.day} ${session.time}${session.group ?? activity.defaultGroup ? `, группа ${session.group ?? activity.defaultGroup}` : ''}${session.program ? `, ${session.program}` : ''}.`)),
    ...(imageSchedule.otherSchedule ?? []).map(item => `- **${item.label}:** ${item.days.join(', ')} ${item.time}.`),
  ] : [];
  const pages = (club.activityPages ?? []).filter(page => page.vkUrl);
  const people = sections.flatMap(section => section.people);
  for (const page of pages) {
    if (page.specialist && !people.some(person => person.name === page.specialist)) {
      people.push({ name: page.specialist, role: page.title, source: 'каталог' });
    }
  }
  const reviewStatus = sections.length
    ? evidence.catalogClubs.find(item => item.name === club.name)?.reviewStatus ?? 'требует сверки'
    : 'для клуба нет отдельного раздела в заметке; сведения каталога требуют сверки';
  const frontmatter = [
    '---', 'record_type: pmk_admiralteysky_research', `catalog_id: ${yaml(id)}`,
    `district: ${yaml('Адмиралтейский')}`, `club: ${yaml(club.name)}`,
    `address: ${yaml(club.address)}`, `club_phone: ${yaml(club.phone)}`,
    `center: ${yaml(center.name)}`, `center_phone: ${yaml(center.phones.join('; '))}`,
    `center_email: ${yaml(center.emails.join('; '))}`, `center_vk: ${yaml(center.links?.vk)}`,
    `center_site: ${yaml(center.links?.site)}`,
    `contact_status: ${yaml('данные из каталога и заметки; актуальность не проверена')}`,
    `club_vk: ${yaml(club.vkUrl)}`, `official_page: ${yaml(officialUrl)}`,
    `official_page_status: ${yaml(officialStatus)}`,
    `activity_count: ${(club.activities ?? []).length}`, `activity_link_count: ${pages.length}`,
    `specialist_record_count: ${people.length}`, `schedule_line_count: ${sections.reduce((n, section) => n + section.scheduleEvidence.length, 0)}`,
    `schedule_activities: ${yaml(scheduleActivities)}`,
    `image_schedule_count: ${imageScheduleLines.length}`,
    `image_schedule_source: ${yaml(imageSchedule ? `[[${path.basename(imageSchedule.sourceImage)}]]` : '')}`,
    `source_section_count: ${sections.length}`, `review_issue_count: ${issues.length}`,
    `review_status: ${yaml(reviewStatus)}`,
    `general_card: ${yaml(`[[База данных/Каталог клубов Санкт-Петербурга/${id}]]`)}`,
    `source_note: ${yaml('[[Задачи/Адмиралтейский район]]')}`,
    `official_source: ${yaml('[[Задачи/Адмиралтейский район официальные стр]]')}`,
    '---', '',
  ];
  const body = [
    `# ${club.name}`, '',
    `**Общая карточка:** [[Каталог клубов Санкт-Петербурга/${id}]]  `,
    `**Адрес по каталогу:** ${club.address}  `,
    `**Официальная страница:** ${officialUrl ? `[открыть](${officialUrl})` : 'не найдена'}  `,
    `**Статус страницы:** ${officialStatus}`, '',
    '## Контакты', '',
    `- Телефон клуба по каталогу: ${club.phone || 'не указан'}.`,
    `- Телефон центра: ${center.phones.join('; ') || 'не указан'}.`,
    `- Почта центра: ${center.emails.join('; ') || 'не указана'}.`,
    `- ВК центра: ${center.links?.vk ? `[открыть](${center.links.vk})` : 'не указан'}.`,
    `- Сайт центра: ${center.links?.site ? `[открыть](${center.links.site})` : 'не указан'}.`,
    `- Источник контактов центра: ${center.source ? `[карточка учреждения](${center.source})` : 'не указан'}.`,
    '- Контакты требуют проверки актуальности; номера из заметки показаны отдельно ниже.', '',
    '## ВК клуба', '',
    `- ${club.vkUrl ? `[Страница клуба по каталогу](${club.vkUrl})` : 'Ссылка в каталоге не указана'}. Доступность отдельно не проверена.`, '',
    '## Направления по каталогу', '',
    ...((club.activities ?? []).length ? club.activities.map(name => `- ${name}`) : ['- Направления не указаны.']), '',
    '## Страницы отдельных направлений', '',
    ...(pages.length ? pages.map(page => {
      const detail = `${page.catalogActivity || page.title}: [${page.title}](${page.vkUrl})${page.specialist ? `; специалист ${page.specialist}` : ''}`;
      return `- ${detail}${/[.!?]$/.test(detail) ? '' : '.'}`;
    }) : ['- Отдельные ссылки пока не указаны.']), '',
    '## Специалисты из исследования', '',
    ...(people.length ? people.map(person => '- ' + person.name
      + (person.role ? ' — ' + person.role : '')
      + (person.source ? ' (источник: ' + person.source + ')' : '') + '.')
      : ['- Упоминаний специалистов пока нет.']), '',
    '## Разделы исходной заметки', '',
    ...(sections.length ? sections.flatMap(section => [
      `### ${section.title}`, '',
      `- Источник: [[Адмиралтейский район]], строки ${section.sourceLines.join('–')}.`,
      ...(section.relationToCatalog ? [`- Связь с клубом: ${section.relationToCatalog}`] : []),
      ...(section.primaryPhones.length ? [`- Основные телефоны из заметки: ${section.primaryPhones.map(item => `${item.value} (строка ${item.line})`).join('; ')}.`] : []),
      ...(section.otherPhoneCandidates.length ? [`- Другие найденные номера, требуют сверки: ${section.otherPhoneCandidates.map(item => `${item.value} (строка ${item.line})`).join('; ')}.`] : []),
      ...(section.people.length ? [`- Люди, упомянутые в разделе: ${section.people.map(person => `${person.name}${person.role ? ` (${person.role})` : ''}`).join('; ')}.`] : []),
      ...section.links.filter(link => link.role === 'страница раздела').map(link => `- Страница раздела: [ВК](${link.url}), строка ${link.line}.`),
      '',
    ]) : ['- Отдельный раздел этого клуба в исходной заметке не найден. Это не означает, что клуба нет или он не работает.', '']),
    '## Расписание из заметки', '',
    '> [!warning] Для сверки',
    '> Названия и время взяты из рабочих заметок. Режим работы клуба, график сотрудника и расписание занятия не равнозначны. Перед публикацией сверить с учреждением.', '',
    ...(scheduleRows.length ? scheduleRows : ['- Строк расписания в разобранных разделах заметки не найдено.']), '',
    ...(imageSchedule ? ['## Расписание по присланному снимку', '',
      '> [!warning] Для сверки',
      '> Расшифровка снимка; актуальность и набор отдельно не проверены.', '',
      `- Источник: [[${path.basename(imageSchedule.sourceImage)}]]; на снимке указано с ${imageSchedule.sourceEffectiveFrom}.`,
      ...imageScheduleLines,
      ...(imageSchedule.notes ?? []).map(note => `- Примечание: ${note}`), '',
    ] : []),
    '## Что уточнить', '',
    ...(issues.length ? issues.map(issue => `- ${issue.field}: в каталоге «${issue.catalogValue || 'не указано'}», в заметке «${issue.noteValue || 'не указано'}» (строка ${issue.sourceLine ?? 'не указана'}).`) : ['- Автоматически выявленных расхождений в этих полях нет; это не подтверждает актуальность данных.']),
    ...(sections.length ? [] : ['- Найти и проверить первичный источник сведений для этого клуба.']), '',
    '## Источники', '',
    '- [[Адмиралтейский район]] — исходная рабочая заметка.',
    `- [[Адмиралтейский район официальные стр]]${official ? `, ссылка на клуб в строке ${official.line}` : '; отдельная страница клуба в заметке не найдена'}.`,
    '- Исходные данные сайта: `data/clubs-admiralteysky.json`.',
    '- Карточка создаётся командой `npm run data:views`; исправления в ней пропадут при пересборке.', '',
  ];
  await writeGeneratedFile(path.join(outputDir, `${club.name}.md`), `${frontmatter.concat(body).join('\n')}\n`);
}
console.log(JSON.stringify({ clubs: clubs.length, withNoteSections: clubs.filter(club => evidence.sections.some(section => section.catalogClub === club.name)).length, officialPages: clubs.filter(club => officialPageFor(club)).length, base: basePath }));
