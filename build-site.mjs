import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = process.env.SITE_OUTPUT_DIR ? path.resolve(root, process.env.SITE_OUTPUT_DIR) : path.join(root, 'dist');
const styleHash = createHash('sha256').update(await fs.readFile(path.join(root, 'assets', 'style.css'))).digest('hex').slice(0, 12);
const scriptHash = createHash('sha256').update(await fs.readFile(path.join(root, 'assets', 'site.js'))).digest('hex').slice(0, 12);
const styleAsset = `style-${styleHash}.css`;
const scriptAsset = `site-${scriptHash}.js`;
const rawClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-vo.json'), 'utf8'));
const rawAdmiralClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-admiralteysky.json'), 'utf8'));
const rawVyborgClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-vyborgsky.json'), 'utf8'));
const rawKalininClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kalininsky.json'), 'utf8'));
const rawKirovClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kirovsky.json'), 'utf8'));
const admiralOrganizations = {
  admiralteysky: {
    name: 'Центр «Адмиралтейский»',
    address: 'Верейская ул., д. 22-24',
    phone: '(812) 246-39-87',
    email: 'admiral_06@inbox.ru',
    site: 'https://admiralteisky.admiral.gov.spb.ru/',
    vk: 'https://vk.com/tsentr_admiralteisky',
    telegram: 'https://t.me/tsentr_admiralteisky',
  },
  record: {
    name: 'Дом молодёжи «Рекорд»',
    address: 'Садовая ул., д. 55-57, лит. А',
    phone: '246-58-80; 246-58-82',
    email: 'dm-record@mail.ru',
    site: 'http://dmrecord.admiral.gov.spb.ru/',
    vk: 'https://vk.com/dmrecord',
    telegram: 'https://t.me/dmrecord',
  },
};
const vyborgOrganizations = {
  mir: {
    name: 'ПМЦ «МИР»',
    address: 'пр. Энгельса, д. 147, к. 1, лит. Д',
    phone: '409-80-36',
    email: 'pmc-mir@yandex.ru',
    vk: 'https://vk.com/pmcmir',
  },
  forpost: {
    name: 'Дом молодёжи «Форпост»',
    address: 'Большой Сампсониевский пр., д. 37',
    phone: '542-24-07',
    email: 'dm_forpost@mail.ru',
    vk: 'https://vk.com/dm_forpost',
  },
};
const vyborgMirSource = 'https://www.spbdm.ru/upload/iblock/063/7051ownqhxd54askq58jiy80ekffhbrl/%D0%9F%D0%9C%D0%A6%20%D0%9C%D0%98%D0%A0.pdf';
const vyborgForpostSource = 'https://www.spbdm.ru/upload/iblock/3e0/xu0334gk9w5a3qy2t6vlchha49a4j7kt/%D0%94%D0%9C%20%D0%A4%D0%9E%D0%A0%D0%9F%D0%9E%D0%A1%D0%A2.pdf';
const vyborgReviewTooltip = '9 площадок. Состав, контакты, расписание, возрастные условия и набор уточняйте у организаторов.';
const kalininSource = 'https://www.gov.spb.ru/gov/terr/reg_kalinin/podvedomstvennye-uchrezhdeniya/uchrezhdeniya-molodyozhnoj-politiki/';
const kalininSite = 'https://pmc-kalininsky.spb.ru/?page_id=219450';
const kalininOrganization = {
  name: 'ПМЦ «Калининский»',
  address: 'ул. Руставели, д. 37',
  phone: '(812) 298-88-76',
  email: '5564920@mail.ru',
  site: kalininSite,
};
const kirovClubsSource = 'https://pmckir.ru/?page_id=556';
const kirovPdfSource = 'https://www.spbdm.ru/upload/iblock/412/7s2lf23hff03g0ls4mgteb9m3nyjd26h/%D0%9F%D0%9C%D0%A6%20%D0%9A%D0%B8%D1%80%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9.pdf';
const kirovOrganization = {
  name: 'ПМЦ «Кировский»',
  address: 'пр. Народного Ополчения, д. 3',
  phone: '377-21-13',
  email: 'pmz.kir@mail.ru',
  site: 'https://pmckir.ru/',
  vk: 'https://vk.com/pmc_kirovskiy',
};
const admiralSource = 'https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/';
const admiralSourceDate = '18.04.2025';
const districts = [
  ['Адмиралтейский', 'admiralteysky'],
  ['Василеостровский', 'vasileostrovsky'],
  ['Выборгский', 'vyborgsky'],
  ['Калининский', 'kalininsky'],
  ['Кировский', 'kirovsky'],
  ['Колпинский', 'kolpinsky'],
  ['Красногвардейский', 'krasnogvardeysky'],
  ['Красносельский', 'krasnoselsky'],
  ['Кронштадтский', 'kronshtadtsky'],
  ['Курортный', 'kurortny'],
  ['Московский', 'moskovsky'],
  ['Невский', 'nevsky'],
  ['Петроградский', 'petrogradsky'],
  ['Петродворцовый', 'petrodvortsovy'],
  ['Приморский', 'primorsky'],
  ['Пушкинский', 'pushkinsky'],
  ['Фрунзенский', 'frunzensky'],
  ['Центральный', 'tsentralny'],
];
const knownSlugs = {
  'Морской': 'morskoy', 'Аврора': 'avrora', 'Витана': 'vitana',
  'Притяжение': 'prityazhenie', 'Белый медведь': 'belyy-medved',
};
const translit = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
const slugify = (value) => [...value.toLowerCase()].map(char => translit[char] ?? char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const html = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shortWords = 'в|во|с|со|к|ко|о|об|у|и|а|но|из|от|до|по|за|на|под|над|при|про|без|для|не|ни|что|как|или|чем|где|если|через';
const text = (value = '') => html(value).replace(new RegExp(`(^|[\\s(])(${shortWords}) +`, 'giu'), '$1$2&nbsp;').replace(/(\d+) +(лет|клуба|клубов|районов|пространство)/giu, '$1&nbsp;$2');
const clubs = rawClubs.map(club => ({...club, slug: knownSlugs[club.name] ?? slugify(club.name)}));
const admiralClubs = rawAdmiralClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'admiralteysky', organizationInfo: admiralOrganizations[club.organization], organizationLabel: admiralOrganizations[club.organization]?.name ?? 'Подростково-молодёжный клуб'}));
const vyborgClubs = rawVyborgClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'vyborgsky', organizationInfo: vyborgOrganizations[club.organization], organizationLabel: vyborgOrganizations[club.organization]?.name ?? club.type}));
const kalininClubs = rawKalininClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'kalininsky', organizationInfo:kalininOrganization, organizationLabel:club.type}));
const kirovClubs = rawKirovClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'kirovsky', organizationInfo:kirovOrganization, organizationLabel:club.type}));
const catalogDistricts = new Set(['vasileostrovsky', 'admiralteysky', 'vyborgsky', 'kalininsky', 'kirovsky']);
const districtHeroPhotos = {
  'vo-page': {
    file: 'hero-vasileostrovsky.webp',
    place: 'Стрелка Васильевского острова',
  },
  'admiral-page': {
    file: 'hero-admiralteysky.webp',
    place: 'Адмиралтейство и Исаакиевский собор',
  },
  'vyborg-page': {
    file: 'hero-vyborgsky.webp',
    place: 'Сампсониевский собор',
  },
  'kalinin-page': {
    file: 'hero-kalininsky.webp',
    place: 'Финляндский вокзал',
  },
  'kirov-page': {
    file: 'hero-kirovsky.webp',
    place: 'Нарвские триумфальные ворота',
  },
};

function tags(club) {
  const line = club.activities.join(' ').toLowerCase();
  const result = [];
  if (/англий|немец|француз|япон|билингв|иностранн|язык|лингвист/.test(line)) result.push('languages');
  if (/спорт|бокс|борьб|самбо|айкидо|дзюдо|джиу|фитнес|йога|теннис|хоккей|атлет|пауэр|бодибилд|футбол|шахмат|бильярд|гребл|парус|капоэйр|дартс|офп|самооборон|городош|скалолаз|туризм|тхэквондо|армрестлинг|акробат|гимнастик|волейбол|стрельб|кик.бокс|аэробик|рукопаш/.test(line)) result.push('sport');
  if (/тан|хореограф|брейк|зумб|чирлидинг|контемп|хиллс|джаз-модерн|джаз-фанк|хип-хоп/.test(line)) result.push('dance');
  if (/изо|рисован|живопис|лепк|флорист|арт|дпи|кукл|творч|вышив|фотограф|дизайн|керамик|мастерск|швейн|роспис|батик|график|декор|акварел|фото|костюм|фелтинг/.test(line)) result.push('creative');
  if (/вокал|хор|гитар|театр|актёр|песн|музык|кино|оратор|звук|барабан|инструментальн|цирков/.test(line)) result.push('stage');
  if (/волонт|добровол|добро\.центр|скаут|проект|коворкинг|мероприят|подкаст|настольные игры|семь|общени|разговорн|квест|медиа|квн|реконструк/.test(line)) result.push('community');
  return result;
}
const topicNames = {all:'Все направления', languages:'Языки',sport:'Спорт',dance:'Танцы',creative:'Творчество',stage:'Сцена и музыка',community:'Общение'};
const iconArrow = '<span aria-hidden="true">↗</span>';

function header(base, active = '') {
  return `<header class="site-header"><div class="container header-inner">
    <a class="brand" href="${base}index.html" aria-label="ПМК Петербурга, главная"><span class="brand-symbol" aria-hidden="true"><i></i><i></i><i></i></span><span>ПМК<span class="brand-light"> Петербурга</span></span></a>
    <nav class="desktop-nav" aria-label="Основная навигация"><a href="${base}index.html#directions"${active==='directions'?' aria-current="page"':''}>Занятия</a><a href="${base}districts/index.html"${active==='districts'?' aria-current="page"':''}>Районы</a><a href="${base}index.html#how">Как участвовать</a></nav>
    <a class="header-link" href="${base}districts/index.html">Каталоги районов ${iconArrow}</a>
    <button class="menu-button" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button>
  </div><nav id="mobile-nav" class="mobile-nav" aria-label="Мобильная навигация" hidden><a href="${base}index.html#directions">Занятия</a><a href="${base}districts/index.html">Районы</a><a href="${base}index.html#how">Как участвовать</a><a href="${base}districts/index.html">Каталоги районов</a></nav></header>`;
}
function footer(base) {
  return `<footer class="site-footer"><div class="container footer-inner"><div><a class="brand brand-footer" href="${base}index.html"><span class="brand-symbol" aria-hidden="true"><i></i><i></i><i></i></span><span>ПМК<span class="brand-light"> Петербурга</span></span></a><p>Занятия и&nbsp;клубы рядом с&nbsp;тобой.</p></div><div class="footer-links"><a href="${base}districts/index.html">Все районы</a><a href="${base}districts/vasileostrovsky.html">Василеостровский район</a><a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a></div><p class="footer-note">Сведения собраны из&nbsp;открытых источников. Расписание, возрастные условия и&nbsp;наличие мест уточняйте у&nbsp;организаторов.</p></div></footer>`;
}
function page({title, description, base='', active='', body, className=''}) {
  const heroPhoto = districtHeroPhotos[className];
  const photoPreload = heroPhoto ? `<link rel="preload" as="image" href="${base}assets/${heroPhoto.file}">` : '';
  const pageBody = heroPhoto ? body.replace('class="subhero vo-subhero"', 'class="subhero vo-subhero district-photo-hero"') : body;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf8f1"><meta name="description" content="${html(description)}"><title>${html(title)} | ПМК Петербурга</title><link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">${photoPreload}<link rel="stylesheet" href="${base}assets/${styleAsset}"><script src="${base}assets/${scriptAsset}" defer></script></head><body class="${className}"><a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a>${header(base, active)}<main id="main">${pageBody}</main>${footer(base)}</body></html>`;
}
function clubCard(club, base = '../', featured = false) {
  const display = club.activities.slice(0, featured ? 3 : 4);
  const badge = club.organizationLabel ?? (club.type === 'Молодёжное пространство' ? 'Молодёжное пространство' : 'Подростково-молодёжный клуб');
  const clubHref = `${base}clubs/${club.districtCode ? `${club.districtCode}/` : ''}${club.slug}.html`;
  const linkLabel = club.type === 'Подростково-молодёжный клуб' ? 'Смотреть клуб' : 'Смотреть площадку';
  return `<article class="club-card${featured?' club-card-featured':''}" data-name="${html(club.name.toLowerCase())}" data-search="${html([club.name,club.address,club.organizationInfo?.name ?? '',...club.activities].join(' ').toLowerCase())}" data-topics="${tags(club).join(' ')}"${club.organization?` data-org="${html(club.organization)}"`:''}>
    <div class="club-card-top"><span class="eyebrow">${text(badge)}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
    <h3><a href="${clubHref}">${text(club.name)}</a></h3><p class="club-address">${text(club.address)}</p>
    <div class="club-tags">${display.length ? display.map(item=>`<span>${text(item)}</span>`).join('') : '<span>Направления уточняются</span>'}</div>
    <a class="card-bottom" href="${clubHref}">${linkLabel} <span aria-hidden="true">→</span></a>
  </article>`;
}

const featured = [clubs.find(club => club.name === 'Морской'), admiralClubs[0], admiralClubs[22]].filter(Boolean);
const districtLink = district => `districts/${district[1]}.html`;
const districtTopics = {
  vasileostrovsky: [...new Set(clubs.flatMap(tags))].join(' '),
  admiralteysky: [...new Set(admiralClubs.flatMap(tags))].join(' '),
  vyborgsky: [...new Set(vyborgClubs.flatMap(tags))].join(' '),
  kalininsky: [...new Set(kalininClubs.flatMap(tags))].join(' '),
  kirovsky: [...new Set(kirovClubs.flatMap(tags))].join(' '),
};

const home = page({
  title:'Найди своё занятие',
  description:'Каталог подростково-молодёжных клубов Санкт-Петербурга. Направления, адреса и ссылки на организаторов.',
  body:`<section class="hero"><div class="container hero-grid"><div class="hero-copy"><div class="kicker"><span class="kicker-dot"></span> Подростково-молодёжные клубы Петербурга</div><h1>Найди своё <em>занятие</em> в&nbsp;Петербурге</h1><p class="hero-lead">Спорт, творчество, языки и&nbsp;общение рядом с&nbsp;домом. Выбери то, что тебе интересно, и&nbsp;узнай, куда прийти.</p><div class="hero-actions"><a class="button button-primary" href="districts/index.html">Выбрать район <span aria-hidden="true">↗</span></a><a class="text-link" href="#directions">Смотреть направления <span aria-hidden="true">↓</span></a></div><div class="hero-facts"><span><b>18</b> районов города</span><span><b>${clubs.length + admiralClubs.length + vyborgClubs.length + kalininClubs.length + kirovClubs.length}</b> площадок в&nbsp;пяти каталогах</span></div></div><div class="hero-photo"><img src="assets/hero-youth.webp" width="1600" height="900" alt="Иллюстрация: молодые люди общаются за игрой в настольный теннис"><div class="photo-sticker"><span class="sticker-spark" aria-hidden="true">✳</span><b>Пробуй новое</b><small>рядом с&nbsp;домом</small></div><span class="photo-caption">Иллюстративное изображение</span></div></div></section>
  <section class="intro-strip"><div class="container strip-inner"><p><strong>14-35&nbsp;лет</strong><span>Возможности для&nbsp;молодёжи</span></p><p><strong>Бесплатно</strong><span>Направления, указанные в&nbsp;каталоге</span></p><p><strong>Рядом</strong><span>Начни поиск со&nbsp;своего района</span></p></div></section>
  <section class="section directions" id="directions"><div class="container"><div class="section-heading"><div><p class="section-kicker">Выбирай по&nbsp;интересу</p><h2>Чем хочется заняться?</h2></div><p>Выбери направление, чтобы увидеть районы, где в&nbsp;каталоге есть подходящие занятия.</p></div><div class="topic-grid">
  <a class="topic-card topic-languages" href="districts/index.html?topic=languages"><span class="topic-icon" aria-hidden="true">Aa</span><h3>Языки</h3><p>Разговорные клубы и&nbsp;новые знакомства</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-sport" href="districts/index.html?topic=sport"><span class="topic-icon" aria-hidden="true">◉</span><h3>Спорт</h3><p>От&nbsp;шахмат и&nbsp;йоги до&nbsp;единоборств</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-creative" href="districts/index.html?topic=creative"><span class="topic-icon" aria-hidden="true">✳</span><h3>Творчество</h3><p>Рисование, фотография, дизайн</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-stage" href="districts/index.html?topic=stage"><span class="topic-icon" aria-hidden="true">♫</span><h3>Сцена и&nbsp;музыка</h3><p>Театр, вокал и&nbsp;гитара</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-community" href="districts/index.html?topic=community"><span class="topic-icon" aria-hidden="true">↗</span><h3>Общение</h3><p>Клубы, проекты и&nbsp;волонтёрство</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  </div></div></section>
  <section class="section island-section"><div class="container"><div class="island-banner"><div><p class="section-kicker">Каталоги уже открыты</p><h2>Начни с&nbsp;пяти районов</h2><p>Василеостровский, Адмиралтейский, Выборгский, Калининский и&nbsp;Кировский: ищи площадку по&nbsp;названию, адресу и&nbsp;направлению.</p><div class="hero-actions"><a class="button button-light" href="districts/vasileostrovsky.html">Василеостровский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/admiralteysky.html">Адмиралтейский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/vyborgsky.html">Выборгский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kalininsky.html">Калининский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kirovsky.html">Кировский <span aria-hidden="true">↗</span></a></div></div><div class="island-mark" aria-hidden="true"><span>ПМК</span><i></i><i></i><i></i></div></div><div class="featured-head"><h3>Куда можно заглянуть</h3><span>Примеры из&nbsp;каталогов</span></div><div class="featured-grid">${featured.map(club=>clubCard(club,'',true)).join('')}</div></div></section>
  <section class="section districts-section" id="districts"><div class="container"><div class="section-heading"><div><p class="section-kicker">Клубы рядом</p><h2>Выбери свой район</h2></div><p>Страница есть для&nbsp;каждого района Петербурга. Каталоги Василеостровского, Адмиралтейского, Выборгского, Калининского и&nbsp;Кировского районов уже открыты.</p></div><div class="district-home-grid">${districts.map((district,index)=>`<a class="district-pill${catalogDistricts.has(district[1])?' district-pill-ready':''}${district[1]==='vyborgsky'?' needs-review':''}" href="${districtLink(district)}"${district[1]==='vyborgsky'?` title="${html(vyborgReviewTooltip)}"`:''}><span class="district-number">${String(index+1).padStart(2,'0')}</span><span>${text(district[0])}</span>${district[1]==='vyborgsky'?'<span class="district-pill-review">Данные уточняются</span>':''}<span class="district-pill-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><a class="all-districts-link" href="districts/index.html">Открыть список районов <span aria-hidden="true">→</span></a></div></section>
  <section class="section how-section" id="how"><div class="container"><div class="section-heading"><div><p class="section-kicker">Просто начать</p><h2>Как попасть в&nbsp;клуб</h2></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Найди интерес</h3><p>Выбери занятие или район, который тебе подходит.</p></div><div class="step"><span>02</span><h3>Открой страницу клуба</h3><p>Посмотри адрес и&nbsp;доступные направления.</p></div><div class="step"><span>03</span><h3>Уточни детали</h3><p>Спроси у&nbsp;организаторов про расписание, возраст и&nbsp;запись.</p></div></div><div class="how-bottom"><p>Программы и&nbsp;набор могут меняться. Перед посещением проверь актуальные условия на&nbsp;странице клуба.</p><a href="districts/index.html">Открыть каталоги <span aria-hidden="true">↗</span></a></div></div></section>`
});

const directory = page({
  title:'Районы Петербурга',
  description:'Выберите район Санкт-Петербурга и найдите подростково-молодёжные клубы.',
  base:'../',active:'districts',className:'directory-page',
  body:`<section class="subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><span>Районы</span></nav><p class="section-kicker">Каталог по&nbsp;городу</p><h1>Районы Петербурга</h1><p class="subhero-lead">Выбери район и&nbsp;узнай, какие клубы и&nbsp;занятия уже есть в&nbsp;каталоге.</p></div></section><section class="section directory-section"><div class="container"><div class="directory-toolbar"><label for="district-search">Найти район</label><div class="search-box"><span aria-hidden="true">⌕</span><input id="district-search" type="search" placeholder="Например, Адмиралтейский" autocomplete="off"></div><p><strong>18&nbsp;районов</strong><br>Открыто 5&nbsp;каталогов</p></div><div class="directory-grid" id="district-list">${districts.map((district,index)=>`<a class="directory-card${catalogDistricts.has(district[1])?' ready':''}${district[1]==='vyborgsky'?' needs-review':''}" href="${district[1]}.html" data-search="${html(district[0].toLowerCase())}" data-topics="${districtTopics[district[1]]??''}"${district[1]==='vyborgsky'?` title="${html(vyborgReviewTooltip)}"`:''}><span class="directory-number">${String(index+1).padStart(2,'0')}</span><span class="directory-name">${text(district[0])}</span><span class="directory-status">${district[1]==='vyborgsky'?'9&nbsp;площадок · данные уточняются':district[1]==='kalininsky'?'21&nbsp;площадка':district[1]==='kirovsky'?'19&nbsp;площадок':catalogDistricts.has(district[1])?'Каталог открыт':'Страница района'}</span><span class="directory-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><p class="directory-topic-note" id="district-topic-note" hidden><span id="district-topic-note-text"></span> <a href="index.html">Сбросить направление</a></p><p class="empty-state" id="district-empty" hidden>По&nbsp;этому запросу каталогов не&nbsp;нашлось. Очисти поиск или выбери другое направление.</p></div></section>`
});

const vo = page({
  title:'Клубы Василеостровского района',
  description:'31 подростково-молодёжный клуб и пространство «Притяжение» в Василеостровском районе Санкт-Петербурга.',
  base:'../',active:'districts',className:'vo-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Василеостровский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Клубы Васильевского острова</p><h1>Василеостровский район</h1><p class="subhero-lead">Спорт, языки, творчество, музыка и&nbsp;общение: ищи клуб по&nbsp;интересу и&nbsp;узнавай, где он&nbsp;находится.</p><a class="button button-primary" href="#clubs">Найти клуб <span aria-hidden="true">↓</span></a></div><div class="vo-stats" aria-label="Состав каталога"><div><b>31</b><span>подростково-молодёжный клуб</span></div><div><b>1</b><span>молодёжное пространство</span></div><p>Адреса, телефоны и&nbsp;направления обновлены по&nbsp;списку ПМЦ ВО от&nbsp;12.10.2026. Перед посещением уточни условия участия, набор и&nbsp;расписание.</p></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Выбери подходящее место</h2></div><p id="result-count" aria-live="polite">Показано 32 площадки</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по клубам и направлениям</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div><div class="topic-filters" role="group" aria-label="Фильтр по направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="club-grid" id="club-grid">${clubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Ничего не&nbsp;нашлось. Попробуй другое название или направление.</p><div class="catalog-source"><span aria-hidden="true">ⓘ</span><p>Адреса, телефоны и&nbsp;направления обновлены по&nbsp;списку ПМЦ Василеостровского района от&nbsp;12.10.2026. Список предоставлен для проекта и&nbsp;не опубликован здесь. <a href="https://www.pmcvo.ru/" target="_blank" rel="noopener noreferrer">Сайт ПМЦ ВО</a> поможет уточнить стоимость, расписание и&nbsp;набор.</p></div></div></section>`
});

const admiral = page({
  title:'Клубы Адмиралтейского района',
  description:'Каталог подростково-молодёжных клубов и площадок Адмиралтейского района Санкт-Петербурга.',
  base:'../',active:'districts',className:'admiral-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Адмиралтейский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Клубы и площадки района</p><h1>Адмиралтейский район</h1><p class="subhero-lead">Ищи клуб по&nbsp;названию, адресу, направлению или учреждению. В&nbsp;списке две организации и&nbsp;26&nbsp;площадок.</p><a class="button button-primary" href="#clubs">Найти клуб <span aria-hidden="true">↓</span></a></div><div class="vo-stats" aria-label="Состав каталога"><div><b>22</b><span>площадки Центра «Адмиралтейский»</span></div><div><b>4</b><span>площадки Дома молодёжи «Рекорд»</span></div><p>Список перенесён из&nbsp;открытых источников с&nbsp;датой изменения 18.04.2025. Актуальность контактов и&nbsp;направлений нужно уточнять.</p></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Выбери подходящее место</h2></div><p id="result-count" aria-live="polite">Показано ${admiralClubs.length} площадок</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по клубам и направлениям</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div><h3 class="filter-label">Учреждение</h3><div class="topic-filters" role="group" aria-label="Фильтр по учреждению">${[['all','Все учреждения'],['admiralteysky','Центр «Адмиралтейский»'],['record','Дом молодёжи «Рекорд»']].map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-org-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div><h3 class="filter-label">Направление</h3><div class="topic-filters" role="group" aria-label="Фильтр по направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><h2>Клубы района</h2></div><div class="club-grid" id="club-grid">${admiralClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Ничего не&nbsp;нашлось. Попробуй другое название или фильтр.</p><div class="organization-grid">${Object.values(admiralOrganizations).map(org=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone">${text(org.phone)}</p><div class="organization-links"><a href="${html(org.site)}" target="_blank" rel="noopener noreferrer">Сайт <span aria-hidden="true">↗</span></a><a href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a><a href="${html(org.telegram)}" target="_blank" rel="noopener noreferrer">Телеграм <span aria-hidden="true">↗</span></a><a href="mailto:${html(org.email)}">${text(org.email)}</a></div></article>`).join('')}</div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><p>Список клубов, адреса, телефоны и&nbsp;направления собраны с&nbsp;<a href="${admiralSource}" target="_blank" rel="noopener noreferrer">официальной страницы Администрации Адмиралтейского района</a>. Дата изменения страницы: ${admiralSourceDate}; это дата источника, а&nbsp;не проверка каждой площадки. <a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений</a> указывает для PDF Центра «Адмиралтейский» дату загрузки 01.06.2026, но содержимое документа по этой ссылке не совпало с названием учреждения. Поэтому карточки пока перенесены со страницы администрации района от 18.04.2025. Перед посещением уточняй данные у&nbsp;организаторов.</p></div></div></section>`
});

const vyborg = page({
  title:'Клубы Выборгского района',
  description:'Девять молодёжных площадок Выборгского района Санкт-Петербурга: адреса, направления и контакты учреждений.',
  base:'../',active:'districts',className:'vyborg-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Выборгский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Клубы и&nbsp;молодёжные площадки</p><h1>Выборгский район</h1><p class="subhero-lead">Девять площадок двух учреждений: ПМЦ «МИР» и&nbsp;Дома молодёжи «Форпост». Ищи занятия и&nbsp;адреса рядом с&nbsp;собой.</p><a class="button button-primary" href="#clubs">Найти площадку <span aria-hidden="true">↓</span></a></div><div class="vo-stats" aria-label="Состав каталога"><div><b>6</b><span>площадок ПМЦ «МИР»</span></div><div><b>3</b><span>площадки «Форпоста»</span></div><p>Сведения взяты из&nbsp;городской базы. Перед посещением уточняй набор, возраст, расписание и&nbsp;контакты.</p></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Выбери подходящее место</h2></div><p id="result-count" aria-live="polite">Показано ${vyborgClubs.length} площадок</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по&nbsp;площадкам и&nbsp;направлениям</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div><h3 class="filter-label">Учреждение</h3><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;учреждению">${[['all','Все учреждения'],['mir','ПМЦ «МИР»'],['forpost','Дом молодёжи «Форпост»']].map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-org-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div><h3 class="filter-label">Направление</h3><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><h2>Клубы и&nbsp;пространства</h2></div><div class="club-grid" id="club-grid">${vyborgClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Ничего не&nbsp;нашлось. Попробуй другое название или фильтр.</p>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед первым визитом</p><h2>Уточни условия</h2><p>В&nbsp;документах направления указаны как бесплатные. Условия каждой группы могут различаться.</p></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Спроси, для&nbsp;кого открыта группа.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Уточни дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться к&nbsp;занятиям.</p></div></div>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты учреждений</p><h2>К кому обратиться</h2></div></div><div class="organization-grid">${Object.values(vyborgOrganizations).map(org=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone"><a href="tel:+7812${org.phone.replace(/\D/g,'')}">${text(org.phone)}</a></p><div class="organization-links"><a href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a><a href="mailto:${html(org.email)}">${text(org.email)}</a></div></article>`).join('')}</div>
  <div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Направления, адреса и&nbsp;контакты собраны по&nbsp;<a href="${vyborgMirSource}" target="_blank" rel="noopener noreferrer">PDF ПМЦ «МИР»</a> и&nbsp;<a href="${vyborgForpostSource}" target="_blank" rel="noopener noreferrer">PDF Дома молодёжи «Форпост»</a> из&nbsp;<a href="https://www.spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">городской базы учреждений</a>. Дата загрузки документов: 01.06.2026. Это не&nbsp;дата проверки каждой группы.</p><p>В&nbsp;документе «МИРа» есть адрес на&nbsp;пр. Просвещения, д. 54, лит. А без названия площадки, направлений и&nbsp;контактов. До&nbsp;уточнения статуса он&nbsp;не&nbsp;включён в&nbsp;список. Для «Феникса» и&nbsp;«Фестиваля» указаны общие контакты «Форпоста»: прямые контакты в&nbsp;PDF не&nbsp;найдены.</p></div></div></div></section>`
});

const kalinin = page({
  title:'Клубы Калининского района',
  description:'21 подростково-молодёжная площадка Калининского района Санкт-Петербурга: бесплатные занятия, адреса и контакты.',
  base:'../',active:'districts',className:'kalinin-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Калининский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Бесплатные возможности для&nbsp;молодёжи 14–35&nbsp;лет</p><h1>Калининский район</h1><p class="subhero-lead">19 клубов и&nbsp;молодёжных пространств, центр #Водинголос и&nbsp;Дом молодёжи «Атлант». Найди площадку по&nbsp;интересу.</p><a class="button button-primary" href="#clubs">Смотреть площадки <span aria-hidden="true">↓</span></a></div><div class="vo-stats" aria-label="Состав каталога"><div><b>21</b><span>площадка в&nbsp;каталоге</span></div><p>Состав и&nbsp;контакты собраны по&nbsp;открытым материалам. Набор, расписание и&nbsp;условия занятий уточняй у&nbsp;организатора.</p></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Что тебе интересно?</h2><p>Ищи по&nbsp;названию, адресу или занятию. Можно выбрать тему.</p></div><p id="result-count" aria-live="polite">Показана 21&nbsp;площадка</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по&nbsp;площадкам и&nbsp;направлениям</label><input id="club-search" type="search" placeholder="Например, керамика или Руставели" autocomplete="off"></div><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><div><h2>Клубы и&nbsp;пространства</h2><p>Открой карточку: там есть направления, адрес, телефон и&nbsp;источники.</p></div></div><div class="club-grid" id="club-grid">${kalininClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Подходящих площадок не&nbsp;найдено. Попробуй другой запрос.</p>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты ПМЦ</p><h2>К кому обратиться</h2><p>Общий контакт центра и&nbsp;телефоны отдельных площадок в&nbsp;карточках.</p></div></div><div class="organization-grid"><article class="organization-card"><p class="section-kicker">Учреждение района</p><h3>${text(kalininOrganization.name)}</h3><p>${text(kalininOrganization.address)}</p><p class="organization-phone"><a href="tel:+78122988876">${text(kalininOrganization.phone)}</a></p><div class="organization-links"><a href="mailto:${html(kalininOrganization.email)}">${text(kalininOrganization.email)}</a><a href="${html(kalininOrganization.site)}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ <span aria-hidden="true">↗</span></a></div></article></div>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед первым занятием</p><h2>Уточни условия</h2><p>ПМЦ сообщает о&nbsp;бесплатных занятиях для молодёжи 14-35&nbsp;лет. Условия отдельной группы могут различаться.</p></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Узнай возраст участников группы.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Проверь дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться.</p></div><div class="step"><span>04</span><h3>Допуск</h3><p>Спроси, нужна ли&nbsp;справка для спорта и&nbsp;танцев.</p></div></div>
  <div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Состав площадок, адреса и&nbsp;телефоны взяты со&nbsp;<a href="${kalininSource}" target="_blank" rel="noopener noreferrer">страницы администрации Калининского района</a>. Примеры бесплатных направлений: с&nbsp;<a href="${kalininSite}" target="_blank" rel="noopener noreferrer">сайта ПМЦ «Калининский»</a>. Платные детские студии в&nbsp;каталог не&nbsp;включены.</p><p>Действующее расписание, набор и&nbsp;условия участия могут отличаться. Телефоны некоторых площадок в&nbsp;источниках расходятся: проверь контакт перед визитом.</p></div></div></div></section>`
});

const kirov = page({
  title:'Клубы Кировского района',
  description:'19 подростково-молодёжных площадок Кировского района Санкт-Петербурга: направления, адреса и контакты.',
  base:'../',active:'districts',className:'kirov-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Кировский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Бесплатные возможности для&nbsp;молодёжи 14-35&nbsp;лет</p><h1>Кировский район</h1><p class="subhero-lead">Клубы, студии и&nbsp;молодёжные пространства ПМЦ «Кировский». Выбери площадку по&nbsp;адресу или интересу.</p><a class="button button-primary" href="#clubs">Смотреть площадки <span aria-hidden="true">↓</span></a></div><div class="vo-stats" aria-label="Состав каталога"><div><b>19</b><span>площадок в&nbsp;каталоге</span></div><p>Адреса и&nbsp;контакты собраны по&nbsp;сайту ПМЦ. Набор, расписание и&nbsp;условия участия уточняй у&nbsp;организатора.</p></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Найди своё место</h2><p>Ищи по&nbsp;названию, адресу или занятию. Можно выбрать направление.</p></div><p id="result-count" aria-live="polite">Показано 19&nbsp;площадок</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по&nbsp;площадкам и&nbsp;направлениям</label><input id="club-search" type="search" placeholder="Например, танцы или Стачек" autocomplete="off"></div><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><div><h2>Клубы и&nbsp;пространства</h2><p>В&nbsp;карточке есть направления, адрес, контакт и&nbsp;ссылка на&nbsp;источник.</p></div></div><div class="club-grid" id="club-grid">${kirovClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Подходящих площадок не&nbsp;найдено. Попробуй другой запрос.</p>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты ПМЦ</p><h2>К кому обратиться</h2><p>Можно позвонить в&nbsp;центр или связаться с&nbsp;клубом по&nbsp;номеру из&nbsp;его карточки.</p></div></div><div class="organization-grid"><article class="organization-card"><p class="section-kicker">Учреждение района</p><h3>${text(kirovOrganization.name)}</h3><p>${text(kirovOrganization.address)}</p><p class="organization-phone"><a href="tel:+78123772113">${text(kirovOrganization.phone)}</a></p><div class="organization-links"><a href="mailto:${html(kirovOrganization.email)}">${text(kirovOrganization.email)}</a><a href="${html(kirovOrganization.site)}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ <span aria-hidden="true">↗</span></a><a href="${html(kirovOrganization.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a></div></article></div>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед первым занятием</p><h2>Уточни условия</h2><p>ПМЦ сообщает о&nbsp;бесплатных секциях для молодёжи 14-35&nbsp;лет. Условия конкретной группы проверь перед визитом.</p></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Узнай возраст участников группы.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Проверь дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться.</p></div><div class="step"><span>04</span><h3>Допуск</h3><p>Для спорта уточни требования к&nbsp;здоровью.</p></div></div>
  <div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Перечень площадок, адреса и&nbsp;контакты: <a href="${kirovClubsSource}" target="_blank" rel="noopener noreferrer">сайт ПМЦ «Кировский»</a>. Дополнительный источник по&nbsp;направлениям: <a href="${kirovPdfSource}" target="_blank" rel="noopener noreferrer">городской PDF</a>, загружен 01.06.2026.</p><p>На&nbsp;главной странице ПМЦ указано 20 подразделений, а&nbsp;в&nbsp;разделе «Наши клубы» перечислено 19. Состав и&nbsp;отдельные контакты в&nbsp;PDF отличаются от&nbsp;списка на&nbsp;сайте ПМЦ. В&nbsp;каталоге использован список сайта; детали и&nbsp;действующий набор уточняй у&nbsp;центра.</p></div></div></div></section>`
});

function otherDistrict([name,slug]) {
  return page({title:`${name} район`,description:`Страница подростково-молодёжных клубов: ${name} район Санкт-Петербурга.`,base:'../',active:'districts',className:'pending-page',body:`<section class="subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>${text(name)}</span></nav><p class="section-kicker">Страница района</p><h1>${text(name)} район</h1><p class="subhero-lead">Проверяем адреса, направления и&nbsp;контакты клубов этого района. Каталог появится здесь после сверки данных.</p></div></section><section class="section pending-content"><div class="container"><div class="pending-panel"><div class="pending-symbol" aria-hidden="true">✳</div><div><span class="status-label">Раздел наполняется</span><h2>Скоро здесь будут клубы</h2><p>Пока можно посмотреть другие районы или открыть городскую базу учреждений.</p><div class="pending-actions"><a class="button button-primary" href="index.html">Все районы <span aria-hidden="true">↗</span></a><a class="text-link" href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a></div></div></div><div class="nearby-prompt"><h3>Уже есть в&nbsp;каталоге</h3><p>Открыты каталоги пяти районов.</p><a href="index.html">Выбрать район <span aria-hidden="true">→</span></a></div></div></section>`});
}

function clubDetail(club) {
  const isSpace = club.type === 'Молодёжное пространство';
  const cautions = Boolean(club.organization) || new Set(['Пресс-клуб','Севера','Центр творчества','Притяжение']).has(club.name);
  const isVasileostrovsky = !club.organization;
  const digits = (club.phone ?? '').split(';')[0].replace(/\D/g,'');
  const phoneHref = digits.length === 11 && digits.startsWith('7') ? `tel:+${digits}` : digits.length === 7 ? `tel:+7812${digits}` : '';
  const voPhoneLinks = (club.phone ?? '').split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const digits = value.replace(/\D/g, '');
    const href = digits.length === 11 && digits.startsWith('7') ? `tel:+${digits}` : digits.length === 7 ? `tel:+7812${digits}` : '';
    return href ? `<a href="${href}">${text(value)}</a>` : text(value);
  }).join('<br>');
  const phoneLinks = isVasileostrovsky ? voPhoneLinks : (phoneHref ? `<a href="${phoneHref}">${text(club.phone)}</a>` : text(club.phone));
  return page({title:`${club.name}, Василеостровский район`,description:`${club.name}: ${club.address}. Направления и контакты клуба.`,base:'../',className:'club-detail-page',body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="../districts/vasileostrovsky.html">Василеостровский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${isSpace?'Молодёжное пространство':'Подростково-молодёжный клуб'}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section><section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления клуба</h2>${club.activities.length?`<div class="activity-list">${club.activities.map(item=>`<span>${text(item)}</span>`).join('')}</div>`:'<p>Направления уточняются. Проверь сведения на&nbsp;странице организатора.</p>'}<p class="detail-muted">${isVasileostrovsky ? 'Направления указаны в&nbsp;списке ПМЦ от&nbsp;12.10.2026. Действующие группы, возраст, стоимость и&nbsp;расписание уточняй у&nbsp;организаторов.' : 'Список составлен по&nbsp;открытому документу. Действующие группы, возраст участников и&nbsp;расписание уточняй у&nbsp;организаторов.'}</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как попасть в&nbsp;клуб</h2><ol class="detail-steps"><li>Открой страницу клуба или сообщество ВКонтакте.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div>${cautions?'<div class="detail-alert"><strong>Сведения уточняются</strong><p>Статус клуба или отдельных направлений нужно подтвердить у&nbsp;организаторов перед визитом.</p></div>':''}</div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-address">${text(club.address)}</p>${club.phone?`<p class="contact-phone"><span>${isVasileostrovsky ? 'Телефон из&nbsp;списка ПМЦ' : 'Телефон из&nbsp;открытого документа'}</span><b>${phoneLinks}</b></p>`:''}<div class="contact-actions">${club.officialUrl?`<a class="button button-primary" href="${html(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Страница клуба <span aria-hidden="true">↗</span></a>`:''}${club.vkUrl?`<a class="button button-outline" href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a>`:''}</div><p class="contact-note">Контакты и&nbsp;адрес могли измениться. Проверь детали у&nbsp;организаторов.</p></div><a class="back-card" href="../districts/vasileostrovsky.html">← Ко&nbsp;всем клубам района</a></aside></div></section>`});
}

function admiralClubDetail(club) {
  const markup = clubDetail({...club, officialUrl:club.organizationInfo?.site ?? ''})
    .replaceAll('="../', '="../../')
    .replaceAll('Василеостровский район', 'Адмиралтейский район')
    .replaceAll('../../districts/vasileostrovsky.html', '../../districts/admiralteysky.html')
    .replace('Подростково-молодёжный клуб</p>', `${text(club.organizationInfo?.name ?? 'Подростково-молодёжный клуб')} · Подростково-молодёжный клуб</p>`)
    .replace('>Страница клуба <span', '>Сайт учреждения <span')
    .replace('Контакты и&nbsp;адрес могли измениться.', `Источник списка обновлялся ${admiralSourceDate}. Контакты и&nbsp;адрес могли измениться.`);
  return markup;
}

function vyborgClubDetail(club) {
  const org = club.organizationInfo;
  const directPhone = club.phone ?? '';
  const phone = directPhone || org.phone;
  const email = club.email || org.email;
  const phoneDigits = phone.replace(/\D/g, '');
  const sourceUrl = club.sourceUrl || (club.organization === 'mir' ? vyborgMirSource : vyborgForpostSource);
  return page({
    title:`${club.name}, Выборгский район`,
    description:`${club.name}: ${club.address}. Направления и контакты молодёжной площадки в Выборгском районе.`,
    base:'../../',className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/vyborgsky.html">Выборгский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(org.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2><div class="activity-list">${club.activities.map(item=>`<span>${text(item)}</span>`).join('')}</div><p class="detail-muted">Направления перенесены из&nbsp;открытого документа. Уточни, какие группы работают сейчас, возраст участников и&nbsp;расписание.</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Свяжись с&nbsp;учреждением или открой его&nbsp;сообщество ВКонтакте.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>Направления в&nbsp;документе указаны как бесплатные. Действующий набор и&nbsp;условия конкретной группы нужно подтвердить у&nbsp;организатора.</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><p>Основа карточки: <a href="${html(sourceUrl)}" target="_blank" rel="noopener noreferrer">документ городской базы учреждений</a>. Дата загрузки PDF: 01.06.2026; это не&nbsp;дата проверки площадки.</p></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-address">${text(club.address)}</p><p class="contact-phone"><span>${directPhone?'Телефон площадки из&nbsp;документа':'Общий телефон учреждения'}</span><b><a href="tel:+7812${phoneDigits}">${text(phone)}</a></b></p><p class="contact-phone"><span>${club.email?'Почта площадки из&nbsp;документа':'Общая почта учреждения'}</span><b><a href="mailto:${html(email)}">${text(email)}</a></b></p><div class="contact-actions"><a class="button button-outline" href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">Сообщество учреждения <span aria-hidden="true">↗</span></a></div><p class="contact-note">Адрес и&nbsp;контакты могли измениться. Проверь детали перед визитом.</p></div><a class="back-card" href="../../districts/vyborgsky.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

function kalininClubDetail(club) {
  const phoneLinks = (club.phone ?? '').split(';').map(value => {
    const number = value.trim();
    const digits = number.replace(/\D/g, '');
    return digits.length === 7 ? `<a href="tel:+7812${digits}">${text(number)}</a>` : text(number);
  }).join('; ');
  const additionalNote = club.name === 'Атлант'
    ? 'Телефоны «Атланта» на сайте ПМЦ отличаются от номеров на странице администрации.'
    : club.name === 'Ровесник'
      ? 'Номер «Ровесника» в городском PDF отличается от номера на странице администрации.'
      : club.name === 'Пионер'
        ? 'Действующее название площадки нужно подтвердить у ПМЦ.'
        : '';
  return page({
    title:`${club.name}, Калининский район`,
    description:`${club.name}: ${club.address}. Бесплатные направления, адрес и контакты площадки Калининского района.`,
    base:'../../',className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/kalininsky.html">Калининский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(kalininOrganization.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2><div class="activity-list">${club.activities.map(item=>`<span>${text(item)}</span>`).join('')}</div><p class="detail-muted">Эти направления опубликованы в&nbsp;разделе бесплатных занятий ПМЦ. Уточни, какие группы работают сейчас, возраст участников и&nbsp;расписание.</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Свяжись с&nbsp;площадкой или ПМЦ.</li><li>Уточни, идёт ли&nbsp;набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание, запись и&nbsp;возможный медицинский допуск.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>ПМЦ сообщает о&nbsp;бесплатных занятиях для молодёжи 14-35&nbsp;лет. Условия конкретной группы и&nbsp;наличие мест нужно подтвердить у&nbsp;организатора.${additionalNote ? ` ${text(additionalNote)}` : ''}</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Адрес и&nbsp;телефон: <a href="${kalininSource}" target="_blank" rel="noopener noreferrer">страница администрации района</a>. Направления: <a href="${html(club.sourceUrl || kalininSite)}" target="_blank" rel="noopener noreferrer">сайт ПМЦ «Калининский»</a>.</p><p>Дата публикации источника не&nbsp;означает проверку набора или расписания.</p></div></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-address">${text(club.address)}</p><p class="contact-phone"><span>Телефон площадки из&nbsp;открытого списка</span><b>${phoneLinks}</b></p><p class="contact-phone"><span>Общая почта ПМЦ</span><b><a href="mailto:${html(kalininOrganization.email)}">${text(kalininOrganization.email)}</a></b></p><div class="contact-actions"><a class="button button-outline" href="${html(kalininOrganization.site)}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ <span aria-hidden="true">↗</span></a></div><p class="contact-note">Перед визитом проверь контакт и&nbsp;условия участия.</p></div><a class="back-card" href="../../districts/kalininsky.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

function kirovClubDetail(club) {
  const phone = club.phone || kirovOrganization.phone;
  const digits = phone.replace(/\D/g, '');
  const phoneHref = digits.length === 11 && digits.startsWith('7') ? `tel:+${digits}` : digits.length === 7 ? `tel:+7812${digits}` : '';
  const activityMarkup = club.activities.length
    ? `<div class="activity-list">${club.activities.map(item=>`<span>${text(item)}</span>`).join('')}</div>`
    : '<p>Направления пока не&nbsp;опубликованы в&nbsp;доступном списке. Свяжись с&nbsp;центром перед визитом.</p>';
  const activitySource = club.activitiesSource || (club.activities.length ? club.sourceUrl : kirovClubsSource);
  const activitySourceLabel = club.activitiesSource ? 'городской PDF' : club.activities.length ? 'страница площадки' : 'список клубов ПМЦ';
  return page({
    title:`${club.name}, Кировский район`,
    description:`${club.name}: ${club.address}. Направления, адрес и контакты площадки Кировского района.`,
    base:'../../',className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/kirovsky.html">Кировский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(kirovOrganization.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2>${activityMarkup}<p class="detail-muted">Направления указаны в&nbsp;открытых материалах ПМЦ и&nbsp;городской базы. Уточни, какие группы работают сейчас, возраст участников, бесплатность и&nbsp;расписание.</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Открой страницу клуба или свяжись с&nbsp;ПМЦ.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>На&nbsp;сайте ПМЦ указаны бесплатные секции для молодёжи 14-35&nbsp;лет. Условия конкретного занятия нужно подтвердить у&nbsp;организатора.${club.note ? ` ${text(club.note)}` : ''}</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Адрес и&nbsp;телефон: <a href="${kirovClubsSource}" target="_blank" rel="noopener noreferrer">список клубов ПМЦ</a>. Сведения о&nbsp;направлениях: <a href="${html(activitySource)}" target="_blank" rel="noopener noreferrer">${activitySourceLabel}</a>.</p><p>Публикация источника не&nbsp;подтверждает наличие мест и&nbsp;действующий набор.</p></div></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-address">${text(club.address)}</p><p class="contact-phone"><span>${club.phone ? 'Телефон площадки на&nbsp;сайте ПМЦ' : 'Общий телефон ПМЦ'}</span><b>${phoneHref ? `<a href="${phoneHref}">${text(phone)}</a>` : text(phone)}</b></p><p class="contact-phone"><span>Общая почта ПМЦ</span><b><a href="mailto:${html(kirovOrganization.email)}">${text(kirovOrganization.email)}</a></b></p><div class="contact-actions"><a class="button button-primary" href="${html(club.sourceUrl)}" target="_blank" rel="noopener noreferrer">Страница площадки <span aria-hidden="true">↗</span></a><a class="button button-outline" href="${html(kirovOrganization.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте ПМЦ <span aria-hidden="true">↗</span></a></div><p class="contact-note">Перед визитом проверь контакт и&nbsp;условия участия.</p></div><a class="back-card" href="../../districts/kirovsky.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

await fs.mkdir(path.join(out,'districts'),{recursive:true});
await fs.mkdir(path.join(out,'clubs'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','admiralteysky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','vyborgsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kalininsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kirovsky'),{recursive:true});
await fs.mkdir(path.join(out,'assets'),{recursive:true});
await fs.writeFile(path.join(out,'index.html'),home);
await fs.writeFile(path.join(out,'districts','index.html'),directory);
await fs.writeFile(path.join(out,'districts','vasileostrovsky.html'),vo);
await fs.writeFile(path.join(out,'districts','admiralteysky.html'),admiral);
await fs.writeFile(path.join(out,'districts','vyborgsky.html'),vyborg);
await fs.writeFile(path.join(out,'districts','kalininsky.html'),kalinin);
await fs.writeFile(path.join(out,'districts','kirovsky.html'),kirov);
for (const district of districts.filter(item=>!catalogDistricts.has(item[1]))) await fs.writeFile(path.join(out,'districts',`${district[1]}.html`),otherDistrict(district));
for (const club of clubs) await fs.writeFile(path.join(out,'clubs',`${club.slug}.html`),clubDetail(club));
for (const club of admiralClubs) await fs.writeFile(path.join(out,'clubs','admiralteysky',`${club.slug}.html`),admiralClubDetail(club));
for (const club of vyborgClubs) await fs.writeFile(path.join(out,'clubs','vyborgsky',`${club.slug}.html`),vyborgClubDetail(club));
for (const club of kalininClubs) await fs.writeFile(path.join(out,'clubs','kalininsky',`${club.slug}.html`),kalininClubDetail(club));
for (const club of kirovClubs) await fs.writeFile(path.join(out,'clubs','kirovsky',`${club.slug}.html`),kirovClubDetail(club));
const sitemapPaths = [
  '/',
  '/districts/index.html',
  ...districts.filter(([, slug]) => catalogDistricts.has(slug)).map(([, slug]) => `/districts/${slug}.html`),
  ...clubs.map(club => `/clubs/${club.slug}.html`),
  ...admiralClubs.map(club => `/clubs/admiralteysky/${club.slug}.html`),
  ...vyborgClubs.map(club => `/clubs/vyborgsky/${club.slug}.html`),
  ...kalininClubs.map(club => `/clubs/kalininsky/${club.slug}.html`),
  ...kirovClubs.map(club => `/clubs/kirovsky/${club.slug}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map(route => `  <url><loc>https://young-russia.ru${route}</loc></url>`).join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(out,'sitemap.xml'),sitemap);
await fs.writeFile(path.join(out,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://young-russia.ru/sitemap.xml\n');
for (const asset of ['style.css','site.js','hero-youth.webp','hero-vasileostrovsky.webp','hero-admiralteysky.webp','hero-vyborgsky.webp','hero-kalininsky.webp','hero-kirovsky.webp','favicon.svg']) await fs.copyFile(path.join(root,'assets',asset),path.join(out,'assets',asset));
await fs.copyFile(path.join(root,'assets','style.css'),path.join(out,'assets',styleAsset));
await fs.copyFile(path.join(root,'assets','site.js'),path.join(out,'assets',scriptAsset));
console.log(`Built ${1+1+18+clubs.length+admiralClubs.length+vyborgClubs.length+kalininClubs.length+kirovClubs.length} HTML pages in ${out}`);
