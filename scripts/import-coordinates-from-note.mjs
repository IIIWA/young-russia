import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceArgument = process.argv.find(argument => argument.startsWith('--source='))?.slice('--source='.length);
const source = sourceArgument ? path.resolve(root, sourceArgument) : path.join(root, 'YoungRussiaOBS/Задачи/Координаты клубов — ввод 2026-10-22.md');
const target = path.join(root, 'data/manual-club-coordinates.json');
const apply = process.argv.includes('--apply');
const districtCodes = new Map([
  ['Адмиралтейский', 'admiralteysky'], ['Василеостровский', 'vasileostrovsky'],
  ['Выборгский', 'vyborgsky'], ['Калининский', 'kalininsky'],
  ['Кировский', 'kirovsky'], ['Колпинский', 'kolpinsky'],
  ['Красногвардейский', 'krasnogvardeysky'], ['Красносельский', 'krasnoselsky'],
  ['Кронштадтский', 'kronshtadtsky'], ['Курортный', 'kurortny'],
  ['Московский', 'moskovsky'], ['Невский', 'nevsky'],
  ['Петроградский', 'petrogradsky'], ['Петродворцовый', 'petrodvortsovy'],
  ['Приморский', 'primorsky'], ['Пушкинский', 'pushkinsky'],
  ['Фрунзенский', 'frunzensky'], ['Центральный', 'tsentralny'],
]);
const bareName = raw => {
  let name = String(raw).trim();
  const quoted = name.match(/^(.*?)\s*[«"“]([^«»"“”]+)[»"”]\s*$/);
  if (quoted) name = quoted[2].trim();
  name = name.replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
  name = name.replace(/^(ПМК|ПМЦ|МПЦ|ОПМК|РПЦ|ПМДЦ|ДМ|МПК|ВПК)\s+/i, '');
  if (/^[а-яё]/.test(name)) name = name[0].toUpperCase() + name.slice(1);
  return name;
};
const withCity = address => /^Санкт-Петербург\b/.test(address) ? address : `Санкт-Петербург, ${address}`;
const normal = value => String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();

const [note, addresses, manual, existingCoordinates] = await Promise.all([
  fs.readFile(source, 'utf8'),
  fs.readFile(path.join(root, 'data/map-addresses.json'), 'utf8').then(JSON.parse),
  fs.readFile(target, 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'data/club-coordinates.json'), 'utf8').then(JSON.parse),
]);
const priorCandidates = new Map(existingCoordinates.addresses.flatMap(address =>
  address.clubCoordinates.map(point => [`${address.id}|${point.clubName}`, point.coordinates])));
const distanceMeters = (a, b) => {
  const radians = degrees => degrees * Math.PI / 180;
  const dLat = radians(a.latitude - b.latitude);
  const dLon = radians(a.longitude - b.longitude);
  const greatCircle = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(12742000 * Math.asin(Math.sqrt(greatCircle)));
};
const index = new Map();
for (const address of addresses.addresses) {
  for (const club of address.clubs) {
    const key = `${address.district}|${normal(bareName(club.name))}|${normal(withCity(address.address))}`;
    if (index.has(key)) throw new Error(`Duplicate catalog key: ${key}`);
    index.set(key, { address, club });
  }
}

const lines = note.split(/\r?\n/);
let district = '';
const rows = [];
for (let i = 0; i < lines.length; i += 1) {
  const heading = lines[i].match(/^## (.+?) район/);
  if (heading) {
    district = districtCodes.get(heading[1]);
    if (!district) throw new Error(`Unknown district on line ${i + 1}: ${heading[1]}`);
    continue;
  }
  if (lines[i].trim() !== '```' || lines[i + 2]?.trim() !== '```') continue;
  const label = lines[i + 1] ?? '';
  const dash = label.indexOf(' — ');
  if (dash < 0) throw new Error(`Missing club/address delimiter on line ${i + 2}`);
  const name = label.slice(0, dash).trim();
  const location = label.slice(dash + 3).trim();
  const chunk = [];
  for (let j = i + 3; j < lines.length; j += 1) {
    if (lines[j].trim() === '```' || /^#{1,2} /.test(lines[j])) break;
    chunk.push(lines[j]);
  }
  const value = chunk.map(line => line.replace(/^\s*Координаты:\s*/i, '').trim())
    .filter(Boolean).join(' ').replace(/\bclipboard\b/gi, '').replace(/\s+/g, ' ').trim();
  rows.push({ district, name, location, value, line: i + 2 });
  i += 2;
}
const expectedRows = Number(note.match(/В файле (\d+) клубов из/)?.[1]);
if (!expectedRows || rows.length !== expectedRows) throw new Error(`Expected ${expectedRows} source rows, found ${rows.length}`);

const summary = { sourceRows: rows.length, blank: 0, noCoordinates: 0, valid: 0, alreadyPresent: 0, added: 0, newNames: [], repairedLinks: 0, distantCandidates: [], problems: [] };
const seen = new Set();
for (const row of rows) {
  const key = `${row.district}|${normal(row.name)}|${normal(row.location)}`;
  if (seen.has(key)) throw new Error(`Duplicate source row: ${key}`);
  seen.add(key);
  const match = index.get(key);
  if (!match) {
    summary.problems.push({ line: row.line, name: row.name, problem: 'Клуб или адрес не найден в каталоге' });
    continue;
  }
  if (!row.value) { summary.blank += 1; continue; }
  if (/^(?:нет(?:\s|,|$)|точных координат нет)/i.test(row.value)) { summary.noCoordinates += 1; continue; }
  const repairedValue = row.value.replace(/^ttps:\/\/yandex\.ru\/maps\/-\//, 'https://yandex.ru/maps/-/');
  if (repairedValue !== row.value) summary.repairedLinks += 1;
  const urls = [...repairedValue.matchAll(/https:\/\/yandex\.ru\/maps\/-\/[^\s)]+/g)].map(item => item[0]);
  const points = [...repairedValue.matchAll(/(?<!\d)(\d{2}\.\d{5,})\s*[,;]\s*(\d{2}\.\d{5,})(?!\d)/g)];
  const isNevskyCenter = row.district === 'nevsky' && row.name === 'Молодёжный центр' && row.location.includes('Бабушкина, д. 42, корп. 4А');
  // The note lists two separate organizations at building 42. Only the first is near catalog building 4A.
  if (isNevskyCenter && (urls.length !== 2 || points.length !== 2 || !urls[0].endsWith('/CXRvm0JX') || !urls[1].endsWith('/CXRvqQ3X'))) {
    throw new Error(`Changed source evidence for Молодёжный центр at line ${row.line}`);
  }
  if ((!isNevskyCenter && urls.length !== 1) || (!isNevskyCenter && points.length !== 1)) {
    summary.problems.push({ line: row.line, name: row.name, problem: 'Нужна ровно одна ссылка Яндекс Карт и одна пара координат', value: row.value });
    continue;
  }
  const latitude = Number(points[0][1]);
  const longitude = Number(points[0][2]);
  if (latitude < 59.1 || latitude > 60.5 || longitude < 28.5 || longitude > 31.8) {
    summary.problems.push({ line: row.line, name: row.name, problem: 'Точка вне Петербурга', latitude, longitude });
    continue;
  }
  summary.valid += 1;
  const { address, club } = match;
  const prior = manual.overrides[address.id]?.points?.find(point => point.clubName === club.name);
  if (prior) {
    if (prior.latitude === latitude && prior.longitude === longitude) summary.alreadyPresent += 1;
    else summary.problems.push({ line: row.line, name: row.name, problem: 'Другая точка уже есть в ручном реестре', prior, proposed: { latitude, longitude, referenceUrl: urls[0] } });
    continue;
  }
  const candidate = priorCandidates.get(`${address.id}|${club.name}`);
  const displacement = candidate ? distanceMeters(candidate, { latitude, longitude }) : 0;
  if (displacement > 1000) summary.distantCandidates.push({ line: row.line, label: `${row.name} — ${row.location}`, proposed: { latitude, longitude, referenceUrl: urls[0] }, candidate, distanceMeters: displacement });
  manual.overrides[address.id] ??= { points: [] };
  const point = { clubName: club.name, latitude, longitude, referenceUrl: urls[0] };
  if (isNevskyCenter) {
    point.precision = 'approximate';
    point.locationNote = 'В каталоге ул. Бабушкина, д. 42, корп. 4А; в Яндекс Картах у выбранной точки указан корпус 4. Вторая точка из заметки относится к корпусу 1 и не использована.';
  }
  if (displacement > 1000) {
    point.precision = 'approximate';
    point.locationNote = `Точка из заметки расходится с прежним автоматическим кандидатом OpenStreetMap на ${displacement} м; адрес и точку нужно проверить вручную.`;
  }
  manual.overrides[address.id].points.push(point);
  summary.added += 1;
  summary.newNames.push(`${row.name} (${row.district})`);
}
if (apply && summary.problems.length) throw new Error(`Import stopped: ${JSON.stringify(summary.problems)}`);
if (apply) await fs.writeFile(target, `${JSON.stringify(manual, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, applied: apply }, null, 2));
