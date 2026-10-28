import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vault = path.join(root, 'YoungRussiaOBS');
const database = path.join(vault, 'База данных');
const folder = path.join(database, 'ПМК Выборгского района');
const basePath = path.join(database, 'ПМК Выборгского района.base');
const [clubs, evidence, centers] = await Promise.all([
  fs.readFile(path.join(root, 'data/clubs-vyborgsky.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'data/research/vyborgsky-note-evidence.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'data/research/pmc-centers-contacts.json'), 'utf8').then(JSON.parse),
]);
const yaml = value => JSON.stringify(String(value ?? ''));
const unique = values => [...new Set(values.filter(Boolean))];
const issues = {
  'Перекрёсток': [
    'Для «Перекрёстка» в публичный каталог перенесена mklub461: она указана в списке клубов на официальном сайте ПМЦ «МИР», проверенном 22.10.2026. Ссылка mirpr46 из описания вокальной студии сохранена как отдельный кандидат; её назначение уточнить.',
    '«Класс сопрано»: в заметке указаны бесплатные часы до 18:30 и платные индивидуальные занятия после 18:30; условия не обобщать на всё направление.',
    '«Комьюнити Дэнс»: два фрагмента дают разное окончание занятий — 20:30 и 21:00; расписание требует уточнения.',
    '«Арт-пространство»: в источнике время записано как 16:0; не исправлять без проверки.',
    'В разделе «КРУГ» есть программы для детей младше 14 лет; возраст и условия участия показывать по каждой группе отдельно.',
    'Время 14:30–22:00 в строке 1775 относится к приходу на прослушивание студии «Вокализ», а не к расписанию занятий.',
  ],
  'Форпост': [
    'Публикации разных лет; актуальность расписаний и набора проверить у учреждения.',
    'В строке 1196 часы 11:00–19:00 указаны для звонков по поводу вокальной студии «Пульс», а не для занятий.',
  ],
  'Феникс': [
    'Публикации разных лет; актуальность расписаний и набора проверить у учреждения.',
  ],
  'Фестиваль': ['Публикации разных лет; актуальность расписаний и набора проверить у учреждения.'],
  'Патриот': ['Расписание на снимке начинается 01.09.2025; действующий набор и изменения уточнить перед посещением.'],
};
const secondNoteName = 'ВК ПМК Выборгского района — дополнение';
const secondNoteLink = `[[Источники/ВК/${secondNoteName}]]`;
// Ручные пояснения к карточкам. Держим их здесь, потому что карточки пересоздаются командой data:views.
const manualNotes = {
  'Патриот': [
    'Других ссылок у «Патриота» нет: пользователь проверил клуб и подтвердил, что в заметке не осталось ни ссылок на направления, ни страниц сообществ. Отдельно искать их не нужно — единственная ссылка, страница клуба, уже в карточке.',
  ],
  'Центральный': [
    `Пользователь добавляет данные по «Центральному» во вторую заметку ${secondNoteLink}, а не в первую. Ссылки, люди и телефоны оттуда сведены ниже, в разделе «Контакты сообществ из второй заметки», и ещё не сверены с клубом.`,
  ],
  'Феникс': [
    'Это площадка ДМ «Форпост» по адресу Лесной пр., д. 61, к. 3; в заметке она подписана как «МПК «Феникс»».',
    'Своей группы ВК у площадки нет: все публикации идут из группы «Дом молодёжи «Форпост»» (vk.ru/dm_forpost), поэтому отдельную ссылку клуба искать не нужно.',
    'В заметке к этой площадке относятся «Форпост-ТВ», «Ника», «Живая история», «6-й егерский», «Фокус», «Серебряный веер» и «Гильдия хроник».',
  ],
  'Фестиваль': [
    'Это молодёжный досуговый центр «Фестиваль» — площадка ДМ «Форпост» в бывшем кинотеатре на пр. Просвещения, д. 47; в заметке указаны кабинеты 120, 302 и 307.',
    'Своей группы ВК у площадки нет: публикации идут из группы «Форпост» (vk.ru/dm_forpost), отдельной ссылки клуба не существует.',
    'В заметке к этой площадке относятся «Медиа Взгляд», «Ар-деко», HIP-HOP «База», «Кинетика», КВН, английский язык и роспись фарфора.',
  ],
};
// Данные второй заметки, которые пока не разбираются генератором evidence: переносим вручную.
const secondNoteCommunities = {
  'Центральный': [
    {
      name: 'Студия эстрадного вокала «FORTE»',
      url: 'https://vk.ru/club171386486',
      details: 'Марина Тлеубаева; +7 (911) 107-15-01; сайт fortemuz.ru. Раздел «Студия вокала FORTE» уже есть выше по первой заметке — здесь добавлены ссылка и контакты. В карточке сообщества указан адрес ул. Олеко Дундича, д. 32; связь с «Центральным» по адресу требует уточнения.',
    },
    {
      name: '«Путь игры» / импровизация',
      url: 'https://vk.ru/club230375800',
      details: 'Анастасия Зенцова; бесплатные занятия по сценической импровизации для 14–35 лет; чат в Telegram. Адрес в заметке не указан.',
    },
    {
      name: '«•MIR• ЕДИНОБОРСТВА»',
      url: 'https://vk.ru/mirsportclub',
      details: 'Клуб единоборств центра «МИР»; пр. Энгельса, д. 147/1, лит. Д; телефоны 409-80-39 и 417-57-04.',
    },
    {
      name: 'Концертный хор «Исток»',
      url: 'https://vk.ru/istokchoir',
      details: 'vhs.istok@mail.ru; +7 (904) 556-02-81 и +7 (911) 218-13-08; М. И. Шистер, А. А. Зингаренко; пр. Энгельса, д. 147, к. 1, лит. Д. В заметке есть расписание и детские группы — возраст каждой группы уточнять.',
    },
    {
      name: 'Фольклорная студия «Оберег»',
      url: 'https://vk.ru/club172388487',
      details: 'Ольга Ющенко; бесплатно для 14–35 лет; в описании указаны два адреса — пр. Энгельса, д. 7, лит. Б и д. 147, к. 1, лит. Д, поэтому принадлежность к «Центральному» требует уточнения.',
    },
  ],
};
const base = `filters:
  and:
    - file.inFolder("База данных/ПМК Выборгского района")
    - record_type == "pmk_vyborgsky_research"
formulas:
  vk_link: if(club_vk, link(club_vk, "Открыть VK"), "")
  center_vk_link: if(center_vk, link(center_vk, "Открыть VK центра"), "")
properties:
  file.name:
    displayName: Клуб или площадка
  organization:
    displayName: Учреждение
  address:
    displayName: Адрес по каталогу
  club_phone:
    displayName: Телефон по каталогу
  center_phone:
    displayName: Телефон учреждения
  center_site:
    displayName: Сайт учреждения
  formula.vk_link:
    displayName: ВК клуба из заметки
  formula.center_vk_link:
    displayName: ВК учреждения
  direction_count:
    displayName: Направлений из заметки
  direction_link_count:
    displayName: Направлений со ссылками
  schedule_fragment_count:
    displayName: Фрагментов расписания
  catalog_schedule_count:
    displayName: Расписаний в каталоге
  image_schedule_count:
    displayName: Интервалов по снимку
  review_issue_count:
    displayName: Вопросов для сверки
  review_status:
    displayName: Статус
views:
  - type: table
    name: Все клубы
    order:
      - file.name
      - organization
      - address
      - formula.vk_link
      - direction_count
      - direction_link_count
      - schedule_fragment_count
      - review_status
  - type: table
    name: Контакты
    order:
      - file.name
      - organization
      - address
      - club_phone
      - center_phone
      - center_site
      - formula.vk_link
      - formula.center_vk_link
  - type: table
    name: Направления и ссылки
    filters:
      and:
        - direction_count > 0
    order:
      - file.name
      - direction_count
      - direction_link_count
      - schedule_fragment_count
  - type: table
    name: Требует уточнения
    order:
      - file.name
      - review_issue_count
      - review_status
`;
await fs.mkdir(folder, { recursive: true });
await writeGeneratedFile(basePath, base);

for (const [index, club] of clubs.entries()) {
  if (/[\\/:*?"<>|]/.test(club.name)) throw new Error(`Invalid note filename: ${club.name}`);
  const id = `ВЫ-${String(index + 1).padStart(3, '0')}`;
  const sections = evidence.sections.filter(section => section.catalogClub === club.name);
  const noteCenter = evidence.centers.find(item => item.id === club.organization);
  const catalogCenter = centers.find(item => item.id === club.organization);
  if (!noteCenter) throw new Error(`Missing organization: ${club.organization}`);
  const clubVk = club.vkUrl || evidence.clubVk[club.name]?.url || '';
  const centerPhone = unique([...(catalogCenter?.phones ?? []), noteCenter.phone]).join('; ');
  const centerEmail = (catalogCenter?.emails ?? []).join('; ');
  const centerSite = catalogCenter?.links.site || noteCenter.site;
  const questionList = issues[club.name] ?? [];
  if (!sections.length) questionList.push('В заметке найдена страница ВК клуба в списке ПМЦ «МИР», но нет отдельных описаний занятий и расписаний.');
  const linked = sections.filter(section => section.groupLinks.length || section.productPage);
  const scheduleCount = sections.reduce((sum, section) => sum + section.scheduleEvidence.length, 0);
  const personCount = sections.reduce((sum, section) => sum + section.people.length, 0);
  const imageSchedules = (club.activitySchedule ?? []).filter(item => item.sourceType === 'user_image');
  const imageSessionCount = imageSchedules.reduce((count, activity) => count + activity.schedule.reduce((n, session) => n + String(session.day ?? session.days).split(',').length, 0), 0);
  const status = sections.length ? 'рабочие сведения из заметки; актуальность не проверена' : 'только ссылка клуба; направления требуют отдельной сверки';
  const frontmatter = [
    '---', 'record_type: pmk_vyborgsky_research', `catalog_id: ${yaml(id)}`,
    `district: ${yaml('Выборгский')}`, `club: ${yaml(club.name)}`,
    `organization: ${yaml(noteCenter.name)}`, `address: ${yaml(club.address)}`,
    `club_phone: ${yaml(club.phone)}`, `club_email: ${yaml(club.email)}`,
    `club_vk: ${yaml(clubVk)}`, `center_vk: ${yaml(noteCenter.vk.url)}`,
    `center_site: ${yaml(centerSite)}`, `center_phone: ${yaml(centerPhone)}`,
    `center_email: ${yaml(centerEmail)}`, `direction_count: ${sections.length}`,
    `direction_link_count: ${linked.length}`, `schedule_fragment_count: ${scheduleCount}`,
    `catalog_schedule_count: ${(club.activitySchedule ?? []).length}`, `image_schedule_count: ${imageSessionCount}`,
    `person_mention_count: ${personCount}`,
    `review_issue_count: ${questionList.length}`, `review_status: ${yaml(status)}`,
    `general_card: ${yaml(`[[База данных/Каталог клубов Санкт-Петербурга/${id}]]`)}`,
    `source_note: ${yaml('[[Источники/ВК/ВК ПМК Выборгского района]]')}`,
    ...(secondNoteCommunities[club.name]?.length ? [`source_note_2: ${yaml(secondNoteLink)}`] : []),
    '---', '',
  ];
  const body = [
    `# ${club.name}`, '',
    `**Общая карточка:** [[Каталог клубов Санкт-Петербурга/${id}]]  `,
    `**Учреждение:** ${noteCenter.name}  `,
    `**Адрес по каталогу:** ${club.address}  `,
    `**${club.vkUrlSharedWith ? 'Общее сообщество учреждения' : 'ВК клуба'}:** ${clubVk ? `[открыть](${clubVk})` : 'отдельная ссылка не найдена'}  `,
    ...(evidence.clubVkAlternates?.[club.name] ?? []).map(item => `**Другая ссылка ВК из заметки:** [открыть](${item.url}), строка ${item.line}; связь уточнить.  `),
    `**ВК учреждения:** [открыть](${noteCenter.vk.url})  `,
    `**Статус:** ${status}`, '',
    '## Контакты', '',
    `- Телефон клуба по каталогу: ${club.phone || 'не указан'}.`,
    `- Почта клуба по каталогу: ${club.email || 'не указана'}.`,
    `- Телефон учреждения: ${centerPhone || 'не указан'}.`,
    `- Почта учреждения: ${centerEmail || 'не указана'}.`,
    `- Сайт учреждения: ${centerSite ? `[открыть](${centerSite})` : 'не указан'}.`,
    club.organization === 'mir'
      ? club.officialUrl ? `- Официальная страница клуба: [открыть](${club.officialUrl}); ссылка из меню учреждения проверена ${club.officialUrlCheckedAt}.` : '- Официальная страница клуба пока не указана; [список клубов ПМЦ «МИР»](https://xn----ptbkbv6a.xn--p1ai/clubs).'
      : '- Официальной страницы у площадки нет: отдельных страниц у клубов «Форпоста» не найдено, общие сведения — на сайте и в группе учреждения.',
    '- Доступность страниц и актуальность контактов отдельно не проверены.', '',
    '## Направления по каталогу сайта', '',
    ...(club.activities.length ? club.activities.map(activity => `- ${activity}`) : ['- Не указаны.']), '',
    ...(imageSchedules.length ? [
      '## Расписание по снимку', '',
      `- Источник: [[${club.scheduleSourceImage}]], дата начала в документе ${club.scheduleSourceEffectiveFrom}.`,
      '- Перенесено в основной каталог по запросу пользователя 22.10.2026; действующий набор отдельно не проверен.', '',
      ...imageSchedules.flatMap(activity => [
        `### ${activity.activity}`, '',
        ...activity.schedule.map(session => `- **${session.group}:** ${session.day ?? session.days}, ${session.time}; кабинет ${session.room}.`), '',
      ]),
    ] : []),
    '## Направления из присланной заметки', '',
    '> [!warning] Рабочие сведения',
    '> Название, время и условия приведены по заметке. Совпадение с общими категориями каталога не утверждено; перед переносом на сайт нужно сверить действующее расписание и набор.', '',
    ...(sections.length ? sections.flatMap(section => [
      `### ${section.title}`, '',
      `- Источник: [[Источники/ВК/ВК ПМК Выборгского района]], строки ${section.sourceLines.join('–')}.`,
      ...(section.publishedAt ? [`- Дата публикации в заметке: ${section.publishedAt}.`] : []),
      ...(section.groupLinks.length ? section.groupLinks.map(link => `- Ссылка ВК из раздела: [открыть](${link.url}), строка ${link.line}; принадлежность уточнить.`) : []),
      ...(section.productPage ? [`- Страница направления в каталоге ВК: [открыть](${section.productPage.url}), строка ${section.productPage.line}.`] : []),
      ...(section.people.length ? [`- Люди, упомянутые в разделе: ${section.people.map(person => `${person.name} (строка ${person.line})`).join('; ')}. Имена и роли требуют сверки.`] : []),
      ...(section.scheduleEvidence.length ? section.scheduleEvidence.map(item => `- **${item.activity || section.title}, расписание:** ${item.text.replaceAll('\n', ' ')} (строка ${item.line}).`) : ['- Время занятий в этом разделе не найдено.']),
      '',
    ]) : ['- Отдельных описаний занятий этого клуба в заметке не найдено.', '']),
    ...(manualNotes[club.name]?.length ? ['## Заметки', '', ...manualNotes[club.name].map(note => `- ${note}`), ''] : []),
    ...(secondNoteCommunities[club.name]?.length ? [
      '## Контакты сообществ из второй заметки', '',
      '> [!warning] Не сверено',
      `> Направления уже описаны выше; здесь только ссылки, люди и телефоны из ${secondNoteLink}. Возраст, набор и расписание требуют подтверждения.`, '',
      ...secondNoteCommunities[club.name].map(item => `- **${item.name}**: [ВК](${item.url}); ${item.details}`),
      '',
    ] : []),
    '## Что уточнить', '',
    ...(questionList.length ? questionList.map(question => `- ${question}`) : ['- Действуют ли перечисленные направления, ссылки и расписания сейчас.']),
    ...(club.name === 'Феникс' ? ['- Публикация о «6-м егерском» в строках 578–606 не называет площадку; отдельная публикация в строках 645–671 прямо указывает «Феникс».'] : []),
    ...(club.name === 'Форпост' ? ['- Публикация об объединении «ДВИЖ» в строках 1260–1290 не называет площадку; она оставлена на уровне учреждения.'] : []),
    ...(club.name === 'Перекрёсток' ? ['- В конце заметки, строки 1932–2100, есть список сообществ. Его ссылки требуют сверки с конкретными направлениями.'] : []),
    '', '## Источники', '',
    '- [[Источники/ВК/ВК ПМК Выборгского района]] — исходная заметка пользователя.',
    ...(secondNoteCommunities[club.name]?.length ? [`- ${secondNoteLink} — вторая заметка пользователя: ссылки на сообщества клуба.`] : []),
    '- Исходный каталог сайта: `data/clubs-vyborgsky.json`.',
    '- Карточка создаётся командой `npm run data:views`; правки в ней пропадут при пересборке.', '',
  ];
  await writeGeneratedFile(path.join(folder, `${club.name}.md`), `${frontmatter.concat(body).join('\n')}\n`);
}
console.log(JSON.stringify({ clubs: clubs.length, withSections: evidence.summary.withSections, sections: evidence.sections.length, schedules: evidence.summary.scheduleFragments, base: basePath }));
