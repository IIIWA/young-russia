import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const club = JSON.parse(await fs.readFile(path.join(root, 'data/clubs-admiralteysky.json'), 'utf8'))
  .find(item => item.name === 'Клуб юных моряков «Адмиралтеец»');
if (!club) throw new Error('Admiralteets club missing');
club.slug = 'klub-yunyh-moryakov-admiralteets';
club.organizationInfo = {site:'https://admiralteisky.admiral.gov.spb.ru/'};
const directions = [
  ['Судовождение','admiralteets-sudovozhdenie','Морские направления'],
  ['Морская пехота','admiralteets-morskaya-pekhota','Морские направления'],
  ['Лазертаг','admiralteets-lazertag','Активный отдых'],
  ['Комбинированный туризм','admiralteets-kombinirovannyy-turizm','Туризм'],
  ['Общая физическая подготовка','admiralteets-ofp','Спорт и движение'],
  ['Тайский бокс','admiralteets-tayskiy-boks','Единоборства'],
  ['Бокс','admiralteets-boks','Единоборства'],
  ['ЮНАРМИЯ','admiralteets-yunarmiya','Молодёжные направления'],
  ['Настольный теннис','admiralteets-nastolnyy-tennis','Спорт и движение'],
];
if (directions.length !== club.activities.length || directions.some(([activity]) => !club.activities.includes(activity))) throw new Error('Direction list differs from catalog');
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const section = (number,id,kicker,title,body,note) => `<section class="wire-section" id="${id}" data-section="${id}" data-section-label="${esc(title)}"><div class="section-label-row"><span class="sec-label">${number} · ${esc(kicker)}</span></div><div class="section-body"><h2>${title}</h2>${body}</div><p class="section-note">↳ ${note}</p></section>`;
function boxingSchedule() {
  const entries = club.activitySchedule?.find(item => item.activity === 'Бокс')?.schedule;
  if (!entries || entries.length !== 11) throw new Error('Boxing schedule missing');
  const days = [['понедельник','Пн','Понедельник'],['вторник','Вт','Вторник'],['среда','Ср','Среда'],['четверг','Чт','Четверг'],['пятница','Пт','Пятница'],['суббота','Сб','Суббота']];
  const groups = [['Дневные тренировки','day'],['Вечерние тренировки','evening']];
  const used = new Set();
  const rows = days.map(([day,label,fullLabel]) => {
    const cells = groups.map(([group,color]) => {
      const match = entries.filter(entry => entry.group === group && entry.day === day);
      if (day === 'суббота' && group === 'Вечерние тренировки') {
        if (match.length) throw new Error('Unexpected Saturday evening boxing session');
        return '<td></td>';
      }
      if (match.length !== 1 || !/^\d{2}:\d{2}$/.test(match[0].time)) throw new Error(`Missing boxing time: ${group}, ${day}`);
      used.add(match[0]);
      return `<td><span class="slot ${color}">${esc(match[0].time)}</span></td>`;
    }).join('');
    return `<tr><th scope="row" data-day-full="${fullLabel}" data-day-short="${label}">${label}</th>${cells}</tr>`;
  }).join('');
  if (used.size !== entries.length) throw new Error('Unexpected extra boxing sessions');
  return `<div class="schedule-scroll boxing-schedule-frame"><table class="boxing-schedule" aria-label="Расписание бокса"><colgroup><col><col><col></colgroup><thead><tr><th scope="col">День недели</th><th scope="col">Дневная</th><th scope="col">Вечерняя</th></tr></thead><tbody>${rows}</tbody></table></div><p>Указано время начала тренировок. Продолжительность и&nbsp;наличие мест уточни в&nbsp;сообществе секции.</p>`;
}
const style = `.wire-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.wire-address{font-weight:800;margin:18px 0 10px}.wire-map{display:block;width:100%;height:300px;border:1px solid #aaa;border-radius:8px;background:#eee}.schedule-scroll{max-width:620px;overflow:hidden}.schedule-scroll table{width:100%;table-layout:fixed;border-collapse:collapse}.schedule-scroll col:first-child{width:38%}.schedule-scroll col:nth-child(2),.schedule-scroll col:nth-child(3){width:31%}.schedule-scroll th,.schedule-scroll td{padding:8px;border:1px solid #aaa;text-align:left}.schedule-scroll tbody th{text-align:center;white-space:nowrap}.schedule-scroll td{padding:3px}.schedule-scroll .slot{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;font-weight:800}.schedule-scroll .day{background:#ddd}.schedule-scroll .evening{background:#bbb}@media(max-width:500px){.schedule-scroll th{padding:5px;font-size:14px}.schedule-scroll .slot{min-height:38px;border-radius:8px;font-size:14px}}`;
const boxingDayScript = `<script>const table=document.querySelector('.boxing-schedule');const cells=[...table.querySelectorAll('tbody th[data-day-full]')];const frame=table.closest('.boxing-schedule-frame');const probe=document.createElement('span');probe.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none';document.body.append(probe);function updateDayNames(){const allFit=cells.every(cell=>{const style=getComputedStyle(cell);probe.style.font=style.font;probe.style.letterSpacing=style.letterSpacing;probe.textContent=cell.dataset.dayFull;const available=cell.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);return probe.getBoundingClientRect().width<=available-2});cells.forEach(cell=>{cell.textContent=allFit?cell.dataset.dayFull:cell.dataset.dayShort})}updateDayNames();new ResizeObserver(updateDayNames).observe(frame);document.fonts?.ready.then(updateDayNames);</script>`;
for (const [activity,slug,label] of directions) {
  const page = club.activityPages?.find(item => item.catalogActivity === activity);
  const directionLeader = page?.communityContacts?.find(contact => contact.role === 'руководитель направления');
  const directionUrl = page?.vkUrl;
  const community = directionUrl
    ? `<div class="wire-links"><a class="wire-button button-dark" href="${esc(directionUrl)}" target="_blank" rel="noopener noreferrer">${esc(page.title)} ВКонтакте ↗</a>${(page.communityContacts ?? []).map(contact => `<a class="wire-button button-outline" href="${esc(contact.profileUrl)}" target="_blank" rel="noopener noreferrer">${contact.role === 'руководитель направления' ? 'Руководитель направления' : 'Контакт сообщества'}: ${esc(contact.displayName)} ↗</a>`).join('')}</div>`
    : `<p>Отдельное сообщество направления пока не&nbsp;указано. Вопросы можно задать в&nbsp;<a href="${esc(club.vkUrl)}" target="_blank" rel="noopener noreferrer">сообществе клуба</a>.</p>`;
  const schedule = activity === 'Бокс' ? boxingSchedule() : '<p>Расписание направления пока не&nbsp;уточнено. Перед визитом спроси актуальное время у&nbsp;организаторов.</p>';
  const joinUrl = directionUrl ?? club.vkUrl;
  const joinLabel = directionUrl ? 'Сообщество направления' : 'Сообщество клуба';
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Прототип направления ${esc(activity)} КЮМ «Адмиралтеец»"><title>${esc(activity)} | Прототип направления</title><link rel="stylesheet" href="../assets/wire.css"><script src="../assets/app.js" defer></script><script src="../assets/comments.js" defer></script><style>${style}</style></head><body>
  <a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><nav class="main-nav" aria-label="Основная навигация"><a href="../index.html">Главная</a><a href="../districts/index.html">Районы</a><a href="../districts/admiralteysky.html">Адмиралтейский район</a></nav><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button></div></header>
  <main id="main" class="wire-main"><section class="wire-section hero-band" data-section="intro" data-section-label="Первый экран"><div class="section-label-row"><span class="sec-label">01 · НАПРАВЛЕНИЕ</span></div><div class="section-body"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a> / <a href="../districts/admiralteysky.html">Адмиралтейский район</a> / <a href="../clubs/admiralteysky/${club.slug}.html">КЮМ «Адмиралтеец»</a> / ${esc(activity)}</nav><p class="eyebrow">${esc(label)} · КЮМ «Адмиралтеец»</p><h1>${esc(activity)}</h1><p class="lead">${esc(activity)} в&nbsp;КЮМ «Адмиралтеец».${page?.specialist ? ` Специалист: ${esc(page.specialist)}` : ''}</p></div><p class="section-note">↳ Направление и&nbsp;клуб видны на&nbsp;первом экране.</p></section>
  ${section('02','community','СООБЩЕСТВО','Страницы в&nbsp;VK',community,'Ссылка направления показана при наличии подтверждённого сообщества.')}
  ${section('03','schedule','РАСПИСАНИЕ','Расписание',schedule,activity === 'Бокс' ? 'Цветная сетка показывает только подтверждённое время начала.' : 'Время занятий пока не&nbsp;подтверждено.')}
  ${section('04','contacts','АДРЕС И КОНТАКТЫ','Адрес и&nbsp;контакты',`<div class="wire-links"><a class="wire-button button-dark" href="${esc(club.organizationInfo.site)}" target="_blank" rel="noopener noreferrer">Сайт учреждения ↗</a><a class="wire-button button-outline" href="${esc(club.vkUrl)}" target="_blank" rel="noopener noreferrer">ВКонтакте клуба ↗</a></div><p class="wire-address">${esc(club.address)}</p><iframe class="wire-map" title="КЮМ Адмиралтеец на Яндекс Картах" src="https://yandex.ru/map-widget/v1/?ll=30.2819743%2C59.9199188&amp;z=16&amp;pt=30.2819743%2C59.9199188%2Cpm2rdm" loading="lazy"></iframe><p>Это адрес клуба. Место занятия уточни у&nbsp;организаторов.</p>`,'Адрес клуба расположен непосредственно над картой Яндекса.')}
  ${section('05','join','ПЕРЕД ПЕРВЫМ ЗАНЯТИЕМ','Как присоединиться',`<p>Уточни возраст участников, наличие мест и&nbsp;порядок записи у&nbsp;организаторов.</p><div class="wire-links"><a class="wire-button button-outline" href="${esc(joinUrl)}" target="_blank" rel="noopener noreferrer">${joinLabel} ↗</a>${directionLeader ? `<a class="wire-button button-outline" href="${esc(directionLeader.profileUrl)}" target="_blank" rel="noopener noreferrer">Руководитель направления ↗</a>` : ''}</div><p>Способ записи пока не&nbsp;подтверждён.</p>`,'Ссылки ведут в&nbsp;сообщество направления или&nbsp;клуба и&nbsp;к&nbsp;руководителю, если он&nbsp;указан.')}
  <a class="wire-button button-outline" href="../clubs/admiralteysky/${club.slug}.html">← К&nbsp;направлениям клуба</a></main><footer class="site-footer"><div class="footer-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><p>Условия участия уточняй у&nbsp;организатора.</p></div></footer>${activity === 'Бокс' ? boxingDayScript : ''}</body></html>`;
  await fs.writeFile(path.join(root,'prototype/site/activities',`${slug}.html`),html);
}
console.log(`Saved ${directions.length} Admiralteets direction prototypes.`);
