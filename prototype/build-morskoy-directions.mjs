import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'prototype', 'site', 'activities');
const club = (JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-vo.json'), 'utf8'))).find(item => item.name === 'Морской');
const coordinateData = JSON.parse(await fs.readFile(path.join(root, 'data', 'club-coordinates.json'), 'utf8'));
const morskoyAddress = coordinateData.addresses.find(item => item.district === 'vasileostrovsky' && item.clubs.some(club => club.name === 'Морской'));
const morskoyPoint = morskoyAddress.clubCoordinates.find(item => item.clubName === 'Морской');
const mapPointsJson = JSON.stringify([{name:'Морской', address:club.address, coordinates:[morskoyPoint.coordinates.latitude,morskoyPoint.coordinates.longitude], url:'../clubs/morskoy.html', provisional:morskoyAddress.status !== 'user_provided'}]).replaceAll('<','\\u003c');

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const nbsp = value => escape(value).replace(/\b(в|на|с|по|и|к|о|у|для|из|до|не|как) /gi, '$1&nbsp;');
const schedule = activity => club.activitySchedule.find(item => item.activity === activity)?.schedule || [];
const rows = items => items.map(item => `<div class="contact-row"><span>${nbsp(item.day || item.days)}</span><strong>${escape(item.time)}</strong></div>`).join('');
const community = id => club.activityPages.find(item => item.id === id);
const sessions = activity => new Set(schedule(activity).flatMap(entry => (entry.day || entry.days).split(',').map(day => day.trim()).flatMap(day => entry.time.split(',').map(time => `${day}|${time.trim()}`))));

function languageSchedule() {
  const english = sessions('Разговорный клуб на английском языке');
  const german = sessions('Разговорный клуб на немецком языке');
  const japanese = sessions('Разговорный клуб на японском языке');
  const days = [['вторник','Вт'],['среда','Ср'],['пятница','Пт'],['суббота','Сб']];
  const times = ['16:30-18:10','18:40-20:20','20:20-22:00'];
  const table = (label,columns,slots,cell) => `<div class="language-schedule-frame"><table class="language-schedule" aria-label="${label}"><colgroup><col class="language-schedule-time">${columns.map(() => '<col>').join('')}</colgroup><thead><tr><th scope="col">Время</th>${columns.map(([,short]) => `<th scope="col">${short}</th>`).join('')}</tr></thead><tbody>${slots.map(time => `<tr><th scope="row">${time}</th>${columns.map(([day]) => cell(day,time)).join('')}</tr>`).join('')}</tbody></table></div>`;
  const shared = table('Английский и немецкий языки',days,times,(day,time) => {
    const key = `${day}|${time}`;
    if (english.has(key) === german.has(key)) throw new Error(`Ambiguous language slot: ${key}`);
    return english.has(key) ? '<td><span class="language-schedule-slot language-schedule-eng">Eng</span></td>' : '<td><span class="language-schedule-slot language-schedule-deu">Deu</span></td>';
  });
  const japaneseTable = table('Японский язык',[['вторник','Вт'],['суббота','Сб']],['16:30-19:00','19:30-22:00'],(day,time) => {
    if (!japanese.has(`${day}|${time}`)) throw new Error(`Missing Japanese slot: ${day}|${time}`);
    return '<td><span class="language-schedule-slot language-schedule-jpn">Японский</span></td>';
  });
  return `<div class="language-schedule-group"><h3>Английский и&nbsp;немецкий</h3><div class="language-schedule-legend"><span><i class="language-legend-eng"></i>English</span><span><i class="language-legend-deu"></i>Deutsch</span></div>${shared}</div><div class="language-schedule-group"><h3>Японский</h3>${japaneseTable}</div>`;
}

const pages = [
  {
    file: 'morskoy-devyatyy-lad.html',
    title: 'Девятый лад',
    category: 'Гитара',
    description: '«Девятый лад» связан с&nbsp;занятиями гитарой в&nbsp;ПМК «Морской». Расписание и&nbsp;контакты клуба собраны на&nbsp;этой странице.',
    schedules: [{title:'Игра на гитаре',rows:schedule('Гитара')}],
    communities: [community('morskoy-devyatyy-lad')],
  },
  {
    file: 'morskoy-sam-sebe-kinolog.html',
    title: 'Сам себе кинолог',
    category: 'Курс «Сам себе кинолог»',
    description: 'Курс «Сам себе кинолог» проходит в&nbsp;ПМК «Морской». Узнать подробности и&nbsp;новости можно в&nbsp;сообществе направления.',
    schedules: [{title:'Расписание курса',rows:schedule('Курс «Сам себе кинолог»')}],
    communities: [community('morskoy-sam-sebe-kinolog')],
  },
  {
    file: 'morskoy-razgovornyy-klub.html',
    title: 'Разговорный клуб',
    category: 'Английский, немецкий, японский',
    description: 'В&nbsp;ПМК «Морской» указаны разговорные занятия на&nbsp;английском, немецком и&nbsp;японском языках. В&nbsp;карточке собраны часы каждого языка.',
    schedules: [
      {title:'Английский язык',rows:schedule('Разговорный клуб на английском языке')},
      {title:'Немецкий язык',rows:schedule('Разговорный клуб на немецком языке')},
      {title:'Японский язык',rows:schedule('Разговорный клуб на японском языке')},
    ],
    communities: [
      {...community('morskoy-kak-eto-skazat'), directionLabel: 'Английский и немецкий'},
      {...community('morskoy-yaponskiy'), directionLabel: 'Японский'},
    ],
  },
  {
    file: 'morskoy-vspyshka.html',
    title: 'Фотостудия «Вспышка»',
    category: 'Фотостудия',
    description: '«Вспышка» указана как фотостудия ПМК «Морской». О&nbsp;содержании занятий и&nbsp;наборе можно узнать в&nbsp;сообществе направления.',
    schedules: [{title:'Расписание фотостудии',rows:schedule('Фотостудия')}],
    communities: [community('morskoy-vspyshka')],
  },
];

for (const page of pages) {
  const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7);
  if (only && page.file !== only) continue;
  const scheduleHtml = page.file === 'morskoy-razgovornyy-klub.html'
    ? languageSchedule()
    : `<div class="direction-grid">${page.schedules.map(item => `<div class="info-card"><h3>${escape(item.title)}</h3><div class="direction-facts">${rows(item.rows)}</div></div>`).join('')}</div>`;
  const scheduleNote = page.file === 'morskoy-razgovornyy-klub.html' ? '' : `<p>Расписание взято с&nbsp;<a href="${escape(club.scheduleSource)}" target="_blank" rel="noopener noreferrer">сайта ПМЦ</a> и&nbsp;проверено 16.10.2026. Перед посещением уточни изменения у&nbsp;клуба.</p>`;
  const communityHtml = page.communities.map(item => `<a class="wire-button button-outline" href="${escape(item.vkUrl)}" target="_blank" rel="noopener noreferrer">${item.directionLabel ? `${escape(item.directionLabel)}: ` : ''}${escape(item.title)} ↗</a>`).join('');
  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Прототип направления ${escape(page.title)} в ПМК Морской"><title>${escape(page.title)} | Прототип направления</title><link rel="stylesheet" href="../assets/wire.css"><script src="../assets/app.js" defer></script><script src="../assets/comments.js" defer></script><script src="../assets/map-preview.js" defer></script><style>.direction-facts{display:grid;gap:.65rem}.direction-facts .contact-row{margin:0}.direction-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1rem}.direction-links{display:flex;flex-wrap:wrap;gap:.75rem}.direction-links .wire-button,.button-column .wire-button{white-space:normal}.direction-copy{max-width:46rem}h1,h2,h3{text-wrap:balance}p{text-wrap:pretty}.language-schedule-group{margin:0 0 20px;padding:clamp(12px,2.5vw,28px);border:1px solid #edddd7;border-radius:20px;background:#fbf7f2;color:#722531}.language-schedule-group h3{color:#721d2b;font:700 clamp(23px,3vw,32px)/1.15 Georgia,serif}.language-schedule-legend{display:flex;justify-content:flex-start;flex-wrap:wrap;gap:clamp(16px,5vw,70px);margin:0 0 18px;color:#721d2b;font:700 clamp(15px,2.2vw,25px)/1.2 Georgia,serif}.language-schedule-legend span{display:inline-flex;align-items:center;gap:12px}.language-schedule-legend i{display:inline-block;width:clamp(26px,5vw,60px);height:clamp(22px,3vw,38px);border-radius:10px}.language-legend-eng,.language-schedule-eng{background:#eaa2aa}.language-legend-deu,.language-schedule-deu{background:#bec0df}.language-schedule-jpn{background:#f1c6a5}.language-schedule-frame{overflow:hidden;border:1px solid #d5a99e;border-radius:17px;background:#fffaf6}.language-schedule{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;color:#75212f;font-family:Georgia,serif}.language-schedule col.language-schedule-time{width:25%}.language-schedule th,.language-schedule td{padding:3px;border-right:1px solid #d6a99e;border-bottom:1px solid #d6a99e;text-align:center}.language-schedule tr>*:last-child{border-right:0}.language-schedule tbody tr:last-child>*{border-bottom:0}.language-schedule thead th{height:clamp(44px,6vw,70px);background:#fff7f1;font-size:clamp(14px,2.5vw,28px)}.language-schedule tbody th{white-space:nowrap;font-size:clamp(10px,2vw,22px);font-variant-numeric:tabular-nums}.language-schedule-slot{display:flex;align-items:center;justify-content:center;min-height:clamp(49px,7vw,82px);border-radius:12px;color:#552039;font-size:clamp(12px,3vw,31px);font-weight:700}@media(max-width:500px){.language-schedule-group{padding:10px}.language-schedule-legend span{gap:6px}.language-schedule th,.language-schedule td{padding:2px}.language-schedule-slot{border-radius:7px}}</style></head>
<body><a class="skip-link" href="#main">Перейти к содержимому</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><nav class="main-nav" aria-label="Основная навигация"><a href="../index.html">Главная</a><a href="../index.html#topics">Занятия</a><a href="../districts/index.html">Районы</a><a href="../districts/vasileostrovsky.html">Васильевский остров</a></nav><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button><button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden><a href="../index.html">Главная</a><a href="../index.html#topics">Занятия</a><a href="../districts/index.html">Районы</a><a href="../districts/vasileostrovsky.html">Васильевский остров</a><button type="button" data-page-comment>Обсудить страницу</button></nav></header>
<main id="main" class="wire-main"><section class="wire-section hero-band" data-section="intro" data-section-label="Первый экран"><div class="section-label-row"><span class="sec-label">01 · НАПРАВЛЕНИЕ</span></div><div class="section-body"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><a href="../districts/vasileostrovsky.html">Василеостровский район</a><span aria-hidden="true">/</span><a href="../clubs/morskoy.html">ПМК «Морской»</a><span aria-hidden="true">/</span><span>${escape(page.title)}</span></nav><div class="club-hero-copy"><p class="eyebrow">${escape(page.category)} · ПМК «Морской»</p><h1>${escape(page.title)}</h1><p class="lead direction-copy">${page.description}</p><div class="button-row"><a class="wire-button button-dark" href="#schedule">Расписание ↓</a><a class="wire-button button-outline" href="#contacts">Контакты и&nbsp;адрес ↓</a></div></div></div><p class="section-note">↳ Короткое описание и&nbsp;основные переходы видны до&nbsp;прокрутки.</p></section>
<section class="wire-section " id="community" data-section="community" data-section-label="Сообщества"><div class="section-label-row"><span class="sec-label">02 · СООБЩЕСТВА</span></div><div class="section-body"><h2>Страницы направления в&nbsp;VK</h2><div class="direction-links">${communityHtml}</div><p>Перед записью уточни возраст участников, наличие мест и&nbsp;условия участия.</p></div><p class="section-note">↳ Ссылки на&nbsp;сообщества предоставлены пользователем; содержимое страниц VK не&nbsp;проверялось.</p></section><section class="wire-section " id="schedule" data-section="schedule" data-section-label="Расписание"><div class="section-label-row"><span class="sec-label">03 · РАСПИСАНИЕ</span></div><div class="section-body"><h2>${page.file === 'morskoy-razgovornyy-klub.html' ? 'Расписание' : 'Когда проходят занятия'}</h2>${scheduleHtml}${scheduleNote}</div><p class="section-note">↳ Время относится к&nbsp;занятиям, перечисленным на&nbsp;официальной странице ПМК.</p></section>
<section class="wire-section " id="contacts" data-section="contacts" data-section-label="Контакты и адрес"><div class="section-label-row"><span class="sec-label">04 · КОНТАКТЫ И&nbsp;АДРЕС</span></div><div class="section-body"><div class="split-block"><div><h2>Как связаться</h2><div class="contact-row"><span>Клуб</span><strong>ПМК «Морской»</strong></div><div class="contact-row"><span>Адрес клуба</span><strong>Железноводская ул., д.&nbsp;20</strong></div><div class="contact-row"><span>Телефон клуба</span><strong><a href="tel:+79219459789">+7&nbsp;921&nbsp;945-97-89</a></strong></div></div><div class="button-column"><a class="wire-button button-dark" href="../clubs/morskoy.html">Страница ПМК «Морской» →</a><a class="wire-button button-outline" href="${escape(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Карточка клуба на&nbsp;сайте ПМЦ ↗</a></div></div></div><p class="section-note">↳ Адрес и&nbsp;телефон относятся к&nbsp;ПМК. Отдельные контакты направления не&nbsp;подтверждены.</p></section>
<section class="wire-section " id="join" data-section="join" data-section-label="Как записаться"><div class="section-label-row"><span class="sec-label">05 · КАК ПРИСОЕДИНИТЬСЯ</span></div><div class="section-body"><div class="split-block"><div><h2>Перед первым занятием</h2><p>Уточни возраст участников, наличие мест, условия участия и&nbsp;нужна ли&nbsp;предварительная запись в&nbsp;сообществе направления.</p></div><div class="button-column">${communityHtml}</div></div></div><p class="section-note">↳ Способ записи на&nbsp;занятие пока не&nbsp;подтверждён; ссылки ведут к&nbsp;сообществам направления.</p></section>
<section class="wire-section" id="map" data-section="map" data-section-label="Карта клуба"><div class="section-label-row"><span class="sec-label">06 · КАРТА КЛУБА</span></div><div class="section-body"><h2>Где проходят занятия</h2><p>Занятия проходят в&nbsp;ПМК «Морской», Железноводская ул., д.&nbsp;20.</p><div class="prototype-map-frame"><div class="prototype-map" data-map-preview role="region" aria-label="Карта ПМК Морской"></div><p class="prototype-map-status" role="status">Загружаем карту…</p></div><script type="application/json" id="map-preview-data">${mapPointsJson}</script><p class="prototype-map-detail"><span>Точка предварительная. Перед визитом уточни вход у&nbsp;организатора.</span><a href="../clubs/morskoy.html">Открыть страницу клуба →</a></p></div><p class="section-note">↳ Карта показывает адрес клуба, отдельный адрес занятия не&nbsp;указан.</p></section></main>
<footer class="site-footer"><div class="footer-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><p>Условия участия уточняй у&nbsp;организатора.</p><a href="../districts/vasileostrovsky.html">Клубы района →</a></div></footer></body></html>`;
  const output = path.join(outDir, page.file);
  if (!process.argv.includes('--replace')) {
    try { await fs.access(output); throw new Error(`Prototype snapshot already exists: ${output}. Use --replace after saving a snapshot.`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await fs.writeFile(output, html, 'utf8');
  console.log(path.relative(root, output));
}
