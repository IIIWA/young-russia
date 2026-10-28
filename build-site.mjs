import {renderCatalogSchedule} from './scripts/activity-schedule-markup.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { approximateActivityTopics, classifyActivity, classifyClub, topicGroups } from './scripts/topic-taxonomy.mjs';
import {activityPageSlug, mapClubActivityEntries, slugify} from './scripts/activity-page-routes.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = process.env.SITE_OUTPUT_DIR ? path.resolve(root, process.env.SITE_OUTPUT_DIR) : path.join(root, 'dist');
const styleHash = createHash('sha256').update(await fs.readFile(path.join(root, 'assets', 'style.css'))).digest('hex').slice(0, 12);
const scriptHash = createHash('sha256').update(await fs.readFile(path.join(root, 'assets', 'site.js'))).digest('hex').slice(0, 12);
const styleAsset = `style-${styleHash}.css`;
const scriptAsset = `site-${scriptHash}.js`;
const rawClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-vo.json'), 'utf8'));
const rawAdmiralClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-admiralteysky.json'), 'utf8'));
const rawVyborgClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-vyborgsky.json'), 'utf8'));
const centerContacts = JSON.parse(await fs.readFile(path.join(root, 'data', 'research', 'pmc-centers-contacts.json'), 'utf8'));
const centerContactById = new Map(centerContacts.map(center => [center.id, center]));
const rawKalininClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kalininsky.json'), 'utf8'));
const rawKirovClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kirovsky.json'), 'utf8'));
const rawKolpinoClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kolpinsky.json'), 'utf8'));
const rawKrasnogvardClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-krasnogvardeysky.json'), 'utf8'));
const rawKrasnoselskyClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-krasnoselsky.json'), 'utf8'));
const rawKronshtadtskyClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kronshtadtsky.json'), 'utf8'));
const rawKurortnyClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-kurortny.json'), 'utf8'));
const rawMoskovskyClubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs-moskovsky.json'), 'utf8'));
const newDistrictSlugs = ['nevsky', 'petrogradsky', 'petrodvortsovy', 'primorsky', 'pushkinsky', 'frunzensky', 'tsentralny'];
const newDistrictRaw = Object.fromEntries(await Promise.all(newDistrictSlugs.map(async slug => [slug, JSON.parse(await fs.readFile(path.join(root, 'data', `clubs-${slug}.json`), 'utf8'))])));
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
    site: centerContactById.get('mir').links.site,
  },
  forpost: {
    name: 'Дом молодёжи «Форпост»',
    address: 'Большой Сампсониевский пр., д. 37',
    phone: '542-24-07',
    email: 'dm_forpost@mail.ru',
    vk: 'https://vk.com/dm_forpost',
    site: centerContactById.get('forpost').links.site,
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
const kolpinoSources = {
  kolpinets: 'https://www.spbdm.ru/upload/iblock/2f5/ta80j84xkf2ix3fqn56aju6z93jzjpfx/%D0%94%D0%9C%20%D0%9A%D0%BE%D0%BB%D0%BF%D0%B8%D0%BD%D0%B5%D1%86.pdf',
  rovesnik: 'https://www.spbdm.ru/upload/iblock/79f/v3qp6t9gqcaa1susuz350eartp4udj8k/%D0%A0%D0%BE%D0%B2%D0%B5%D1%81%D0%BD%D0%B8%D0%BA.pdf',
};
const kolpinoOrganizations = {
  kolpinets: {name:'Дом молодёжи «Колпинец»',address:'г. Колпино, Заводской пр., д. 10',phone:'246-43-22',email:'mail@dmk.spb.ru',site:'http://dmk.spb.ru/',vk:'https://vk.ru/dm_kolpinets'},
  rovesnik: {name:'МЦ «Ровесник»',address:'г. Колпино, ул. Танкистов, д. 28А',phone:'469-63-50',site:'https://spbgbu-rovesnik.ru/'},
};
const krasnogvardSource = 'https://pmcohta.ru/contacts';
const krasnogvardPdfSource = 'https://www.spbdm.ru/upload/iblock/e06/6xs92c2vtfocx1149b3gfygt7ypl0d2z/%D0%9F%D0%9C%D0%A6%20%D0%9E%D1%85%D1%82%D0%B0.pdf';
const krasnogvardOrganization = {name:'Молодёжный центр «Охта»',address:'Полюстровский пр., д. 3',phone:'498-84-27',email:'secretar@mcohta.ru',site:'https://pmcohta.ru/'};
const krasnoselskyPdfSource = 'https://www.spbdm.ru/upload/iblock/524/35qphtbcqyez2ov7ps7y8rp6jdm56ezp/%D0%9F%D0%9C%D0%A6%20%D0%9B%D0%B8%D0%B3%D0%BE%D0%B2%D0%BE.pdf';
const krasnoselskyCompassSource = 'https://www.gov.spb.ru/gov/terr/reg_krasnoselsk/news/314884/';
const krasnoselskyOrganization = {name:'МЦ «Лигово»',address:'Балтийский бульвар, д. 4',phone:'8 (969) 729-32-20',email:'pmcligovo@mail.ru',site:'https://gu321.site.gov.spb.ru/',vk:'https://vk.com/pmcligovo'};
const kronshtadtskyPdfSource = 'https://www.spbdm.ru/upload/iblock/637/y4cmgcterp1srclzgum486c8i7qnfd0c/%D0%9A%D0%94%D0%9C.pdf';
const kronshtadtskyOrganization = {name:'Кронштадтский Дворец молодёжи',address:'г. Кронштадт, Советская ул., д. 35, лит. А',phone:'311-22-14',email:'bastion.35@mail.ru',site:'https://xn----htbqkcfn.xn--p1ai/',vk:'https://vk.com/krondm'};
const kurortnyPdfSources = {
  voshod:'https://www.spbdm.ru/upload/iblock/804/hdmmqnwzjh65tnqygjc16kx34vc6rql1/%D0%9F%D0%9C%D0%A6%20%D0%92%D0%BE%D1%81%D1%85%D0%BE%D0%B4.pdf',
  molodost:'https://www.spbdm.ru/upload/iblock/06f/vqldvvp2sa73sthp7ru3wwhj9o6je8by/%D0%9F%D0%9C%D0%A6%20%D0%9C%D0%BE%D0%BB%D0%BE%D0%B4%D0%BE%D1%81%D1%82%D1%8C.pdf',
  sniper:'https://www.spbdm.ru/upload/iblock/55e/56zw8a519ke1xn9kd7gomyhwyy355u8w/%D0%9F%D0%9C%D0%A6%20%D0%A1%D0%BD%D0%B0%D0%B9%D0%BF%D0%B5%D1%80.pdf',
};
const kurortnyOrganizations = {
  voshod:{name:'ПМЦ «Восход»',address:'г. Сестрорецк, Приморское ш., д. 286',phone:'437-23-55',email:'sportvoshod@mail.ru',site:'https://xn--75-dlci3cau6a.xn--p1ai/',vk:'https://vk.ru/pmcvoshod'},
  molodost:{name:'ПМЦ «Молодость»',address:'пос. Песочный, ул. Карла Маркса, д. 57А',phone:'596-80-01',email:'molodostr@yandex.ru',site:'https://molodost.kurort.gov.spb.ru/',vk:'https://vk.ru/pmcmolodost'},
  sniper:{name:'ПМЦ «Снайпер»',address:'г. Зеленогорск, ул. Исполкомская, д. 5',phone:'433-51-52',email:'pmcsniper1111@mail.ru',site:'https://xn----8sbppmhlfke7c.xn--p1ai/',vk:'https://vk.ru/pmcsniper'},
};
const moskovskyPdfSource = 'https://www.spbdm.ru/upload/iblock/f59/tnsxo87fil4fe7j8jp1z7ia4nwigd8xn/%D0%9C%D0%9F%D0%A6%20%D0%9C%D0%BE%D1%81%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9.pdf';
const pulkovetsPdfSource = 'https://www.spbdm.ru/upload/iblock/03d/76jdg9euybfxm1sbb8plzlzqxuvblo5l/%D0%94%D0%9C%20%D0%9F%D1%83%D0%BB%D0%BA%D0%BE%D0%B2%D0%B5%D1%86.pdf';
const moskovskyDistrictSource = 'https://www.gov.spb.ru/gov/terr/reg_moscow/molodezh/uchrezhdeniya-po-delam-molodezhi/';
const moskovskyAddressesSource = 'https://www.gov.spb.ru/gov/terr/reg_moscow/news/173080/';
const moskovskyOrganizations = {
  mpc:{name:'МПЦ «Московский»',address:'Алтайская ул., д. 37',phone:'417-30-10',email:'mpc-moskovskij@mail.ru',site:'https://mpc-moskovskij.tumos.gov.spb.ru/o-centre/'},
  pulkovets:{name:'Дом молодёжи «Пулковец»',address:'5-й Предпортовый пр., д. 8, корп. 5',phone:'413-58-20',email:'pulkovec@mail.ru',site:'https://dm.pulkovec.ru/'},
};
const newDistrictSources = {
  nevsky:'https://www.spbdm.ru/upload/iblock/187/6ql8t1jeh7jl04el76kba7ovyq0a28uq/%D0%9F%D0%9C%D0%A6%20%D0%9D%D0%B5%D0%B2%D1%81%D0%BA%D0%B8%D0%B9.pdf',
  petrogradsky:'https://www.spbdm.ru/upload/iblock/9a4/mq72p91opxlv85avyv0kauatyd6n82xj/%D0%9F%D0%9C%D0%A6%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%B4%D1%81%D0%BA%D0%B8%D0%B9.pdf',
  petrodvortsovy:'https://www.spbdm.ru/upload/iblock/c90/si2n21f153nkas2s6o6ppj0aab85e4qo/%D0%9F%D0%9C%D0%A6%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B4%D0%B2%D0%BE%D1%80%D1%86%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D1%80-%D0%BD%D0%B0%20%D0%A1%D0%9F%D0%B1.pdf',
  primorsky:'https://www.spbdm.ru/upload/iblock/61a/6m1do9vk9g8xfg4xg30nproj1565ggrb/%D0%94%D0%9C%20%D0%9F%D1%80%D0%B8%D0%BC%D0%BE%D1%80%D1%81%D0%BA%D0%BE%D0%B3%D0%BE%20%D1%80-%D0%BD%D0%B0%20%D0%A1%D0%9F%D0%B1.pdf',
  pushkinsky:'https://www.spbdm.ru/upload/iblock/33d/t5jgeeeqrkyc0b9d4v2qq3n9zr0on9ga/%D0%A0%D0%9F%D0%A6%20%D0%9F%D1%83%D1%88%D0%BA%D0%B8%D0%BD%D0%B5%D1%86.pdf',
  pushkinskyDm:'https://www.spbdm.ru/upload/iblock/ec0/leghu7ych2yqkrplx98106p1105ztdai/%D0%94%D0%9C%20%D0%A6%D0%B0%D1%80%D1%81%D0%BA%D0%BE%D1%81%D0%B5%D0%BB%D1%8C%D1%81%D0%BA%D0%B8%D0%B9.pdf',
  frunzensky:'https://www.spbdm.ru/upload/iblock/46c/f902q6623d850j1w1zut53x0a3aqgfh7/%D0%9F%D0%9C%D0%94%D0%A6%20%D0%A4%D1%80%D1%83%D0%BD%D0%B7%D0%B5%D0%BD%D1%81%D0%BA%D0%B8%D0%B9.pdf',
  tsentralny:'https://www.spbdm.ru/upload/iblock/048/ewb43yyvu770vfq104sby11l7k0vtexo/%D0%9E%D0%9F%D0%9C%D0%9A%20%D0%9F%D0%B5%D1%80%D1%81%D0%BF%D0%B5%D0%BA%D1%82%D0%B8%D0%B2%D0%B0.pdf',
};
const newDistrictOrganizations = {
  nevsky:{pmc:{name:'ПМЦ «Невский»',address:'ул. Бабушкина, д. 42, корп. 1',phone:'411-92-30',email:'pc_nevskiy@mail.ru',site:'https://centernevskiy.ru/'}},
  petrogradsky:{pmc:{name:'ПМЦ «Петроградский»',address:'Большой пр. П.С., д. 18А',phone:'235-56-36',email:'pmc-petrograd@mail.ru',site:'https://pmc-petrogradsky.ru/'}},
  petrodvortsovy:{pmc:{name:'Молодёжный центр Петродворцового района',address:'г. Петергоф, ул. Ботаническая, д. 4, корп. 3',phone:'246-24-52',email:'centr-dosug.2016@yandex.ru',site:'https://guptcyu.peter.gov.spb.ru/',siteLabel:'Официальный сайт'}},
  primorsky:{dm:{name:'Дом молодёжи Приморского района',address:'пр. Королёва, д. 32, корп. 1, лит. Б',phone:'342-99-42',email:'info@dom-mol.ru',site:'https://dom-mol.ru/'}},
  pushkinsky:{pushkinets:{name:'РПЦ «Пушкинец»',address:'г. Пушкин, ул. Железнодорожная, д. 56',phone:'470-15-28',email:'pushkinez2008@yandex.ru',site:'https://gurptcp.pushkin.gov.spb.ru/'},dm:{name:'Дом молодёжи «Царскосельский»',address:'г. Пушкин, ул. Магазейная, д. 42',phone:'465-66-15',email:'direktor@pushkindm.ru',site:'https://pushkindm.ru/'}},
  frunzensky:{pmc:{name:'ПМДЦ «Фрунзенский»',address:'Софийская ул., д. 38, корп. 2',phone:'411-85-75',email:'pmdcfrunz@mail.ru',site:'https://centerfrunze.ru/'}},
  tsentralny:{pmc:{name:'ОПМК «Перспектива»',address:'ул. Пушкинская, д. 2/79',phone:'575-67-36',email:'pers279@yandex.ru',site:'https://perspektiva-klab.ru/'}},
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
const html = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shortWords = 'в|во|с|со|к|ко|о|об|у|и|а|но|из|от|до|по|за|на|под|над|при|про|без|для|не|ни|что|как|или|чем|где|если|через';
const text = (value = '') => html(value).replace(new RegExp(`(^|[\\s(])(${shortWords}) +`, 'giu'), '$1$2&nbsp;').replace(/(\d+) +(лет|клуба|клубов|районов|пространство)/giu, '$1&nbsp;$2');
const telHref = value => {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 7) return `tel:+7812${digits}`;
  if (digits.length === 11 && digits.startsWith('8')) return `tel:+7${digits.slice(1)}`;
  return `tel:+${digits}`;
};
const clubs = rawClubs.map(club => ({...club, slug: knownSlugs[club.name] ?? slugify(club.name)}));
const admiralClubs = rawAdmiralClubs.map(club => ({...club, slug: club.slug ?? slugify(club.name), districtCode:'admiralteysky', organizationInfo: admiralOrganizations[club.organization], organizationLabel: admiralOrganizations[club.organization]?.name ?? 'Подростково-молодёжный клуб'}));
const vyborgClubs = rawVyborgClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'vyborgsky', organizationInfo: vyborgOrganizations[club.organization], organizationLabel: vyborgOrganizations[club.organization]?.name ?? club.type}));
const kalininClubs = rawKalininClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'kalininsky', organizationInfo:kalininOrganization, organizationLabel:club.type}));
const kirovClubs = rawKirovClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'kirovsky', organizationInfo:kirovOrganization, organizationLabel:club.type}));
const kolpinoClubs = rawKolpinoClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'kolpinsky', organizationInfo:kolpinoOrganizations[club.organization], organizationLabel:kolpinoOrganizations[club.organization].name}));
const krasnogvardClubs = rawKrasnogvardClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'krasnogvardeysky', organizationInfo:krasnogvardOrganization, organizationLabel:club.type}));
const krasnoselskyClubs = rawKrasnoselskyClubs.map(club => ({...club, slug:slugify(club.name), districtCode:'krasnoselsky', organizationInfo:krasnoselskyOrganization, organizationLabel:club.type}));
const kronshtadtskyClubs = rawKronshtadtskyClubs.map(club => ({...club, slug:slugify(club.name), districtCode:'kronshtadtsky', organizationInfo:kronshtadtskyOrganization, organizationLabel:club.type}));
const kurortnyClubs = rawKurortnyClubs.map(club => ({...club, slug:slugify(club.name), districtCode:'kurortny', organizationInfo:kurortnyOrganizations[club.organization], organizationLabel:club.type}));
const moskovskyClubs = rawMoskovskyClubs.map(club => ({...club, slug:slugify(club.name), districtCode:'moskovsky', organizationInfo:moskovskyOrganizations[club.organization], organizationLabel:club.type, note:club.organization === 'mpc' ? 'Адрес клуба опубликован в районном материале 2019 года и требует подтверждения.' : club.note}));
const newDistrictClubs = Object.fromEntries(newDistrictSlugs.map(slug => [slug, newDistrictRaw[slug].map(club => ({...club,type:club.type || 'Подростково-молодёжный клуб',organization:club.organization || (slug === 'primorsky' ? 'dm' : 'pmc'),slug:slugify(club.name),districtCode:slug,organizationInfo:newDistrictOrganizations[slug][club.organization || (slug === 'primorsky' ? 'dm' : 'pmc')],organizationLabel:club.type || 'Подростково-молодёжный клуб'}))]));
const catalogDistricts = new Set(['vasileostrovsky', 'admiralteysky', 'vyborgsky', 'kalininsky', 'kirovsky', 'kolpinsky', 'krasnogvardeysky', 'krasnoselsky', 'kronshtadtsky', 'kurortny', 'moskovsky', ...newDistrictSlugs]);
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
  'kolpino-page': {file:'hero-kolpinsky.webp',place:'КДЦ «Ижорский» и мост через Ижору'},
  'krasnogvard-page': {file:'hero-krasnogvardeysky.webp',place:'Большеохтинский мост'},
  'krasnoselsky-page': {file:'hero-krasnoselsky.webp',place:'Троицкая церковь в Красном Селе'},
  'kronshtadtsky-page': {file:'hero-kronshtadtsky.webp',place:'Морской Никольский собор'},
  'kurortny-page': {file:'hero-kurortny.webp',place:'Лютеранская церковь в Зеленогорске'},
  'moskovsky-page': {file:'hero-moskovsky.webp',place:'Чесменская церковь'},
  'nevsky-page': {file:'hero-nevsky.webp',place:'Церковь «Кулич и Пасха»'},
  'petrogradsky-page': {file:'hero-petrogradsky.webp',place:'Петропавловская крепость'},
  'petrodvortsovy-page': {file:'hero-petrodvortsovy.webp',place:'Большой Петергофский дворец'},
  'primorsky-page': {file:'hero-primorsky.webp',place:'Лахта-центр'},
  'pushkinsky-page': {file:'hero-pushkinsky.webp',place:'Екатерининский дворец'},
  'frunzensky-page': {file:'hero-frunzensky.webp',place:'Храм Георгия Победоносца в Купчине'},
  'tsentralny-page': {file:'hero-tsentralny.webp',place:'Дворцовая площадь'},
};

function tags(club) {
  const {topics, subtopics} = classifyClub(club);
  return [...topics, ...['languages', 'dance'].filter(alias => subtopics.includes(alias))];
}
const topicNames = {all:'Все направления', sport:topicGroups.sport.label, creative:topicGroups.creative.label, stage:topicGroups.stage.label, knowledge:topicGroups.knowledge.label, community:topicGroups.community.label};
const topicTaxonomyJson = JSON.stringify(topicGroups).replace(/</g, '\\u003c');
const pendingTopicActivities = new Set(Object.keys(approximateActivityTopics));
const iconArrow = '<span aria-hidden="true">↗</span>';

function header(base, active = '') {
  return `<header class="site-header"><div class="container header-inner">
    <a class="brand" href="${base}index.html" aria-label="ПМК Петербурга, главная"><span class="brand-symbol" aria-hidden="true"><i></i><i></i><i></i></span><span>ПМК<span class="brand-light"> Петербурга</span></span></a>
    <nav class="desktop-nav" aria-label="Основная навигация"><a href="${base}directions/index.html"${active==='directions'?' aria-current="page"':''}>Занятия</a><a href="${base}districts/index.html"${active==='districts'?' aria-current="page"':''}>Районы</a><a href="${base}index.html#how">Как участвовать</a></nav>
    <a class="header-link" href="${base}directions/index.html?topic=sport">Каталог занятий ${iconArrow}</a>
    <button class="menu-button" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button>
  </div><nav id="mobile-nav" class="mobile-nav" aria-label="Мобильная навигация" hidden><a href="${base}directions/index.html">Занятия</a><a href="${base}districts/index.html">Районы</a><a href="${base}index.html#how">Как участвовать</a><a href="${base}directions/index.html?topic=sport">Каталог занятий</a></nav></header>`;
}
function footer(base, district = 'vasileostrovsky') {
  const districtName = `${districts.find(([, slug]) => slug === district)?.[0] ?? 'Василеостровский'} район`;
  return `<footer class="site-footer"><div class="container footer-inner"><div><a class="brand brand-footer" href="${base}index.html"><span class="brand-symbol" aria-hidden="true"><i></i><i></i><i></i></span><span>ПМК<span class="brand-light"> Петербурга</span></span></a><p>Занятия и&nbsp;клубы рядом с&nbsp;тобой.</p></div><div class="footer-links"><a href="${base}districts/index.html">Все районы</a><a href="${base}districts/${district}.html">${districtName}</a><a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a></div><p class="footer-note">Сведения собраны из&nbsp;открытых источников. Расписание, возрастные условия и&nbsp;наличие мест уточняйте у&nbsp;организаторов.</p></div>
    <div class="container footer-contact"><div class="footer-author"><p>Сайт разработан</p><div class="footer-contact-links"><a href="https://vk.ru/iiiwaa" target="_blank" rel="noopener noreferrer">ВКонтакте ${iconArrow}</a><a href="https://t.me/IIIWA6" target="_blank" rel="noopener noreferrer">Telegram ${iconArrow}</a></div></div><p>По&nbsp;вопросам и&nbsp;предложениям пишите в&nbsp;личные сообщения.</p></div>
  </footer>`;
}
function contactButtonsForClub(club, markup) {
  const anchors = [...markup.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  const href = anchor => anchor.match(/\bhref="([^"]+)"/)?.[1] ?? '';
  const normalize = value => value.toLowerCase().replace(/https?:\/\/(?:www\.)?vk\.(?:ru|com)\//, 'https://vk.com/').replace(/\/$/, '');
  const isVk = value => /^https?:\/\/(?:www\.)?vk\.(?:ru|com)(?:\/|$)/i.test(value);
  const district = club.districtCode ?? 'vasileostrovsky';
  const districtLabel = districts.find(([, code]) => code === district)?.[0];
  const sameName = value => String(value ?? '').toLowerCase().replace(/[«»"\s]/g, '');
  const center = centerContacts.find(item => item.id === club.organization && item.district === districtLabel)
    ?? centerContacts.find(item => club.organizationInfo?.name && sameName(item.name) === sameName(club.organizationInfo.name))
    ?? centerContacts.find(item => club.organizationInfo?.site && item.links?.site && normalize(item.links.site) === normalize(club.organizationInfo.site))
    ?? (!club.organizationInfo ? centerContactById.get(district) : undefined);
  const vk = club.vkUrl || club.organizationInfo?.vk || center?.links?.vk || anchors.map(href).find(isVk);
  const ownPage = club.officialUrl && !anchors.some(anchor => normalize(href(anchor)) === normalize(club.officialUrl)) ? `<a class="button button-outline" href="${html(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Страница клуба <span aria-hidden="true">↗</span></a>` : '';
  if (!vk) return ownPage + markup;
  const label = club.vkUrlSharedWith ? 'Общее сообщество' : club.vkUrl ? 'ВКонтакте клуба' : 'ВКонтакте учреждения';
  const first = `<a class="button button-primary" href="${html(vk)}" target="_blank" rel="noopener noreferrer">${text(label)} <span aria-hidden="true">↗</span></a>`;
  const rest = anchors.filter(anchor => normalize(href(anchor)) !== normalize(vk)).map(anchor => anchor.replace(/\bbutton-primary\b/g, 'button-outline'));
  return first + ownPage + rest.join('');
}

function contactEmail(email) {
  return email ? `<p class="contact-email"><span>Эл.&nbsp;почта:</span> <span class="contact-email-address">${text(email)}</span></p>` : '';
}

function emailAddressesAsText(markup) {
  return markup.replace(/<a\b[^>]*\bhref="mailto:([^"?]+)[^"]*"[^>]*>[\s\S]*?<\/a>/gi, (_, value) => {
    let email = value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try { email = decodeURIComponent(email); } catch {}
    return `<span class="contact-email-address">${text(email)}</span>`;
  });
}

function page({title, description, base='', active='', body, className='', footerDistrict='vasileostrovsky', contactClub=null}) {
  const heroPhoto = districtHeroPhotos[className];
  const photoPreload = heroPhoto ? `<link rel="preload" as="image" href="${base}assets/${heroPhoto.file}" fetchpriority="high">` : '';
  const contactBody = contactClub ? body.replace(/<div class="contact-actions">([\s\S]*?)<\/div>/g, (_, buttons) => `<div class="contact-actions">${contactButtonsForClub(contactClub, buttons)}</div>`).replace(/(<div class="contact-panel">)([\s\S]*?)(<div class="contact-actions">[\s\S]*?<\/div>)/, (_, start, introduction, actions) => {
    const emails = [...introduction.matchAll(/<p class="contact-phone">[\s\S]*?<\/p>/g)].map(match => match[0]);
    return start + introduction.replace(/<p class="contact-phone">[\s\S]*?<\/p>/g, '') + actions + emails.join('');
  }).replace(/(<section\b[^>]*\bid="contacts"[^>]*>[\s\S]*?<div class="direction-link-list">)([\s\S]*?)(<\/div>)/, (_, start, buttons, end) => `${start}${contactButtonsForClub(contactClub, buttons)}${end}`) : body;
  const pageBody = heroPhoto ? contactBody.replace('class="subhero vo-subhero"><div class="container"', `class="subhero vo-subhero district-photo-hero"><img class="district-hero-image" src="${base}assets/${heroPhoto.file}" alt="" aria-hidden="true" loading="eager" fetchpriority="high" decoding="async" onload="this.classList.add('is-loaded')"><div class="container"`) : contactBody;
  const reviewedBody = pageBody.replace(/<div class="activity-list">[\s\S]*?<\/div>/g, list => {
    for (const activity of pendingTopicActivities) {
      list = list.replace(`<span>${text(activity)}</span>`, `<span class="activity-topic-pending">${text(activity)}<small>Тематика уточняется</small></span>`);
    }
    return list;
  });
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf8f1"><meta name="description" content="${html(description)}"><title>${html(title)} | ПМК Петербурга</title><link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">${photoPreload}<link rel="stylesheet" href="${base}assets/${styleAsset}"><script src="${base}assets/${scriptAsset}" defer></script></head><body class="${className}"><a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a>${header(base, active)}<main id="main">${emailAddressesAsText(reviewedBody)}<script id="topic-taxonomy-data" type="application/json">${topicTaxonomyJson}</script></main>${footer(base, footerDistrict)}</body></html>`;
}
function clubCard(club, base = '../', featured = false) {
  const display = club.activities.slice(0, featured ? 3 : 4);
  const badge = club.organizationLabel ?? (club.type === 'Молодёжное пространство' ? 'Молодёжное пространство' : 'Подростково-молодёжный клуб');
  const isPmk = badge === 'Подростково-молодёжный клуб';
  const clubHref = `${base}clubs/${club.districtCode ? `${club.districtCode}/` : ''}${club.slug}.html`;
  const linkLabel = club.type === 'Подростково-молодёжный клуб' ? 'Смотреть клуб' : 'Смотреть площадку';
  return `<article class="club-card${featured?' club-card-featured':''}" data-name="${html(club.name.toLowerCase())}" data-search="${html([club.name,club.address,club.organizationInfo?.name ?? '',...club.activities].join(' ').toLowerCase())}" data-topics="${tags(club).join(' ')}" data-subtopics="${classifyClub(club).subtopics.join(' ')}"${club.organization?` data-org="${html(club.organization)}"`:''}>
    ${isPmk ? '' : `<div class="club-card-top"><span class="eyebrow">${text(badge)}</span></div>`}
    <h3><a href="${clubHref}">${isPmk ? '<abbr class="club-kind" title="Подростково-молодёжный клуб">ПМК</abbr>&nbsp;' : ''}${text(club.name)}</a></h3><p class="club-address">${text(club.address)}</p>${club.temporarilyClosed ? '<p class="club-review-notice">Закрыт на&nbsp;капитальный ремонт</p>' : club.reviewNotice ? '<p class="club-review-notice">Статус площадки уточняется</p>' : ''}
    <div class="club-tags">${display.length ? display.map(item=>`<span>${text(item)}</span>`).join('') : '<span>Направления уточняются</span>'}${club.activities.some(item => pendingTopicActivities.has(item)) ? '<span class="club-topic-pending">Тематика уточняется</span>' : ''}</div>
    <a class="card-bottom" href="${clubHref}">${linkLabel} <span aria-hidden="true">→</span></a>
  </article>`;
}

const catalogClubs = [...clubs, ...admiralClubs, ...vyborgClubs, ...kalininClubs, ...kirovClubs, ...kolpinoClubs, ...krasnogvardClubs, ...krasnoselskyClubs, ...kronshtadtskyClubs, ...kurortnyClubs, ...moskovskyClubs, ...newDistrictSlugs.flatMap(slug => newDistrictClubs[slug])];
const mapCoordinateData = JSON.parse(await fs.readFile(path.join(root, 'data', 'club-coordinates.json'), 'utf8'));
const mapSourceClubs = {
  'data/clubs-vo.json': clubs,
  'data/clubs-admiralteysky.json': admiralClubs,
  'data/clubs-vyborgsky.json': vyborgClubs,
  'data/clubs-kalininsky.json': kalininClubs,
  'data/clubs-kirovsky.json': kirovClubs,
  'data/clubs-kolpinsky.json': kolpinoClubs,
  'data/clubs-krasnogvardeysky.json': krasnogvardClubs,
  'data/clubs-krasnoselsky.json': krasnoselskyClubs,
  'data/clubs-kronshtadtsky.json': kronshtadtskyClubs,
  'data/clubs-kurortny.json': kurortnyClubs,
  'data/clubs-moskovsky.json': moskovskyClubs,
  ...Object.fromEntries(newDistrictSlugs.map(slug => [`data/clubs-${slug}.json`, newDistrictClubs[slug]])),
};
const allMapClubs = mapCoordinateData.addresses.flatMap(address => {
  return address.clubCoordinates.map(point => {
    if (!point.coordinates) return null;
    const source = address.clubs.find(club => club.name === point.clubName);
    const club = source && mapSourceClubs[source.source]?.[source.index];
    if (!club || club.name !== point.clubName || club.address !== address.address) throw new Error(`Map club ${point.clubName} does not match source ${address.id}`);
    const clubPath = source.source === 'data/clubs-vo.json' ? `clubs/${club.slug}.html` : `clubs/${address.district}/${club.slug}.html`;
    return {name:club.name,address:club.address,activities:mapClubActivityEntries(club),district:address.district,coordinates:[point.coordinates.latitude,point.coordinates.longitude],...(point.additionalPoints?.length ? {additionalCoordinates:point.additionalPoints.map(location => [location.latitude,location.longitude])} : {}),url:clubPath,topics:tags(club),provisional:point.source !== 'user_provided' || point.precision === 'approximate'};
  }).filter(Boolean);
});
const mapClubs = allMapClubs.filter(club => club.district === 'vasileostrovsky');
const mapClubsJson = JSON.stringify(mapClubs).replace(/</g, '\\u003c');
const venueCountLabel = count => `${count} ${Math.floor(count/10)%10===1 ? "площадок" : count%10===1 ? "площадка" : count%10>=2 && count%10<=4 ? "площадки" : "площадок"}`;
const homeMapClubsJson = JSON.stringify(allMapClubs).replace(/</g, '\\u003c');
const mappedClubUrls = new Set(allMapClubs.map(club => club.url));
const clubsWithoutMapPoint = catalogClubs.map(club => ({
  name: club.name,
  address: club.address,
  district: districts.find(([, code]) => code === (club.districtCode ?? 'vasileostrovsky'))?.[0],
  url: `clubs/${club.districtCode ? `${club.districtCode}/` : ''}${club.slug}.html`,
})).filter(club => !mappedClubUrls.has(club.url));
if (allMapClubs.length + clubsWithoutMapPoint.length !== catalogClubs.length || clubsWithoutMapPoint.some(club => !club.district)) {
  throw new Error('Home map points do not match the club catalog');
}
const homeMapMissingList = clubsWithoutMapPoint.length
  ? `<details class="map-unlocated"><summary>${venueCountLabel(clubsWithoutMapPoint.length)} пока без&nbsp;точки на&nbsp;карте</summary><ul>${clubsWithoutMapPoint.map(club => `<li><a href="${html(club.url)}">${text(club.name)}</a><span>${text(club.district)} район, ${text(club.address)}</span></li>`).join('')}</ul></details>`
  : '';
function districtCatalogMap(slug) {
  const districtName = districts.find(([, code]) => code === slug)?.[0];
  const points = allMapClubs.filter(club => club.district === slug);
  if (!districtName || !points.length) throw new Error(`No district map data for ${slug}`);
  const mapJson = JSON.stringify(points).replace(/</g, '\\u003c');
  return `<div class="catalog-map-panel"><h3>Клубы на&nbsp;карте</h3><div class="map-legend"><span><i class="map-legend-dot map-legend-known" aria-hidden="true"></i>Координаты уточнены</span><span><i class="map-legend-dot map-legend-provisional" aria-hidden="true"></i>Точка предварительная</span></div><div class="map-shell"><div id="clubs-map" class="clubs-map" data-filtered="true" role="region" aria-label="Карта клубов района: ${text(districtName)}"></div><p id="clubs-map-status" class="map-status" role="status">Загружаем карту клубов…</p></div><script id="clubs-map-data" type="application/json">${mapJson}</script><p id="catalog-map-count" class="catalog-map-credit" aria-live="polite"></p><p class="catalog-map-credit">Предварительные координаты: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>.</p></div>`;
}
function withDistrictMap(markup, slug) {
  const grid = '<div class="club-grid" id="club-grid">';
  if (!markup.includes(grid)) throw new Error(`No club grid on district page ${slug}`);
  return markup.replace(grid, `${districtCatalogMap(slug)}${grid}`);
}
const directionMapPoints = new Map(mapCoordinateData.addresses.flatMap(address => address.clubCoordinates.filter(point => point.coordinates).map(point => [
  `${address.district}|${point.clubName}|${address.address}`,
  {coordinates:[point.coordinates.latitude,point.coordinates.longitude],additionalCoordinates:point.additionalPoints?.map(location => [location.latitude,location.longitude]) ?? [],provisional:point.source !== 'user_provided' || point.precision === 'approximate'},
])));
const featured = [clubs.find(club => club.name === 'Морской'), admiralClubs[0], admiralClubs[22]].filter(Boolean);
const districtLink = district => `districts/${district[1]}.html`;
const districtTopics = {
  vasileostrovsky: [...new Set(clubs.flatMap(tags))].join(' '),
  admiralteysky: [...new Set(admiralClubs.flatMap(tags))].join(' '),
  vyborgsky: [...new Set(vyborgClubs.flatMap(tags))].join(' '),
  kalininsky: [...new Set(kalininClubs.flatMap(tags))].join(' '),
  kirovsky: [...new Set(kirovClubs.flatMap(tags))].join(' '),
  kolpinsky: [...new Set(kolpinoClubs.flatMap(tags))].join(' '),
  krasnogvardeysky: [...new Set(krasnogvardClubs.flatMap(tags))].join(' '),
  krasnoselsky: [...new Set(krasnoselskyClubs.flatMap(tags))].join(' '),
  kronshtadtsky: [...new Set(kronshtadtskyClubs.flatMap(tags))].join(' '),
  kurortny: [...new Set(kurortnyClubs.flatMap(tags))].join(' '),
  moskovsky: [...new Set(moskovskyClubs.flatMap(tags))].join(' '),
  ...Object.fromEntries(newDistrictSlugs.map(slug => [slug, [...new Set(newDistrictClubs[slug].flatMap(tags))].join(' ')])),
};

const home = page({
  title:'Найди своё занятие',
  description:'Каталог подростково-молодёжных клубов Санкт-Петербурга. Направления, адреса и ссылки на организаторов.',
  body:`<section class="hero"><div class="container hero-grid"><div class="hero-copy"><div class="kicker"><span class="kicker-dot"></span> Подростково-молодёжные клубы Петербурга</div><h1>Найди своё <em>занятие</em> в&nbsp;Петербурге</h1><p class="hero-lead">Спорт, творчество, языки и&nbsp;общение рядом с&nbsp;домом. Выбери то, что тебе интересно, и&nbsp;узнай, куда прийти.</p><div class="hero-actions"><a class="button button-primary" href="districts/index.html">Выбрать район <span aria-hidden="true">↗</span></a><a class="text-link" href="#directions">Смотреть направления <span aria-hidden="true">↓</span></a></div><div class="hero-facts"><span><b>18</b> районов города</span><span><b>${catalogClubs.length}</b> площадки в&nbsp;восемнадцати каталогах</span></div></div><div class="hero-photo"><img src="assets/hero-youth.webp" width="1600" height="900" alt="Иллюстрация: молодые люди общаются за игрой в настольный теннис"><div class="photo-sticker"><span class="sticker-spark" aria-hidden="true">✳</span><b>Пробуй новое</b><small>рядом с&nbsp;домом</small></div></div></div></section>
  <section class="intro-strip"><div class="container strip-inner"><p><strong>14-35&nbsp;лет</strong><span>Возможности для&nbsp;молодёжи</span></p><p><strong>Бесплатно</strong><span>Все направления, указанные в&nbsp;каталоге</span></p><p><strong>Рядом</strong><span>Начни поиск со&nbsp;своего района</span></p></div></section>
  <section class="section directions" id="directions"><div class="container"><div class="section-heading"><div><p class="section-kicker">Выбирай по&nbsp;интересу</p><h2>Чем хочется заняться?</h2></div><p>Выбери направление, затем уточни занятие и&nbsp;район.</p></div><div class="topic-grid">
  <a class="topic-card topic-languages" href="directions/index.html?topic=knowledge"><span class="topic-icon" aria-hidden="true">Aa</span><h3>Знания и&nbsp;технологии</h3><p>Языки, программирование и&nbsp;новые навыки</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-sport" href="directions/index.html?topic=sport"><span class="topic-icon" aria-hidden="true">◉</span><h3>Спорт и&nbsp;движение</h3><p>Игры, фитнес, танцы и&nbsp;единоборства</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-creative" href="directions/index.html?topic=creative"><span class="topic-icon" aria-hidden="true">✳</span><h3>Творчество</h3><p>Рисование, фотография, дизайн</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-stage" href="directions/index.html?topic=stage"><span class="topic-icon" aria-hidden="true">♫</span><h3>Сцена и&nbsp;музыка</h3><p>Театр, вокал и&nbsp;гитара</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-community" href="directions/index.html?topic=community"><span class="topic-icon" aria-hidden="true">↗</span><h3>Общение и&nbsp;проекты</h3><p>Клубы, игры и&nbsp;добровольчество</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  </div></div></section>
  <section class="section island-section" id="districts"><div class="container"><div class="island-banner"><div><p class="section-kicker">Каталоги уже открыты</p><h2>Выбери свой район</h2><p>Уже открыты каталоги восемнадцати районов. Ищи площадку по&nbsp;названию, адресу и&nbsp;направлению.</p><div class="hero-actions"><a class="button button-light" href="districts/vasileostrovsky.html">Василеостровский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/admiralteysky.html">Адмиралтейский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/vyborgsky.html">Выборгский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kalininsky.html">Калининский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kirovsky.html">Кировский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kolpinsky.html">Колпинский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/krasnogvardeysky.html">Красногвардейский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/krasnoselsky.html">Красносельский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kronshtadtsky.html">Кронштадтский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kurortny.html">Курортный <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/moskovsky.html">Московский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/nevsky.html">Невский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/petrogradsky.html">Петроградский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/petrodvortsovy.html">Петродворцовый <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/primorsky.html">Приморский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/pushkinsky.html">Пушкинский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/frunzensky.html">Фрунзенский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/tsentralny.html">Центральный <span aria-hidden="true">↗</span></a></div></div><div class="island-mark" aria-hidden="true"><span>ПМК</span><i></i><i></i><i></i></div></div><div class="featured-head"><h3>Куда можно заглянуть</h3><span>Примеры из&nbsp;каталогов</span></div><div class="featured-grid">${featured.map(club=>clubCard(club,'',true)).join('')}</div></div></section>
  <section class="section map-section" id="map"><div class="container"><div class="section-heading"><div><p class="section-kicker">Ориентируйся в&nbsp;городе</p><h2>Клубы на&nbsp;карте</h2></div><p>На&nbsp;карте ${venueCountLabel(allMapClubs.length)} из&nbsp;${catalogClubs.length} во&nbsp;всех 18&nbsp;районах. Для&nbsp;остальных координаты уточняются; адреса есть в&nbsp;карточках.</p></div><div class="map-legend"><span><i class="map-legend-dot map-legend-known" aria-hidden="true"></i>Координаты уточнены</span><span><i class="map-legend-dot map-legend-provisional" aria-hidden="true"></i>Точка предварительная</span></div><div class="map-shell"><div id="clubs-map" class="clubs-map" role="region" aria-label="Карта клубов Петербурга"></div><p id="clubs-map-status" class="map-status" role="status">Загружаем карту клубов…</p></div><script id="clubs-map-data" type="application/json">${homeMapClubsJson}</script>${homeMapMissingList}<p class="map-footnote"><span>Предварительные координаты: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>.</span><a href="districts/index.html">Все районы ↗</a></p></div></section>
  <section class="section how-section" id="how"><div class="container"><div class="section-heading"><div><p class="section-kicker">Просто начать</p><h2>Как попасть в&nbsp;клуб</h2></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Найди интерес</h3><p>Выбери занятие или район, который тебе подходит.</p></div><div class="step"><span>02</span><h3>Открой страницу клуба</h3><p>Посмотри адрес и&nbsp;доступные направления.</p></div><div class="step"><span>03</span><h3>Уточни детали</h3><p>Спроси у&nbsp;организаторов про расписание, возраст и&nbsp;запись.</p></div></div><div class="how-bottom"><p>Программы и&nbsp;набор могут меняться. Перед посещением проверь актуальные условия на&nbsp;странице клуба.</p><a href="districts/index.html">Открыть каталоги <span aria-hidden="true">↗</span></a></div></div></section>`
});

const directionDistrictNames = Object.fromEntries(districts.map(([name,code]) => [code,name]));
const directionCatalogClubs = catalogClubs.filter(club => classifyClub(club).topics.length);
const initialDirectionCount = directionCatalogClubs.length;
const directionResultCards = directionCatalogClubs.map((club, index) => {
  const districtCode = club.districtCode ?? 'vasileostrovsky';
  const activities = mapClubActivityEntries(club).map(activity => ({...activity,subtopics:classifyActivity(activity.label),provisional:Object.hasOwn(approximateActivityTopics,activity.label)}));
  const firstMatch = activities[0];
  const initiallyVisible = index < 12;
  const href = `../clubs/${club.districtCode ? `${districtCode}/` : ''}${club.slug}.html`;
  const mapPoint = directionMapPoints.get(`${districtCode}|${club.name}|${club.address}`);
  const extraMapPoints = mapPoint?.additionalCoordinates.length ? ` data-map-additional="${html(JSON.stringify(mapPoint.additionalCoordinates))}"` : '';
  return `<article class="direction-club-card" data-district="${districtCode}" data-direction-activities="${html(JSON.stringify(activities))}"${mapPoint ? ` data-map-lat="${mapPoint.coordinates[0]}" data-map-lon="${mapPoint.coordinates[1]}" data-map-provisional="${mapPoint.provisional}"${extraMapPoints}` : ''}${initiallyVisible?'':' hidden'}><div class="direction-club-top"><span>${text(directionDistrictNames[districtCode])} район</span><span aria-hidden="true">↗</span></div><h3><a href="${href}">${text(club.name)}</a></h3><p class="direction-club-activity"><span>Подходящее занятие</span><strong data-matched-activity>${firstMatch ? text(firstMatch.label) : ''}</strong><small data-activity-provisional${firstMatch?.provisional?'':' hidden'}>Тематика уточняется</small></p><p class="direction-club-address">${text(club.address)}</p><span class="direction-club-link">Открыть страницу клуба →</span></article>`;
}).join('');
const directionTopicButtons = `<button class="direction-topic direction-topic-all" type="button" data-topic-button="all" aria-pressed="true"><span class="direction-topic-bullet" aria-hidden="true"></span><strong>Все направления</strong><small>${venueCountLabel(initialDirectionCount)}</small></button>` + Object.entries(topicGroups).map(([code,group]) => `<button class="direction-topic direction-topic-${code}" type="button" data-topic-button="${code}" aria-pressed="false"><span class="direction-topic-bullet" aria-hidden="true"></span><strong>${text(group.label)}</strong><small>${venueCountLabel(catalogClubs.filter(club => classifyClub(club).topics.includes(code)).length)}</small></button>`).join('');
const directionSubtopicButtons = Object.entries(topicGroups).flatMap(([groupCode,group]) => Object.entries(group.subtopics).map(([code,label]) => `<label class="direction-subtopic" hidden><input type="radio" name="direction-subtopic" data-subtopic-button="${code}" data-group="${groupCode}"><span class="direction-subtopic-body"><strong>${text(label)}</strong><small>${venueCountLabel(catalogClubs.filter(club => classifyClub(club).subtopics.includes(code)).length)}</small></span></label>`)).join('');
const directionDistrictOptions = districts.map(([name,code]) => `<option value="${code}">${text(name)}</option>`).join('');
const directionsPage = page({
  title:'Занятия для молодёжи в Санкт-Петербурге',
  description:'Бесплатные занятия и подростково-молодёжные клубы Санкт-Петербурга. Выберите направление, занятие и район.',
  base:'../',active:'directions',className:'directions-page',
  body:`<section class="subhero direction-hero" id="directions"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span aria-hidden="true">/</span><span>Занятия</span></nav><p class="section-kicker">Занятия в&nbsp;Петербурге</p><h1 id="direction-title">Все направления</h1><p class="subhero-lead">Выбери район, направление и&nbsp;занятие.</p><div class="direction-controls"><label for="direction-district">Район</label><select id="direction-district"><option value="">Весь Петербург</option>${directionDistrictOptions}</select><button type="button" id="direction-reset">Сбросить фильтры</button></div><div class="direction-topics" role="group" aria-label="Направления занятий">${directionTopicButtons}</div><div class="direction-explore"><details class="direction-subtopics" id="subgroups" open><summary><span>Подгруппы направления</span><strong id="direction-subtopic-selection">Все занятия</strong></summary><div class="direction-subtopic-options" role="radiogroup" aria-label="Подгруппы направления"><label class="direction-subtopic direction-subtopic-all"><input type="radio" name="direction-subtopic" data-subtopic-button="" checked><span class="direction-subtopic-body"><strong>Все занятия</strong><small>Всё направление</small></span></label>${directionSubtopicButtons}</div></details><div class="direction-map-panel"><div class="direction-map-heading"><strong>Клубы на&nbsp;карте</strong><span>По&nbsp;выбранным фильтрам</span></div><div class="direction-map" id="direction-map" role="region" aria-label="Карта клубов по выбранным фильтрам"></div><p class="direction-map-status" id="direction-map-status" role="status" aria-live="polite">Загружаем карту клубов…</p></div></div></div></section>
  <section class="section direction-results-section" id="results"><div class="container"><div class="direction-results-heading"><div><p class="section-kicker">Подходящие площадки</p><h2>Где заниматься</h2><p id="direction-summary" aria-live="polite">Найдено площадок: ${initialDirectionCount}</p></div></div><div class="direction-results-grid" id="direction-results">${directionResultCards}</div><p class="empty-state" id="direction-empty" hidden>Подходящих площадок пока нет. Выбери другой район или подгруппу.</p><button class="button button-outline direction-more" type="button" id="direction-more"${initialDirectionCount>12?'':' hidden'}>Показать ещё</button><p class="direction-results-note">Направления собраны по&nbsp;открытым материалам учреждений. Действующие группы, возраст, расписание и&nbsp;набор уточняй у&nbsp;организаторов.</p></div></section>`
});

const directory = page({
  title:'Районы Петербурга',
  description:'Выберите район Санкт-Петербурга и найдите подростково-молодёжные клубы.',
  base:'../',active:'districts',className:'directory-page',
  body:`<section class="subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><span>Районы</span></nav><p class="section-kicker">Каталог по&nbsp;городу</p><h1>Районы Петербурга</h1><p class="subhero-lead">Выбери район и&nbsp;узнай, какие клубы и&nbsp;занятия уже есть в&nbsp;каталоге.</p></div></section><section class="section directory-section"><div class="container"><div class="directory-toolbar"><label for="district-search">Найти район</label><div class="search-box"><span aria-hidden="true">⌕</span><input id="district-search" type="search" placeholder="Например, Адмиралтейский" autocomplete="off"></div><p><strong>18&nbsp;районов</strong><br>Открыто 18&nbsp;каталогов</p></div><div class="directory-grid" id="district-list">${districts.map((district,index)=>`<a class="directory-card${catalogDistricts.has(district[1])?' ready':''}${district[1]==='vyborgsky'?' needs-review':''}" href="${district[1]}.html" data-search="${html(district[0].toLowerCase())}" data-topics="${districtTopics[district[1]]??''}"${district[1]==='vyborgsky'?` title="${html(vyborgReviewTooltip)}"`:''}><span class="directory-number">${String(index+1).padStart(2,'0')}</span><span class="directory-name">${text(district[0])}</span><span class="directory-status">${district[1]==='vyborgsky'?'9&nbsp;площадок · данные уточняются':district[1]==='kalininsky'?'21&nbsp;площадка':district[1]==='kirovsky'?'19&nbsp;площадок':district[1]==='kolpinsky'?'15&nbsp;площадок':district[1]==='krasnogvardeysky'?'22&nbsp;площадки':district[1]==='krasnoselsky'?'17&nbsp;площадок':district[1]==='kronshtadtsky'?'3&nbsp;площадки':district[1]==='kurortny'?'9&nbsp;площадок':district[1]==='moskovsky'?'21&nbsp;площадка':newDistrictClubs[district[1]]?venueCountLabel(newDistrictClubs[district[1]].length).replace(' ', '&nbsp;'):catalogDistricts.has(district[1])?'Каталог открыт':'Страница района'}</span><span class="directory-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><p class="directory-topic-note" id="district-topic-note" hidden><span id="district-topic-note-text"></span> <a href="index.html">Сбросить направление</a></p><p class="empty-state" id="district-empty" hidden>По&nbsp;этому запросу каталогов не&nbsp;нашлось. Очисти поиск или выбери другое направление.</p></div></section>`
});

function districtCountNoun(count) {
  return Math.floor(count / 10) % 10 === 1 ? 'площадок' : count % 10 === 1 ? 'площадка' : count % 10 >= 2 && count % 10 <= 4 ? 'площадки' : 'площадок';
}

const vo = page({
  title:'Клубы Василеостровского района',
  description:'31 подростково-молодёжный клуб и пространство «Притяжение» в Василеостровском районе Санкт-Петербурга.',
  base:'../',active:'districts',className:'vo-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Василеостровский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Клубы Васильевского острова</p><h1>Василе&shy;островский район</h1><p class="subhero-lead">Спорт, языки, творчество, музыка и&nbsp;общение: ищи клуб по&nbsp;интересу и&nbsp;узнавай, где он&nbsp;находится.</p><a class="button button-primary" href="#clubs">Найти клуб <span aria-hidden="true">↓</span></a></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Выбери подходящее место</h2></div><p id="result-count" aria-live="polite">Показано 32 площадки</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по клубам и направлениям</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div><div class="topic-filters" role="group" aria-label="Фильтр по направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-map-panel"><h3>Клубы на&nbsp;карте</h3><div class="map-legend"><span><i class="map-legend-dot map-legend-known" aria-hidden="true"></i>Координаты уточнены</span><span><i class="map-legend-dot map-legend-provisional" aria-hidden="true"></i>Точка предварительная</span></div><div class="map-shell"><div id="clubs-map" class="clubs-map" data-filtered="true" role="region" aria-label="Карта клубов Василеостровского района"></div><p id="clubs-map-status" class="map-status" role="status">Загружаем карту клубов…</p></div><script id="clubs-map-data" type="application/json">${mapClubsJson}</script><p class="catalog-map-credit">Предварительные координаты: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>.</p></div><div class="club-grid" id="club-grid">${clubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Ничего не&nbsp;нашлось. Попробуй другое название или направление.</p><div class="catalog-source"><span aria-hidden="true">ⓘ</span><p>Адреса, телефоны и&nbsp;направления обновлены по&nbsp;списку ПМЦ Василеостровского района от&nbsp;12.10.2026. Список предоставлен для проекта и&nbsp;не опубликован здесь. <a href="https://www.pmcvo.ru/" target="_blank" rel="noopener noreferrer">Сайт ПМЦ ВО</a> поможет уточнить стоимость, расписание и&nbsp;набор.</p></div></div></section>`
});

const admiral = page({
  title:'Клубы Адмиралтейского района',
  description:'Каталог подростково-молодёжных клубов и площадок Адмиралтейского района Санкт-Петербурга.',
  base:'../',active:'districts',className:'admiral-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Адмиралтейский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Клубы и площадки района</p><h1>Адмиралтейский район</h1><p class="subhero-lead">Ищи клуб по&nbsp;названию, адресу, направлению или учреждению. В&nbsp;списке две организации и&nbsp;26&nbsp;площадок.</p><a class="button button-primary" href="#clubs">Найти клуб <span aria-hidden="true">↓</span></a></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Выбери подходящее место</h2></div><p id="result-count" aria-live="polite">Показано ${admiralClubs.length} площадок</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по клубам и направлениям</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div><h3 class="filter-label">Учреждение</h3><div class="topic-filters" role="group" aria-label="Фильтр по учреждению">${[['all','Все учреждения'],['admiralteysky','Центр «Адмиралтейский»'],['record','Дом молодёжи «Рекорд»']].map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-org-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div><h3 class="filter-label">Направление</h3><div class="topic-filters" role="group" aria-label="Фильтр по направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><h2>Клубы района</h2></div><div class="club-grid" id="club-grid">${admiralClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Ничего не&nbsp;нашлось. Попробуй другое название или фильтр.</p><div class="organization-grid">${Object.values(admiralOrganizations).map(org=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone">${text(org.phone)}</p><div class="organization-links"><a href="${html(org.site)}" target="_blank" rel="noopener noreferrer">Сайт <span aria-hidden="true">↗</span></a><a href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a><a href="${html(org.telegram)}" target="_blank" rel="noopener noreferrer">Телеграм <span aria-hidden="true">↗</span></a><a href="mailto:${html(org.email)}">${text(org.email)}</a></div></article>`).join('')}</div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><p>Список клубов, адреса, телефоны и&nbsp;направления собраны с&nbsp;<a href="${admiralSource}" target="_blank" rel="noopener noreferrer">официальной страницы Администрации Адмиралтейского района</a>. Дата изменения страницы: ${admiralSourceDate}; это дата источника, а&nbsp;не проверка каждой площадки. <a href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений</a> указывает для PDF Центра «Адмиралтейский» дату загрузки 01.06.2026, но содержимое документа по этой ссылке не совпало с названием учреждения. Поэтому карточки пока перенесены со страницы администрации района от 18.04.2025. Перед посещением уточняй данные у&nbsp;организаторов.</p></div></div></section>`
});

const vyborg = page({
  title:'Клубы Выборгского района',
  description:'Девять молодёжных площадок Выборгского района Санкт-Петербурга: адреса, направления и контакты учреждений.',
  base:'../',active:'districts',className:'vyborg-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Выборгский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Клубы и&nbsp;молодёжные площадки</p><h1>Выборгский район</h1><p class="subhero-lead">Девять площадок двух учреждений: ПМЦ «МИР» и&nbsp;Дома молодёжи «Форпост». Ищи занятия и&nbsp;адреса рядом с&nbsp;собой.</p><a class="button button-primary" href="#clubs">Найти площадку <span aria-hidden="true">↓</span></a></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Выбери подходящее место</h2></div><p id="result-count" aria-live="polite">Показано ${vyborgClubs.length} площадок</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по&nbsp;площадкам и&nbsp;направлениям</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div><h3 class="filter-label">Учреждение</h3><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;учреждению">${[['all','Все учреждения'],['mir','ПМЦ «МИР»'],['forpost','Дом молодёжи «Форпост»']].map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-org-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div><h3 class="filter-label">Направление</h3><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><h2>Клубы и&nbsp;пространства</h2></div><div class="club-grid" id="club-grid">${vyborgClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Ничего не&nbsp;нашлось. Попробуй другое название или фильтр.</p>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед первым визитом</p><h2>Уточни условия</h2><p>В&nbsp;документах направления указаны как бесплатные. Условия каждой группы могут различаться.</p></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Спроси, для&nbsp;кого открыта группа.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Уточни дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться к&nbsp;занятиям.</p></div></div>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты учреждений</p><h2>К кому обратиться</h2></div></div><div class="organization-grid">${Object.values(vyborgOrganizations).map(org=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone"><a href="${telHref(org.phone)}">${text(org.phone)}</a></p><div class="organization-links"><a href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a><a href="mailto:${html(org.email)}">${text(org.email)}</a></div></article>`).join('')}</div>
  <div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Направления, адреса и&nbsp;контакты собраны по&nbsp;<a href="${vyborgMirSource}" target="_blank" rel="noopener noreferrer">PDF ПМЦ «МИР»</a> и&nbsp;<a href="${vyborgForpostSource}" target="_blank" rel="noopener noreferrer">PDF Дома молодёжи «Форпост»</a> из&nbsp;<a href="https://www.spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">городской базы учреждений</a>. Дата загрузки документов: 01.06.2026. Это не&nbsp;дата проверки каждой группы.</p><p>В&nbsp;документе «МИРа» есть адрес на&nbsp;пр. Просвещения, д. 54, лит. А без названия площадки, направлений и&nbsp;контактов. До&nbsp;уточнения статуса он&nbsp;не&nbsp;включён в&nbsp;список. Для «Феникса» и&nbsp;«Фестиваля» указаны общие контакты «Форпоста»: прямые контакты в&nbsp;PDF не&nbsp;найдены.</p></div></div></div></section>`
});

const kalinin = page({
  title:'Клубы Калининского района',
  description:'21 подростково-молодёжная площадка Калининского района Санкт-Петербурга: бесплатные занятия, адреса и контакты.',
  base:'../',active:'districts',className:'kalinin-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Калининский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Бесплатные возможности для&nbsp;молодёжи 14–35&nbsp;лет</p><h1>Калининский район</h1><p class="subhero-lead">19 клубов и&nbsp;молодёжных пространств, центр #Водинголос и&nbsp;Дом молодёжи «Атлант». Найди площадку по&nbsp;интересу.</p><a class="button button-primary" href="#clubs">Смотреть площадки <span aria-hidden="true">↓</span></a></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Что тебе интересно?</h2><p>Ищи по&nbsp;названию, адресу или занятию. Можно выбрать тему.</p></div><p id="result-count" aria-live="polite">Показана 21&nbsp;площадка</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по&nbsp;площадкам и&nbsp;направлениям</label><input id="club-search" type="search" placeholder="Например, керамика или Руставели" autocomplete="off"></div><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><div><h2>Клубы и&nbsp;пространства</h2><p>Открой карточку: там есть направления, адрес, телефон и&nbsp;источники.</p></div></div><div class="club-grid" id="club-grid">${kalininClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Подходящих площадок не&nbsp;найдено. Попробуй другой запрос.</p>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты ПМЦ</p><h2>К кому обратиться</h2><p>Общий контакт центра и&nbsp;телефоны отдельных площадок в&nbsp;карточках.</p></div></div><div class="organization-grid"><article class="organization-card"><p class="section-kicker">Учреждение района</p><h3>${text(kalininOrganization.name)}</h3><p>${text(kalininOrganization.address)}</p><p class="organization-phone"><a href="tel:+78122988876">${text(kalininOrganization.phone)}</a></p><div class="organization-links"><a href="mailto:${html(kalininOrganization.email)}">${text(kalininOrganization.email)}</a><a href="${html(kalininOrganization.site)}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ <span aria-hidden="true">↗</span></a></div></article></div>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед первым занятием</p><h2>Уточни условия</h2><p>ПМЦ сообщает о&nbsp;бесплатных занятиях для молодёжи 14-35&nbsp;лет. Условия отдельной группы могут различаться.</p></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Узнай возраст участников группы.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Проверь дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться.</p></div><div class="step"><span>04</span><h3>Допуск</h3><p>Спроси, нужна ли&nbsp;справка для спорта и&nbsp;танцев.</p></div></div>
  <div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Состав площадок, адреса и&nbsp;телефоны взяты со&nbsp;<a href="${kalininSource}" target="_blank" rel="noopener noreferrer">страницы администрации Калининского района</a>. Примеры бесплатных направлений: с&nbsp;<a href="${kalininSite}" target="_blank" rel="noopener noreferrer">сайта ПМЦ «Калининский»</a>. Платные детские студии в&nbsp;каталог не&nbsp;включены.</p><p>Действующее расписание, набор и&nbsp;условия участия могут отличаться. Телефоны некоторых площадок в&nbsp;источниках расходятся: проверь контакт перед визитом.</p></div></div></div></section>`
});

const kirov = page({
  title:'Клубы Кировского района',
  description:'19 подростково-молодёжных площадок Кировского района Санкт-Петербурга: направления, адреса и контакты.',
  base:'../',active:'districts',className:'kirov-page',
  body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>Кировский</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Бесплатные возможности для&nbsp;молодёжи 14-35&nbsp;лет</p><h1>Кировский район</h1><p class="subhero-lead">Клубы, студии и&nbsp;молодёжные пространства ПМЦ «Кировский». Выбери площадку по&nbsp;адресу или интересу.</p><a class="button button-primary" href="#clubs">Смотреть площадки <span aria-hidden="true">↓</span></a></div></div></div></section>
  <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Найди своё место</h2><p>Ищи по&nbsp;названию, адресу или занятию. Можно выбрать направление.</p></div><p id="result-count" aria-live="polite">Показано 19&nbsp;площадок</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по&nbsp;площадкам и&nbsp;направлениям</label><input id="club-search" type="search" placeholder="Например, танцы или Стачек" autocomplete="off"></div><div class="topic-filters" role="group" aria-label="Фильтр по&nbsp;направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><div><h2>Клубы и&nbsp;пространства</h2><p>В&nbsp;карточке есть направления, адрес, контакт и&nbsp;ссылка на&nbsp;источник.</p></div></div><div class="club-grid" id="club-grid">${kirovClubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Подходящих площадок не&nbsp;найдено. Попробуй другой запрос.</p>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты ПМЦ</p><h2>К кому обратиться</h2><p>Можно позвонить в&nbsp;центр или связаться с&nbsp;клубом по&nbsp;номеру из&nbsp;его карточки.</p></div></div><div class="organization-grid"><article class="organization-card"><p class="section-kicker">Учреждение района</p><h3>${text(kirovOrganization.name)}</h3><p>${text(kirovOrganization.address)}</p><p class="organization-phone"><a href="tel:+78123772113">${text(kirovOrganization.phone)}</a></p><div class="organization-links"><a href="mailto:${html(kirovOrganization.email)}">${text(kirovOrganization.email)}</a><a href="${html(kirovOrganization.site)}" target="_blank" rel="noopener noreferrer">Сайт ПМЦ <span aria-hidden="true">↗</span></a><a href="${html(kirovOrganization.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a></div></article></div>
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед первым занятием</p><h2>Уточни условия</h2><p>ПМЦ сообщает о&nbsp;бесплатных секциях для молодёжи 14-35&nbsp;лет. Условия конкретной группы проверь перед визитом.</p></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Узнай возраст участников группы.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Проверь дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться.</p></div><div class="step"><span>04</span><h3>Допуск</h3><p>Для спорта уточни требования к&nbsp;здоровью.</p></div></div>
  <div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Перечень площадок, адреса и&nbsp;контакты: <a href="${kirovClubsSource}" target="_blank" rel="noopener noreferrer">сайт ПМЦ «Кировский»</a>. Дополнительный источник по&nbsp;направлениям: <a href="${kirovPdfSource}" target="_blank" rel="noopener noreferrer">городской PDF</a>, загружен 01.06.2026.</p><p>На&nbsp;главной странице ПМЦ указано 20 подразделений, а&nbsp;в&nbsp;разделе «Наши клубы» перечислено 19. Состав и&nbsp;отдельные контакты в&nbsp;PDF отличаются от&nbsp;списка на&nbsp;сайте ПМЦ. В&nbsp;каталоге использован список сайта; детали и&nbsp;действующий набор уточняй у&nbsp;центра.</p></div></div></div></section>`
});

function newDistrictPage({name, genitive, className, clubs, lead, organizations, sourceNote, credit = ''}) {
  const countNoun = districtCountNoun(clubs.length);
  const organizationFilters = organizations.length > 1
    ? `<h3 class="filter-label">Учреждение</h3><div class="topic-filters" role="group" aria-label="Фильтр по учреждению">${[['all','Все учреждения'],...organizations.map(([key,org])=>[key,org.name])].map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-org-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div>`
    : '';
  return page({
    title:`Клубы ${genitive} района`,
    description:`${clubs.length} молодёжных площадок ${genitive} района Санкт-Петербурга: направления, адреса и контакты.`,
    base:'../', active:'districts', className,
    body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>${name}</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Молодёжные площадки района</p><h1>${name} район</h1><p class="subhero-lead">${lead}</p><a class="button button-primary" href="#clubs">Смотреть площадки <span aria-hidden="true">↓</span></a></div></div></div></section>
    <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Найди своё место</h2><p>Ищи по&nbsp;названию, адресу или направлению.</p></div><p id="result-count" aria-live="polite">Показано ${clubs.length} ${countNoun}</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по площадкам</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div>${organizationFilters}<h3 class="filter-label">Направление</h3><div class="topic-filters" role="group" aria-label="Фильтр по направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><h2>Клубы и&nbsp;пространства</h2></div><div class="club-grid" id="club-grid">${clubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Подходящих площадок не&nbsp;найдено. Попробуй другой запрос.</p>
    <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Связаться с учреждением</p><h2>К кому обратиться</h2></div></div><div class="organization-grid">${organizations.map(([,org])=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone"><a href="${telHref(org.phone)}">${text(org.phone)}</a></p><div class="organization-links">${org.email?`<a href="mailto:${html(org.email)}">${text(org.email)}</a>`:''}<a href="${html(org.site)}" target="_blank" rel="noopener noreferrer">${text(org.siteLabel || "Сайт учреждения")} <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div>
    <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед посещением</p><h2>Уточни условия</h2></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Спроси, для&nbsp;кого открыта группа.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Проверь дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться.</p></div></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div>${sourceNote}<p>${credit}</p></div></div></div></section>`,
  });
}

const kolpino = newDistrictPage({
  name:'Колпинский',genitive:'Колпинского',className:'kolpino-page',clubs:kolpinoClubs,
  lead:'Клубы Дома молодёжи «Колпинец» и&nbsp;МЦ «Ровесник» в&nbsp;Колпине, Металлострое и&nbsp;Понтонном.',
  organizations:Object.entries(kolpinoOrganizations),
  sourceNote:`<p>Адреса, названия студий и&nbsp;расписания ДМК сверены 23.10.2026 с&nbsp;<a href="http://dmk.spb.ru/klubs/" target="_blank" rel="noopener noreferrer">официальным сайтом «Колпинца»</a>. Даты страниц не&nbsp;означают дату начала занятий; текущий набор уточни у&nbsp;клуба. Общие направления также сохранены из&nbsp;городских документов <a href="${kolpinoSources.kolpinets}" target="_blank" rel="noopener noreferrer">«Колпинца»</a> и&nbsp;<a href="${kolpinoSources.rovesnik}" target="_blank" rel="noopener noreferrer">«Ровесника»</a> от&nbsp;01.06.2026. Состав «Ровесника» ранее сверен с&nbsp;<a href="https://spbgbu-rovesnik.ru/" target="_blank" rel="noopener noreferrer">сайтом учреждения</a>.</p>`,
  credit:'Фото КДЦ «Ижорский» и&nbsp;моста: <a href="https://commons.wikimedia.org/wiki/File:DK_Izhorsky_and_bridge_(Kolpino).jpg" target="_blank" rel="noopener noreferrer">Андрей Крижановский, Wikimedia Commons</a>, общественное достояние. Изображение кадрировано.',
});

const krasnogvard = newDistrictPage({
  name:'Красногвардейский',genitive:'Красногвардейского',className:'krasnogvard-page',clubs:krasnogvardClubs,
  lead:'Клубы и&nbsp;молодёжные пространства МЦ «Охта». Выбери площадку по&nbsp;адресу или интересу.',
  organizations:[['okhta',krasnogvardOrganization]],
  sourceNote:`<p>Клубы, бесплатные направления для молодёжи 14-35&nbsp;лет и&nbsp;расписания сверены 23.10.2026 по&nbsp;<a href="https://pmcohta.ru/ourclubs2" target="_blank" rel="noopener noreferrer">официальному сайту МЦ «Охта»</a>. Платные и&nbsp;спорные группы не&nbsp;включены в&nbsp;каталог. «Вега» закрыта на&nbsp;капитальный ремонт; уточни дату открытия у&nbsp;центра. Расписание каждого занятия находится на&nbsp;странице направления.</p>`,
  credit:'Фото Большеохтинского моста: <a href="https://commons.wikimedia.org/wiki/File:Bolsheokhtinsky_Bridge_SPB.jpg" target="_blank" rel="noopener noreferrer">Алексей Фёдоров, Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Изображение кадрировано и&nbsp;сжато.',
});

const krasnoselsky = newDistrictPage({
  name:'Красносельский',genitive:'Красносельского',className:'krasnoselsky-page',clubs:krasnoselskyClubs,
  lead:'Клубы ПМЦ «Лигово» на&nbsp;Юго-Западе и&nbsp;в&nbsp;Красном Селе. Найди площадку по&nbsp;адресу или интересу.',
  organizations:[['ligovo',krasnoselskyOrganization]],
  sourceNote:`<p>Адреса и&nbsp;бесплатные направления 16&nbsp;клубов взяты из&nbsp;<a href="${krasnoselskyPdfSource}" target="_blank" rel="noopener noreferrer">городского документа ПМЦ «Лигово»</a>, загруженного 01.06.2026. «Альфа» в&nbsp;нём отмечена закрытой на&nbsp;капремонт, поэтому в&nbsp;каталог не&nbsp;включена. Открытие «Компаса» подтверждает <a href="${krasnoselskyCompassSource}" target="_blank" rel="noopener noreferrer">администрация района</a>; действующие направления этого клуба уточняются. Адрес учреждения в&nbsp;городском документе отличается от&nbsp;адреса в&nbsp;более старой карточке районной администрации. Перед визитом свяжись с&nbsp;ПМЦ.</p>`,
  credit:'Фото Троицкой церкви в&nbsp;Красном Селе: <a href="https://commons.wikimedia.org/wiki/File:%D0%9A%D1%80%D0%B0%D1%81%D0%BD%D0%BE%D0%B5_%D0%A1%D0%B5%D0%BB%D0%BE._%D0%A2%D1%80%D0%BE%D0%B8%D1%86%D0%BA%D0%B0%D1%8F_%D1%86%D0%B5%D1%80%D0%BA%D0%BE%D0%B2%D1%8C_03.jpg" target="_blank" rel="noopener noreferrer">Екатерина Борисова, Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Изображение кадрировано и&nbsp;сжато.',
});

const kronshtadtsky = newDistrictPage({
  name:'Кронштадтский',genitive:'Кронштадтского',className:'kronshtadtsky-page',clubs:kronshtadtskyClubs,
  lead:'Дворец молодёжи и&nbsp;клубы «Маяк» и&nbsp;«Ровесник» в&nbsp;Кронштадте.',
  organizations:[['kdm',kronshtadtskyOrganization]],
  sourceNote:`<p>Карточки клубов, студий и&nbsp;секций сверены 23.10.2026 по&nbsp;<a href="${kronshtadtskyOrganization.site}" target="_blank" rel="noopener noreferrer">официальному сайту Дворца молодёжи</a>. Бесплатные профили сопоставлены с&nbsp;<a href="${kronshtadtskyPdfSource}" target="_blank" rel="noopener noreferrer">городским перечнем</a>; отдельные платные услуги проверены по&nbsp;прейскурантам 2026&nbsp;года и&nbsp;не&nbsp;включены в&nbsp;каталог. Возраст и&nbsp;режим работы каждого направления указаны на&nbsp;его странице. Спортивный комплекс относится к&nbsp;площадке Дворца на&nbsp;Советской улице.</p>`,
});

const kurortny = newDistrictPage({
  name:'Курортный',genitive:'Курортного',className:'kurortny-page',clubs:kurortnyClubs,
  lead:'Площадки «Восхода», «Молодости» и&nbsp;«Снайпера» в&nbsp;Сестрорецке, Песочном и&nbsp;Зеленогорске.',
  organizations:Object.entries(kurortnyOrganizations),
  sourceNote:`<p>Направления и&nbsp;бесплатные группы сверены по&nbsp;официальным сайтам и&nbsp;городским документам. Расписания: <a href="${kurortnyOrganizations.voshod.site}кружки-и-секции/" target="_blank" rel="noopener noreferrer">«Восход», графики на&nbsp;2026&nbsp;год</a>, <a href="${kurortnyOrganizations.molodost.site}grafik-raboty-studij-i-sekcij-s-01062026-g---po-31082026-g/" target="_blank" rel="noopener noreferrer">«Молодость», архив с&nbsp;1&nbsp;июня по&nbsp;31&nbsp;августа 2026&nbsp;года</a>, <a href="${kurortnyOrganizations.sniper.site}grafik-raboty/94-grafik-raboty-kruzhkov-i-sekcij-s-12102026-god.html" target="_blank" rel="noopener noreferrer">«Снайпер», с&nbsp;12&nbsp;октября 2026&nbsp;года</a>. Два зала «Восхода» на&nbsp;Приморском шоссе, 280&nbsp;объединены в&nbsp;одну карточку. На&nbsp;Привокзальной, 7&nbsp;бесплатные группы пока не&nbsp;подтверждены. Набор и&nbsp;изменения времени уточняй перед визитом.</p>`,
});

const moskovsky = newDistrictPage({
  name:'Московский',genitive:'Московского',className:'moskovsky-page',clubs:moskovskyClubs,
  lead:'Клубы МПЦ «Московский» и&nbsp;пространства Дома молодёжи «Пулковец».',
  organizations:Object.entries(moskovskyOrganizations),
  sourceNote:`<p>Состав клубов МПЦ сверен по&nbsp;<a href="${moskovskyDistrictSource}" target="_blank" rel="noopener noreferrer">списку администрации района</a>. Бесплатные направления: <a href="${moskovskyPdfSource}" target="_blank" rel="noopener noreferrer">городской документ МПЦ</a>; площадки «Пулковца»: <a href="${pulkovetsPdfSource}" target="_blank" rel="noopener noreferrer">документ Дома молодёжи</a>. PDF загружены 01.06.2026. Адреса клубов МПЦ взяты из&nbsp;<a href="${moskovskyAddressesSource}" target="_blank" rel="noopener noreferrer">районной публикации 2019 года</a> и&nbsp;нуждаются в&nbsp;подтверждении. «Атлант» отмечен в&nbsp;PDF как ремонтируемый, а&nbsp;«Искорка» не&nbsp;имеет действующих направлений; они не&nbsp;включены в&nbsp;список доступных площадок.</p>`,
});

const newDistrictConfigs = {
  nevsky:{name:'Невский',genitive:'Невского',lead:'Клубы ПМЦ «Невский» от&nbsp;Невской заставы до&nbsp;Рыбацкого. Найди занятия рядом с&nbsp;домом.',sourceNote:`<p>Состав, адреса и&nbsp;бесплатные направления взяты из&nbsp;<a href="${newDistrictSources.nevsky}" target="_blank" rel="noopener noreferrer">городского документа ПМЦ «Невский»</a>, загруженного 01.06.2026. Контакт учреждения дополнительно сверен с&nbsp;<a href="${newDistrictOrganizations.nevsky.pmc.site}" target="_blank" rel="noopener noreferrer">его сайтом</a>. Телефоны отдельных клубов взяты из&nbsp;документа; перед визитом проверь их&nbsp;актуальность.</p>`},
  petrogradsky:{name:'Петроградский',genitive:'Петроградского',lead:'Молодёжные клубы, мастерские и&nbsp;пространства ПМЦ «Петроградский» на&nbsp;Петроградской стороне.',sourceNote:`<p>Площадки, адреса и&nbsp;бесплатные направления взяты из&nbsp;<a href="${newDistrictSources.petrogradsky}" target="_blank" rel="noopener noreferrer">городского документа ПМЦ «Петроградский»</a>, загруженного 01.06.2026. Там отдельно перечислены платные занятия: в&nbsp;карточках показаны только направления из&nbsp;колонки бесплатных. Наличие группы проверь у&nbsp;центра.</p>`},
  petrodvortsovy:{name:'Петродворцовый',genitive:'Петродворцового',lead:'Площадки ПМЦ в&nbsp;Петергофе, Ломоносове и&nbsp;Стрельне: от&nbsp;творчества до&nbsp;спорта.',sourceNote:`<p>Адреса, клубные ссылки и&nbsp;расписания десяти клубов сверены по&nbsp;<a href="https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/" target="_blank" rel="noopener noreferrer">сайту Молодёжного центра</a> 28.10.2026. Бесплатные направления выбраны по&nbsp;<a href="${newDistrictSources.petrodvortsovy}" target="_blank" rel="noopener noreferrer">бесплатной колонке городского перечня</a> и&nbsp;явному бесплатному предложению «М-51» для&nbsp;молодёжи 14-35&nbsp;лет. Период регулярных сеток не&nbsp;указан; различия источников поясняются рядом с&nbsp;расписанием. Перед визитом уточни свою группу, место и&nbsp;наличие мест.</p>`},
  primorsky:{name:'Приморский',genitive:'Приморского',lead:'Молодёжные пространства Дома молодёжи Приморского района. Выбери адрес и&nbsp;интересное направление.',sourceNote:`<p>Актуальный перечень из&nbsp;13&nbsp;филиалов и&nbsp;контакты сверены по&nbsp;<a href="https://dom-mol.ru/clubs" target="_blank" rel="noopener noreferrer">сайту Дома молодёжи</a> и&nbsp;<a href="https://dom-mol.ru/contacts" target="_blank" rel="noopener noreferrer">странице контактов</a>. Примеры бесплатных направлений взяты из&nbsp;<a href="${newDistrictSources.primorsky}" target="_blank" rel="noopener noreferrer">городского документа</a> от&nbsp;01.06.2026. В&nbsp;нём больше старых площадок, поэтому список сверён с&nbsp;сайтом учреждения. Отдельные направления могли измениться.</p>`},
  pushkinsky:{name:'Пушкинский',genitive:'Пушкинского',lead:'Клубы «Пушкинца» и&nbsp;Дома молодёжи «Царскосельский» в&nbsp;Пушкине, Павловске и&nbsp;Шушарах.',sourceNote:`<p>Состав и&nbsp;бесплатные направления взяты из&nbsp;городских документов <a href="${newDistrictSources.pushkinsky}" target="_blank" rel="noopener noreferrer">РПЦ «Пушкинец»</a> и&nbsp;<a href="${newDistrictSources.pushkinskyDm}" target="_blank" rel="noopener noreferrer">Дома молодёжи «Царскосельский»</a>, загруженных 01.06.2026. Для&nbsp;«Ленсоветовского» в&nbsp;документе нет номера дома. Наличие конкретной группы и&nbsp;адрес занятий проверь у&nbsp;организатора.</p>`},
  frunzensky:{name:'Фрунзенский',genitive:'Фрунзенского',lead:'Дом молодёжи «Купчино» и&nbsp;16 клубов ПМДЦ «Фрунзенский». Найди занятия рядом с&nbsp;домом.',sourceNote:`<p>Перечень площадок, контакты и&nbsp;примеры бесплатных направлений взяты из&nbsp;<a href="${newDistrictSources.frunzensky}" target="_blank" rel="noopener noreferrer">городского документа ПМДЦ «Фрунзенский»</a>, загруженного 01.06.2026. В&nbsp;документе есть и&nbsp;платные занятия: в&nbsp;карточках оставлены направления из&nbsp;колонки бесплатных. Наличие конкретной группы и&nbsp;условия участия уточняй у&nbsp;центра.</p>`},
  tsentralny:{name:'Центральный',genitive:'Центрального',lead:'Клубы ОПМК «Перспектива» в&nbsp;центре Петербурга. Ищи площадку по&nbsp;адресу и&nbsp;интересам.',sourceNote:`<p>Перечень, адреса и&nbsp;примеры бесплатных направлений взяты из&nbsp;<a href="${newDistrictSources.tsentralny}" target="_blank" rel="noopener noreferrer">городского документа ОПМК «Перспектива»</a>, загруженного 01.06.2026. «Око» отмечен как ремонтируемый, «Эстафета» как закрытая: они не&nbsp;включены в&nbsp;каталог доступных площадок. Для&nbsp;трёх клубов бесплатные направления в&nbsp;документе не&nbsp;перечислены. У&nbsp;некоторых клубов несколько адресов; в&nbsp;карточке указан первый адрес из&nbsp;документа. Перед визитом уточни место, набор и&nbsp;условия у&nbsp;<a href="${newDistrictOrganizations.tsentralny.pmc.site}" target="_blank" rel="noopener noreferrer">организатора</a>.</p>`},
};
const newDistrictPages = Object.fromEntries(newDistrictSlugs.map(slug => [slug,newDistrictPage({
  ...newDistrictConfigs[slug],className:`${slug}-page`,clubs:newDistrictClubs[slug],organizations:Object.entries(newDistrictOrganizations[slug]),
})]));

function otherDistrict([name,slug]) {
  return page({title:`${name} район`,description:`Страница подростково-молодёжных клубов: ${name} район Санкт-Петербурга.`,base:'../',active:'districts',className:'pending-page',body:`<section class="subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>${text(name)}</span></nav><p class="section-kicker">Страница района</p><h1>${text(name)} район</h1><p class="subhero-lead">Проверяем адреса, направления и&nbsp;контакты клубов этого района. Каталог появится здесь после сверки данных.</p></div></section><section class="section pending-content"><div class="container"><div class="pending-panel"><div class="pending-symbol" aria-hidden="true">✳</div><div><span class="status-label">Раздел наполняется</span><h2>Скоро здесь будут клубы</h2><p>Пока можно посмотреть другие районы или открыть городскую базу учреждений.</p><div class="pending-actions"><a class="button button-primary" href="index.html">Все районы <span aria-hidden="true">↗</span></a><a class="text-link" href="https://spbdm.ru/baza-uchrezhdeniy/" target="_blank" rel="noopener noreferrer">Городская база учреждений ↗</a></div></div></div><div class="nearby-prompt"><h3>Уже есть в&nbsp;каталоге</h3><p>Открыты каталоги восемнадцати районов.</p><a href="index.html">Выбрать район <span aria-hidden="true">→</span></a></div></div></section>`});
}

const morskoyDirectionConfigs = [
  {slug:'morskoy-devyatyy-lad',title:'Девятый лад',label:'Гитара',description:'Занятия гитарой в ПМК «Морской».',scheduleActivities:['Гитара'],communityIds:['morskoy-devyatyy-lad']},
  {slug:'morskoy-sam-sebe-kinolog',title:'Сам себе кинолог',label:'Курс «Сам себе кинолог»',description:'Курс «Сам себе кинолог» в ПМК «Морской».',scheduleActivities:['Курс «Сам себе кинолог»'],communityIds:['morskoy-sam-sebe-kinolog']},
  {slug:'morskoy-razgovornyy-klub',title:'Разговорный клуб',label:'Английский, немецкий, японский',description:'Разговорные занятия на английском, немецком и японском языках в ПМК «Морской».',scheduleActivities:['Разговорный клуб на английском языке','Разговорный клуб на немецком языке','Разговорный клуб на японском языке'],communityIds:['morskoy-kak-eto-skazat','morskoy-yaponskiy']},
  {slug:'morskoy-vspyshka',title:'Фотостудия «Вспышка»',label:'Фотостудия',description:'Фотостудия «Вспышка» в ПМК «Морской».',scheduleActivities:['Фотостудия'],communityIds:['morskoy-vspyshka']},
];

function morskoyScheduleRows(club, activity) {
  const entries = club.activitySchedule?.find(item => item.activity === activity)?.schedule;
  if (!entries?.length) throw new Error(`Missing schedule for ${activity}`);
  return entries.flatMap(entry => (entry.day || entry.days).split(',').map(day => ({
    day: day.trim(),
    times: entry.time.split(',').map(time => time.trim()),
  })));
}

function morskoyDirectionScheduleTable(club, config) {
  const activity = config.scheduleActivities[0];
  const rows = morskoyScheduleRows(club, activity);
  const days = [...new Set(rows.map(row => row.day))];
  const times = [...new Set(rows.flatMap(row => row.times))].sort();
  const sessions = new Set(rows.flatMap(row => row.times.map(time => `${row.day}|${time}`)));
  const dayLabels = {понедельник:'Пн',вторник:'Вт',среда:'Ср',четверг:'Чт',пятница:'Пт',суббота:'Сб',воскресенье:'Вс'};
  const palette = {
    'morskoy-devyatyy-lad':'guitar',
    'morskoy-sam-sebe-kinolog':'kinolog',
    'morskoy-vspyshka':'photo',
  }[config.slug];
  const cellLabel = config.slug === 'morskoy-sam-sebe-kinolog' ? 'Сам себе кинолог' : activity;
  if (!palette || days.some(day => !dayLabels[day])) throw new Error(`Cannot build schedule table for ${config.slug}`);
  const header = `<thead><tr><th scope="col">Время</th>${days.map(day => `<th scope="col" aria-label="${text(day)}">${dayLabels[day]}</th>`).join('')}</tr></thead>`;
  const body = times.map(time => `<tr><th scope="row">${text(time)}</th>${days.map(day => sessions.has(`${day}|${time}`)
    ? `<td><span class="language-schedule-slot morskoy-schedule-slot morskoy-schedule-${palette}">${text(cellLabel)}</span></td>`
    : '<td></td>').join('')}</tr>`).join('');
  return `<div class="language-schedule-group morskoy-schedule-group"><h3>${text(activity)}</h3><div class="language-schedule-frame"><table class="language-schedule" aria-label="Расписание: ${text(activity)}"><colgroup><col class="language-schedule-time">${days.map(() => '<col>').join('')}</colgroup>${header}<tbody>${body}</tbody></table></div></div>`;
}

function morskoyDirectionDetail(config) {
  const club = clubs.find(item => item.name === 'Морской');
  const communities = config.communityIds.map(id => club.activityPages.find(item => item.id === id));
  if (communities.some(item => !item)) throw new Error(`Missing VK link for ${config.slug}`);
  const communityLinks = communities.map(item => `<a class="button button-outline" href="${html(item.vkUrl)}" target="_blank" rel="noopener noreferrer">${item.languages?.length ? `${text(item.languages.join(' и ').replace(/^./u, letter => letter.toLocaleUpperCase('ru-RU')))}: ` : item.id === 'morskoy-yaponskiy' ? 'Японский: ' : ''}${text(item.title)} <span aria-hidden="true">↗</span></a>`).join('');
  const scheduleMarkup = config.slug === 'morskoy-razgovornyy-klub' ? (() => {
    const sessions = activity => {
      const entries = club.activitySchedule.find(item => item.activity === activity)?.schedule;
      if (!entries?.length) throw new Error(`Missing schedule for ${activity}`);
      return new Set(entries.flatMap(entry =>
        (entry.day || entry.days).split(',').map(day => day.trim()).flatMap(day =>
          entry.time.split(',').map(time => `${day}|${time.trim()}`))));
    };
    const english = sessions('Разговорный клуб на английском языке');
    const german = sessions('Разговорный клуб на немецком языке');
    const japanese = sessions('Разговорный клуб на японском языке');
    const languageDays = [['вторник','Вт'],['среда','Ср'],['пятница','Пт'],['суббота','Сб']];
    const languageTimes = ['16:30-18:10','18:40-20:20','20:20-22:00'];
    const japaneseDays = [['вторник','Вт'],['суббота','Сб']];
    const japaneseTimes = ['16:30-19:00','19:30-22:00'];
    const header = days => `<thead><tr><th scope="col">Время</th>${days.map(([,label]) => `<th scope="col">${label}</th>`).join('')}</tr></thead>`;
    const table = (label,days,times,cell) => `<div class="language-schedule-frame"><table class="language-schedule" aria-label="${label}"><colgroup><col class="language-schedule-time">${days.map(() => '<col>').join('')}</colgroup>${header(days)}<tbody>${times.map(time => `<tr><th scope="row">${time}</th>${days.map(([day]) => cell(day,time)).join('')}</tr>`).join('')}</tbody></table></div>`;
    const shared = table('Английский и немецкий языки',languageDays,languageTimes,(day,time) => {
      const key = `${day}|${time}`;
      if (english.has(key) === german.has(key)) throw new Error(`Ambiguous language slot: ${key}`);
      return english.has(key) ? '<td><span class="language-schedule-slot language-schedule-eng" aria-label="Английский язык">Eng</span></td>' : '<td><span class="language-schedule-slot language-schedule-deu" aria-label="Немецкий язык">Deu</span></td>';
    });
    const japaneseTable = table('Японский язык',japaneseDays,japaneseTimes,(day,time) => {
      if (!japanese.has(`${day}|${time}`)) throw new Error(`Missing Japanese slot: ${day}|${time}`);
      return '<td><span class="language-schedule-slot language-schedule-jpn">Японский</span></td>';
    });
    return `<div class="language-schedule-group"><h3>Английский и&nbsp;немецкий</h3><div class="language-schedule-legend" aria-label="Обозначения языков"><span><i class="language-legend-eng" aria-hidden="true"></i>English</span><span><i class="language-legend-deu" aria-hidden="true"></i>Deutsch</span></div>${shared}</div><div class="language-schedule-group"><h3>Японский</h3>${japaneseTable}</div>`;
  })() : morskoyDirectionScheduleTable(club, config);
  return page({contactClub:club,
    title:`${config.title}, ПМК «Морской»`,
    description:`${config.description} Расписание, адрес, контакты и сообщества направления.`,
    base:'../',className:'direction-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="../districts/vasileostrovsky.html">Василеостровский район</a><span>/</span><a href="../clubs/morskoy.html">Морской</a><span>/</span><span>${text(config.title)}</span></nav><p class="section-kicker">${text(config.label)} · ПМК «Морской»</p><h1>${text(config.title)}</h1><p class="subhero-lead">${text(config.description)}</p></div></section>
    <section class="section direction-content"><div class="container direction-stack">
      <section class="detail-block" id="community"><p class="section-kicker">Сообщества направления</p><h2>Страницы в&nbsp;VK</h2><div class="direction-link-list">${communityLinks}</div>${config.slug === 'morskoy-razgovornyy-klub' ? '' : '<p class="detail-muted">Ссылки предоставлены пользователем. Уточни в&nbsp;сообществе действующий набор и&nbsp;условия участия.</p>'}</section>
      <section class="detail-block" id="schedule"><p class="section-kicker">Время занятий</p><h2>Расписание</h2>${scheduleMarkup}${config.slug === 'morskoy-razgovornyy-klub' ? '' : `<p class="detail-muted">Расписание проверено 16.10.2026 по&nbsp;<a href="${html(club.scheduleSource)}" target="_blank" rel="noopener noreferrer">странице ПМЦ</a>. Перед визитом уточни изменения.</p>`}</section>
      <section class="detail-block" id="contacts"><p class="section-kicker">ПМК «Морской»</p><h2>Адрес и&nbsp;контакты</h2><div class="direction-link-list"><a class="button button-primary" href="${html(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Страница клуба <span aria-hidden="true">↗</span></a><a class="button button-outline" href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">ВКонтакте клуба <span aria-hidden="true">↗</span></a></div>${config.slug === 'morskoy-razgovornyy-klub' ? '' : '<p class="contact-note">Отдельный адрес занятия не&nbsp;подтверждён. Перед визитом уточни место у&nbsp;организаторов.</p>'}${clubLocationMarkup(club,'vasileostrovsky')}</section>
      <section class="detail-block" id="join"><p class="section-kicker">Перед первым занятием</p><h2>Как присоединиться</h2><p>Уточни возраст участников, наличие мест, условия участия и&nbsp;нужна&nbsp;ли предварительная запись в&nbsp;сообществе направления.</p><div class="direction-link-list">${communityLinks}</div>${config.slug === 'morskoy-razgovornyy-klub' ? '' : '<p class="detail-muted">Способ записи пока не&nbsp;подтверждён.</p>'}</section>
      <a class="back-card" href="../clubs/morskoy.html">← К&nbsp;направлениям ПМК «Морской»</a>
    </div></section>`
  });
}

const admiralteetsDirectionConfigs = [
  {activity:'Морская пехота',slug:'admiralteets-morskaya-pekhota',label:'Морские направления'},
  {activity:'Тайский бокс',slug:'admiralteets-tayskiy-boks',label:'Единоборства'},
  {activity:'Бокс',slug:'admiralteets-boks',label:'Единоборства'},
  {activity:'Настольный теннис',slug:'admiralteets-nastolnyy-tennis',label:'Спорт и движение'},
  {activity:'Тренажёрный зал',slug:'admiralteets-trenazhernyy-zal',label:'Спорт и движение'},
];

function admiralteetsBoxingSchedule(club) {
  const sessions = club.activitySchedule?.find(item => item.activity === 'Бокс')?.schedule;
  if (!sessions?.length) throw new Error('Missing Admiralteets boxing schedule');
  const weekdays = [['понедельник','Пн','Понедельник'],['вторник','Вт','Вторник'],['среда','Ср','Среда'],['четверг','Чт','Четверг'],['пятница','Пт','Пятница'],['суббота','Сб','Суббота']];
  const groups = [['Дневные тренировки','language-schedule-eng'],['Вечерние тренировки','language-schedule-deu']];
  const used = new Set();
  const rows = weekdays.map(([day,label,fullLabel]) => {
    const cells = groups.map(([group,color]) => {
      const matches = sessions.filter(item => item.group === group && item.day === day);
      if (day === 'суббота' && group === 'Вечерние тренировки') {
        if (matches.length) throw new Error('Unexpected Saturday evening boxing session');
        return '<td></td>';
      }
      if (matches.length !== 1 || !/^\d{2}:\d{2}$/.test(matches[0].time)) throw new Error(`Unexpected boxing schedule: ${group}, ${day}`);
      used.add(matches[0]);
      return `<td><span class="language-schedule-slot ${color}">${text(matches[0].time)}</span></td>`;
    }).join('');
    return `<tr><th scope="row" data-day-full="${fullLabel}" data-day-short="${label}">${label}</th>${cells}</tr>`;
  }).join('');
  if (used.size !== sessions.length) throw new Error('Unexpected extra boxing sessions');
  return `<div class="language-schedule-frame boxing-schedule-frame"><table class="language-schedule boxing-schedule" aria-label="Расписание бокса"><colgroup><col><col><col></colgroup><thead><tr><th scope="col">День недели</th><th scope="col">Дневная</th><th scope="col">Вечерняя</th></tr></thead><tbody>${rows}</tbody></table></div><p class="detail-muted">Указано время начала тренировок. Продолжительность и&nbsp;наличие мест уточни в&nbsp;сообществе секции.</p>`;
}

function admiralteetsDirectionDetail(config) {
  const club = admiralClubs.find(item => item.slug === 'klub-yunyh-moryakov-admiralteets');
  if (!club?.activities.includes(config.activity)) throw new Error(`Missing Admiralteets activity: ${config.activity}`);
  const activityPage = club.activityPages?.find(item => item.catalogActivity === config.activity);
  const directionLeader = activityPage?.communityContacts?.find(contact => contact.role === 'руководитель направления');
  const communityLinks = activityPage?.vkUrl
    ? `<a class="button button-primary" href="${html(activityPage.vkUrl)}" target="_blank" rel="noopener noreferrer">${text(activityPage.title)} ВКонтакте <span aria-hidden="true">↗</span></a>${(activityPage.communityContacts ?? []).map(contact => `<a class="button button-outline" href="${html(contact.profileUrl)}" target="_blank" rel="noopener noreferrer">${contact.role === 'руководитель направления' ? 'Руководитель направления' : 'Контакт сообщества'}: ${text(contact.displayName)} <span aria-hidden="true">↗</span></a>`).join('')}`
    : `<p class="detail-muted">Отдельное сообщество направления пока не&nbsp;указано. Вопросы можно задать в&nbsp;<a href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">сообществе клуба</a>.</p>`;
  const scheduleMarkup = config.activity === 'Бокс'
    ? admiralteetsBoxingSchedule(club)
    : activityScheduleTable(club, config.activity, admiralteetsDirectionConfigs.findIndex(c=>c.activity===config.activity));
  const joinUrl = activityPage?.vkUrl ?? club.vkUrl;
  const joinLabel = activityPage?.vkUrl ? 'Сообщество направления' : 'Сообщество клуба';
  return page({contactClub:club,
    title:`${config.activity}, КЮМ «Адмиралтеец»`,
    description:`${config.activity} в КЮМ «Адмиралтеец»: сведения о направлении, расписание, адрес и контакты клуба.`,
    base:'../',className:'direction-detail-page',footerDistrict:'admiralteysky',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="../districts/admiralteysky.html">Адмиралтейский район</a><span>/</span><a href="../clubs/admiralteysky/${club.slug}.html">КЮМ «Адмиралтеец»</a><span>/</span><span>${text(config.activity)}</span></nav><p class="section-kicker">${text(config.label)} · КЮМ «Адмиралтеец»</p><h1>${text(config.activity)}</h1><p class="subhero-lead">${text(config.activity)} в&nbsp;КЮМ «Адмиралтеец».${activityPage?.specialist ? ` Специалист: ${text(activityPage.specialist)}` : ''}</p></div></section>
    <section class="section direction-content"><div class="container direction-stack">
      <section class="detail-block" id="community"><p class="section-kicker">Сообщества направления</p><h2>Страницы в&nbsp;VK</h2><div class="direction-link-list">${communityLinks}</div></section>
      <section class="detail-block" id="schedule"><p class="section-kicker">Время занятий</p><h2>Расписание</h2>${scheduleMarkup}</section>
      <section class="detail-block" id="contacts"><p class="section-kicker">КЮМ «Адмиралтеец»</p><h2>Адрес и&nbsp;контакты</h2><div class="direction-link-list"><a class="button button-primary" href="${html(club.organizationInfo.site)}" target="_blank" rel="noopener noreferrer">Сайт учреждения <span aria-hidden="true">↗</span></a><a class="button button-outline" href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">ВКонтакте клуба <span aria-hidden="true">↗</span></a></div><p class="contact-note">Это адрес клуба. Место занятия уточни у&nbsp;организаторов.</p>${clubLocationMarkup(club,'admiralteysky')}</section>
      <section class="detail-block" id="join"><p class="section-kicker">Перед первым занятием</p><h2>Как присоединиться</h2><p>Уточни возраст участников, наличие мест и&nbsp;порядок записи у&nbsp;организаторов.</p><div class="direction-link-list"><a class="button button-outline" href="${html(joinUrl)}" target="_blank" rel="noopener noreferrer">${joinLabel} <span aria-hidden="true">↗</span></a>${directionLeader ? `<a class="button button-outline" href="${html(directionLeader.profileUrl)}" target="_blank" rel="noopener noreferrer">Руководитель направления <span aria-hidden="true">↗</span></a>` : ''}</div><p class="detail-muted">Способ записи пока не&nbsp;подтверждён.</p></section>
      <a class="back-card" href="../clubs/admiralteysky/${club.slug}.html">← К&nbsp;направлениям клуба</a>
    </div></section>`
  });
}

function clubLocationMarkup(club, districtSlug) {
  const record = mapCoordinateData.addresses.find(item => item.district === districtSlug && item.address === club.address && item.clubs.some(candidate => candidate.name === club.name));
  const point = record?.clubCoordinates.find(item => item.clubName === club.name && item.coordinates);
  const address = `<p class="club-location-address">${text(club.address)}</p>${club.addressNote ? `<p class="club-location-note">${text(club.addressNote)}</p>` : ''}`;
  if (!point) {
    const searchUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(`Санкт-Петербург, ${club.address}`)}`;
    return `<div class="club-location"><h3>Адрес клуба</h3>${address}<p class="club-location-pending">Точка на&nbsp;карте уточняется.</p><a class="club-location-link" href="${html(searchUrl)}" target="_blank" rel="noopener noreferrer">Найти адрес в&nbsp;Яндекс Картах ↗</a></div>`;
  }
  const provisional = point.source !== 'user_provided' || point.precision === 'approximate';
  const locations = [{...point.coordinates, referenceUrl:point.referenceUrl}, ...(point.additionalPoints ?? [])];
  const maps = locations.map((location, index) => {
    const coords = `${location.longitude},${location.latitude}`;
    // A shared map URL can restore only its camera view, without a visible pin.
    // Render the supplied point explicitly; keep source URLs in the coordinate registry.
    const marker = encodeURIComponent(`${coords},pm2rdm`);
    const mapUrl = `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(coords)}&z=16&pt=${marker}&lang=ru_RU`;
    const externalUrl = `https://yandex.ru/maps/?ll=${encodeURIComponent(coords)}&z=16&pt=${marker}`;
    const pointLabel = locations.length > 1 ? `, точка ${index + 1}` : '';
    return `${locations.length > 1 ? `<h4>Точка&nbsp;${index + 1}</h4>` : ''}${address}<iframe class="club-location-map" title="${text(club.name)}${pointLabel} на Яндекс Картах" src="${html(mapUrl)}" loading="lazy" allowfullscreen></iframe>${provisional ? '<p class="club-location-pending">Метка предварительная. Уточни расположение у&nbsp;организаторов.</p>' : ''}<a class="club-location-link" href="${html(externalUrl)}" target="_blank" rel="noopener noreferrer">Открыть в&nbsp;Яндекс Картах ↗</a>`;
  }).join('');
  return `<div class="club-location"><h3>Клуб на&nbsp;карте</h3>${maps}</div>`;
}

const weekdayLabels = new Map([
  ['понедельник', 'Пн'], ['вторник', 'Вт'], ['среда', 'Ср'],
  ['четверг', 'Чт'], ['пятница', 'Пт'], ['суббота', 'Сб'], ['воскресенье', 'Вс'],
]);

function directionPriority(club, scheduleActivities, communityPages) {
  // Club-wide contacts are the same for every direction; only direction-specific links affect its order.
  const hasSchedule = scheduleActivities.some(activity =>
    club.activitySchedule?.some(item => item.activity === activity && item.schedule?.length) ||
    (club.classSchedule === 'Брейкинг: пн–сб 16:00–21:00' && activity.startsWith('Брейкинг'))
  );
  const contactLinks = new Set(communityPages.flatMap(page => [
    page.vkUrl,
    page.officialUrl,
    ...(page.communityContacts ?? []).map(contact => contact.profileUrl),
  ]).filter(Boolean));
  return [Number(hasSchedule), contactLinks.size];
}

function sortDirectionCards(club, entries, details) {
  return entries.map((entry, index) => ({entry, index, priority:directionPriority(club, ...details(entry))}))
    .sort((a, b) => b.priority[0] - a.priority[0] || b.priority[1] - a.priority[1] || a.index - b.index)
    .map(({entry}) => entry);
}

function activityCards(club, nested = false) {
  if (!club.activities.length) return '<p>Направления этой площадки уточняются. Свяжись с&nbsp;организатором перед визитом.</p>';
  const entries = sortDirectionCards(club, club.activities.map((activity, index) => ({activity, index})), ({activity}) => [
    [activity], (club.activityPages ?? []).filter(page => page.catalogActivity === activity),
  ]);
  return `<div class="direction-card-grid">${entries.map(({activity, index}) => {
    const slug = activityPageSlug(club, activity, index);
    if (!slug) throw new Error(`Missing direction route: ${club.name}, ${activity}`);
    const detail = club.activityPages?.find(item => item.catalogActivity === activity);
    const detailTitle = detail?.title && detail.mapping?.includes('подтвержден') && detail.title !== activity ? detail.title : '';
    return `<a class="direction-card" href="${nested ? '../../' : '../'}activities/${slug}.html"><span class="section-kicker">Направление клуба</span><h3>${text(activity)}</h3>${detailTitle ? `<p class="direction-card-detail">${text(detailTitle)}</p>` : ''}<span class="direction-card-link">Подробнее <span aria-hidden="true">→</span></span></a>`;
  }).join('')}</div>`;
}

function activityScheduleTable(club, activity, index) {
  let record = club.activitySchedule?.find(item => item.activity === activity);
  const sharedBreaking = !record && club.classSchedule === 'Брейкинг: пн–сб 16:00–21:00' && activity.startsWith('Брейкинг');
  if (sharedBreaking) record = {schedule:[{days:'понедельник, вторник, среда, четверг, пятница, суббота',time:'16:00–21:00',group:'Брейкинг: общее время'}]};
  if (!record?.schedule?.length) return `<p class="detail-muted">Время занятий пока не&nbsp;указано в&nbsp;данных клуба. Уточни расписание у&nbsp;организатора.</p>${club.scheduleUrl ? `<p><a href="${html(club.scheduleUrl)}" target="_blank" rel="noopener noreferrer">Расписание клуба в&nbsp;VK ↗</a></p>` : ''}`;
  return renderCatalogSchedule(record, {activity,index,text,html,weekdayLabels}) + (sharedBreaking ? '<p class="detail-muted">Указано общее время занятий по&nbsp;брейкингу. Распределение между группами уточни у&nbsp;организатора.</p>' : '');
}

function catalogActivityDetail(club, activity, index) {
  const district = club.districtCode ?? 'vasileostrovsky';
  const districtName = districts.find(([, slug]) => slug === district)?.[0] ?? district;
  const clubHref = `../clubs/${club.districtCode ? `${district}/` : ''}${club.slug}.html`;
  const communities = (club.activityPages ?? []).filter(item => item.catalogActivity === activity && (item.vkUrl || item.officialUrl));
  const communityLinks = communities.map(item => [
    item.vkUrl ? `<a class="button button-outline" href="${html(item.vkUrl)}" target="_blank" rel="noopener noreferrer">${text(item.title || activity)}: ВКонтакте <span aria-hidden="true">↗</span></a>` : '',
    item.officialUrl ? `<a class="button button-outline" href="${html(item.officialUrl)}" target="_blank" rel="noopener noreferrer">${text(item.title || activity)}: на&nbsp;сайте клуба <span aria-hidden="true">↗</span></a>` : '',
    item.registrationUrl ? `<a class="button button-outline" href="${html(item.registrationUrl)}" target="_blank" rel="noopener noreferrer">Зарегистрироваться <span aria-hidden="true">↗</span></a>` : ''
  ].join('')).join('');
  const conditions = (club.activityConditions ?? []).filter(item => item.activity === activity);

  const siteUrl = club.officialUrl ?? club.organizationInfo?.site;
  const vkUrl = club.vkUrl ?? club.organizationInfo?.vk;
  const email = club.email ?? club.organizationInfo?.email;
  const contactLinks = `${siteUrl ? `<a class="button button-primary" href="${html(siteUrl)}" target="_blank" rel="noopener noreferrer">${club.officialUrl ? 'Страница клуба' : 'Сайт организатора'} <span aria-hidden="true">↗</span></a>` : ''}${vkUrl ? `<a class="button button-outline" href="${html(vkUrl)}" target="_blank" rel="noopener noreferrer">ВКонтакте ${club.vkUrlSharedWith ? 'учреждения' : club.vkUrl ? 'клуба' : 'организатора'} <span aria-hidden="true">↗</span></a>` : ''}`;
  const joinLinks = communityLinks || contactButtonsForClub(club, contactLinks);
  return page({contactClub:club,
    title:`${activity}, ${club.name}`,
    description:`${activity} в клубе ${club.name}. Адрес, контакты и расписание при наличии подтверждённых данных.`,
    base:'../',className:'direction-detail-page',footerDistrict:district,
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="../districts/${district}.html">${text(districtName)} район</a><span>/</span><a href="${clubHref}">${text(club.name)}</a><span>/</span><span>${text(activity)}</span></nav><p class="section-kicker">${text(club.name)} · направление</p><h1>${text(activity)}</h1><p class="subhero-lead">Занятие в&nbsp;клубе «${text(club.name)}». Уточни действующий набор и&nbsp;условия участия у&nbsp;организатора.</p></div></section>
    <section class="section direction-content"><div class="container direction-stack">
      ${club.temporarilyClosed ? `<div class="detail-alert"><strong>Клуб закрыт на&nbsp;капитальный ремонт</strong><p>${text(club.note??'Уточни дату открытия у центра.')}</p></div>` : ''}
      <section class="detail-block" id="community"><p class="section-kicker">Сообщество направления</p><h2>Страницы направления</h2>${communityLinks ? `<div class="direction-link-list">${communityLinks}</div>` : '<p>Отдельная страница направления пока не&nbsp;указана. Контакты клуба собраны ниже.</p>'}</section>
      <section class="detail-block" id="schedule"><p class="section-kicker">Время занятий</p><h2>Расписание</h2>${activityScheduleTable(club, activity, index)}</section>
      <section class="detail-block" id="contacts"><p class="section-kicker">${text(club.name)}</p><h2>Адрес и&nbsp;контакты</h2>${contactLinks ? `<div class="direction-link-list">${contactLinks}</div>` : '<p>Прямые ссылки на&nbsp;клуб пока не&nbsp;указаны. Адрес площадки приведён ниже.</p>'}${contactEmail(email)}${club.sourceUrl && club.sourceUrl !== siteUrl ? `<p class="detail-muted">Список направлений: <a href="${html(club.sourceUrl)}" target="_blank" rel="noopener noreferrer">открытый источник ↗</a></p>` : ''}${clubLocationMarkup(club, district)}</section>
      <section class="detail-block" id="join"><p class="section-kicker">Перед первым занятием</p><h2>Как присоединиться</h2>${club.ageConditions ? `<p class="detail-muted">Бесплатные группы для участников ${club.ageConditions.freeFrom}-${club.ageConditions.freeTo}&nbsp;лет. Возраст и&nbsp;время своей группы уточни при&nbsp;записи.</p>` : ''}${conditions.map(item => `<p class="detail-muted">${item.sourceType === 'user_vk_note' ? 'В&nbsp;сведениях сообщества' : item.sourceType === 'user_supplied_vk_text' ? 'В&nbsp;перечне услуг ДМК' : 'В&nbsp;официальном перечне'}: ${text(item.sourceText.replace(/\s+—\s+/g,', ').replace(/[,.]+$/,''))}. <a href="${html(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Источник условий ↗</a></p>`).join('')}<p>Уточни возраст участников, наличие мест, действующее расписание и&nbsp;порядок записи у&nbsp;организатора.</p>${joinLinks ? `<div class="direction-link-list">${joinLinks}</div>` : `<a class="button button-outline" href="${clubHref}">Открыть страницу клуба <span aria-hidden="true">→</span></a>`}${communityLinks ? '' : contactEmail(email)}</section>
      <a class="back-card" href="${clubHref}">← К&nbsp;направлениям клуба</a>
    </div></section>`
  });
}

function catalogActivityPrototype(club, activity, index) {
  const district = club.districtCode ?? 'vasileostrovsky';
  const districtName = districts.find(([, slug]) => slug === district)?.[0] ?? district;
  const community = (club.activityPages ?? []).filter(item => item.catalogActivity === activity && item.vkUrl);
  const siteUrl = club.officialUrl ?? club.organizationInfo?.site;
  const vkUrl = club.vkUrl ?? club.organizationInfo?.vk;
  const email = club.email ?? club.organizationInfo?.email;
  const links = community.map(item => `<a href="${html(item.vkUrl)}">${text(item.title || activity)}: ВКонтакте ↗</a>`).join(' ');
  const contacts = `${siteUrl ? `<a href="${html(siteUrl)}">Страница организатора ↗</a>` : ''} ${vkUrl ? `<a href="${html(vkUrl)}">ВКонтакте клуба ↗</a>` : ''} ${email ? `<span class="contact-email-address">Эл.&nbsp;почта: ${text(email)}</span>` : ''}`;
  const wireSection = (number, id, label, content, note) => `<section class="wire-section" id="${id}" data-section="${id}" data-section-label="${html(label)}"><div class="section-label-row"><span class="sec-label">${number} · ${text(label)}</span></div><div class="section-body">${content}</div><p class="section-note">↳ ${text(note)}</p></section>`;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${html(activity)} | Прототип направления</title><link rel="stylesheet" href="../assets/wire.css"><script src="../assets/app.js" defer></script><script src="../assets/comments.js" defer></script><style>.wire-section .language-schedule-group{padding:16px;border:1px solid #aaa;border-radius:12px;background:#f5f5f5}.wire-section .language-schedule-frame{overflow:hidden}.wire-section .language-schedule{width:100%;border-collapse:collapse;table-layout:fixed}.wire-section .language-schedule th,.wire-section .language-schedule td{padding:7px;border:1px solid #aaa;text-align:center}.wire-section .language-schedule-slot{display:flex;flex-direction:column;gap:6px;min-height:64px;padding:10px 5px;background:#d5c9e8;border-radius:7px}.wire-section .catalog-schedule-room{margin-top:auto;font-size:12px}.wire-section .catalog-schedule-part+.catalog-schedule-part{margin-top:16px}.wire-section .catalog-schedule-day{width:22%}.wire-section .contact-email-address{overflow-wrap:anywhere}.wire-section .club-location-address{font-weight:800;margin:16px 0 8px}.wire-section .club-location-map{display:block;width:100%;height:260px;border:1px solid #aaa}</style></head><body><header class="site-header"><div class="header-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a><button class="header-comment" type="button" data-page-comment>Обсудить страницу</button></div></header><main id="main" class="wire-main">${wireSection('01','intro','Направление',`<p>${text(districtName)} район / ${text(club.name)}</p><h1>${text(activity)}</h1><p>Занятие в&nbsp;клубе «${text(club.name)}».</p>`,'На первом экране указаны занятие, клуб и район.')}${wireSection('02','community','Сообщество',`<h2>Страницы в&nbsp;VK</h2>${links || '<p>Отдельная страница направления не указана.</p>'}`,'Ссылки направления показаны при наличии соответствия в каталоге.')}${wireSection('03','schedule','Расписание',`<h2>Расписание</h2>${activityScheduleTable(club, activity, index)}`,'Время показано только при наличии записи для этого направления.')}${wireSection('04','contacts','Адрес и контакты',`<h2>Адрес и&nbsp;контакты</h2><p>${contacts}</p>${clubLocationMarkup(club, district)}`,'Адрес клуба расположен над картой Яндекса.')}${wireSection('05','join','Перед первым занятием',`<h2>Как присоединиться</h2><p>Уточни возраст участников, наличие мест и&nbsp;порядок записи у&nbsp;организатора.</p><p>${links || contacts}</p>`,'Для связи используются ссылки направления или клуба.')}</main><footer class="site-footer"><div class="footer-inner"><a class="wordmark" href="../index.html">ПМК Петербурга<span> / прототип</span></a></div></footer></body></html>`;
}

function admiralteetsDirectionsMarkup(club) {
  if (club.activities.length !== admiralteetsDirectionConfigs.length || admiralteetsDirectionConfigs.some(config => !club.activities.includes(config.activity))) throw new Error('Admiralteets direction pages do not match catalog activities');
  const configs = sortDirectionCards(club, admiralteetsDirectionConfigs, config => [
    [config.activity], (club.activityPages ?? []).filter(page => page.catalogActivity === config.activity),
  ]);
  return `<div class="direction-card-grid">${configs.map(config => {
    const activityPage = club.activityPages?.find(page => page.catalogActivity === config.activity);
    return `<a class="direction-card" href="../activities/${config.slug}.html"><span class="section-kicker">${text(config.label)}</span><h3>${text(config.activity)}</h3>${activityPage?.specialist ? `<p class="direction-card-specialist">Специалист: ${text(activityPage.specialist)}</p>` : ''}<span class="direction-card-link">Подробнее <span aria-hidden="true">→</span></span></a>`;
  }).join('')}</div>`;
}

function clubDetail(club) {
  const isSpace = club.type === 'Молодёжное пространство';
  const cautions = Boolean(club.organization) || new Set(['Пресс-клуб','Севера','Центр творчества','Притяжение']).has(club.name);
  const isVasileostrovsky = !club.organization;
  const vkLabel = club.vkUrlSharedWith ? 'Общее сообщество' : 'ВКонтакте';
  const sharedCommunityNote = club.vkUrlSharedWith ? `<p class="contact-note">Это общее сообщество с&nbsp;ПМК «${text(club.vkUrlSharedWith)}».</p>` : '';
  const activityMarkup = club.slug === 'klub-yunyh-moryakov-admiralteets'
    ? admiralteetsDirectionsMarkup(club)
    : club.name === 'Морской'
    ? `<div class="direction-card-grid">${sortDirectionCards(club, morskoyDirectionConfigs, config => [
      config.scheduleActivities, (club.activityPages ?? []).filter(page => config.communityIds.includes(page.id)),
    ]).map(config => `<a class="direction-card" href="../activities/${config.slug}.html"><span class="section-kicker">${text(config.label)}</span><h3>${text(config.title)}</h3><span class="direction-card-link">Подробнее <span aria-hidden="true">→</span></span></a>`).join('')}</div>`
    : activityCards(club);
  const isMorskoy = isVasileostrovsky && club.name === 'Морской';
  const confirmedScheduleMarkup = club.openingHours
    ? `<div class="detail-block"><p class="section-kicker">Посещение клуба</p><h2>Режим работы</h2><p>Часы работы: ${text(club.openingHours)}</p><p class="detail-muted">Перед визитом проверь набор и&nbsp;наличие мест.</p></div>`
    : '';
  const contactActions = `<div class="contact-actions">${club.officialUrl?`<a class="button button-primary" href="${html(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Страница клуба <span aria-hidden="true">↗</span></a>`:''}${club.vkUrl?`<a class="button button-outline" href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">${text(vkLabel)} <span aria-hidden="true">↗</span></a>`:''}</div>`;
  const locationMarkup = clubLocationMarkup(club, isVasileostrovsky ? 'vasileostrovsky' : 'admiralteysky');
  const firstVisitStep = isMorskoy && club.vkUrl && club.officialUrl
    ? `Открой <a href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">сообщество ВКонтакте</a>, чтобы связаться со&nbsp;специалистом для&nbsp;записи на&nbsp;занятия. На&nbsp;<a href="${html(club.officialUrl)}" target="_blank" rel="noopener noreferrer">странице клуба</a> может быть дополнительная информация.`
    : 'Открой страницу клуба или сообщество ВКонтакте.';
  return page({contactClub:club,title:`${club.name}, Василеостровский район`,description:`${club.name}: ${club.address}. Направления и контакты клуба.`,base:'../',className:'club-detail-page',body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="../districts/vasileostrovsky.html">Василеостровский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${isSpace?'Молодёжное пространство':club.type === 'Студия'?'Студия':'Подростково-молодёжный клуб'}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section><section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления клуба</h2>${activityMarkup}<p class="detail-muted">${isVasileostrovsky ? 'Направления указаны в&nbsp;списке ПМЦ от&nbsp;12.10.2026. Действующие группы, возраст, стоимость и&nbsp;расписание уточняй у&nbsp;организаторов.' : club.noteConfirmedAt ? 'Направления подтверждены 18.10.2026. Действующий набор и&nbsp;наличие мест уточняй у&nbsp;организаторов.' : 'Список составлен по&nbsp;открытому документу. Действующие группы, возраст участников и&nbsp;расписание уточняй у&nbsp;организаторов.'}</p></div>${confirmedScheduleMarkup}<div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как попасть в&nbsp;клуб</h2><ol class="detail-steps"><li>${firstVisitStep}</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div>${club.reviewNotice ? `<div class="detail-alert"><strong>Статус площадки уточняется</strong><p>${text(club.reviewNotice)}</p></div>` : club.noteConfirmedAt ? '' : cautions ? '<div class="detail-alert"><strong>Сведения уточняются</strong><p>Статус клуба или отдельных направлений нужно подтвердить у&nbsp;организаторов перед визитом.</p></div>' : ''}</div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Контакты</span><h2>${text(club.name)}</h2>${contactActions}${sharedCommunityNote}<p class="contact-note">Контакты и&nbsp;адрес могли измениться. Проверь детали у&nbsp;организаторов.</p>${locationMarkup}</div><a class="back-card" href="../districts/vasileostrovsky.html">← Ко&nbsp;всем клубам района</a></aside></div></section>`});
}

function admiralClubDetail(club) {
  const markup = clubDetail({...club, officialUrl:club.officialUrl || club.organizationInfo?.site || ''})
    .replaceAll('="../', '="../../')
    .replaceAll('Василеостровский район', 'Адмиралтейский район')
    .replaceAll('../../districts/vasileostrovsky.html', '../../districts/admiralteysky.html')
    .replace('Подростково-молодёжный клуб</p>', `${text(club.organizationInfo?.name ?? 'Подростково-молодёжный клуб')} · Подростково-молодёжный клуб</p>`)
    .replace('>Страница клуба <span', club.officialUrl ? '>Страница клуба <span' : '>Сайт учреждения <span')
    .replace('Контакты и&nbsp;адрес могли измениться.', club.noteConfirmedAt
      ? `Сведения обновлены ${club.noteConfirmedAt.split('-').reverse().join('.')}. Перед визитом проверь условия участия.`
      : `Источник списка обновлялся ${admiralSourceDate}. Контакты и&nbsp;адрес могли измениться.`);
  return markup;
}

function vyborgClubDetail(club) {
  const org = club.organizationInfo;
  const email = club.email || org.email;
  const sourceUrl = club.sourceUrl || (club.organization === 'mir' ? vyborgMirSource : vyborgForpostSource);
  const shared = Boolean(club.vkUrlSharedWith);
  const clubVkLabel = shared ? 'Общее сообщество «Форпоста»' : club.type === 'Дом молодёжи' ? 'Сообщество учреждения' : 'ВКонтакте клуба';
  const sameCommunity = url => String(url ?? '').replace('vk.ru/', 'vk.com/').replace(/\/$/, '');
  const contactActions = `<div class="contact-actions">${club.officialUrl ? `<a class="button button-primary" href="${html(club.officialUrl)}" target="_blank" rel="noopener noreferrer">Страница клуба <span aria-hidden="true">↗</span></a>` : ''}${club.vkUrl ? `<a class="button button-outline" href="${html(club.vkUrl)}" target="_blank" rel="noopener noreferrer">${text(clubVkLabel)} <span aria-hidden="true">↗</span></a>` : ''}${org.vk && sameCommunity(org.vk) !== sameCommunity(club.vkUrl) ? `<a class="button button-outline" href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">Сообщество учреждения <span aria-hidden="true">↗</span></a>` : ''}${org.site ? `<a class="button button-outline" href="${html(org.site)}" target="_blank" rel="noopener noreferrer">Сайт учреждения <span aria-hidden="true">↗</span></a>` : ''}</div>${shared ? '<p class="contact-note">У&nbsp;площадки нет отдельной группы: новости публикуются в&nbsp;общем сообществе ДМ «Форпост».</p>' : ''}`;
  return page({contactClub:club,
    title:`${club.name}, Выборгский район`,
    description:`${club.name}: ${club.address}. Направления и контакты молодёжной площадки в Выборгском районе.`,
    base:'../../',className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/vyborgsky.html">Выборгский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(org.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2>${activityCards(club, true)}<p class="detail-muted">Направления перенесены из&nbsp;открытого документа. Уточни, какие группы работают сейчас, возраст участников и&nbsp;расписание.</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Свяжись с&nbsp;учреждением или открой его&nbsp;сообщество ВКонтакте.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>Направления в&nbsp;документе указаны как бесплатные. Действующий набор и&nbsp;условия конкретной группы нужно подтвердить у&nbsp;организатора.</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><p>Основа карточки: <a href="${html(sourceUrl)}" target="_blank" rel="noopener noreferrer">документ городской базы учреждений</a>. Дата загрузки PDF: 01.06.2026; это не&nbsp;дата проверки площадки.</p></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-phone"><span>${club.email?'Почта площадки из&nbsp;документа':'Общая почта учреждения'}</span><b><a href="mailto:${html(email)}">${text(email)}</a></b></p>${contactActions}<p class="contact-note">Адрес и&nbsp;контакты могли измениться. Проверь детали перед визитом.</p>${clubLocationMarkup(club,'vyborgsky')}</div><a class="back-card" href="../../districts/vyborgsky.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

function kalininClubDetail(club) {
  const additionalNote = club.name === 'Пионер' && !club.nameConfirmedAt ? 'Действующее название площадки нужно подтвердить у ПМЦ.' : '';
  return page({contactClub:club,
    title:`${club.name}, Калининский район`,
    description:`${club.name}: ${club.address}. Бесплатные направления, адрес и контакты площадки Калининского района.`,
    base:'../../',className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/kalininsky.html">Калининский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(kalininOrganization.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2>${activityCards(club, true)}${clubSupplement(club)}<p class="detail-muted">Направления взяты из&nbsp;бесплатного перечня ПМЦ и&nbsp;бюджетных графиков. Уточни, какие группы работают сейчас, возраст участников и&nbsp;расписание.</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Свяжись с&nbsp;площадкой или ПМЦ.</li><li>Уточни, идёт ли&nbsp;набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание, запись и&nbsp;возможный медицинский допуск.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>ПМЦ сообщает о&nbsp;бесплатных занятиях для молодёжи 14-35&nbsp;лет. Условия конкретной группы и&nbsp;наличие мест нужно подтвердить у&nbsp;организатора.${additionalNote ? ` ${text(additionalNote)}` : ''}</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Адрес: <a href="${kalininSource}" target="_blank" rel="noopener noreferrer">страница администрации района</a>. Направления: <a href="${html(club.sourceUrl || kalininSite)}" target="_blank" rel="noopener noreferrer">сайт ПМЦ «Калининский»</a>.</p><p>Дата публикации источника не&nbsp;означает проверку набора или расписания.</p></div></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-phone"><span>Общая почта ПМЦ</span><b><a href="mailto:${html(kalininOrganization.email)}">${text(kalininOrganization.email)}</a></b></p><div class="contact-actions"><a class="button button-outline" href="${html(club.officialUrl || kalininOrganization.site)}" target="_blank" rel="noopener noreferrer">${club.officialUrl ? 'Страница клуба' : 'Сайт ПМЦ'} <span aria-hidden="true">↗</span></a></div><p class="contact-note">Перед визитом проверь контакт и&nbsp;условия участия.</p>${clubLocationMarkup(club,'kalininsky')}</div><a class="back-card" href="../../districts/kalininsky.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

function clubSupplement(club) {
  return `${(club.additionalCommunityLinks ?? []).length ? `<div class="club-communities"><h3>Сообщества площадки</h3>${club.additionalCommunityLinks.map(item => `<p><a href="${html(item.url)}" target="_blank" rel="noopener noreferrer">${text(item.title)} ↗</a>${item.note ? `<br><small>${text(item.note)}</small>` : ''}</p>`).join('')}</div>` : ''}${club.description ? `<p class="club-description">${text(club.description)}</p>` : ''}${club.amenities?.length ? `<div class="club-amenities"><h3>Также доступны</h3><ul>${club.amenities.map(item => `<li>${text(item)}</li>`).join('')}</ul></div>` : ''}`;
}

function kirovClubDetail(club) {
  const activityMarkup = club.activities.length
    ? activityCards(club, true)
    : '<p>Направления пока не&nbsp;опубликованы в&nbsp;доступном списке. Свяжись с&nbsp;центром перед визитом.</p>';
  const activitySource = club.activitiesSource || (club.activities.length ? club.sourceUrl : kirovClubsSource);
  const activitySourceLabel = club.activitiesSource ? 'городской PDF' : club.activities.length ? 'страница площадки' : 'список клубов ПМЦ';
  return page({contactClub:club,
    title:`${club.name}, Кировский район`,
    description:`${club.name}: ${club.address}. Направления, адрес и контакты площадки Кировского района.`,
    base:'../../',className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/kirovsky.html">Кировский район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(kirovOrganization.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2>${activityMarkup}${clubSupplement(club)}<p class="detail-muted">Направления указаны в&nbsp;открытых материалах ПМЦ и&nbsp;городской базы. Уточни, какие группы работают сейчас, возраст участников, бесплатность и&nbsp;расписание.</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Открой страницу клуба или свяжись с&nbsp;ПМЦ.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>На&nbsp;сайте ПМЦ указаны бесплатные секции для молодёжи 14-35&nbsp;лет. Условия конкретного занятия нужно подтвердить у&nbsp;организатора.${club.note ? ` ${text(club.note)}` : ''}</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Адрес: <a href="${kirovClubsSource}" target="_blank" rel="noopener noreferrer">список клубов ПМЦ</a>. Сведения о&nbsp;направлениях: <a href="${html(activitySource)}" target="_blank" rel="noopener noreferrer">${activitySourceLabel}</a>.</p><p>Публикация источника не&nbsp;подтверждает наличие мест и&nbsp;действующий набор.</p></div></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-phone"><span>Общая почта ПМЦ</span><b><a href="mailto:${html(kirovOrganization.email)}">${text(kirovOrganization.email)}</a></b></p><div class="contact-actions"><a class="button button-primary" href="${html(club.sourceUrl)}" target="_blank" rel="noopener noreferrer">Страница площадки <span aria-hidden="true">↗</span></a><a class="button button-outline" href="${html(kirovOrganization.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте ПМЦ <span aria-hidden="true">↗</span></a></div><p class="contact-note">Перед визитом проверь контакт и&nbsp;условия участия.</p>${clubLocationMarkup(club,'kirovsky')}</div><a class="back-card" href="../../districts/kirovsky.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

function newDistrictClubDetail(club, districtName, districtGenitive, districtSlug, source) {
  const org = club.organizationInfo;
  const activityMarkup = club.temporarilyClosed
    ? '<p>Клуб закрыт на&nbsp;капитальный ремонт. Дата возобновления работы пока не&nbsp;указана.</p>'
    : club.activities.length
    ? activityCards(club, true)
    : '<p>Направления этой площадки уточняются. Свяжись с&nbsp;центром перед визитом.</p>';
  const activityCaution = club.activities.length
    ? 'Направления приведены по&nbsp;открытым материалам учреждения. Уточни действующие группы, возрастные условия, наличие мест и&nbsp;расписание.'
    : 'Городской документ не&nbsp;содержит перечня занятий этой площадки. Уточни действующие группы, возрастные условия, наличие мест и&nbsp;расписание.';
  return page({contactClub:club,
    title:`${club.name}, ${districtName} район`,
    description:`${club.name}: ${club.address}. Адрес, направления и контакты площадки ${districtGenitive} района.`,
    base:'../../', className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/${districtSlug}.html">${districtName} район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(org.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2>${activityMarkup}${clubSupplement(club)}<p class="detail-muted">${activityCaution}</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Свяжись с&nbsp;площадкой или учреждением.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>Адрес и&nbsp;условия конкретного занятия проверь у&nbsp;организатора перед визитом.${club.note ? ` ${text(club.note)}` : ''}</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Сведения о&nbsp;площадке: <a href="${html(source)}" target="_blank" rel="noopener noreferrer">открытый источник</a>. Контакты: <a href="${html(org.site)}" target="_blank" rel="noopener noreferrer">${text(org.siteLabel || "сайт организатора")}</a>.</p></div></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2>${club.email ? `<p class="contact-phone"><span>Почта площадки</span><b><a href="mailto:${html(club.email)}">${text(club.email)}</a></b></p>` : org.email ? `<p class="contact-phone"><span>Почта учреждения</span><b><a href="mailto:${html(org.email)}">${text(org.email)}</a></b></p>` : ''}<div class="contact-actions"><a class="button button-primary" href="${html(['kurortny','petrodvortsovy'].includes(districtSlug) ? (club.officialUrl || org.site) : org.site)}" target="_blank" rel="noopener noreferrer">${text(['kurortny','petrodvortsovy'].includes(districtSlug) ? 'Страница площадки' : (org.siteLabel || "Сайт организатора"))} <span aria-hidden="true">↗</span></a></div><p class="contact-note">Перед визитом уточни место занятий и&nbsp;условия участия.</p>${clubLocationMarkup(club,districtSlug)}</div><a class="back-card" href="../../districts/${districtSlug}.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

await fs.mkdir(path.join(out,'districts'),{recursive:true});
await fs.mkdir(path.join(out,'directions'),{recursive:true});
await fs.mkdir(path.join(out,'activities'),{recursive:true});
await fs.mkdir(path.join(out,'clubs'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','admiralteysky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','vyborgsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kalininsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kirovsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kolpinsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','krasnogvardeysky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','krasnoselsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kronshtadtsky'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','kurortny'),{recursive:true});
await fs.mkdir(path.join(out,'clubs','moskovsky'),{recursive:true});
for (const slug of newDistrictSlugs) await fs.mkdir(path.join(out,'clubs',slug),{recursive:true});
await fs.mkdir(path.join(out,'assets'),{recursive:true});
await fs.writeFile(path.join(out,'index.html'),home);
await fs.writeFile(path.join(out,'directions','index.html'),directionsPage);
await fs.writeFile(path.join(out,'districts','index.html'),directory);
await fs.writeFile(path.join(out,'districts','vasileostrovsky.html'),vo);
await fs.writeFile(path.join(out,'districts','admiralteysky.html'),withDistrictMap(admiral,'admiralteysky'));
await fs.writeFile(path.join(out,'districts','vyborgsky.html'),withDistrictMap(vyborg,'vyborgsky'));
await fs.writeFile(path.join(out,'districts','kalininsky.html'),withDistrictMap(kalinin,'kalininsky'));
await fs.writeFile(path.join(out,'districts','kirovsky.html'),withDistrictMap(kirov,'kirovsky'));
await fs.writeFile(path.join(out,'districts','kolpinsky.html'),withDistrictMap(kolpino,'kolpinsky'));
await fs.writeFile(path.join(out,'districts','krasnogvardeysky.html'),withDistrictMap(krasnogvard,'krasnogvardeysky'));
await fs.writeFile(path.join(out,'districts','krasnoselsky.html'),withDistrictMap(krasnoselsky,'krasnoselsky'));
await fs.writeFile(path.join(out,'districts','kronshtadtsky.html'),withDistrictMap(kronshtadtsky,'kronshtadtsky'));
await fs.writeFile(path.join(out,'districts','kurortny.html'),withDistrictMap(kurortny,'kurortny'));
await fs.writeFile(path.join(out,'districts','moskovsky.html'),withDistrictMap(moskovsky,'moskovsky'));
for (const slug of newDistrictSlugs) await fs.writeFile(path.join(out,'districts',`${slug}.html`),withDistrictMap(newDistrictPages[slug],slug));
for (const district of districts.filter(item=>!catalogDistricts.has(item[1]))) await fs.writeFile(path.join(out,'districts',`${district[1]}.html`),otherDistrict(district));
for (const club of clubs) await fs.writeFile(path.join(out,'clubs',`${club.slug}.html`),clubDetail(club));
for (const config of morskoyDirectionConfigs) await fs.writeFile(path.join(out,'activities',`${config.slug}.html`),morskoyDirectionDetail(config));
for (const config of admiralteetsDirectionConfigs) await fs.writeFile(path.join(out,'activities',`${config.slug}.html`),admiralteetsDirectionDetail(config));
const specialActivitySlugs = new Set([
  ...morskoyDirectionConfigs.map(config => config.slug),
  ...admiralteetsDirectionConfigs.map(config => config.slug),
]);
const generatedActivityRoutes = [];
const prototypeActivities = path.join(root, 'prototype', 'site', 'activities');
await fs.mkdir(prototypeActivities, {recursive:true});
const admiralteetsPrototypeClub=admiralClubs.find(c=>c.slug==='klub-yunyh-moryakov-admiralteets');
for(const config of admiralteetsDirectionConfigs){
  const filename=path.join(prototypeActivities,`${config.slug}.html`);
  try{await fs.access(filename);}catch(error){if(error.code!=='ENOENT')throw error;await fs.writeFile(filename,catalogActivityPrototype(admiralteetsPrototypeClub,config.activity,admiralteetsPrototypeClub.activities.indexOf(config.activity)));}
}
for (const club of catalogClubs) for (const [index, activity] of club.activities.entries()) {
  const slug = activityPageSlug(club, activity, index);
  if (!slug) throw new Error(`Missing activity route: ${club.name}, ${activity}`);
  if (specialActivitySlugs.has(slug)) continue;
  if (generatedActivityRoutes.includes(slug)) throw new Error(`Duplicate activity route: ${slug}`);
  generatedActivityRoutes.push(slug);
  await fs.writeFile(path.join(out, 'activities', `${slug}.html`), catalogActivityDetail(club, activity, index));
  const prototypeFile = path.join(prototypeActivities, `${slug}.html`);
  if (process.env.REFRESH_CATALOG_PROTOTYPES === '1') {
    await fs.writeFile(prototypeFile, catalogActivityPrototype(club, activity, index));
  } else {
    try {
      await fs.access(prototypeFile);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await fs.writeFile(prototypeFile, catalogActivityPrototype(club, activity, index));
    }
  }
}
for (const club of admiralClubs) await fs.writeFile(path.join(out,'clubs','admiralteysky',`${club.slug}.html`),admiralClubDetail(club));
for (const club of vyborgClubs) await fs.writeFile(path.join(out,'clubs','vyborgsky',`${club.slug}.html`),vyborgClubDetail(club));
for (const club of kalininClubs) await fs.writeFile(path.join(out,'clubs','kalininsky',`${club.slug}.html`),kalininClubDetail(club));
for (const club of kirovClubs) await fs.writeFile(path.join(out,'clubs','kirovsky',`${club.slug}.html`),kirovClubDetail(club));
for (const club of kolpinoClubs) await fs.writeFile(path.join(out,'clubs','kolpinsky',`${club.slug}.html`),newDistrictClubDetail(club,'Колпинский','Колпинского','kolpinsky',club.sourceUrl || (club.organization === 'rovesnik' ? kolpinoSources.rovesnik : kolpinoSources.kolpinets)));
for (const club of krasnogvardClubs) await fs.writeFile(path.join(out,'clubs','krasnogvardeysky',`${club.slug}.html`),newDistrictClubDetail(club,'Красногвардейский','Красногвардейского','krasnogvardeysky',club.sourceUrl || krasnogvardSource));
for (const club of krasnoselskyClubs) await fs.writeFile(path.join(out,'clubs','krasnoselsky',`${club.slug}.html`),newDistrictClubDetail(club,'Красносельский','Красносельского','krasnoselsky',club.sourceUrl || krasnoselskyPdfSource));
for (const club of kronshtadtskyClubs) await fs.writeFile(path.join(out,'clubs','kronshtadtsky',`${club.slug}.html`),newDistrictClubDetail(club,'Кронштадтский','Кронштадтского','kronshtadtsky',kronshtadtskyPdfSource));
for (const club of kurortnyClubs) await fs.writeFile(path.join(out,'clubs','kurortny',`${club.slug}.html`),newDistrictClubDetail(club,'Курортный','Курортного','kurortny',club.sourceUrl??kurortnyPdfSources[club.organization]));
for (const club of moskovskyClubs) await fs.writeFile(path.join(out,'clubs','moskovsky',`${club.slug}.html`),newDistrictClubDetail(club,'Московский','Московского','moskovsky',club.organization === 'mpc' ? moskovskyPdfSource : pulkovetsPdfSource));
for (const slug of newDistrictSlugs) for (const club of newDistrictClubs[slug]) await fs.writeFile(path.join(out,'clubs',slug,`${club.slug}.html`),newDistrictClubDetail(club,newDistrictConfigs[slug].name,newDistrictConfigs[slug].genitive,slug,club.sourceUrl || (slug === 'pushkinsky' && club.organization === 'dm' ? newDistrictSources.pushkinskyDm : newDistrictSources[slug])));
const sitemapPaths = [
  '/',
  '/directions/index.html',
  '/districts/index.html',
  ...districts.filter(([, slug]) => catalogDistricts.has(slug)).map(([, slug]) => `/districts/${slug}.html`),
  ...clubs.map(club => `/clubs/${club.slug}.html`),
  ...morskoyDirectionConfigs.map(config => `/activities/${config.slug}.html`),
  ...admiralteetsDirectionConfigs.map(config => `/activities/${config.slug}.html`),
  ...generatedActivityRoutes.map(slug => `/activities/${slug}.html`),
  ...admiralClubs.map(club => `/clubs/admiralteysky/${club.slug}.html`),
  ...vyborgClubs.map(club => `/clubs/vyborgsky/${club.slug}.html`),
  ...kalininClubs.map(club => `/clubs/kalininsky/${club.slug}.html`),
  ...kirovClubs.map(club => `/clubs/kirovsky/${club.slug}.html`),
  ...kolpinoClubs.map(club => `/clubs/kolpinsky/${club.slug}.html`),
  ...krasnogvardClubs.map(club => `/clubs/krasnogvardeysky/${club.slug}.html`),
  ...krasnoselskyClubs.map(club => `/clubs/krasnoselsky/${club.slug}.html`),
  ...kronshtadtskyClubs.map(club => `/clubs/kronshtadtsky/${club.slug}.html`),
  ...kurortnyClubs.map(club => `/clubs/kurortny/${club.slug}.html`),
  ...moskovskyClubs.map(club => `/clubs/moskovsky/${club.slug}.html`),
  ...newDistrictSlugs.flatMap(slug => newDistrictClubs[slug].map(club => `/clubs/${slug}/${club.slug}.html`)),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map(route => `  <url><loc>https://young-russia.ru${route}</loc></url>`).join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(out,'sitemap.xml'),sitemap);
await fs.writeFile(path.join(out,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://young-russia.ru/sitemap.xml\n');
for (const asset of ['style.css','site.js','hero-youth.webp','hero-vasileostrovsky.webp','hero-admiralteysky.webp','hero-vyborgsky.webp','hero-kalininsky.webp','hero-kirovsky.webp','hero-kolpinsky.webp','hero-krasnogvardeysky.webp','hero-krasnoselsky.webp','hero-kronshtadtsky.webp','hero-kurortny.webp','hero-moskovsky.webp',...newDistrictSlugs.map(slug=>`hero-${slug}.webp`),'favicon.svg']) await fs.copyFile(path.join(root,'assets',asset),path.join(out,'assets',asset));
await fs.copyFile(path.join(root,'assets','style.css'),path.join(out,'assets',styleAsset));
await fs.copyFile(path.join(root,'assets','site.js'),path.join(out,'assets',scriptAsset));
console.log(`Built ${1+1+1+18+catalogClubs.length} HTML pages in ${out}`);
