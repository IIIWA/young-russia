import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { topicGroups, classifyActivity } from './topic-taxonomy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'prototype', 'site', 'guides');
const activityOutput = path.join(root, 'prototype', 'site', 'activities');
const guideDrafts = JSON.parse(await fs.readFile(path.join(root, 'data', 'editorial-guide-drafts.json'), 'utf8'));
const catalogFacts = JSON.parse(await fs.readFile(path.join(root, 'data', 'catalog-facts.json'), 'utf8'));
if (catalogFacts.allActivitiesFree !== true) throw new Error('Topic page copy requires confirmed free activities');

const districtNames = new Map([
  ['admiralteysky', 'Адмиралтейский'], ['vasileostrovsky', 'Василеостровский'],
  ['vyborgsky', 'Выборгский'], ['kalininsky', 'Калининский'], ['kirovsky', 'Кировский'],
  ['kolpinsky', 'Колпинский'], ['krasnogvardeysky', 'Красногвардейский'],
  ['krasnoselsky', 'Красносельский'], ['kronshtadtsky', 'Кронштадтский'],
  ['kurortny', 'Курортный'], ['moskovsky', 'Московский'], ['nevsky', 'Невский'],
  ['petrogradsky', 'Петроградский'], ['petrodvortsovy', 'Петродворцовый'],
  ['primorsky', 'Приморский'], ['pushkinsky', 'Пушкинский'],
  ['frunzensky', 'Фрунзенский'], ['tsentralny', 'Центральный'],
]);
const translit = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
const slugify = value => [...value.toLowerCase()].map(char => translit[char] ?? char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text = value => html(value)
  .replace(/(?<![\p{L}\p{N}])(в|во|с|со|к|ко|о|об|у|и|а|но|да|из|от|до|по|за|на|под|над|при|про|без|для|не|ни|что|как|или|чем|где|то|если|между|через) +/giu, '$1&nbsp;')
  .replace(/ +(бы|б|же|ж|ли|ль)(?=[\s?!.,;:]|$)/giu, '&nbsp;$1')
  .replace(/(\d) +(?=[А-Яа-яЁё])/gu, '$1&nbsp;');
const voSlugs = {'Морской':'morskoy','Аврора':'avrora','Витана':'vitana','Притяжение':'prityazhenie','Белый медведь':'belyy-medved'};
const directionSlug = (district, club, activity, index) => {
  if (district === 'vasileostrovsky' && club.name === 'Морской' && activity === 'Разговорный клуб: английский, немецкий, японский') return 'morskoy-razgovornyy-klub';
  if (district === 'admiralteysky' && club.name === 'Клуб юных моряков «Адмиралтеец»' && activity === 'Бокс') return 'admiralteets-boks';
  const clubSlug = club.slug || (district === 'vasileostrovsky' && voSlugs[club.name]) || slugify(club.name);
  return `${district}-${clubSlug.slice(0, 42)}-${slugify(activity).slice(0, 34) || 'zanyatie'}-${String(index + 1).padStart(2, '0')}`;
};

const topics = [
  {slug:'razgovornye-kluby', navTitle:'Разговорные клубы', group:'knowledge', subgroup:'languages', match:activity => classifyActivity(activity).includes('languages')},
  {slug:'boks', navTitle:'Бокс', group:'sport', subgroup:'martial_arts', match:activity => activity.trim().toLocaleLowerCase('ru-RU') === 'бокс'},
];
const guideLanguages = [['Английский','английск','EN','gb'],['Немецкий','немецк','DE','de'],['Французский','французск','FR','fr'],['Испанский','испанск','ES','es'],['Китайский','китайск','ZH','cn'],['Японский','японск','JA','jp'],['Корейский','корейск','KO','kr'],['Жестовый язык','жестов','SL',null]];
const clubWord = count => count % 100 >= 11 && count % 100 <= 14 ? 'клубов' : count % 10 === 1 ? 'клуб' : count % 10 >= 2 && count % 10 <= 4 ? 'клуба' : 'клубов';
const coordinateData = JSON.parse(await fs.readFile(path.join(root, 'data', 'club-coordinates.json'), 'utf8'));
const points = new Map(coordinateData.addresses.flatMap(address => address.clubCoordinates.filter(point => point.coordinates).map(point => [
  `${address.district}|${point.clubName}|${address.address}`,
  {coordinates:[point.coordinates.latitude, point.coordinates.longitude], additionalCoordinates:(point.additionalPoints ?? []).map(extra => [extra.latitude, extra.longitude]), provisional:point.source !== 'user_provided' || point.precision === 'approximate'},
])));
const catalog = [];
for (const [districtCode] of districtNames) {
  const file = `clubs-${districtCode === 'vasileostrovsky' ? 'vo' : districtCode}.json`;
  const clubs = JSON.parse(await fs.readFile(path.join(root, 'data', file), 'utf8'));
  for (const [sourceIndex, club] of clubs.entries()) catalog.push({districtCode, sourceIndex, ...club});
}

function topicRecords(topic) {
  return catalog.flatMap(club => {
    const activities = (club.activities ?? []).map((activity, index) => ({activity, index})).filter(({activity}) => topic.match(activity));
    if (!activities.length) return [];
    const point = points.get(`${club.districtCode}|${club.name}|${club.address}`);
    const links = activities.map(({activity, index}) => ({activity, url:`../activities/${directionSlug(club.districtCode, club, activity, index)}.html`}));
    return [{id:`${club.districtCode}-${club.sourceIndex}`, name:club.name, address:club.address, district:club.districtCode, districtName:districtNames.get(club.districtCode), activities:links, point}];
  }).sort((a, b) => a.districtName.localeCompare(b.districtName, 'ru') || a.name.localeCompare(b.name, 'ru'));
}

function section(number, label, id, body, note) {
  return `<section class="wire-section guide-section" id="${id}" data-section="${id}" data-section-label="${html(label)}"><div class="section-label-row"></div>${body}</section>`;
}

function renderGuideNavigation(currentSlug, contents) {
  const currentTopic = topics.find(topic => topic.slug === currentSlug);
  const renderTopic = topic => {
    const active = topic.slug === currentSlug;
    const sections = active ? `<ol class="guide-nav-sections" aria-label="Пункты текущей статьи">${contents.map(([id, label]) => `<li><a href="#${id}">${text(label)}</a></li>`).join('')}</ol>` : '';
    return `<li class="guide-nav-item${active ? ' is-current' : ''}">${active
      ? `<details class="guide-nav-article" open><summary class="guide-nav-title" aria-current="page">${text(topic.navTitle)}<span class="guide-nav-chevron" aria-hidden="true">›</span></summary>${sections}</details>`
      : `<a class="guide-nav-title" href="${topic.slug}.html">${text(topic.navTitle)}<span aria-hidden="true">›</span></a>`}</li>`;
  };
  const groups = Object.entries(topicGroups).map(([groupId, group]) => `<li><details class="guide-nav-category"${currentTopic?.group === groupId ? ' open' : ''}><summary class="guide-nav-group-title">${text(group.label)}<span class="guide-nav-chevron" aria-hidden="true">›</span></summary><ul class="guide-nav-subgroups">${Object.entries(group.subtopics).map(([subgroupId, label]) => `<li><a class="guide-nav-subgroup" href="../directions/index.html?topic=${groupId}&amp;subtopic=${subgroupId}">${text(label)}</a>${topics.some(topic => topic.subgroup === subgroupId) ? `<ul class="guide-nav-articles">${topics.filter(topic => topic.subgroup === subgroupId).map(renderTopic).join('')}</ul>` : ''}</li>`).join('')}</ul></details></li>`).join('');
  return `<button class="guide-nav-toggle" type="button" aria-controls="guide-sidebar" aria-expanded="false"><span aria-hidden="true">☰</span> Гид по&nbsp;занятиям</button><button class="guide-nav-backdrop" type="button" aria-label="Закрыть меню гидов" tabindex="-1" hidden></button><aside class="guide-sidebar" id="guide-sidebar" aria-label="Гид по занятиям" tabindex="-1"><div class="guide-sidebar-head"><a class="guide-sidebar-title" href="index.html"${currentSlug ? '' : ' aria-current="page"'}>Гид по&nbsp;занятиям</a><button class="guide-nav-close" type="button" aria-label="Закрыть меню гидов"><span aria-hidden="true">×</span></button></div><nav aria-label="Направления и статьи гида"><ul class="guide-nav-list">${groups}</ul></nav></aside>`;
}

function guideShell({title, description, currentSlug = null, contents = [], compact = false, content}) {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${html(description)}"><title>${html(title)} · Прототип</title><link rel="stylesheet" href="../assets/wire.css"><link rel="stylesheet" href="../assets/topic-pages.css"><link rel="stylesheet" href="../assets/guide-pages.css"><script src="../assets/app.js" defer></script><script src="../assets/guide-navigation.js" defer></script>${currentSlug ? '<script src="../assets/topic-map.js" defer></script>' : ''}<script src="../assets/comments.js" defer></script></head>
<body><a class="skip-link" href="#guide-article">Перейти к&nbsp;содержимому</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">Young Russia<span> / прототип</span></a><nav class="main-nav" aria-label="Основная навигация"><a href="../directions/index.html">Занятия</a><a href="../districts/index.html">Районы</a><a href="index.html" aria-current="page">Гид по&nbsp;занятиям</a></nav><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button><button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden><a href="../directions/index.html">Занятия</a><a href="../districts/index.html">Районы</a><a href="index.html">Гид по&nbsp;занятиям</a></nav></header>
<main id="main" class="guide-main${compact ? ' guide-compact' : ''}"><div class="guide-layout">${renderGuideNavigation(currentSlug, contents)}<div class="guide-content">${content}</div></div></main></body></html>`;
}

function render(topic, records) {
  const draft = guideDrafts[topic.slug];
  if (!draft) throw new Error(`No article draft for ${topic.slug}`);
  const compact = draft.layout === 'compact';
  const districts = [...new Map(records.map(record => [record.district, record.districtName]))];
  const englishClubCount = records.filter(record => record.activities.some(link => /английск/iu.test(link.activity))).length;
  const conversationClubCount = records.filter(record => record.activities.some(link => /разговорн/iu.test(link.activity))).length;
  const englishConversationCount = records.filter(record => record.activities.some(link => /английск/iu.test(link.activity) && /разговорн/iu.test(link.activity))).length;
  const expand = value => String(value).replaceAll('{{clubCount}}', records.length).replaceAll('{{clubCountLabel}}', `${records.length} ${clubWord(records.length)}`).replaceAll('{{districtCount}}', districts.length).replaceAll('{{englishClubCount}}', englishClubCount).replaceAll('{{englishClubLabel}}', `${englishClubCount} ${clubWord(englishClubCount)}`).replaceAll('{{conversationClubCount}}', conversationClubCount).replaceAll('{{englishConversationCount}}', englishConversationCount);
  const rich = value => text(expand(value)).replace(/\[([^\]]+)\]\((\.\.\/activities\/[a-z0-9-]+\.html)\)/g, '<a href="$2">$1</a>');
  const paragraphs = values => (values ?? []).map(value => `<p>${rich(value)}</p>`).join('');
  const languageTable = () => {
    const unknown = record => !record.activities.some(link => guideLanguages.some(([, part]) => link.activity.toLocaleLowerCase('ru').includes(part)));
    const rows = [...guideLanguages.map(([label, part, code, flag]) => ({label, part, code, flag, matching:records.filter(record => record.activities.some(link => link.activity.toLocaleLowerCase('ru').includes(part)))})), {label:'Язык уточняется',code:'?',flag:null,matching:records.filter(unknown)}];
    return `<div class="guide-table-wrap"><table class="guide-table guide-language-table"><caption class="sr-only">Языки, клубы и явно названные разговорные занятия</caption><thead><tr><th scope="col">Язык</th><th scope="col">Клубы и занятия</th></tr></thead><tbody>${rows.filter(row => row.matching.length).map(row => `<tr${row.flag ? ` data-language-flag="${row.flag}"` : ''}><th scope="row"><div class="guide-language-label"><span class="guide-language-code" aria-hidden="true">${row.code}</span><span>${text(row.label)}<span class="guide-language-count">${row.matching.length}&nbsp;${clubWord(row.matching.length)}</span></span></div></th><td>${row.flag ? '<span class="guide-language-flag" aria-hidden="true"></span>' : ''}<ul class="guide-language-clubs">${row.matching.map(record => {
      const link = row.part ? record.activities.find(link => link.activity.toLocaleLowerCase('ru').includes(row.part)) : record.activities[0];
      return `<li data-language-club="${record.id}"><a href="${html(link.url)}" title="${html(link.activity)}">${text(record.name)}${/разговорн/iu.test(link.activity) ? '<span class="guide-speaking-badge">Разговорный</span>' : ''}</a></li>`;
    }).join('')}</ul></td></tr>`).join('')}</tbody></table></div>`;
  };
  const articleSections = draft.sections.map((item, index) => section(index + 1, item.heading, item.id, `<h2>${rich(item.heading)}</h2>${paragraphs(item.paragraphs)}${item.catalogTable === 'languages' ? languageTable() : ''}${item.after ? `<p>${rich(item.after)}</p>` : ''}${item.list ? `<ul>${item.list.map(value => `<li>${rich(value)}</li>`).join('')}</ul>` : ''}`)).join('');
  const mapData = records.filter(record => record.point).map(record => ({id:record.id,name:record.name,address:record.address,district:record.district,activities:record.activities,...(topic.slug === 'razgovornye-kluby' ? {languages:guideLanguages.filter(([,part]) => record.activities.some(link => link.activity.toLocaleLowerCase('ru').includes(part))).map(([label]) => label.toLocaleLowerCase('ru')),formatNote:record.activities.some(link => /разговорн/iu.test(link.activity)) ? 'Разговорные занятия указаны в названии направления' : 'Формат занятий уточните у клуба'} : {}),...record.point}));
  const mapJson = JSON.stringify(mapData).replace(/</g, '\\u003c');
  const filter = `<div class="topic-filter"><label for="topic-district">Выбрать район</label><select id="topic-district"><option value="">Все районы</option>${districts.map(([code, name]) => `<option value="${code}">${text(name)}</option>`).join('')}</select><p id="topic-result-count" role="status">Показано ${records.length} из&nbsp;${records.length} клубов</p></div>`;
  const map = section(5, draft.mapHeading, 'map', `<h2>${text(draft.mapHeading)}</h2>${compact ? '' : '<p>Выбери удобный район. Карта и&nbsp;список ниже показывают одни и&nbsp;те&nbsp;же клубы.</p>'}${filter}<div class="prototype-map-frame"><div id="topic-map" class="prototype-map" role="region" aria-label="${html(draft.mapHeading)}"></div><p id="topic-map-status" class="prototype-map-status" role="status">Загружаем карту Яндекса…</p></div><script id="topic-map-data" type="application/json">${mapJson}</script><p class="topic-map-credit">${mapData.length} из&nbsp;${records.length} клубов отмечены на&nbsp;карте. Предварительные точки выделены оранжевым. Источник предварительных координат: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>.</p>`);
  const cards = records.map(record => `<article class="topic-club-card" data-topic-club data-district="${record.district}" data-club-id="${record.id}"><span class="topic-club-district">${text(record.districtName)} район</span><h3>${text(record.name)}</h3><p class="topic-club-address">${text(record.address)}</p><ul class="topic-activity-links">${record.activities.map(link => `<li><a href="${html(link.url)}">${text(link.activity)} <span aria-hidden="true">→</span></a></li>`).join('')}</ul></article>`).join('');
  const addressTable = compact ? `<div class="guide-table-wrap" id="topic-club-grid"><table class="guide-table guide-address-table"><caption class="sr-only">Адреса клубов и ссылки на языковые занятия</caption><thead><tr><th scope="col">Клуб</th><th scope="col">Адрес</th></tr></thead><tbody>${records.map(record => `<tr data-topic-club data-district="${record.district}" data-club-id="${record.id}"><th scope="row"><a href="${html(record.activities[0].url)}">${text(record.name)}</a><span class="guide-address-district">${text(record.districtName)} район</span>${record.activities.slice(1).map(link => `<a class="guide-address-extra" href="${html(link.url)}">${text(link.activity)}</a>`).join('')}</th><td>${text(record.address)}</td></tr>`).join('')}</tbody></table></div>` : '';
  const clubs = section(6, draft.listHeading, 'clubs', `<h2>${text(draft.listHeading)}</h2>${compact ? `<details class="guide-address-disclosure"><summary>Показать адреса и&nbsp;контакты клубов</summary>${addressTable}</details>` : `<p>Нажми на&nbsp;название занятия, чтобы посмотреть контакты и&nbsp;известное расписание.</p><div class="topic-club-grid" id="topic-club-grid">${cards}</div>`}`);
  const join = section(7, draft.joinHeading, 'join', `<h2>${text(draft.joinHeading)}</h2>${paragraphs(draft.joinParagraphs)}`);
  const faq = section(8, 'Вопросы и ответы', 'questions', `<h2>Вопросы и&nbsp;ответы</h2><div class="guide-faq">${draft.faq.map(([question, answer]) => `<details><summary>${rich(question)}</summary><p>${rich(answer)}</p></details>`).join('')}</div>`);
  const contents = [...draft.sections.map(item => [item.id, item.heading]),['map',draft.mapHeading],['clubs',draft.listHeading],['join',draft.joinHeading],['questions','Вопросы и ответы']];
  return guideShell({
    title: draft.title,
    description: expand(draft.description),
    currentSlug: topic.slug,
    contents,
    compact,
    content: `<nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><a href="index.html">Гид по&nbsp;занятиям</a></nav><article id="guide-article" tabindex="-1"><header class="guide-hero">${compact ? '' : '<p class="guide-kicker">Гид по&nbsp;бесплатным занятиям</p>'}<h1>${text(draft.h1)}</h1><p class="guide-lead">${rich(draft.lead)}</p><p class="guide-meta">${draft.updatedAt ? text(`Обновлено ${new Date(`${draft.updatedAt}T12:00:00Z`).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Moscow'})}`) : 'Подборка по&nbsp;каталогу на&nbsp;22&nbsp;октября 2026&nbsp;года'}</p></header><div class="guide-body">${articleSections}${map}${clubs}${join}${faq}</div></article><footer class="guide-footer"><p>${compact ? 'Наличие мест, возраст и&nbsp;расписание уточняй у&nbsp;клуба.' : 'В&nbsp;подборку включены направления из&nbsp;каталога Young Russia. Условия конкретной группы и&nbsp;текущее расписание уточняй у&nbsp;организатора.'}</p><a href="index.html">Другие статьи о&nbsp;занятиях →</a></footer>`,
  });
}

await fs.mkdir(output, {recursive:true});
for (const topic of topics) {
  const records = topicRecords(topic);
  if (!records.length) throw new Error(`No clubs for ${topic.slug}`);
  for (const record of records) for (const link of record.activities) {
    await fs.access(path.join(activityOutput, path.basename(link.url)));
  }
  await fs.writeFile(path.join(output, `${topic.slug}.html`), render(topic, records));
  const mapped = records.filter(record => record.point);
  console.log(`${topic.slug}: ${records.length} clubs, ${mapped.length} clubs on map (${mapped.reduce((count, record) => count + 1 + record.point.additionalCoordinates.length, 0)} points)`);
}
await fs.writeFile(path.join(output, 'index.html'), guideShell({
  title: 'Гид по бесплатным занятиям | Young Russia',
  description: 'Статьи о бесплатных занятиях в Петербурге: разговорные клубы, бокс, адреса и выбор группы.',
  content: `<nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><span>Гид по&nbsp;занятиям</span></nav><article id="guide-article" tabindex="-1"><header class="guide-hero"><p class="guide-kicker">Young Russia / прототип</p><h1>Гид по&nbsp;бесплатным занятиям</h1><p class="guide-lead">Статьи о&nbsp;том, где найти занятия в&nbsp;Петербурге, как&nbsp;выбрать группу и&nbsp;связаться с&nbsp;организаторами.</p></header>${topics.map(topic => `<article class="topic-club-card"><h2><a href="${topic.slug}.html">${text(guideDrafts[topic.slug].h1)}</a></h2></article>`).join('')}</article>`,
}));
