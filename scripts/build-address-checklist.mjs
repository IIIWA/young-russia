import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const coordinates = JSON.parse(await fs.readFile(path.join(dataDir, 'club-coordinates.json'), 'utf8'));
const addressManifest = JSON.parse(await fs.readFile(path.join(dataDir, 'map-addresses.json'), 'utf8'));
const contactAudit = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'pmc-club-contact-audit.json'), 'utf8'));
const auditByClub = new Map(contactAudit.clubs.map(club => [`${club.district}\0${club.name}`, club]));
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
  'Рабочий документ от 16.10.2026. Все адреса взяты из локальных карточек проекта. Клубы с переданными пользователем координатами помечены зелёным в HTML-версии. Зелёный статус означает только получение координат: работа клуба, адрес и контакты отдельно не подтверждены.',
  '',
  `В списке **${clubs.length} клуба** и **${uniqueAddressCount} уникальных адреса**. У **${marked.length} клубов** координаты получены. Среди остальных приоритет «Высокий» у **${high.length} клубов**, «Средний» у **${medium.length}**; остальные требуют плановой сверки у организатора. Василеостровский район: **${vo.length} клуба**, координаты получены для **${vo.filter(item => item.userProvidedPoint).length}**.`,
  '',
  'При проверке спросить точный адрес занятий, корпус/литеру и вход, действует ли площадка, а также дату ответа. После подтверждения записать его в карточку клуба и повторно проверить точку на карте. До ответа не считать автоматическое совпадение подтверждением адреса.',
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
  lines.push(`## ${label} (${items.length})`, '', '| Статус | Клуб | Адрес в проекте | Что уточнить | Источник | Подтверждённый адрес / дата |', '| --- | --- | --- | --- | --- | --- |');
  for (const {club, coordinate, addressNote, structuralReview, priority, userProvidedPoint, audit} of sorted) {
    const statusReason = ['not_found', 'wrong_region'].includes(coordinate.status) ? statusNames[coordinate.status] : '';
    const reason = [...new Set([addressNote, statusReason, ...structuralReview, ...(coordinate.reasons ?? [])].filter(Boolean))].join('; ') || statusNames[coordinate.status];
    const source = sourceLink(club.officialUrl || club.sourceUrl || audit?.source);
    lines.push(`| ${userProvidedPoint ? '✓ Координаты получены' : priority} | ${cell(club.name)} | ${cell(club.address)} | ${cell(reason)} | ${source} | — |`);
  }
  lines.push('');
}

const target = path.join(root, 'docs', 'address-checklist-2026-10-16.md');
await fs.writeFile(target, `${lines.join('\n').trimEnd()}\n`, 'utf8');
const reportSections = groups.map(([label, items], index) => {
  const sorted = [...items].sort((a,b) => (a.userProvidedPoint ? 3 : {Высокий:0,Средний:1,Плановый:2}[a.priority]) - (b.userProvidedPoint ? 3 : {Высокий:0,Средний:1,Плановый:2}[b.priority]) || a.club.name.localeCompare(b.club.name, 'ru'));
  const rows = sorted.map(({club, coordinate, addressNote, structuralReview, priority, userProvidedPoint, audit}) => {
    const statusReason = ['not_found', 'wrong_region'].includes(coordinate.status) ? statusNames[coordinate.status] : '';
    const reason = [...new Set([addressNote, statusReason, ...structuralReview, ...(coordinate.reasons ?? [])].filter(Boolean))].join('; ') || statusNames[coordinate.status];
    const sourceUrl = club.officialUrl || club.sourceUrl || audit?.source;
    const source = /^https?:\/\//.test(sourceUrl ?? '') ? `<a href="${htmlCell(sourceUrl)}" target="_blank" rel="noopener noreferrer">Открыть</a>` : 'Не указан';
    const status = userProvidedPoint ? 'Координаты получены' : priority;
    return `<tr class="${userProvidedPoint ? 'coordinates-received' : ''}"><td><span class="status">${status}</span></td><td><strong>${htmlCell(club.name)}</strong></td><td>${htmlCell(club.address)}</td><td>${htmlCell(reason)}</td><td>${source}</td><td class="empty">Не заполнено</td></tr>`;
  }).join('\n');
  return `<section id="district-${index}"><h2>${htmlCell(label)} <small>${items.length}</small></h2><div class="table-wrap"><table><thead><tr><th>Статус</th><th>Клуб</th><th>Адрес в проекте</th><th>Что уточнить</th><th>Источник</th><th>Подтверждение</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}).join('\n');
const navigation = groups.map(([label], index) => `<a href="#district-${index}">${htmlCell(label)}</a>`).join('');
const reportHtml = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Адреса клубов Петербурга: проверка</title>
<style>
:root{font-family:Arial,sans-serif;color:#17221c;background:#f6f8f6}*{box-sizing:border-box}body{margin:0}main{max-width:1440px;margin:auto;padding:32px 24px 80px}h1,h2{text-wrap:balance}p,li{text-wrap:pretty;line-height:1.5}h1{font-size:clamp(28px,4vw,44px);margin:0 0 14px}h2{font-size:23px;margin:44px 0 15px}h2 small{color:#69766e;font-size:15px}.lead{max-width:900px;color:#46574c}.summary{display:flex;gap:12px;flex-wrap:wrap;margin:25px 0}.summary span{padding:12px 16px;background:white;border:1px solid #dce4dc;border-radius:10px}.summary b{font-size:22px}.legend{background:white;border:1px solid #dce4dc;border-radius:12px;padding:16px 20px;max-width:980px}.legend p{margin:5px 0}.swatch{display:inline-block;width:14px;height:14px;background:#dff4df;border:1px solid #b1ddb3;vertical-align:-2px;margin-right:7px}.district-nav{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0}.district-nav a{background:#fff;border:1px solid #dce4dc;border-radius:20px;padding:7px 11px;color:#215a37;text-decoration:none}.district-nav a:hover{background:#e9f3eb}.table-wrap{overflow-x:auto;border:1px solid #dce4dc;border-radius:12px;background:white}table{width:100%;border-collapse:collapse;min-width:950px;font-size:14px}th,td{text-align:left;padding:12px 13px;vertical-align:top;border-bottom:1px solid #e3e9e3}th{background:#e9eee9;position:sticky;top:0;z-index:1}tr:last-child td{border-bottom:0}tbody tr:hover{background:#f2f6f2}tbody tr.coordinates-received,tbody tr.coordinates-received:hover{background:#dff4df}tr.coordinates-received td{border-bottom-color:#c2e7c5}td:nth-child(2){min-width:150px}td:nth-child(3){min-width:190px}td:nth-child(4){min-width:210px}a{color:#17633a}.status{font-weight:700}.coordinates-received .status{color:#145d31}.empty{color:#818b83}section{scroll-margin-top:20px}footer{margin-top:40px;color:#617064;font-size:14px}@media(max-width:600px){main{padding:20px 12px 50px}.summary span{flex:1 1 42%}table{font-size:13px}}
</style></head><body><main><h1>Адреса клубов Петербурга</h1><p class="lead">Рабочий список для&nbsp;уточнения адресов. Зелёным отмечены клубы, для&nbsp;которых вы&nbsp;передали координаты. Цвет не&nbsp;означает подтверждения работы клуба, адреса и&nbsp;контактов.</p>
<div class="summary"><span><b>${clubs.length}</b><br>клуба в&nbsp;списке</span><span><b>${marked.length}</b><br>с&nbsp;координатами</span><span><b>${high.length}</b><br>высокий приоритет</span><span><b>${medium.length}</b><br>средний приоритет</span></div>
<div class="legend"><p><span class="swatch"></span><b>Координаты получены:</b> клуб выделен зелёным.</p><p><b>Высокий приоритет:</b> есть расхождение, нет полного адреса или автоматическая карта не&nbsp;нашла подходящую точку.</p><p><b>Средний и&nbsp;плановый:</b> проверить актуальность адреса у&nbsp;центра перед публикацией.</p></div>
<nav class="district-nav" aria-label="Районы">${navigation}</nav>${reportSections}
<footer>Составлено 16.10.2026 по&nbsp;локальным данным проекта. <a href="address-checklist-2026-10-16.md">Текстовая версия</a>.</footer></main></body></html>`;
const htmlTarget = path.join(root, 'docs', 'address-checklist-2026-10-16.html');
await fs.writeFile(htmlTarget, reportHtml, 'utf8');
console.log(`Wrote checklist: ${clubs.length} clubs; ${marked.length} green; ${high.length} high, ${medium.length} medium, ${vo.length} VO.`);
