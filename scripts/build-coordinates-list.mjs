import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// [название района, файл каталога, код района в club-coordinates.json]
const districts = [
  ['Адмиралтейский', 'admiralteysky', 'admiralteysky'],
  ['Василеостровский', 'vo', 'vasileostrovsky'],
  ['Выборгский', 'vyborgsky', 'vyborgsky'],
  ['Калининский', 'kalininsky', 'kalininsky'],
  ['Кировский', 'kirovsky', 'kirovsky'],
  ['Колпинский', 'kolpinsky', 'kolpinsky'],
  ['Красногвардейский', 'krasnogvardeysky', 'krasnogvardeysky'],
  ['Красносельский', 'krasnoselsky', 'krasnoselsky'],
  ['Кронштадтский', 'kronshtadtsky', 'kronshtadtsky'],
  ['Курортный', 'kurortny', 'kurortny'],
  ['Московский', 'moskovsky', 'moskovsky'],
  ['Невский', 'nevsky', 'nevsky'],
  ['Петроградский', 'petrogradsky', 'petrogradsky'],
  ['Петродворцовый', 'petrodvortsovy', 'petrodvortsovy'],
  ['Приморский', 'primorsky', 'primorsky'],
  ['Пушкинский', 'pushkinsky', 'pushkinsky'],
  ['Фрунзенский', 'frunzensky', 'frunzensky'],
  ['Центральный', 'tsentralny', 'tsentralny'],
];

const quotedName = /^(.*?)\s*[«"“]([^«»"“”]+)[»"”]\s*$/;
const servicePrefix = /^(ПМК|ПМЦ|МПЦ|ОПМК|РПЦ|ПМДЦ|ДМ|МПК|ВПК)\s+/i;

export function bareName(rawName) {
  let value = String(rawName).trim();
  const match = value.match(quotedName);
  if (match) value = match[2].trim();
  value = value.replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
  value = value.replace(servicePrefix, '');
  if (/^[а-яё]/.test(value)) value = value[0].toUpperCase() + value.slice(1);
  return value;
}

function withCity(address) {
  return /^Санкт-Петербург\b/.test(address) ? address : `Санкт-Петербург, ${address}`;
}

const coordinates = JSON.parse(await fs.readFile(path.join(root, 'data/club-coordinates.json'), 'utf8'));
const pointIndex = new Map();
for (const address of coordinates.addresses ?? []) {
  for (const point of address.clubCoordinates ?? []) {
    const key = `${address.district}|${point.clubName}`;
    if (!pointIndex.has(key)) pointIndex.set(key, []);
    pointIndex.get(key).push(point);
  }
}
const pointsOf = (district, name) => (pointIndex.get(`${district}|${name}`) ?? []).filter(point => point.coordinates && typeof point.coordinates.latitude === 'number');
const hasConfirmedPoint = (district, name) => pointsOf(district, name).some(point => point.source === 'user_provided' && point.precision !== 'approximate');

const target = path.join(root, 'YoungRussiaOBS', 'Задачи', 'Координаты клубов.md');

// Сохраняем то, что пользователь уже вписал в поле «Координаты:», чтобы пересборка не стирала ручную работу.
async function readSavedCoordinates() {
  let text = '';
  try {
    text = await fs.readFile(target, 'utf8');
  } catch {
    return new Map();
  }
  const lines = text.split('\n');
  const saved = new Map();
  let district = '';
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^## (.+?) район/);
    if (heading) {
      district = heading[1].trim();
      continue;
    }
    if (lines[i].trim() !== '```' || lines[i + 2]?.trim() !== '```') continue;
    const content = lines[i + 1] ?? '';
    const dash = content.indexOf(' — ');
    if (dash < 0) continue;
    const name = content.slice(0, dash).trim();
    const chunk = [];
    for (let j = i + 3; j < lines.length; j += 1) {
      const line = lines[j];
      if (line.trim() === '```' || /^#{1,2} /.test(line)) break;
      chunk.push(line);
    }
    const value = chunk.map(line => line.replace(/^\s*Координаты:\s*/i, '').trim()).filter(Boolean).join(' ').replace(/\bclipboard\b/gi, '').replace(/\s+/g, ' ').trim();
    const key = `${district}|${name}`;
    if (!saved.has(key)) saved.set(key, []);
    saved.get(key).push(value);
    i += 2;
  }
  return saved;
}

const savedCoordinates = await readSavedCoordinates();

const summary = { total: 0, confirmed: 0, listed: 0, provisional: 0, filled: 0, withoutPoint: [] };
const sections = [];
for (const [label, file, code] of districts) {
  const clubs = JSON.parse(await fs.readFile(path.join(root, `data/clubs-${file}.json`), 'utf8'));
  const pending = [];
  for (const club of clubs) {
    summary.total += 1;
    if (hasConfirmedPoint(code, club.name)) {
      summary.confirmed += 1;
      continue;
    }
    summary.listed += 1;
    if (pointsOf(code, club.name).length) summary.provisional += 1;
    else summary.withoutPoint.push(`${bareName(club.name)} (${label})`);
    pending.push(club);
  }
  if (pending.length) {
    const rows = pending.flatMap(club => {
      const name = bareName(club.name);
      const saved = savedCoordinates.get(`${label}|${name}`)?.shift() ?? '';
      if (saved) summary.filled += 1;
      return ['```', `${name} — ${withCity(club.address)}`, '```', '', `Координаты: ${saved}`, '', '', ''];
    });
    sections.push([`## ${label} район — ${pending.length}`, '', ...rows].join('\n'));
  }
}

const head = [
  '# Координаты клубов', '',
  `Обновлено 22.10.2026. В файле ${summary.listed} клубов из ${summary.total}, у которых координаты ещё не уточнены: у ${summary.provisional} точка предварительная, у ${summary.withoutPoint.length} точки нет совсем. Остальные ${summary.confirmed} клубов с пользовательскими точками без пометки приблизительности сюда не попали. В [списке адресов](../../docs/address-checklist-2026-10-16.html) зелёным отмечены все полученные точки, в том числе приблизительные; адрес и вход требуют отдельной проверки.`, '',
  'Как пользоваться: у каждой строки справа сверху есть кнопка копирования — она копирует «название — адрес» целиком. Вставь строку в Яндекс Карты, найди точку и впиши под строкой широту и долготу или ссылку на точку — в строке «Координаты:» или сразу под ней. Заполненные поля сохраняются при пересборке.', '',
  'Данные: `data/club-coordinates.json` (точки OpenStreetMap и подтверждения пользователя) и `data/clubs-*.json` (названия и адреса). Файл пересобирается командой `npm run data:coords`.', '',
  ...(summary.withoutPoint.length ? [`Без точки на карте совсем (${summary.withoutPoint.length}): ${summary.withoutPoint.join('; ')}.`, ''] : []),
].join('\n');

await writeGeneratedFile(target, `${head}\n${sections.join('\n')}`);
console.log(JSON.stringify({ total: summary.total, confirmed: summary.confirmed, listed: summary.listed, provisional: summary.provisional, filled: summary.filled, withoutPoint: summary.withoutPoint.length }));
