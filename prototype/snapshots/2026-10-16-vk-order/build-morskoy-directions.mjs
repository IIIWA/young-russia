import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'prototype', 'site', 'activities');
const club = (JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-vo.json'), 'utf8'))).find(item => item.name === 'Морской');

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const nbsp = value => escape(value).replace(/\b(в|на|с|по|и|к|о|у|для|из|до|не|как) /gi, '$1&nbsp;');
const schedule = activity => club.activitySchedule.find(item => item.activity === activity)?.schedule || [];
const rows = items => items.map(item => `<div class="contact-row"><span>${nbsp(item.day || item.days)}</span><strong>${escape(item.time)}</strong></div>`).join('');
const community = id => club.activityPages.find(item => item.id === id);

const pages = [
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
    communities: [community('morskoy-kak-eto-skazat'), community('morskoy-yaponskiy')],
    communityNote: 'Точные языки сообщества «Как это сказать по-...?» по&nbsp;его названию не&nbsp;определены.',
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
  const scheduleHtml = page.schedules.map(item => `<div class="info-card"><h3>${escape(item.title)}</h3><div class="direction-facts">${rows(item.rows)}</div></div>`).join('');
  const communityHtml = page.communities.map(item => `<a class="wire-button button-outline" href="${escape(item.vkUrl)}" target="_blank" rel="noopener noreferrer">${escape(item.title)} ↗</a>`).join('');
  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Прототип направления ${escape(page.title)} в ПМК Морской"><title>${escape(page.title)} | Прототип направления</title><link rel="stylesheet" href="../assets/wire.css"><script src="../assets/app.js" defer></script><script src="../assets/comments.js" defer></script><style>.direction-facts{display:grid;gap:.65rem}.direction-facts .contact-row{margin:0}.direction-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1rem}.direction-links{display:flex;flex-wrap:wrap;gap:.75rem}.direction-links .wire-button{white-space:normal}.direction-copy{max-width:46rem}h1,h2,h3{text-wrap:balance}p{text-wrap:pretty}</style></head>
<body><a class="skip-link" href="#main">Перейти к содержимому</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><nav class="main-nav" aria-label="Основная навигация"><a href="../index.html">Главная</a><a href="../index.html#topics">Занятия</a><a href="../districts/index.html">Районы</a><a href="../districts/vasileostrovsky.html">Васильевский остров</a></nav><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button><button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden><a href="../index.html">Главная</a><a href="../index.html#topics">Занятия</a><a href="../districts/index.html">Районы</a><a href="../districts/vasileostrovsky.html">Васильевский остров</a><button type="button" data-page-comment>Обсудить страницу</button></nav></header>
<main id="main" class="wire-main"><section class="wire-section hero-band" data-section="intro" data-section-label="Первый экран"><div class="section-label-row"><span class="sec-label">01 · НАПРАВЛЕНИЕ</span></div><div class="section-body"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><a href="../districts/vasileostrovsky.html">Василеостровский район</a><span aria-hidden="true">/</span><a href="../clubs/morskoy.html">ПМК «Морской»</a><span aria-hidden="true">/</span><span>${escape(page.title)}</span></nav><div class="club-hero-copy"><p class="eyebrow">${escape(page.category)} · ПМК «Морской»</p><h1>${escape(page.title)}</h1><p class="lead direction-copy">${page.description}</p><div class="button-row"><a class="wire-button button-dark" href="#schedule">Расписание ↓</a><a class="wire-button button-outline" href="#contacts">Контакты и&nbsp;адрес ↓</a></div></div></div><p class="section-note">↳ Короткое описание и&nbsp;основные переходы видны до&nbsp;прокрутки.</p></section>
<section class="wire-section " id="schedule" data-section="schedule" data-section-label="Расписание"><div class="section-label-row"><span class="sec-label">02 · РАСПИСАНИЕ</span></div><div class="section-body"><h2>Когда проходят занятия</h2><div class="direction-grid">${scheduleHtml}</div><p>Расписание взято с&nbsp;<a href="${escape(club.scheduleSource)}" target="_blank" rel="noopener noreferrer">сайта ПМЦ</a> и&nbsp;проверено 16.10.2026. Перед посещением уточни изменения у&nbsp;клуба.</p></div><p class="section-note">↳ Время относится к&nbsp;занятиям, перечисленным на&nbsp;официальной странице ПМК.</p></section>
<section class="wire-section " id="contacts" data-section="contacts" data-section-label="Контакты и адрес"><div class="section-label-row"><span class="sec-label">03 · КОНТАКТЫ И&nbsp;АДРЕС</span></div><div class="section-body"><div class="split-block"><div><h2>Как связаться</h2><div class="contact-row"><span>Клуб</span><strong>ПМК «Морской»</strong></div><div class="contact-row"><span>Адрес клуба</span><strong>Железноводская ул., д.&nbsp;20</strong></div><div class="contact-row"><span>Телефон клуба</span><strong><a href="tel:+79219459789">+7&nbsp;921&nbsp;945-97-89</a></strong></div></div><div class="button-column"><a class="wire-button button-dark" href="../clubs/morskoy.html">Страница ПМК «Морской» →</a><a class="wire-button button-outline" href="${escape(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Карточка клуба на&nbsp;сайте ПМЦ ↗</a></div></div></div><p class="section-note">↳ Адрес и&nbsp;телефон относятся к&nbsp;ПМК. Отдельные контакты направления не&nbsp;подтверждены.</p></section>
<section class="wire-section " data-section="community" data-section-label="Сообщества"><div class="section-label-row"><span class="sec-label">04 · СООБЩЕСТВА</span></div><div class="section-body"><h2>Страницы направления в&nbsp;VK</h2><div class="direction-links">${communityHtml}</div>${page.communityNote ? `<p>${page.communityNote}</p>` : ''}<p>Перед записью уточни возраст участников, наличие мест и&nbsp;условия участия.</p></div><p class="section-note">↳ Ссылки на&nbsp;сообщества предоставлены пользователем; содержимое страниц VK не&nbsp;проверялось.</p></section></main>
<footer class="site-footer"><div class="footer-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><p>Условия участия уточняй у&nbsp;организатора.</p><a href="../districts/vasileostrovsky.html">Клубы района →</a></div></footer></body></html>`;
  const output = path.join(outDir, page.file);
  try { await fs.access(output); throw new Error(`Prototype snapshot already exists: ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.writeFile(output, html, 'utf8');
  console.log(path.relative(root, output));
}
