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
const kolpinoSources = {
  kolpinets: 'https://www.spbdm.ru/upload/iblock/2f5/ta80j84xkf2ix3fqn56aju6z93jzjpfx/%D0%94%D0%9C%20%D0%9A%D0%BE%D0%BB%D0%BF%D0%B8%D0%BD%D0%B5%D1%86.pdf',
  rovesnik: 'https://www.spbdm.ru/upload/iblock/79f/v3qp6t9gqcaa1susuz350eartp4udj8k/%D0%A0%D0%BE%D0%B2%D0%B5%D1%81%D0%BD%D0%B8%D0%BA.pdf',
};
const kolpinoOrganizations = {
  kolpinets: {name:'Дом молодёжи «Колпинец»',address:'г. Колпино, Заводской пр., д. 10',phone:'246-43-22',email:'mail@dmk.spb.ru',site:'https://kolpinets.ru/'},
  rovesnik: {name:'МЦ «Ровесник»',address:'г. Колпино, ул. Танкистов, д. 28А',phone:'469-63-50',site:'https://spbgbu-rovesnik.ru/'},
};
const krasnogvardSource = 'https://pmcohta.ru/contacts';
const krasnogvardPdfSource = 'https://www.spbdm.ru/upload/iblock/e06/6xs92c2vtfocx1149b3gfygt7ypl0d2z/%D0%9F%D0%9C%D0%A6%20%D0%9E%D1%85%D1%82%D0%B0.pdf';
const krasnogvardOrganization = {name:'Молодёжный центр «Охта»',address:'Полюстровский пр., д. 3',phone:'498-84-27',email:'secretar@mcohta.ru',site:'https://pmcohta.ru/'};
const krasnoselskyPdfSource = 'https://www.spbdm.ru/upload/iblock/524/35qphtbcqyez2ov7ps7y8rp6jdm56ezp/%D0%9F%D0%9C%D0%A6%20%D0%9B%D0%B8%D0%B3%D0%BE%D0%B2%D0%BE.pdf';
const krasnoselskyCompassSource = 'https://www.gov.spb.ru/gov/terr/reg_krasnoselsk/news/314884/';
const krasnoselskyOrganization = {name:'ПМЦ «Лигово»',address:'ул. Чекистов, д. 28',phone:'8 (969) 729-32-20',email:'pmcligovo@mail.ru',site:'https://www.gov.spb.ru/gov/terr/reg_krasnoselsk/kultura-molodyozhnaya-politika/spb-gbu-podrostkovo-molodezhnyj-centr-ligovo/'};
const kronshtadtskyPdfSource = 'https://www.spbdm.ru/upload/iblock/637/y4cmgcterp1srclzgum486c8i7qnfd0c/%D0%9A%D0%94%D0%9C.pdf';
const kronshtadtskyOrganization = {name:'Кронштадтский Дворец молодёжи',address:'г. Кронштадт, Советская ул., д. 35, лит. А',phone:'311-22-14',email:'bastion.35@mail.ru',site:'https://kron-dm.ru/'};
const kurortnyPdfSources = {
  voshod:'https://www.spbdm.ru/upload/iblock/804/hdmmqnwzjh65tnqygjc16kx34vc6rql1/%D0%9F%D0%9C%D0%A6%20%D0%92%D0%BE%D1%81%D1%85%D0%BE%D0%B4.pdf',
  molodost:'https://www.spbdm.ru/upload/iblock/06f/vqldvvp2sa73sthp7ru3wwhj9o6je8by/%D0%9F%D0%9C%D0%A6%20%D0%9C%D0%BE%D0%BB%D0%BE%D0%B4%D0%BE%D1%81%D1%82%D1%8C.pdf',
  sniper:'https://www.spbdm.ru/upload/iblock/55e/56zw8a519ke1xn9kd7gomyhwyy355u8w/%D0%9F%D0%9C%D0%A6%20%D0%A1%D0%BD%D0%B0%D0%B9%D0%BF%D0%B5%D1%80.pdf',
};
const kurortnyOrganizations = {
  voshod:{name:'ПМЦ «Восход»',address:'г. Сестрорецк, Приморское ш., д. 286А',phone:'437-23-55',email:'sportvoshod@mail.ru',site:'https://xn--75-dlci3cau6a.xn--p1ai/'},
  molodost:{name:'ПМЦ «Молодость»',address:'пос. Песочный, ул. Карла Маркса, д. 57А',phone:'596-82-27',email:'molodostr@yandex.ru',site:'https://molodost.kurort.gov.spb.ru/'},
  sniper:{name:'ПМЦ «Снайпер»',address:'г. Зеленогорск, ул. Исполкомская, д. 5',phone:'433-51-52',email:'pmcsniper1111@mail.ru',site:'https://xn----8sbppmhlfke7c.xn--p1ai/'},
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
  petrodvortsovy:{pmc:{name:'ПМЦ Петродворцового района',address:'г. Петергоф, ул. Ботаническая, д. 4, корп. 3',phone:'246-24-52',email:'centr-dosug.2016@yandex.ru',site:newDistrictSources.petrodvortsovy,siteLabel:'Городской документ'}},
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
const translit = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
const slugify = (value) => [...value.toLowerCase()].map(char => translit[char] ?? char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
const admiralClubs = rawAdmiralClubs.map(club => ({...club, slug: slugify(club.name), districtCode:'admiralteysky', organizationInfo: admiralOrganizations[club.organization], organizationLabel: admiralOrganizations[club.organization]?.name ?? 'Подростково-молодёжный клуб'}));
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
  const line = club.activities.join(' ').toLowerCase();
  const result = [];
  if (/англий|немец|француз|япон|билингв|иностранн|язык|лингвист/.test(line)) result.push('languages');
  if (/спорт|бокс|борьб|самбо|айкидо|дзюдо|джиу|фитнес|йога|теннис|хоккей|атлет|пауэр|бодибилд|футбол|шахмат|бильярд|гребл|парус|капоэйр|дартс|офп|самооборон|городош|скалолаз|туризм|тхэквондо|армрестлинг|акробат|гимнастик|волейбол|стрельб|кик.бокс|аэробик|рукопаш/.test(line)) result.push('sport');
  if (/тан|хореограф|брейк|зумб|чирлидинг|контемп|хиллс|джаз-модерн|джаз-фанк|хип-хоп/.test(line)) result.push('dance');
  if (/изо|рисован|живопис|лепк|флорист|арт|дпи|кукл|творч|вышив|фотограф|дизайн|керамик|мастерск|швейн|роспис|батик|график|декор|акварел|фото|костюм|фелтинг/.test(line)) result.push('creative');
  if (/вокал|хор|гитар|театр|актёр|песн|музык|кино|оратор|звук|барабан|инструментальн|цирков/.test(line)) result.push('stage');
  if (/волонт|добровол|добро\.центр|скаут|проект|коворкинг|мероприят|подкаст|настольные игры|семь|общени|разговорн|квест|медиа|квн|реконструк|социальн|психолог|поисковик|книжный клуб|киноклуб/.test(line)) result.push('community');
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
  const photoPreload = heroPhoto ? `<link rel="preload" as="image" href="${base}assets/${heroPhoto.file}" fetchpriority="high">` : '';
  const pageBody = heroPhoto ? body.replace('class="subhero vo-subhero"><div class="container"', `class="subhero vo-subhero district-photo-hero"><img class="district-hero-image" src="${base}assets/${heroPhoto.file}" alt="" aria-hidden="true" loading="eager" fetchpriority="high" decoding="async" onload="this.classList.add('is-loaded')"><div class="container"`) : body;
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

const catalogClubs = [...clubs, ...admiralClubs, ...vyborgClubs, ...kalininClubs, ...kirovClubs, ...kolpinoClubs, ...krasnogvardClubs, ...krasnoselskyClubs, ...kronshtadtskyClubs, ...kurortnyClubs, ...moskovskyClubs, ...newDistrictSlugs.flatMap(slug => newDistrictClubs[slug])];
const venueCountLabel = count => `${count} ${Math.floor(count/10)%10===1 ? "площадок" : count%10===1 ? "площадка" : count%10>=2 && count%10<=4 ? "площадки" : "площадок"}`;
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
  body:`<section class="hero"><div class="container hero-grid"><div class="hero-copy"><div class="kicker"><span class="kicker-dot"></span> Подростково-молодёжные клубы Петербурга</div><h1>Найди своё <em>занятие</em> в&nbsp;Петербурге</h1><p class="hero-lead">Спорт, творчество, языки и&nbsp;общение рядом с&nbsp;домом. Выбери то, что тебе интересно, и&nbsp;узнай, куда прийти.</p><div class="hero-actions"><a class="button button-primary" href="districts/index.html">Выбрать район <span aria-hidden="true">↗</span></a><a class="text-link" href="#directions">Смотреть направления <span aria-hidden="true">↓</span></a></div><div class="hero-facts"><span><b>18</b> районов города</span><span><b>${catalogClubs.length}</b> площадки в&nbsp;восемнадцати каталогах</span></div></div><div class="hero-photo"><img src="assets/hero-youth.webp" width="1600" height="900" alt="Иллюстрация: молодые люди общаются за игрой в настольный теннис"><div class="photo-sticker"><span class="sticker-spark" aria-hidden="true">✳</span><b>Пробуй новое</b><small>рядом с&nbsp;домом</small></div><span class="photo-caption">Иллюстративное изображение</span></div></div></section>
  <section class="intro-strip"><div class="container strip-inner"><p><strong>14-35&nbsp;лет</strong><span>Возможности для&nbsp;молодёжи</span></p><p><strong>Бесплатно</strong><span>Направления, указанные в&nbsp;каталоге</span></p><p><strong>Рядом</strong><span>Начни поиск со&nbsp;своего района</span></p></div></section>
  <section class="section directions" id="directions"><div class="container"><div class="section-heading"><div><p class="section-kicker">Выбирай по&nbsp;интересу</p><h2>Чем хочется заняться?</h2></div><p>Выбери направление, чтобы увидеть районы, где в&nbsp;каталоге есть подходящие занятия.</p></div><div class="topic-grid">
  <a class="topic-card topic-languages" href="districts/index.html?topic=languages"><span class="topic-icon" aria-hidden="true">Aa</span><h3>Языки</h3><p>Разговорные клубы и&nbsp;новые знакомства</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-sport" href="districts/index.html?topic=sport"><span class="topic-icon" aria-hidden="true">◉</span><h3>Спорт</h3><p>От&nbsp;шахмат и&nbsp;йоги до&nbsp;единоборств</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-creative" href="districts/index.html?topic=creative"><span class="topic-icon" aria-hidden="true">✳</span><h3>Творчество</h3><p>Рисование, фотография, дизайн</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-stage" href="districts/index.html?topic=stage"><span class="topic-icon" aria-hidden="true">♫</span><h3>Сцена и&nbsp;музыка</h3><p>Театр, вокал и&nbsp;гитара</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  <a class="topic-card topic-community" href="districts/index.html?topic=community"><span class="topic-icon" aria-hidden="true">↗</span><h3>Общение</h3><p>Клубы, проекты и&nbsp;волонтёрство</p><span class="topic-arrow" aria-hidden="true">↗</span></a>
  </div></div></section>
  <section class="section island-section"><div class="container"><div class="island-banner"><div><p class="section-kicker">Каталоги уже открыты</p><h2>Начни с&nbsp;восемнадцати районов</h2><p>Уже открыты каталоги восемнадцати районов. Ищи площадку по&nbsp;названию, адресу и&nbsp;направлению.</p><div class="hero-actions"><a class="button button-light" href="districts/vasileostrovsky.html">Василеостровский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/admiralteysky.html">Адмиралтейский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/vyborgsky.html">Выборгский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kalininsky.html">Калининский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kirovsky.html">Кировский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kolpinsky.html">Колпинский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/krasnogvardeysky.html">Красногвардейский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/krasnoselsky.html">Красносельский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kronshtadtsky.html">Кронштадтский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/kurortny.html">Курортный <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/moskovsky.html">Московский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/nevsky.html">Невский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/petrogradsky.html">Петроградский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/petrodvortsovy.html">Петродворцовый <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/primorsky.html">Приморский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/pushkinsky.html">Пушкинский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/frunzensky.html">Фрунзенский <span aria-hidden="true">↗</span></a><a class="button button-light" href="districts/tsentralny.html">Центральный <span aria-hidden="true">↗</span></a></div></div><div class="island-mark" aria-hidden="true"><span>ПМК</span><i></i><i></i><i></i></div></div><div class="featured-head"><h3>Куда можно заглянуть</h3><span>Примеры из&nbsp;каталогов</span></div><div class="featured-grid">${featured.map(club=>clubCard(club,'',true)).join('')}</div></div></section>
  <section class="section districts-section" id="districts"><div class="container"><div class="section-heading"><div><p class="section-kicker">Клубы рядом</p><h2>Выбери свой район</h2></div><p>Страница есть для&nbsp;каждого района Петербурга. Каталоги восемнадцати районов уже открыты.</p></div><div class="district-home-grid">${districts.map((district,index)=>`<a class="district-pill${catalogDistricts.has(district[1])?' district-pill-ready':''}${district[1]==='vyborgsky'?' needs-review':''}" href="${districtLink(district)}"${district[1]==='vyborgsky'?` title="${html(vyborgReviewTooltip)}"`:''}><span class="district-number">${String(index+1).padStart(2,'0')}</span><span>${text(district[0])}</span>${district[1]==='vyborgsky'?'<span class="district-pill-review">Данные уточняются</span>':''}<span class="district-pill-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><a class="all-districts-link" href="districts/index.html">Открыть список районов <span aria-hidden="true">→</span></a></div></section>
  <section class="section how-section" id="how"><div class="container"><div class="section-heading"><div><p class="section-kicker">Просто начать</p><h2>Как попасть в&nbsp;клуб</h2></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Найди интерес</h3><p>Выбери занятие или район, который тебе подходит.</p></div><div class="step"><span>02</span><h3>Открой страницу клуба</h3><p>Посмотри адрес и&nbsp;доступные направления.</p></div><div class="step"><span>03</span><h3>Уточни детали</h3><p>Спроси у&nbsp;организаторов про расписание, возраст и&nbsp;запись.</p></div></div><div class="how-bottom"><p>Программы и&nbsp;набор могут меняться. Перед посещением проверь актуальные условия на&nbsp;странице клуба.</p><a href="districts/index.html">Открыть каталоги <span aria-hidden="true">↗</span></a></div></div></section>`
});

const directory = page({
  title:'Районы Петербурга',
  description:'Выберите район Санкт-Петербурга и найдите подростково-молодёжные клубы.',
  base:'../',active:'districts',className:'directory-page',
  body:`<section class="subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><span>Районы</span></nav><p class="section-kicker">Каталог по&nbsp;городу</p><h1>Районы Петербурга</h1><p class="subhero-lead">Выбери район и&nbsp;узнай, какие клубы и&nbsp;занятия уже есть в&nbsp;каталоге.</p></div></section><section class="section directory-section"><div class="container"><div class="directory-toolbar"><label for="district-search">Найти район</label><div class="search-box"><span aria-hidden="true">⌕</span><input id="district-search" type="search" placeholder="Например, Адмиралтейский" autocomplete="off"></div><p><strong>18&nbsp;районов</strong><br>Открыто 18&nbsp;каталогов</p></div><div class="directory-grid" id="district-list">${districts.map((district,index)=>`<a class="directory-card${catalogDistricts.has(district[1])?' ready':''}${district[1]==='vyborgsky'?' needs-review':''}" href="${district[1]}.html" data-search="${html(district[0].toLowerCase())}" data-topics="${districtTopics[district[1]]??''}"${district[1]==='vyborgsky'?` title="${html(vyborgReviewTooltip)}"`:''}><span class="directory-number">${String(index+1).padStart(2,'0')}</span><span class="directory-name">${text(district[0])}</span><span class="directory-status">${district[1]==='vyborgsky'?'9&nbsp;площадок · данные уточняются':district[1]==='kalininsky'?'21&nbsp;площадка':district[1]==='kirovsky'?'19&nbsp;площадок':district[1]==='kolpinsky'?'15&nbsp;площадок':district[1]==='krasnogvardeysky'?'22&nbsp;площадки':district[1]==='krasnoselsky'?'17&nbsp;площадок':district[1]==='kronshtadtsky'?'3&nbsp;площадки':district[1]==='kurortny'?'9&nbsp;площадок':district[1]==='moskovsky'?'21&nbsp;площадка':newDistrictClubs[district[1]]?venueCountLabel(newDistrictClubs[district[1]].length).replace(' ', '&nbsp;'):catalogDistricts.has(district[1])?'Каталог открыт':'Страница района'}</span><span class="directory-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><p class="directory-topic-note" id="district-topic-note" hidden><span id="district-topic-note-text"></span> <a href="index.html">Сбросить направление</a></p><p class="empty-state" id="district-empty" hidden>По&nbsp;этому запросу каталогов не&nbsp;нашлось. Очисти поиск или выбери другое направление.</p></div></section>`
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
  <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Контакты учреждений</p><h2>К кому обратиться</h2></div></div><div class="organization-grid">${Object.values(vyborgOrganizations).map(org=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone"><a href="${telHref(org.phone)}">${text(org.phone)}</a></p><div class="organization-links"><a href="${html(org.vk)}" target="_blank" rel="noopener noreferrer">ВКонтакте <span aria-hidden="true">↗</span></a><a href="mailto:${html(org.email)}">${text(org.email)}</a></div></article>`).join('')}</div>
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

function newDistrictPage({name, genitive, className, clubs, lead, organizations, sourceNote, credit = ''}) {
  const countNoun = Math.floor(clubs.length / 10) % 10 === 1 ? 'площадок' : clubs.length % 10 === 1 ? 'площадка' : clubs.length % 10 >= 2 && clubs.length % 10 <= 4 ? 'площадки' : 'площадок';
  const organizationFilters = organizations.length > 1
    ? `<h3 class="filter-label">Учреждение</h3><div class="topic-filters" role="group" aria-label="Фильтр по учреждению">${[['all','Все учреждения'],...organizations.map(([key,org])=>[key,org.name])].map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-org-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div>`
    : '';
  return page({
    title:`Клубы ${genitive} района`,
    description:`${clubs.length} молодёжных площадок ${genitive} района Санкт-Петербурга: направления, адреса и контакты.`,
    base:'../', active:'districts', className,
    body:`<section class="subhero vo-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../index.html">Главная</a><span>/</span><a href="index.html">Районы</a><span>/</span><span>${name}</span></nav><div class="vo-hero-grid"><div><p class="section-kicker">Молодёжные площадки района</p><h1>${name} район</h1><p class="subhero-lead">${lead}</p><a class="button button-primary" href="#clubs">Смотреть площадки <span aria-hidden="true">↓</span></a></div><div class="vo-stats" aria-label="Состав каталога"><div><b>${clubs.length}</b><span>${countNoun} в&nbsp;каталоге</span></div><p>Сведения сверены по&nbsp;открытым источникам. Набор, расписание и&nbsp;условия уточняй у&nbsp;организатора.</p></div></div></div></section>
    <section class="section catalog-section" id="clubs"><div class="container"><div class="catalog-heading"><div><p class="section-kicker">Каталог района</p><h2>Найди своё место</h2><p>Ищи по&nbsp;названию, адресу или направлению.</p></div><p id="result-count" aria-live="polite">Показано ${clubs.length} ${countNoun}</p></div><div class="catalog-tools"><div class="search-box"><span aria-hidden="true">⌕</span><label class="sr-only" for="club-search">Поиск по площадкам</label><input id="club-search" type="search" placeholder="Название, занятие или адрес" autocomplete="off"></div>${organizationFilters}<h3 class="filter-label">Направление</h3><div class="topic-filters" role="group" aria-label="Фильтр по направлениям">${Object.entries(topicNames).map(([key,label])=>`<button type="button" class="filter-chip${key==='all'?' active':''}" data-filter="${key}" aria-pressed="${key==='all'?'true':'false'}">${text(label)}</button>`).join('')}</div></div><div class="catalog-heading catalog-subheading"><h2>Клубы и&nbsp;пространства</h2></div><div class="club-grid" id="club-grid">${clubs.map(club=>clubCard(club)).join('')}</div><p class="empty-state" id="club-empty" hidden>Подходящих площадок не&nbsp;найдено. Попробуй другой запрос.</p>
    <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Связаться с учреждением</p><h2>К кому обратиться</h2></div></div><div class="organization-grid">${organizations.map(([,org])=>`<article class="organization-card"><p class="section-kicker">Контакты учреждения</p><h3>${text(org.name)}</h3><p>${text(org.address)}</p><p class="organization-phone"><a href="${telHref(org.phone)}">${text(org.phone)}</a></p><div class="organization-links">${org.email?`<a href="mailto:${html(org.email)}">${text(org.email)}</a>`:''}<a href="${html(org.site)}" target="_blank" rel="noopener noreferrer">${text(org.siteLabel || "Сайт учреждения")} <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div>
    <div class="catalog-heading catalog-subheading"><div><p class="section-kicker">Перед посещением</p><h2>Уточни условия</h2></div></div><div class="steps-grid"><div class="step"><span>01</span><h3>Возраст</h3><p>Спроси, для&nbsp;кого открыта группа.</p></div><div class="step"><span>02</span><h3>Расписание</h3><p>Проверь дни, время и&nbsp;наличие мест.</p></div><div class="step"><span>03</span><h3>Запись</h3><p>Узнай, как присоединиться.</p></div></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div>${sourceNote}<p>${credit}</p></div></div></div></section>`,
  });
}

const kolpino = newDistrictPage({
  name:'Колпинский',genitive:'Колпинского',className:'kolpino-page',clubs:kolpinoClubs,
  lead:'Клубы Дома молодёжи «Колпинец» и&nbsp;МЦ «Ровесник» в&nbsp;Колпине, Металлострое и&nbsp;Понтонном.',
  organizations:Object.entries(kolpinoOrganizations),
  sourceNote:`<p>Состав и&nbsp;направления: <a href="${kolpinoSources.kolpinets}" target="_blank" rel="noopener noreferrer">документ Дома молодёжи «Колпинец»</a> и&nbsp;<a href="${kolpinoSources.rovesnik}" target="_blank" rel="noopener noreferrer">документ «Ровесника»</a> в&nbsp;городской базе от&nbsp;01.06.2026. Действующий состав «Ровесника» дополнительно сверен с&nbsp;<a href="https://spbgbu-rovesnik.ru/" target="_blank" rel="noopener noreferrer">сайтом учреждения</a>. Часть адресов в&nbsp;старых районных списках расходится с&nbsp;документами: смотри примечания на&nbsp;страницах клубов.</p>`,
  credit:'Фото КДЦ «Ижорский» и&nbsp;моста: <a href="https://commons.wikimedia.org/wiki/File:DK_Izhorsky_and_bridge_(Kolpino).jpg" target="_blank" rel="noopener noreferrer">Андрей Крижановский, Wikimedia Commons</a>, общественное достояние. Изображение кадрировано.',
});

const krasnogvard = newDistrictPage({
  name:'Красногвардейский',genitive:'Красногвардейского',className:'krasnogvard-page',clubs:krasnogvardClubs,
  lead:'Клубы и&nbsp;молодёжные пространства МЦ «Охта». Выбери площадку по&nbsp;адресу или интересу.',
  organizations:[['okhta',krasnogvardOrganization]],
  sourceNote:`<p>Состав, названия и&nbsp;адреса сверены по&nbsp;<a href="${krasnogvardSource}" target="_blank" rel="noopener noreferrer">действующей странице контактов МЦ «Охта»</a>. Примеры бесплатных направлений взяты из&nbsp;<a href="${krasnogvardPdfSource}" target="_blank" rel="noopener noreferrer">городского PDF</a>, загруженного 01.06.2026. В&nbsp;нём 21 площадка, а&nbsp;в&nbsp;текущем списке центра 22: для&nbsp;пространства «4К» направления уточняются.</p>`,
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
  sourceNote:`<p>Состав, адреса, контакты и&nbsp;общие бесплатные направления взяты из&nbsp;<a href="${kronshtadtskyPdfSource}" target="_blank" rel="noopener noreferrer">городского документа</a>, загруженного 01.06.2026. Два клуба также перечислены на&nbsp;<a href="${kronshtadtskyOrganization.site}" target="_blank" rel="noopener noreferrer">сайте Дворца молодёжи</a>. Старый районный список содержит больше клубов; их&nbsp;текущий статус здесь не&nbsp;подтверждён.</p>`,
});

const kurortny = newDistrictPage({
  name:'Курортный',genitive:'Курортного',className:'kurortny-page',clubs:kurortnyClubs,
  lead:'Площадки «Восхода», «Молодости» и&nbsp;«Снайпера» в&nbsp;Сестрорецке, Песочном и&nbsp;Зеленогорске.',
  organizations:Object.entries(kurortnyOrganizations),
  sourceNote:`<p>Адреса и&nbsp;направления: документы <a href="${kurortnyPdfSources.voshod}" target="_blank" rel="noopener noreferrer">«Восхода»</a>, <a href="${kurortnyPdfSources.molodost}" target="_blank" rel="noopener noreferrer">«Молодости»</a> и&nbsp;<a href="${kurortnyPdfSources.sniper}" target="_blank" rel="noopener noreferrer">«Снайпера»</a> в&nbsp;городской базе, загруженные 01.06.2026. Два зала «Восхода» по&nbsp;адресу Приморское шоссе, 280&nbsp;объединены в&nbsp;одну карточку. Для&nbsp;площадки «Снайпера» на&nbsp;Привокзальной в&nbsp;документе указано ноль бесплатных групп; доступность уточняй у&nbsp;центра.</p>`,
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
  petrodvortsovy:{name:'Петродворцовый',genitive:'Петродворцового',lead:'Площадки ПМЦ в&nbsp;Петергофе, Ломоносове и&nbsp;Стрельне: от&nbsp;творчества до&nbsp;спорта.',sourceNote:`<p>Состав, адреса и&nbsp;бесплатные направления взяты из&nbsp;<a href="${newDistrictSources.petrodvortsovy}" target="_blank" rel="noopener noreferrer">городского документа ПМЦ</a>, загруженного 01.06.2026. <a href="https://www.gov.spb.ru/gov/terr/reg_petrodv/news/304460/" target="_blank" rel="noopener noreferrer">Администрация района</a> также сообщает о&nbsp;десяти клубах. Для&nbsp;«Галса» и&nbsp;«Стрелы» в&nbsp;документе указан один адрес; место занятий уточняй у&nbsp;центра.</p>`},
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

function newDistrictClubDetail(club, districtName, districtGenitive, districtSlug, source) {
  const org = club.organizationInfo;
  const phone = club.phone || org.phone;
  const phoneHref = telHref(phone);
  const activityMarkup = club.activities.length
    ? `<div class="activity-list">${club.activities.map(item => `<span>${text(item)}</span>`).join('')}</div>`
    : '<p>Направления этой площадки уточняются. Свяжись с&nbsp;центром перед визитом.</p>';
  const activityCaution = club.activities.length
    ? 'Направления приведены по&nbsp;открытым материалам учреждения. Уточни действующие группы, возрастные условия, наличие мест и&nbsp;расписание.'
    : 'Городской документ не&nbsp;содержит перечня занятий этой площадки. Уточни действующие группы, возрастные условия, наличие мест и&nbsp;расписание.';
  return page({
    title:`${club.name}, ${districtName} район`,
    description:`${club.name}: ${club.address}. Адрес, направления и контакты площадки ${districtGenitive} района.`,
    base:'../../', className:'club-detail-page',
    body:`<section class="subhero detail-subhero"><div class="container"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="../../index.html">Главная</a><span>/</span><a href="../../districts/${districtSlug}.html">${districtName} район</a><span>/</span><span>${text(club.name)}</span></nav><p class="section-kicker">${text(club.type)} · ${text(org.name)}</p><h1>${text(club.name)}</h1><p class="subhero-lead">${text(club.address)}</p></div></section>
    <section class="section detail-content"><div class="container detail-grid"><div class="detail-main"><div class="detail-block"><p class="section-kicker">Чем заняться</p><h2>Направления площадки</h2>${activityMarkup}<p class="detail-muted">${activityCaution}</p></div><div class="detail-block"><p class="section-kicker">Перед посещением</p><h2>Как присоединиться</h2><ol class="detail-steps"><li>Свяжись с&nbsp;площадкой или учреждением.</li><li>Уточни, идёт&nbsp;ли набор на&nbsp;интересующее направление.</li><li>Спроси про возраст, расписание и&nbsp;порядок записи.</li></ol></div><div class="detail-alert"><strong>Сведения уточняются</strong><p>Адрес и&nbsp;условия конкретного занятия проверь у&nbsp;организатора перед визитом.${club.note ? ` ${text(club.note)}` : ''}</p></div><div class="catalog-source"><span aria-hidden="true">ⓘ</span><div><p>Сведения о&nbsp;площадке: <a href="${html(source)}" target="_blank" rel="noopener noreferrer">открытый источник</a>. Контакты: <a href="${html(org.site)}" target="_blank" rel="noopener noreferrer">${text(org.siteLabel || "сайт организатора")}</a>.</p></div></div></div><aside class="detail-aside"><div class="contact-panel"><span class="status-label">Адрес и&nbsp;контакты</span><h2>${text(club.name)}</h2><p class="contact-address">${text(club.address)}</p><p class="contact-phone"><span>${club.phone ? 'Телефон площадки' : 'Телефон учреждения'}</span><b><a href="${phoneHref}">${text(phone)}</a></b></p>${club.email ? `<p class="contact-phone"><span>Почта площадки</span><b><a href="mailto:${html(club.email)}">${text(club.email)}</a></b></p>` : org.email ? `<p class="contact-phone"><span>Почта учреждения</span><b><a href="mailto:${html(org.email)}">${text(org.email)}</a></b></p>` : ''}<div class="contact-actions"><a class="button button-primary" href="${html(org.site)}" target="_blank" rel="noopener noreferrer">${text(org.siteLabel || "Сайт организатора")} <span aria-hidden="true">↗</span></a></div><p class="contact-note">Перед визитом уточни место занятий и&nbsp;условия участия.</p></div><a class="back-card" href="../../districts/${districtSlug}.html">← Ко&nbsp;всем площадкам района</a></aside></div></section>`
  });
}

await fs.mkdir(path.join(out,'districts'),{recursive:true});
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
await fs.writeFile(path.join(out,'districts','index.html'),directory);
await fs.writeFile(path.join(out,'districts','vasileostrovsky.html'),vo);
await fs.writeFile(path.join(out,'districts','admiralteysky.html'),admiral);
await fs.writeFile(path.join(out,'districts','vyborgsky.html'),vyborg);
await fs.writeFile(path.join(out,'districts','kalininsky.html'),kalinin);
await fs.writeFile(path.join(out,'districts','kirovsky.html'),kirov);
await fs.writeFile(path.join(out,'districts','kolpinsky.html'),kolpino);
await fs.writeFile(path.join(out,'districts','krasnogvardeysky.html'),krasnogvard);
await fs.writeFile(path.join(out,'districts','krasnoselsky.html'),krasnoselsky);
await fs.writeFile(path.join(out,'districts','kronshtadtsky.html'),kronshtadtsky);
await fs.writeFile(path.join(out,'districts','kurortny.html'),kurortny);
await fs.writeFile(path.join(out,'districts','moskovsky.html'),moskovsky);
for (const slug of newDistrictSlugs) await fs.writeFile(path.join(out,'districts',`${slug}.html`),newDistrictPages[slug]);
for (const district of districts.filter(item=>!catalogDistricts.has(item[1]))) await fs.writeFile(path.join(out,'districts',`${district[1]}.html`),otherDistrict(district));
for (const club of clubs) await fs.writeFile(path.join(out,'clubs',`${club.slug}.html`),clubDetail(club));
for (const club of admiralClubs) await fs.writeFile(path.join(out,'clubs','admiralteysky',`${club.slug}.html`),admiralClubDetail(club));
for (const club of vyborgClubs) await fs.writeFile(path.join(out,'clubs','vyborgsky',`${club.slug}.html`),vyborgClubDetail(club));
for (const club of kalininClubs) await fs.writeFile(path.join(out,'clubs','kalininsky',`${club.slug}.html`),kalininClubDetail(club));
for (const club of kirovClubs) await fs.writeFile(path.join(out,'clubs','kirovsky',`${club.slug}.html`),kirovClubDetail(club));
for (const club of kolpinoClubs) await fs.writeFile(path.join(out,'clubs','kolpinsky',`${club.slug}.html`),newDistrictClubDetail(club,'Колпинский','Колпинского','kolpinsky',club.organization === 'rovesnik' ? kolpinoSources.rovesnik : kolpinoSources.kolpinets));
for (const club of krasnogvardClubs) await fs.writeFile(path.join(out,'clubs','krasnogvardeysky',`${club.slug}.html`),newDistrictClubDetail(club,'Красногвардейский','Красногвардейского','krasnogvardeysky',club.name === '4К' ? krasnogvardSource : krasnogvardPdfSource));
for (const club of krasnoselskyClubs) await fs.writeFile(path.join(out,'clubs','krasnoselsky',`${club.slug}.html`),newDistrictClubDetail(club,'Красносельский','Красносельского','krasnoselsky',club.sourceUrl || krasnoselskyPdfSource));
for (const club of kronshtadtskyClubs) await fs.writeFile(path.join(out,'clubs','kronshtadtsky',`${club.slug}.html`),newDistrictClubDetail(club,'Кронштадтский','Кронштадтского','kronshtadtsky',kronshtadtskyPdfSource));
for (const club of kurortnyClubs) await fs.writeFile(path.join(out,'clubs','kurortny',`${club.slug}.html`),newDistrictClubDetail(club,'Курортный','Курортного','kurortny',kurortnyPdfSources[club.organization]));
for (const club of moskovskyClubs) await fs.writeFile(path.join(out,'clubs','moskovsky',`${club.slug}.html`),newDistrictClubDetail(club,'Московский','Московского','moskovsky',club.organization === 'mpc' ? moskovskyPdfSource : pulkovetsPdfSource));
for (const slug of newDistrictSlugs) for (const club of newDistrictClubs[slug]) await fs.writeFile(path.join(out,'clubs',slug,`${club.slug}.html`),newDistrictClubDetail(club,newDistrictConfigs[slug].name,newDistrictConfigs[slug].genitive,slug,club.sourceUrl || (slug === 'pushkinsky' && club.organization === 'dm' ? newDistrictSources.pushkinskyDm : newDistrictSources[slug])));
const sitemapPaths = [
  '/',
  '/districts/index.html',
  ...districts.filter(([, slug]) => catalogDistricts.has(slug)).map(([, slug]) => `/districts/${slug}.html`),
  ...clubs.map(club => `/clubs/${club.slug}.html`),
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
console.log(`Built ${1+1+18+catalogClubs.length} HTML pages in ${out}`);
