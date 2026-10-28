import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {approximateActivityTopics, classifyActivity, classifyClub, topicGroups} from '../scripts/topic-taxonomy.mjs';
import {mapClubActivityEntries} from '../scripts/activity-page-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'prototype/site/directions');
const districtNames = {
  admiralteysky:'Адмиралтейский', vasileostrovsky:'Василеостровский', vyborgsky:'Выборгский', kalininsky:'Калининский', kirovsky:'Кировский', kolpinsky:'Колпинский', krasnogvardeysky:'Красногвардейский', krasnoselsky:'Красносельский', kronshtadtsky:'Кронштадтский', kurortny:'Курортный', moskovsky:'Московский', nevsky:'Невский', petrogradsky:'Петроградский', petrodvortsovy:'Петродворцовый', primorsky:'Приморский', pushkinsky:'Пушкинский', frunzensky:'Фрунзенский', tsentralny:'Центральный',
};
const districtByFile = {vo:'vasileostrovsky'};
const escape = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const glue = value => escape(value).replace(/(?<![\p{L}])(в|во|с|со|к|ко|о|об|у|и|а|но|из|от|до|по|за|на|под|для|не|или) /giu, '$1&nbsp;');
const dataFiles = (await fs.readdir(path.join(root,'data'))).filter(file => /^clubs-.*\.json$/.test(file));
const venueWord = count => count % 100 >= 11 && count % 100 <= 14 ? 'площадок' : count % 10 === 1 ? 'площадка' : count % 10 >= 2 && count % 10 <= 4 ? 'площадки' : 'площадок';
const clubs = [];
for (const file of dataFiles) {
  const code = districtByFile[file.slice(6,-5)] ?? file.slice(6,-5);
  for (const club of JSON.parse(await fs.readFile(path.join(root,'data',file),'utf8'))) {
    const classification = classifyClub(club);
    clubs.push({...club, district:code, topics:classification.topics, subtopics:classification.subtopics});
  }
}
const coordinateData = JSON.parse(await fs.readFile(path.join(root,'data','club-coordinates.json'),'utf8'));
const clubsByLocation = new Map(clubs.map(club => [`${club.district}|${club.name}|${club.address}`,club]));
const knownSlugs = {'Морской':'morskoy','Аврора':'avrora','Витана':'vitana','Притяжение':'prityazhenie','Белый медведь':'belyy-medved'};
const translit = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
const slugify = value => [...value.toLowerCase()].map(char => translit[char] ?? char).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const prototypeClubPages = new Set((await fs.readdir(path.join(root,'prototype/site/clubs'),{recursive:true})).filter(name => name.endsWith('.html')).map(name => name.replaceAll('\\','/')));
const mapPoints = coordinateData.addresses.flatMap(address => address.clubCoordinates.flatMap(point => {
  const club = clubsByLocation.get(`${address.district}|${point.clubName}|${address.address}`);
  if (!club || !point.coordinates) return [];
  const activities = mapClubActivityEntries({...club,districtCode:club.district,slug:knownSlugs[club.name] ?? slugify(club.name)});
  return [{key:`${club.district}|${club.name}|${club.address}`,name:club.name,address:club.address,activities,coordinates:[point.coordinates.latitude,point.coordinates.longitude],district:club.district,topics:club.topics,subtopics:club.subtopics,provisional:point.source !== 'user_provided' || point.precision === 'approximate',url:`../districts/${club.district}.html#clubs`,linkLabel:'Каталог района'}];
}));

function section(number,key,label,body,note,extra='') {
  return `<section class="wire-section ${extra}" id="${key}" data-section="${key}" data-section-label="${escape(label)}"><div class="section-label-row"><span class="sec-label">${String(number).padStart(2,'0')} · ${escape(label.toUpperCase())}</span></div><div class="section-body">${body}</div><p class="section-note">↳ ${glue(note)}</p></section>`;
}

function page(code,group) {
  const matching = clubs.filter(club => club.topics.includes(code));
  const subtopicCards = Object.entries(group.subtopics).map(([subtopic,label]) => {
    const count = matching.filter(club => club.subtopics.includes(subtopic)).length;
    return `<button class="direction-subgroup" type="button" data-subtopic-button="${subtopic}" aria-pressed="false"><span class="subgroup-count">${count} ${venueWord(count)}</span><strong>${glue(label)}</strong><span class="subgroup-action">Показать клубы →</span></button>`;
  }).join('');
  const districts = [...new Set(matching.map(club => club.district))].sort((a,b) => districtNames[a].localeCompare(districtNames[b],'ru'));
  const districtOptions = districts.map(key => `<option value="${key}">${escape(districtNames[key])}</option>`).join('');
  const clubCards = matching.map(club => `<article class="direction-result" data-subtopics="${club.subtopics.join(' ')}" data-district="${club.district}"><span class="result-district">${escape(districtNames[club.district])} район</span><h3>${glue(club.name)}</h3><p>${glue((club.activities ?? []).slice(0,4).join(', ') || 'Направления уточняются')}</p><p class="result-address">${glue(club.address)}</p><a href="https://young-russia.ru/districts/${club.district}.html#clubs" target="_blank" rel="noopener noreferrer">Открыть каталог района ↗</a></article>`).join('');
  const otherDirections = Object.entries(topicGroups).map(([key,item]) => `<a class="direction-other${key===code?' current':''}" href="${key}.html"${key===code?' aria-current="page"':''}>${glue(item.label)}</a>`).join('');
  const body = section(1,'overview','Направление',`<nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><span>${glue(group.label)}</span></nav><div class="direction-intro"><p class="eyebrow">Занятия в&nbsp;Петербурге</p><h1>${glue(group.label)}</h1><p class="lead">Выбери занятие по&nbsp;интересу. Затем можно оставить весь город или уточнить район.</p><a class="wire-button button-dark" href="#subgroups">Смотреть подгруппы ↓</a></div>`,`Главная задача страницы: сначала показать выбор занятия, затем дать уточнить расположение.`, 'hero-band')
  + section(2,'subgroups','Подгруппы',`<h2>Что тебе интересно?</h2><p>Выбери подгруппу, чтобы увидеть подходящие площадки.</p><div class="direction-subgroups" role="group" aria-label="Подгруппы направления">${subtopicCards}</div>`,`Названия подгрупп взяты из действующей классификации каталога. Числа отражают площадки, где указаны подходящие занятия.`)
  + section(3,'results','Подбор клубов',`<div class="direction-results-head"><div><h2>Где заниматься</h2><p id="direction-summary" aria-live="polite"></p></div><div class="direction-controls"><label for="direction-district">Район</label><select id="direction-district"><option value="">Весь Петербург</option>${districtOptions}</select><button id="direction-reset" type="button">Сбросить фильтры</button></div></div><div class="direction-results" id="direction-results">${clubCards}</div><p class="direction-empty" id="direction-empty" hidden>Подходящих площадок пока нет. Выбери другой район или подгруппу.</p><button class="wire-button button-outline" id="direction-more" type="button" hidden>Показать ещё</button>`,`Карточки используют текущий каталог. В&nbsp;прототипе ссылка ведёт к&nbsp;районному каталогу; в&nbsp;проде она будет вести прямо на&nbsp;страницу клуба.`)
  + section(4,'other-directions','Другие направления',`<h2>Можно попробовать другое</h2><nav class="direction-other-grid" aria-label="Направления">${otherDirections}</nav>`,`Пять направлений остаются доступными без возврата на&nbsp;главную.`);
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Прототип страницы направления ${escape(group.label)}"><title>${escape(group.label)} | Прототип ПМК Петербурга</title><link rel="stylesheet" href="../assets/wire.css"><link rel="stylesheet" href="../assets/directions.css"><script src="../assets/app.js" defer></script><script src="../assets/directions.js" defer></script><script src="../assets/comments.js" defer></script></head><body><a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><nav class="main-nav" aria-label="Основная навигация"><a href="#subgroups" aria-current="page">Занятия</a><a href="../districts/index.html">Районы</a><a href="../index.html#join">Как участвовать</a></nav><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button><button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden><a href="#subgroups">Занятия</a><a href="../districts/index.html">Районы</a><a href="../index.html#join">Как участвовать</a><button type="button" data-page-comment>Обсудить страницу</button></nav></header><main id="main" class="wire-main">${body}</main><footer class="site-footer"><div class="footer-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><p>Сведения о&nbsp;занятиях и&nbsp;записи уточняйте у&nbsp;организаторов.</p><a href="../districts/index.html">Все районы →</a></div></footer></body></html>`;
}

function unifiedPage() {
  const topicButtons = Object.entries(topicGroups).map(([code,group]) => {
    const count = clubs.filter(club => club.topics.includes(code)).length;
    return `<button class="direction-topic" type="button" data-topic-button="${code}" aria-pressed="false"><span class="topic-bullet" aria-hidden="true"></span><strong>${glue(group.label)}</strong><small>${count} ${venueWord(count)}</small></button>`;
  }).join('');
  const subtopicButtons = Object.entries(topicGroups).flatMap(([code,group]) => Object.entries(group.subtopics).map(([subtopic,label]) => {
    const count = clubs.filter(club => club.subtopics.includes(subtopic)).length;
    return `<label class="direction-subgroup" hidden><input type="radio" name="direction-subtopic" data-group="${code}" data-subtopic-button="${subtopic}"><span class="direction-subgroup-body"><strong>${glue(label)}</strong><small>${count} ${venueWord(count)}</small></span></label>`;
  })).join('');
  const districtOptions = Object.entries(districtNames).sort((a,b) => a[1].localeCompare(b[1],'ru')).map(([code,label]) => `<option value="${code}">${glue(label)}</option>`).join('');
  const clubCards = clubs.filter(club => club.topics.length).map(club => {
    const activities = (club.activities ?? []).map(label => ({label,subtopics:classifyActivity(label),provisional:Object.hasOwn(approximateActivityTopics,label)}));
    const mapPoint = mapPoints.find(point => point.district === club.district && point.name === club.name && point.address === club.address);
    const clubRoute = `${club.district === 'vasileostrovsky' ? '' : `${club.district}/`}${knownSlugs[club.name] ?? slugify(club.name)}.html`;
    const hasPrototypeClub = prototypeClubPages.has(clubRoute);
    return `<article class="direction-result" data-topics="${club.topics.join(' ')}" data-district="${club.district}" data-activities="${escape(JSON.stringify(activities))}"${mapPoint ? ` data-map-key="${escape(mapPoint.key)}"` : ''}><span class="result-district">${glue(districtNames[club.district])} район</span><h3>${glue(club.name)}</h3><p class="result-activity"><span>Подходящее занятие</span><strong data-matched-activity></strong><small data-activity-provisional hidden>Тематика уточняется</small></p><p class="result-address">${glue(club.address)}</p><a href="${hasPrototypeClub ? `../clubs/${clubRoute}` : `../districts/${club.district}.html#clubs`}">${hasPrototypeClub ? 'Открыть страницу клуба' : 'Открыть каталог района'} →</a></article>`;
  }).join('');
  const explore = `<div class="direction-explore"><details class="direction-subgroups" id="subgroup-list" open><summary><span>Подгруппы направления</span><strong id="direction-subtopic-selection">Все занятия</strong></summary><div class="direction-subgroup-options" role="radiogroup" aria-label="Подгруппы направления"><label class="direction-subgroup direction-subgroup-all"><input type="radio" name="direction-subtopic" data-subtopic-button="" checked><span class="direction-subgroup-body"><strong>Все занятия</strong><small>Всё направление</small></span></label>${subtopicButtons}</div></details><div class="direction-map-panel"><div class="direction-map-heading"><strong>Клубы на&nbsp;карте</strong><span>По&nbsp;выбранным фильтрам</span></div><div class="prototype-map-frame"><div class="prototype-map" data-map-preview role="region" aria-label="Карта клубов по выбранным фильтрам"></div><p class="prototype-map-status" role="status">Загружаем карту клубов…</p></div><p id="map-preview-summary" class="prototype-map-summary" role="status" aria-live="polite"></p></div></div><script type="application/json" id="map-preview-data">${JSON.stringify(mapPoints).replaceAll('<','\\u003c')}</script>`;
  const body = section(1,'directions','Выбор направления и карта',`<nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><span>Занятия</span></nav><div class="direction-intro"><p class="eyebrow">Занятия в&nbsp;Петербурге</p><h1 id="direction-title">Знания и&nbsp;технологии</h1><p class="lead">Выбери район, направление и&nbsp;занятие.</p></div><div class="direction-controls"><label for="direction-district">Район</label><select id="direction-district"><option value="">Весь Петербург</option>${districtOptions}</select><button id="direction-reset" type="button">Сбросить фильтры</button></div><div class="direction-topics" role="group" aria-label="Направления занятий">${topicButtons}</div>${explore}`,`Пять направлений доступны на&nbsp;одной странице. Активное направление меняет подгруппы, карту и&nbsp;карточки.`, 'hero-band')
    + section(2,'results','Подбор клубов',`<div class="direction-results-head"><div><p class="eyebrow">Подходящие площадки</p><h2>Где заниматься</h2><p id="direction-summary" aria-live="polite"></p></div></div><div class="direction-results" id="direction-results">${clubCards}</div><p class="direction-empty" id="direction-empty" hidden>Подходящих площадок пока нет. Выбери другой район или подгруппу.</p><button class="wire-button button-outline" id="direction-more" type="button" hidden>Показать ещё</button><p class="direction-results-note">Направления собраны по&nbsp;открытым материалам учреждений. Действующие группы, возраст, расписание и&nbsp;набор уточняй у&nbsp;организаторов.</p>`,`Карточка показывает одно подходящее занятие. Ссылка ведёт в&nbsp;сохранённый прототип районного каталога.`);
  const taxonomyJson = JSON.stringify(topicGroups).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Прототип страницы выбора занятий в Петербурге"><title>Занятия | Прототип ПМК Петербурга</title><link rel="stylesheet" href="../assets/wire.css"><link rel="stylesheet" href="../assets/directions.css"><script type="application/json" id="direction-taxonomy">${taxonomyJson}</script><script src="../assets/app.js" defer></script><script src="../assets/directions-map-preview.js" defer></script><script src="../assets/directions-unified.js" defer></script><script src="../assets/comments.js" defer></script></head><body><a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><nav class="main-nav" aria-label="Основная навигация"><a href="#directions" aria-current="page">Занятия</a><a href="../districts/index.html">Районы</a><a href="../index.html#join">Как участвовать</a></nav><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button><button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden><a href="#directions">Занятия</a><a href="../districts/index.html">Районы</a><a href="../index.html#join">Как участвовать</a><button type="button" data-page-comment>Обсудить страницу</button></nav></header><main id="main" class="wire-main">${body}</main><footer class="site-footer"><div class="footer-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><p>Сведения о&nbsp;занятиях и&nbsp;записи уточняйте у&nbsp;организаторов.</p><a href="../districts/index.html">Все районы →</a></div></footer></body></html>`;
}

await fs.mkdir(output,{recursive:true});
for (const [code,group] of Object.entries(topicGroups)) {
  const redirect = `<script>const params = new URLSearchParams(location.search); params.set('topic','${code}'); location.replace('index.html?' + params.toString());</script>`;
  const legacyPage = page(code,group).replace('<script src="../assets/app.js" defer></script>',redirect + '<script src="../assets/app.js" defer></script>');
  await fs.writeFile(path.join(output,`${code}.html`),legacyPage,'utf8');
}
await fs.writeFile(path.join(output,'index.html'),unifiedPage(),'utf8');
console.log(`Built ${Object.keys(topicGroups).length + 1} direction prototypes from ${clubs.length} club records.`);
