import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const updatedAt = new Intl.DateTimeFormat('ru-RU', {timeZone:'Europe/Moscow', day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date());
const dataDir = path.join(root, 'data');
const voSourceNoteHref = `../YoungRussiaOBS/Источники/ВК/${encodeURIComponent('ВК ПМК Василеостровского района.md')}`;
const coordinates = JSON.parse(await fs.readFile(path.join(dataDir, 'club-coordinates.json'), 'utf8'));
const centerContacts = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'pmc-centers-contacts.json'), 'utf8'));
const addressManifest = JSON.parse(await fs.readFile(path.join(dataDir, 'map-addresses.json'), 'utf8'));
const contactAudit = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'pmc-club-contact-audit.json'), 'utf8'));
const voCandidates = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'vo-note-evidence.json'), 'utf8'));
const auditByClub = new Map(contactAudit.clubs.map(club => [`${club.district === 'vo' ? 'vasileostrovsky' : club.district}\0${club.name}`, club]));
const voClubCandidateByName = new Map(voCandidates.clubPages.map(item => [item.club, item]));
const voActivityCandidatesByName = new Map();
const voScheduleByName = new Map();
const voReviewNoteByName = new Map(voCandidates.reviewNotes.map(item => [item.club, item.text]));
const voSourceRangeByName = new Map(voCandidates.sourceRanges.map(item => [item.club, item.lines]));
const voExcerptByName = new Map(voCandidates.excerpts.map(item => [item.club, item.lines]));
for (const item of voCandidates.activityPages) {
  if (!voActivityCandidatesByName.has(item.club)) voActivityCandidatesByName.set(item.club, []);
  voActivityCandidatesByName.get(item.club).push(item);
}
for (const item of voCandidates.scheduleEvidence) {
  if (!voScheduleByName.has(item.club)) voScheduleByName.set(item.club, []);
  voScheduleByName.get(item.club).push(item);
}
const reviewById = new Map(addressManifest.addresses.map(address => [address.id, address.review]));
const files = (await fs.readdir(dataDir)).filter(name => /^clubs-.*\.json$/.test(name)).sort();
const districtNames = {
  admiralteysky: 'Адмиралтейский',
  frunzensky: 'Фрунзенский', kalininsky: 'Калининский', kirovsky: 'Кировский',
  kolpinsky: 'Колпинский', krasnogvardeysky: 'Красногвардейский',
  krasnoselsky: 'Красносельский', kronshtadtsky: 'Кронштадтский',
  kurortny: 'Курортный', moskovsky: 'Московский', nevsky: 'Невский',
  petrodvortsovy: 'Петродворцовый', petrogradsky: 'Петроградский',
  primorsky: 'Приморский', pushkinsky: 'Пушкинский', tsentralny: 'Центральный',
  vasileostrovsky: 'Василеостровский', vyborgsky: 'Выборгский',
};
// Links to the organizations represented in each district, taken from the
// project catalog. A district can have several organizations; unknown links
// stay absent rather than being replaced by a club page or a guessed account.
const districtOrganizations = {
  admiralteysky: [
    {name:'Центр «Адмиралтейский»', official:'https://admiralteisky.admiral.gov.spb.ru/', vk:'https://vk.com/tsentr_admiralteisky'},
    {name:'Дом молодёжи «Рекорд»', official:'http://dmrecord.admiral.gov.spb.ru/', vk:'https://vk.com/dmrecord'},
  ],
  vasileostrovsky: [{name:'ПМЦ Василеостровского района', official:'https://www.pmcvo.ru/', vk:'https://vk.ru/pmc_vo'}],
  vyborgsky: ['mir', 'forpost'].map(id => {
    const center = centerContacts.find(item => item.id === id);
    if (!center?.links.site) throw new Error(`Missing official organization site: ${id}`);
    return {name:center.name, official:center.links.site, vk:center.links.vk};
  }),
  kalininsky: [{name:'ПМЦ «Калининский»', official:'https://pmc-kalininsky.spb.ru/?page_id=219450', vk:'https://vk.com/pmc_kalininsky'}],
  kirovsky: [{name:'ПМЦ «Кировский»', official:'https://pmckir.ru/', vk:'https://vk.com/pmc_kirovskiy'}],
  kolpinsky: [
    {name:'Дом молодёжи «Колпинец»', official:'https://kolpinets.ru/'},
    {name:'МЦ «Ровесник»', official:'https://spbgbu-rovesnik.ru/'},
  ],
  krasnogvardeysky: [{name:'Молодёжный центр «Охта»', official:'https://pmcohta.ru/', vk:'https://vk.com/pmc_ohta'}],
  krasnoselsky: [{name:'ПМЦ «Лигово»', official:'https://www.gov.spb.ru/gov/terr/reg_krasnoselsk/kultura-molodyozhnaya-politika/spb-gbu-podrostkovo-molodezhnyj-centr-ligovo/', vk:'https://vk.com/pmcligovo'}],
  kronshtadtsky: [{name:'Кронштадтский Дворец молодёжи', official:'https://kron-dm.ru/'}],
  kurortny: [
    {name:'ПМЦ «Восход»', official:'https://xn--75-dlci3cau6a.xn--p1ai/'},
    {name:'ПМЦ «Молодость»', official:'https://molodost.kurort.gov.spb.ru/'},
    {name:'ПМЦ «Снайпер»', official:'https://xn----8sbppmhlfke7c.xn--p1ai/'},
  ],
  moskovsky: [
    {name:'МПЦ «Московский»', official:'https://mpc-moskovskij.tumos.gov.spb.ru/o-centre/', vk:'https://vk.com/mpcmoskovski'},
    {name:'Дом молодёжи «Пулковец»', official:'https://dm.pulkovec.ru/', vk:'https://vk.com/dmpulkovec'},
  ],
  nevsky: [{name:'ПМЦ «Невский»', official:'https://centernevskiy.ru/', vk:'https://vk.com/pc_nevskiy'}],
  petrogradsky: [{name:'ПМЦ «Петроградский»', official:'https://pmc-petrogradsky.ru/'}],
  petrodvortsovy: [{name:'ПМЦ Петродворцового района'}],
  primorsky: [{name:'Дом молодёжи Приморского района', official:'https://dom-mol.ru/', vk:'https://vk.com/dommolspb'}],
  pushkinsky: [
    {name:'РПЦ «Пушкинец»', official:'https://gurptcp.pushkin.gov.spb.ru/'},
    {name:'Дом молодёжи «Царскосельский»', official:'https://pushkindm.ru/'},
  ],
  frunzensky: [{name:'ПМДЦ «Фрунзенский»', official:'https://centerfrunze.ru/', vk:'https://vk.com/frunzpmdc'}],
  tsentralny: [{name:'ОПМК «Перспектива»', official:'https://perspektiva-klab.ru/', vk:'https://vk.com/opmk_perspektiva'}],
};
// Reuse known institution contacts so missing VK links do not remain in a second registry.
const normalizedLink = value => String(value ?? '').toLowerCase().replace(/^http:/, 'https:').replace(/\/$/, '');
const normalizedName = value => String(value ?? '').toLowerCase().replaceAll('ё', 'е').replace(/[«»"\s]/g, '');
for (const organizations of Object.values(districtOrganizations)) for (const organization of organizations) {
  const canonical = centerContacts.find(item => normalizedName(item.name) === normalizedName(organization.name))
    ?? centerContacts.find(item => organization.official && normalizedLink(item.links?.site) === normalizedLink(organization.official));
  if (canonical) {
    organization.vk ||= canonical.links?.vk;
    organization.official ||= canonical.links?.site;
  }
}
const statusNames = {
  user_provided: 'Точка предоставлена; адрес клуба не подтверждён',
  partially_user_provided: 'Точка подтверждена не для всех клубов',
  likely_match: 'Дом и улица предварительно совпали на карте',
  needs_review: 'Картографическое совпадение требует проверки',
  not_found: 'Адрес не найден на карте',
  wrong_region: 'Автоматическая точка вне Петербурга',
};
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ').trim();
const htmlCell = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const sourceLink = url => /^https?:\/\//.test(url ?? '') ? `[источник](${url})` : 'источник не указан';
const vkLink = url => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ['vk.com', 'vk.ru'].includes(parsed.hostname) ? parsed.href : '';
  } catch { return ''; }
};
const officialLink = url => /^https?:\/\//.test(url ?? '') ? url : '';
const sameVkLink = (first, second) => {
  try { return new URL(first).pathname.toLowerCase().replace(/\/$/, '') === new URL(second).pathname.toLowerCase().replace(/\/$/, ''); }
  catch { return false; }
};
const clubLinks = (club, audit) => ({
  vk: vkLink(club.vkUrl) || vkLink(audit?.links?.vk),
  official: officialLink(club.officialUrl) || officialLink(audit?.links?.official),
});
const clubVkCandidate = (club, audit) => {
  if (audit?.district !== 'vo') return null;
  const candidate = voClubCandidateByName.get(club.name);
  return candidate && !sameVkLink(clubLinks(club, audit).vk, candidate.vkUrl) ? candidate : null;
};
const activityPagesByName = (club, audit) => {
  const byName = new Map((club.activities ?? []).map(activity => [activity, []]));
  const linkKey = url => { const parsed = new URL(url); return `${['vk.ru','vk.com'].includes(parsed.hostname) ? 'vk' : parsed.hostname}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`; };
  const add = (activity, page, url, label, needsConfirmation = false) => {
    if (!byName.has(activity) || !url) return;
    const links = byName.get(activity);
    if (links.some(existing => linkKey(existing.url) === linkKey(url))) return;
    links.push({title:page.title || activity, url, label, needsConfirmation, sourceLine:page.sourceLine, approvedByUserAt:page.approvedByUserAt});
  };
  // The current catalogue is authoritative; older audit entries only fill gaps.
  for (const page of [...(club.activityPages ?? []), ...(audit?.activityPages ?? [])]) {
    const activity = page.catalogActivity || page.suggestedCatalogActivity;
    const needsConfirmation = !page.catalogActivity || page.needsConfirmation === true;
    add(activity, page, vkLink(page.vkUrl), 'ВК', needsConfirmation);
    add(activity, page, officialLink(page.officialUrl), 'Сайт', needsConfirmation);
  }
  if (audit?.district === 'vo') for (const page of voActivityCandidatesByName.get(club.name) ?? []) {
    add(page.catalogActivity, page, vkLink(page.vkUrl), 'ВК', !page.approvedByUserAt);
  }
  return byName;
};
const missingDirectionLinks = (club, audit) => {
  const pages = activityPagesByName(club, audit);
  return [...pages.values()].filter(links => !links.some(link => link.label === 'ВК' && !link.needsConfirmation)).length;
};
const missingLinks = (club, audit) => {
  const links = clubLinks(club, audit);
  return {clubVk: !links.vk, official: !links.official, directions: missingDirectionLinks(club, audit), activityList:!club.activities?.length};
};
const missingClubLabel = missing => [
  ...(missing.clubVk ? ['ВК клуба'] : []),
  ...(missing.official ? ['официальную страницу'] : []),
  ...(missing.directions ? [`направления: ${missing.directions}`] : []),
  ...(missing.activityList ? ['список направлений'] : []),
].join(' · ');
const missingDistrictLinks = items => items.reduce((sum, item) => {
  const missing = missingLinks(item.club, item.audit);
  sum.clubVk += Number(missing.clubVk);
  sum.official += Number(missing.official);
  sum.directions += missing.directions;
  sum.activityList += Number(missing.activityList);
  return sum;
}, {clubVk: 0, official: 0, directions: 0, activityList:0});
const missingDistrictLabel = missing => [
  ...(missing.clubVk ? [`ВК клубов: ${missing.clubVk}`] : []),
  ...(missing.official ? [`оф. страниц: ${missing.official}`] : []),
  ...(missing.directions ? [`направления: ${missing.directions}`] : []),
  ...(missing.activityList ? [`списков направлений: ${missing.activityList}`] : []),
].join(' · ');
const markdownClub = (club, audit) => {
  const {vk, official} = clubLinks(club, audit);
  const candidate = clubVkCandidate(club, audit);
  return [cell(club.name), ...(vk ? [`[${club.vkUrlSharedWith ? "Общее сообщество" : "ВК клуба"}](${vk})${club.vkUrlApprovedAt ? ` (утверждено пользователем ${club.vkUrlApprovedAt})` : ''}`] : []), ...(club.vkUrlAlternates ?? []).map(url => club.vkUrlAliasConfirmedAt ? `[Альтернативный адрес ВК](${url}) (та же страница, подтверждено пользователем ${club.vkUrlAliasConfirmedAt})` : `[Прежняя ссылка ВК](${url}) (назначение уточнить)`), ...(club.vkUrlSharedWith ? [`Общее сообщество с «${cell(club.vkUrlSharedWith)}»`] : []), ...(candidate ? [`[Кандидат ВК клуба](${candidate.vkUrl}) (строка ${candidate.sourceLine}; проверить)`] : []), ...(official ? [`[Официальная страница](${official})`] : [])].join('<br>');
};
const markdownActivities = (club, audit) => {
  if (!club.activities?.length) return 'Направления не указаны';
  const pages = activityPagesByName(club, audit);
  return club.activities.flatMap(activity => [
    cell(activity),
    ...pages.get(activity).map(page => `↳ [${page.label || 'ВК'}: ${cell(page.title)}](${page.url})${page.approvedByUserAt ? ` (связь утверждена пользователем ${page.approvedByUserAt}; строка ${page.sourceLine})` : page.sourceLine ? ` (кандидат из заметки, строка ${page.sourceLine}; проверить)` : page.needsConfirmation ? ' (связь с направлением уточняется)' : ''}`),
  ]).join('<br>');
};
const catalogSchedules = club => (club.activitySchedule ?? []).filter(record => record.schedule?.length);
const sessionText = session => [Array.isArray(session.days) ? session.days.join(', ') : session.day || session.days || 'День не указан', session.time || 'Время не указано', session.group ? `группа ${session.group}` : '', session.program || '', session.room ? `кабинет ${session.room}` : ''].filter(Boolean).join(' · ');
const scheduleSource = (club, record) => officialLink(record.sourceUrl) || officialLink(club.scheduleSource) || officialLink(club.scheduleUrl);
const markdownSchedule = (club, audit) => [
  ...catalogSchedules(club).map(record => `${cell(record.activity)}: ${record.schedule.map(session => cell(sessionText(session))).join('; ')}. Период: ${cell(record.sourcePeriod || club.schedulePeriod || 'не указан')}.${record.sourceCheckedAt ? ` Источник проверен ${cell(record.sourceCheckedAt)}.` : ''}${record.sourceNote ? ` ${cell(record.sourceNote)}` : ''}${scheduleSource(club,record) ? ` [Источник](${scheduleSource(club,record)})` : ''}`),
  ...(audit?.district === 'vo' ? (voScheduleByName.get(club.name) ?? []).map(item => `Из заметки, требует сверки: строка ${item.sourceLine}${item.catalogActivity ? `, ${cell(item.catalogActivity)}` : ''}: ${cell(item.text)}`) : []),
].join('<br>') || 'В каталоге расписание не указано';
const catalogScheduleBlock = club => {
  const records = catalogSchedules(club);
  if (!records.length) return '<p class="empty">Расписание в&nbsp;каталоге пока не&nbsp;указано.</p>';
  return `<details class="schedule-evidence catalog-schedules"><summary>Расписания в&nbsp;каталоге: ${records.length}</summary><p>Сохранённые сведения. Наличие мест и&nbsp;изменения уточнить у&nbsp;организатора.</p>${records.map(record => `<section><h4>${htmlCell(record.activity)}</h4><p>Период: ${htmlCell(record.sourcePeriod || club.schedulePeriod || 'не указан')}.${record.sourceCheckedAt ? ` Источник проверен ${htmlCell(record.sourceCheckedAt)}.` : ''}</p><ul>${record.schedule.map(session => `<li>${htmlCell(sessionText(session))}</li>`).join('')}</ul>${record.sourceNote ? `<p>${htmlCell(record.sourceNote)}</p>` : ''}${scheduleSource(club,record) ? `<p><a href="${htmlCell(scheduleSource(club,record))}" target="_blank" rel="noopener noreferrer">Источник расписания ↗</a></p>` : ''}</section>`).join('')}</details>`;
};
const venueWord = count => count % 100 >= 11 && count % 100 <= 14 ? 'площадок' : count % 10 === 1 ? 'площадка' : count % 10 >= 2 && count % 10 <= 4 ? 'площадки' : 'площадок';
const coordinateByClub = new Map();
for (const record of coordinates.addresses) {
  for (const club of record.clubs) {
    const key = `${record.district}\0${club.name}`;
    if (coordinateByClub.has(key)) throw new Error(`Duplicate club in coordinate data: ${key}`);
    coordinateByClub.set(key, record);
  }
}

const allClubs = [];
for (const file of files) {
  const district = file === 'clubs-vo.json' ? 'vasileostrovsky' : file.slice(6, -5);
  const entries = JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8'));
  for (const club of entries) {
    const coordinate = coordinateByClub.get(`${district}\0${club.name}`);
    if (!coordinate || coordinate.address !== club.address) throw new Error(`Address data mismatch: ${district}/${club.name}`);
    const addressNote = club.reviewNotice || (/(?:^|\s)адрес(?:\s|:|\.|,|$)|место занят|(?:^|\s)вход(?:\s|:|\.|,|$)|помещен|переезд|здани|нет единого адреса/i.test(club.note ?? '') ? club.note : '');
    const structuralReview = reviewById.get(coordinate.id) ?? [];
    const priority = addressNote || structuralReview.some(reason => ['Указано несколько адресов', 'Нет номера дома'].includes(reason)) || ['not_found', 'wrong_region'].includes(coordinate.status) ? 'Высокий'
      : structuralReview.length || coordinate.status === 'needs_review' || coordinate.status === 'partially_user_provided' ? 'Средний' : 'Плановый';
    const userProvidedPoint = coordinate.clubCoordinates.some(point => point.clubName === club.name && point.source === 'user_provided');
    allClubs.push({district, club, coordinate, addressNote, structuralReview, priority, userProvidedPoint, audit: auditByClub.get(`${district}\0${club.name}`)});
  }
}
if (allClubs.length !== coordinates.clubCount) throw new Error(`Expected ${coordinates.clubCount} clubs; got ${allClubs.length}`);
const marked = allClubs.filter(item => item.userProvidedPoint);
if (marked.length !== coordinates.userProvidedClubCount) throw new Error(`Expected ${coordinates.userProvidedClubCount} user-provided points; got ${marked.length}`);
const clubs = allClubs;
for (const {district, club} of clubs) {
  const info = club.organizationInfo;
  if (!info?.name) continue;
  const organizations = districtOrganizations[district] ??= [];
  const known = organizations.find(org => normalizedName(org.name) === normalizedName(info.name) || info.site && normalizedLink(org.official) === normalizedLink(info.site));
  if (known) { known.official ||= officialLink(info.site); known.vk ||= vkLink(info.vk); }
  else organizations.push({name:info.name, official:officialLink(info.site), vk:vkLink(info.vk)});
}
const activityCount = clubs.reduce((sum, {club}) => sum + (club.activities?.length ?? 0), 0);
const scheduleCount = clubs.reduce((sum, {club}) => sum + catalogSchedules(club).length, 0);
const scheduleSessionCount = clubs.reduce((sum, {club}) => sum + catalogSchedules(club).reduce((count, record) => count + record.schedule.length, 0), 0);
const uniqueAddressCount = new Set(clubs.map(item => `${item.district}\0${item.club.address}`)).size;

const high = clubs.filter(item => !item.userProvidedPoint && item.priority === 'Высокий');
const medium = clubs.filter(item => !item.userProvidedPoint && item.priority === 'Средний');
const vo = clubs.filter(item => item.district === 'vasileostrovsky');
const groups = [
  ['Василеостровский район: все клубы', vo],
  ...Object.keys(districtNames).filter(district => district !== 'vasileostrovsky')
    .sort((a,b) => districtNames[a].localeCompare(districtNames[b], 'ru'))
    .map(district => [districtNames[district], clubs.filter(item => item.district === district)]),
].filter(([, items]) => items.length);

const lines = [
  '# Адреса клубов Петербурга: список для подтверждения',
  '',
  `Рабочий документ обновлён ${updatedAt} из текущих локальных баз всех районов. Дата выгрузки не заменяет дату проверки источника или подтверждение организатором. Клубы с переданными пользователем координатами помечены зелёным в HTML-версии; цвет не подтверждает работу клуба, адрес и контакты.`,
  '',
  `В списке **${clubs.length} клуба** и **${uniqueAddressCount} уникальных адреса**. У **${marked.length} клубов** координаты получены. Среди остальных приоритет «Высокий» у **${high.length} клубов**, «Средний» у **${medium.length}**; остальные требуют плановой сверки у организатора. Василеостровский район: **${vo.length} клуба**, координаты получены для **${vo.filter(item => item.userProvidedPoint).length}**.`,
  '',
  'При проверке спросить точный адрес занятий, корпус/литеру и вход, действует ли площадка, а также дату ответа. После подтверждения записать его в карточку клуба и повторно проверить точку на карте. До ответа не считать автоматическое совпадение подтверждением адреса.',
  '',
  `Направления перенесены из локальных карточек клубов. Пользователь утвердил ВК-страницы клубов (${voCandidates.clubPages.length}) и связи сообществ с занятиями (${voCandidates.activityPages.length}) Василеостровского района. ${voCandidates.scheduleEvidence.length} строк расписания из заметки пока не утверждены и требуют сверки. Утверждение ссылки не подтверждает доступность страницы или действующий набор.`,
  'Пометка у клуба отдельно проверяет ВК клуба, официальную страницу и ссылки на сообщества каждого направления. ВК клуба и официальная страница не заменяют ссылки на сообщества направлений. «Ссылки добавлены» означает, что все эти ссылки есть в рабочих данных. У района показаны суммы по клубам или общий статус готовности.',
  'Под названием района перечислены страницы учреждений, чьи клубы включены в каталог. У района может быть несколько учреждений. Если официальная страница или ВК не указаны, ссылку нужно уточнить.',
  '',
  'Основа списка: `data/clubs-*.json` и `data/club-coordinates.json`. Картографические кандидаты получены через OpenStreetMap Nominatim 15.10.2026 и могут быть неточными. Старую [страницу администрации Василеостровского района](https://www.gov.spb.ru/gov/terr/reg_vasileostr/social/sport/klubi/) нельзя использовать как единственное подтверждение: действующая [страница молодёжной политики](https://www.gov.spb.ru/gov/terr/reg_vasileostr/molodezhnaya-politika/) сообщает о 31 ПМК и пространстве «Притяжение», но не даёт адреса каждой площадки. [База молодёжных учреждений](https://www.spbdm.ru/baza-uchrezhdeniy/) содержит документы центров; адреса из них тоже следует сверять с центром.',
  '',
  '## Как читать пометки',
  '',
  '- **Высокий**: в локальных данных есть примечание об адресе/площадке либо геокодер не нашёл адрес или предложил точку вне Петербурга.',
  '- **Средний**: автоматическая проверка не подтвердила дом, улицу, корпус, литеру или вход.',
  '- **Плановый**: есть предварительное совпадение на карте; актуальный адрес клуба всё равно не подтверждён организатором.',
  '- **Координаты получены**: точку прислал пользователь. Эта строка выделена зелёным в HTML-документе.',
  '',
];

for (const [label, items] of groups) {
  const sorted = [...items].sort((a,b) => (a.userProvidedPoint ? 3 : {Высокий:0,Средний:1,Плановый:2}[a.priority]) - (b.userProvidedPoint ? 3 : {Высокий:0,Средний:1,Плановый:2}[b.priority]) || a.club.name.localeCompare(b.club.name, 'ru'));
  const districtMissing = missingDistrictLabel(missingDistrictLinks(items));
  const organizations = districtOrganizations[items[0].district] ?? [];
  lines.push(`## ${label} (${items.length}; ${districtMissing ? `добавить ссылки: ${districtMissing}` : 'ссылки добавлены'})`, '', ...organizations.map(org => `${org.name}: ${org.official ? `[официальная страница](${org.official})` : 'официальная страница не указана'}; ${org.vk ? `[ВК](${org.vk})` : 'ВК не указан'}.`), '', '| Статус | Клуб | Адрес в проекте | Направления и ссылки ВК | Расписания каталога и строки для сверки | Что уточнить | Источник | Подтверждённый адрес / дата |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const {club, coordinate, addressNote, structuralReview, priority, userProvidedPoint, audit} of sorted) {
    const statusReason = ['not_found', 'wrong_region'].includes(coordinate.status) ? statusNames[coordinate.status] : '';
    const reason = [...new Set([addressNote, statusReason, ...structuralReview, ...(coordinate.reasons ?? [])].filter(Boolean))].join('; ') || statusNames[coordinate.status];
    const source = sourceLink(club.officialUrl || club.sourceUrl || audit?.source);
    const missing = missingClubLabel(missingLinks(club, audit));
    const noteForReview = audit?.district === 'vo' ? voReviewNoteByName.get(club.name) : '';
    lines.push(`| ${userProvidedPoint ? '✓ Координаты получены' : priority} | ${markdownClub(club, audit)}<br>${missing ? `Добавить ссылки: ${missing}` : 'Ссылки добавлены'} | ${cell(club.address)} | ${markdownActivities(club, audit)} | ${markdownSchedule(club, audit)} | ${cell([reason, noteForReview].filter(Boolean).join('; '))} | ${source} | — |`);
  }
  lines.push('');
}

const target = path.join(root, 'docs', 'address-checklist-2026-10-16.md');
await writeGeneratedFile(target, `${lines.join('\n').trimEnd()}\n`);
const reportSections = groups.map(([label, items], index) => {
  const sorted = [...items].sort((a,b) => (a.userProvidedPoint ? 3 : {Высокий:0,Средний:1,Плановый:2}[a.priority]) - (b.userProvidedPoint ? 3 : {Высокий:0,Средний:1,Плановый:2}[b.priority]) || a.club.name.localeCompare(b.club.name, 'ru'));
  const cards = sorted.map(({club, coordinate, addressNote, structuralReview, priority, userProvidedPoint, audit}, clubIndex) => {
    const statusReason = ['not_found', 'wrong_region'].includes(coordinate.status) ? statusNames[coordinate.status] : '';
    const reason = [...new Set([addressNote, statusReason, ...structuralReview, ...(coordinate.reasons ?? [])].filter(Boolean))].join('; ') || statusNames[coordinate.status];
    const sourceUrl = club.officialUrl || club.sourceUrl || audit?.source;
    const source = /^https?:\/\//.test(sourceUrl ?? '') ? `<a href="${htmlCell(sourceUrl)}" target="_blank" rel="noopener noreferrer">Открыть источник</a>` : 'Не указан';
    const status = userProvidedPoint ? 'Координаты получены' : priority;
    const missing = missingClubLabel(missingLinks(club, audit));
    const {vk, official} = clubLinks(club, audit);
    const vkCandidate = clubVkCandidate(club, audit);
    const clubHeadingLinks = [
      ...(vk ? [`<a href="${htmlCell(vk)}" target="_blank" rel="noopener noreferrer">${club.vkUrlSharedWith ? 'Общее сообщество' : 'ВК клуба'} ↗</a>`] : []),
      ...(vkCandidate ? [`<a href="${htmlCell(vkCandidate.vkUrl)}" target="_blank" rel="noopener noreferrer">Кандидат ВК клуба ↗</a>`] : []),
      ...(official ? [`<a href="${htmlCell(official)}" target="_blank" rel="noopener noreferrer">Официальная страница ↗</a>`] : []),
    ].join('');
    const activityPages = activityPagesByName(club, audit);
    const activities = club.activities?.length
      ? `<ul class="activity-list">${club.activities.map(activity => `<li><span>${htmlCell(activity)}</span>${activityPages.get(activity).map(page => `<div class="activity-link"><a href="${htmlCell(page.url)}" target="_blank" rel="noopener noreferrer">${page.label || 'ВК'}: ${htmlCell(page.title)} ↗</a>${page.approvedByUserAt ? `<small>Связь с&nbsp;занятием утверждена пользователем ${htmlCell(page.approvedByUserAt)}. Действующий набор уточнить.</small>` : page.sourceLine ? `<small>Кандидат из&nbsp;заметки, строка&nbsp;${page.sourceLine}. Проверить связь и&nbsp;актуальность.</small>` : page.needsConfirmation ? '<small>Связь с&nbsp;направлением уточняется</small>' : ''}</div>`).join('')}</li>`).join('')}</ul>`
      : '<p class="empty">Направления не указаны в данных проекта.</p>';
    const schedule = audit?.district === 'vo' ? voScheduleByName.get(club.name) ?? [] : [];
    const sourceRange = audit?.district === 'vo' ? voSourceRangeByName.get(club.name) : '';
    const reviewNote = audit?.district === 'vo' ? voReviewNoteByName.get(club.name) : '';
    const rawScheduleBlock = audit?.district === 'vo' ? `<details class="schedule-evidence"><summary>Расписание из&nbsp;заметки: ${schedule.length} строк</summary><p>Строки требуют сверки. Название занятия могло быть определено неточно.</p>${schedule.length ? `<ol>${schedule.map(item => `<li><span>Строка ${item.sourceLine}${item.catalogActivity ? `, ${htmlCell(item.catalogActivity)}` : ''}:</span> ${htmlCell(item.text)}</li>`).join('')}</ol>` : '<p class="empty">Строки расписания не&nbsp;выделены.</p>'}</details>` : '';
    const excerpt = audit?.district === 'vo' ? voExcerptByName.get(club.name) ?? [] : [];
    const excerptBlock = audit?.district === 'vo' ? `<details class="source-excerpt"><summary>Дополнительные сведения из&nbsp;заметки: ${excerpt.length} строк</summary><p>Исходный текст для&nbsp;сверки. ФИО, личные телефоны и&nbsp;изображения здесь скрыты.</p><ol>${excerpt.map(item => `<li><span>${item.sourceLine}:</span> ${htmlCell(item.text)}</li>`).join('')}</ol></details>` : '';
    const approvedVkNote = club.vkUrlApprovedAt ? `Ссылка ВК клуба утверждена пользователем ${htmlCell(club.vkUrlApprovedAt)}. ${club.vkUrlSharedWith ? `Это общее сообщество с&nbsp;«${htmlCell(club.vkUrlSharedWith)}». ` : ''}${(club.vkUrlAlternates ?? []).map(url => club.vkUrlAliasConfirmedAt ? `Альтернативный адрес той&nbsp;же страницы: <a href="${htmlCell(url)}" target="_blank" rel="noopener noreferrer">открыть ВК</a>; подтверждено пользователем ${htmlCell(club.vkUrlAliasConfirmedAt)}. ` : `Прежняя ссылка: <a href="${htmlCell(url)}" target="_blank" rel="noopener noreferrer">открыть ВК</a>; её назначение уточнить. `).join('')}` : '';
    const noteBlock = audit?.district === 'vo' ? `<div class="source-note"><strong>Из&nbsp;заметки для&nbsp;сверки:</strong> ${htmlCell(reviewNote || 'Проверить сведения у организатора.')} ${approvedVkNote}${vkCandidate ? `Кандидат ВК клуба: строка&nbsp;${vkCandidate.sourceLine}. ` : ''}<a href="${htmlCell(voSourceNoteHref)}">Полная исходная заметка</a>, строки ${htmlCell(sourceRange || 'не указаны')}.</div>` : '';
    return `<details class="club${userProvidedPoint ? ' coordinates-received' : ''}" data-district="${htmlCell(club.districtCode || coordinate.district)}" data-club="${htmlCell(club.name)}" id="club-${index}-${clubIndex}"><summary><span class="club-heading"><strong class="club-title">${htmlCell(club.name)}</strong>${clubHeadingLinks ? `<span class="club-heading-links">${clubHeadingLinks}</span>` : ''}</span><span class="club-address">${htmlCell(club.address)}</span><span class="club-markers"><span class="status">${htmlCell(status)}</span><span class="link-note${missing ? '' : ' links-complete'}">${missing ? `Добавить ссылки: ${htmlCell(missing)}` : 'Ссылки добавлены'}</span></span></summary><div class="club-body"><div class="club-data"><h4>Направления и&nbsp;сообщества ВК</h4>${activities}</div>${catalogScheduleBlock(club)}${rawScheduleBlock}${excerptBlock}${noteBlock}<dl class="review-data"><div><dt>Что уточнить</dt><dd>${htmlCell(reason)}</dd></div><div><dt>Источник</dt><dd>${source}</dd></div><div><dt>Подтверждённый адрес и&nbsp;дата</dt><dd class="empty">Не заполнено</dd></div></dl></div></details>`;
  }).join('\n');
  const districtMissing = missingDistrictLabel(missingDistrictLinks(items));
  const organizations = districtOrganizations[items[0].district] ?? [];
  const organizationLinks = organizations.map(org => `<span class="district-organization"><b>${htmlCell(org.name)}:</b> ${org.official ? `<a href="${htmlCell(org.official)}" target="_blank" rel="noopener noreferrer">Официальная страница ↗</a>` : '<span class="missing-link">Официальная страница не&nbsp;указана</span>'}<span aria-hidden="true"> · </span>${org.vk ? `<a href="${htmlCell(org.vk)}" target="_blank" rel="noopener noreferrer">ВК ↗</a>` : '<span class="missing-link">ВК не&nbsp;указан</span>'}</span>`).join('');
  return `<details class="district" id="district-${index}"><summary><span class="district-heading"><strong>${htmlCell(label)}</strong><span class="district-organization-links" aria-label="Страницы учреждений района">${organizationLinks}</span></span><span class="district-markers"><small>${items.length} ${venueWord(items.length)}</small><small class="link-note${districtMissing ? '' : ' links-complete'}">${districtMissing ? `Добавить ссылки: ${htmlCell(districtMissing)}` : 'Ссылки добавлены'}</small></span></summary><div class="club-list">${cards}</div></details>`;
}).join('\n');
const navigation = groups.map(([label], index) => `<a href="#district-${index}">${htmlCell(label)}</a>`).join('');
const reportStyle = `
:root{font-family:Arial,sans-serif;color:#17221c;background:#f6f8f6;scroll-behavior:smooth}
*{box-sizing:border-box}body{margin:0}main{max-width:1200px;margin:auto;padding:32px 24px 100px}
h1,h2,h3,h4{text-wrap:balance}p,li{text-wrap:pretty;line-height:1.5}h1{font-size:clamp(28px,4vw,44px);margin:0 0 14px}
.lead{max-width:900px;color:#46574c}.summary{display:flex;gap:12px;flex-wrap:wrap;margin:25px 0}.summary span{padding:12px 16px;background:white;border:1px solid #dce4dc;border-radius:10px}.summary b{font-size:22px}
.legend{background:white;border:1px solid #dce4dc;border-radius:12px;padding:16px 20px;max-width:980px}.legend p{margin:5px 0}.swatch{display:inline-block;width:14px;height:14px;background:#dff4df;border:1px solid #b1ddb3;vertical-align:-2px;margin-right:7px}
.district-nav{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0}.district-nav a{background:#fff;border:1px solid #dce4dc;border-radius:20px;padding:7px 11px;color:#215a37;text-decoration:none}.district-nav a:hover{background:#e9f3eb}
.district{margin:14px 0;border:1px solid #dce4dc;border-radius:14px;background:#fff;scroll-margin-top:18px}.district>summary{display:flex;align-items:center;gap:12px;padding:18px 22px;cursor:pointer;font-size:22px;font-weight:700;list-style:none}.district-heading{display:grid;gap:7px;min-width:0;flex:1}.district>summary::-webkit-details-marker,.club>summary::-webkit-details-marker{display:none}.district>summary small{margin-left:auto;color:#617064;font-size:14px;font-weight:600;white-space:nowrap}.district>summary:after,.club>summary:after{content:'⌄';margin-left:10px;color:#215a37;font-size:22px;transition:transform .15s}.district:not([open])>summary:after,.club:not([open])>summary:after{transform:rotate(-90deg)}.district[open]>summary{border-bottom:1px solid #dce4dc}
.district-markers{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;max-width:60%}.district>summary .district-markers small{margin:0}.link-note{display:inline-block;padding:5px 8px;border-radius:10px;background:#fff1d8;color:#765016;font-size:12px;font-weight:700;line-height:1.35;white-space:normal;text-align:left}.district>summary .link-note{color:#765016;font-size:12px}.links-complete,.district>summary .links-complete{background:#e4f0ff;color:#18549a}
.district-organization-links{display:grid;gap:5px;font-size:14px;font-weight:400;line-height:1.5}.district-organization{overflow-wrap:anywhere}.district-organization b{font-weight:600}.district-organization a{margin-left:8px;font-weight:600}.missing-link{margin-left:8px;color:#6f7972}
.club-list{display:grid;gap:9px;padding:14px}.club{border:1px solid #dce4dc;border-radius:10px;background:#fff;scroll-margin-top:18px}.club>summary{display:grid;grid-template-columns:minmax(180px,1.5fr) minmax(200px,1.4fr) minmax(180px,300px) auto;align-items:center;gap:12px;padding:13px 15px;cursor:pointer;list-style:none}.club>summary:hover{background:#f2f6f2}.club-heading{display:grid;gap:5px;min-width:0}.club-title{font-weight:700}.club-heading-links{display:flex;flex-wrap:wrap;gap:5px 12px;font-size:13px;font-weight:400}.club-heading-links a{overflow-wrap:anywhere}.club-address{color:#46574c;font-size:14px}.status{padding:5px 9px;border-radius:999px;background:#edf1ed;color:#314a38;font-size:12px;font-weight:700;white-space:nowrap}.club.coordinates-received{background:#eaf8ea;border-color:#b1ddb3}.club.coordinates-received>summary:hover{background:#dff4df}.coordinates-received .status{background:#d2efd5;color:#145d31}
.club-markers{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:5px;min-width:0}
.club-body{padding:18px;border-top:1px solid #dce4dc}.club-data h4{font-size:15px;margin:0 0 8px}.club-data p{margin:0}.activity-list{margin:0;padding-left:20px;columns:2;column-gap:30px}.activity-list li{break-inside:avoid;margin:0 0 9px}.activity-link{margin:3px 0 0 2px;font-size:13px;line-height:1.45}.activity-link small{display:block;color:#80561c;font-size:12px}a{color:#17633a}.empty{color:#6f7972}.review-data{display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;margin:20px 0 0;padding-top:15px;border-top:1px solid #e3e9e3}.review-data dt{font-size:12px;font-weight:700;color:#617064}.review-data dd{margin:5px 0 0;font-size:14px;line-height:1.45;overflow-wrap:anywhere}
.schedule-evidence,.source-excerpt{margin:18px 0 0;border:1px solid #dce4dc;border-radius:10px;background:#fff;padding:12px 15px}.schedule-evidence summary,.source-excerpt summary{cursor:pointer;font-weight:700}.schedule-evidence p,.source-excerpt p{font-size:13px;color:#617064}.schedule-evidence ol,.source-excerpt ol{margin:12px 0 2px;padding-left:24px;max-height:420px;overflow:auto}.schedule-evidence li,.source-excerpt li{font-size:13px;margin:0 0 7px;overflow-wrap:anywhere}.schedule-evidence li span,.source-excerpt li span{font-weight:700;color:#617064}.source-note{margin-top:12px;font-size:13px;line-height:1.5;color:#46574c}.source-note strong{color:#17221c}
summary:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid #1b8d4d;outline-offset:3px}#back-to-top{position:fixed;right:22px;bottom:22px;z-index:10;display:grid;place-items:center;width:52px;height:52px;border:0;border-radius:50%;background:#17633a;color:#fff;font-size:28px;box-shadow:0 8px 24px #17221c33;cursor:pointer}#back-to-top:hover{background:#0e4b2b}#back-to-top[hidden]{display:none}footer{margin-top:40px;color:#617064;font-size:14px}
@media(max-width:760px){main{padding:20px 12px 70px}.district>summary{display:grid;grid-template-columns:minmax(0,1fr) auto;font-size:18px;padding:15px}.district-heading{grid-column:1/-1}.district-markers{grid-column:1;margin-left:0;justify-content:flex-start;max-width:100%}.district>summary:after{grid-column:2;grid-row:2;justify-self:end}.club>summary{grid-template-columns:1fr auto;gap:5px 10px}.club-heading{grid-column:1;grid-row:1}.club-address{grid-column:1;grid-row:2}.club-markers{grid-column:1/-1;grid-row:3;justify-content:flex-start}.club .status{font-size:11px}.club>summary:after{grid-column:2;grid-row:2;justify-self:end}.review-data{grid-template-columns:1fr}.activity-list{columns:1}.summary span{flex:1 1 42%}#back-to-top{right:14px;bottom:14px}}
@media(prefers-reduced-motion:reduce){:root{scroll-behavior:auto}.district>summary:after,.club>summary:after{transition:none}}
`;
const reportHtml = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Адреса клубов Петербурга: проверка</title>
<style>
${reportStyle}</style></head><body><main><h1>Адреса клубов Петербурга</h1><p class="lead">Рабочий список для&nbsp;уточнения адресов. Зелёным отмечены клубы, для&nbsp;которых вы&nbsp;передали координаты. Цвет не&nbsp;означает подтверждения работы клуба, адреса и&nbsp;контактов.</p>
<p class="lead">Документ обновлён ${updatedAt} из&nbsp;текущих локальных баз. Дата выгрузки не&nbsp;заменяет дату проверки источника.</p><div class="summary"><span><b>${clubs.length}</b><br>клуба в&nbsp;списке</span><span><b>${groups.length}</b><br>районов</span><span><b>${activityCount}</b><br>направлений</span><span><b>${scheduleCount}</b><br>расписаний в&nbsp;каталоге</span><span><b>${marked.length}</b><br>с&nbsp;полученными координатами</span></div>
<div class="legend"><p><span class="swatch"></span><b>Координаты получены:</b> клуб выделен зелёным.</p><p><b>Высокий приоритет:</b> есть расхождение, нет полного адреса или автоматическая карта не&nbsp;нашла подходящую точку.</p><p><b>Средний и&nbsp;плановый:</b> проверить актуальность адреса у&nbsp;центра перед публикацией.</p><p><b>Данные из&nbsp;заметки:</b> ссылки на&nbsp;страницы клубов и&nbsp;связи сообществ с&nbsp;занятиями Василеостровского района утверждены пользователем. Строки расписания остаются на&nbsp;проверке. ФИО и&nbsp;личные телефоны специалистов сюда не&nbsp;перенесены.</p><p><b>Ссылки района:</b> под названием района показаны страницы учреждений каталога. Если страницы или ВК нет в&nbsp;данных, ссылка помечена как&nbsp;неуказанная.</p><p><b>Добавить ссылки:</b> указывает, где не&nbsp;хватает ВК клуба, официальной страницы или&nbsp;ссылок для&nbsp;направлений в&nbsp;рабочем каталоге. ВК клуба и&nbsp;официальный сайт не&nbsp;заменяют сообщество направления. Утверждение ссылки не&nbsp;подтверждает её текущую доступность. <b>Ссылки добавлены:</b> все нужные ссылки есть в&nbsp;рабочих данных.</p></div>
<nav class="district-nav" aria-label="Районы">${navigation}</nav>${reportSections}
<footer>Снимок локальных баз на&nbsp;${updatedAt}. Даты источников указаны отдельно. <a href="address-checklist-2026-10-16.md">Текстовая версия</a>.</footer></main>
<button id="back-to-top" type="button" aria-label="Прокрутить наверх" title="Наверх" hidden>↑</button>
<script>
const backToTop = document.getElementById('back-to-top');
const updateBackToTop = () => { backToTop.hidden = window.scrollY < 320; };
const revealHash = () => {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!target) return;
  if (target.matches('details')) target.open = true;
  target.closest('details.district')?.setAttribute('open', '');
  requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
};
document.querySelector('.district-nav').addEventListener('click', event => {
  const link = event.target.closest('a[href^="#district-"]');
  if (link) document.getElementById(link.hash.slice(1)).open = true;
});
document.querySelectorAll('.club-heading-links a').forEach(link => link.addEventListener('click', event => event.stopPropagation()));
document.querySelectorAll('.district-organization-links a').forEach(link => link.addEventListener('click', event => event.stopPropagation()));
backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}));
window.addEventListener('scroll', updateBackToTop, {passive:true});
window.addEventListener('hashchange', revealHash);
revealHash(); updateBackToTop();
</script></body></html>`;
const htmlTarget = path.join(root, 'docs', 'address-checklist-2026-10-16.html');
await writeGeneratedFile(htmlTarget, reportHtml);
console.log(`Wrote checklist: ${clubs.length} clubs; ${marked.length} green; ${high.length} high, ${medium.length} medium, ${vo.length} VO.`);

console.log(JSON.stringify({updatedAt, districts:groups.length, clubs:clubs.length, activities:activityCount, catalogSchedules:scheduleCount, scheduleSessions:scheduleSessionCount, missingLinks:missingDistrictLinks(clubs)}));
