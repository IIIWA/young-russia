import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const addresses = JSON.parse(await fs.readFile(path.join(dataDir, 'map-addresses.json'), 'utf8'));
const geocodes = JSON.parse(await fs.readFile(path.join(dataDir, 'map-geocodes.json'), 'utf8'));
const manualCoordinates = JSON.parse(await fs.readFile(path.join(dataDir, 'manual-club-coordinates.json'), 'utf8')).overrides;
const knownAddressIds = new Set(addresses.addresses.map(address => address.id));
for (const id of Object.keys(manualCoordinates)) if (!knownAddressIds.has(id)) throw new Error(`Unknown manual coordinate id: ${id}`);
const normalize = value => String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/[^\p{L}\p{N}]/gu, '');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const stopwords = new Set(['улица', 'проспект', 'переулок', 'площадь', 'шоссе', 'набережная', 'бульвар', 'линия', 'проезд', 'санктпетербург', 'россия']);
const inRegion = candidate => candidate.latitude > 59.1 && candidate.latitude < 60.5 && candidate.longitude > 28.5 && candidate.longitude < 31.8 && candidate.displayName.includes('Санкт-Петербург');

function matchesHouse(candidate, address) {
  const match = address.match(/(?:^|[\s,])д\.\s*([^,; ()]+)/i);
  if (!match) return false;
  const house = normalize(match[1]);
  return candidate.displayName.split(',').slice(0, 4).some(part => normalize(part) === house);
}

function matchesStreet(candidate, query) {
  const parts = query.split(',');
  const street = parts[1] ?? parts[0];
  const tokens = street.toLocaleLowerCase('ru').replaceAll('ё', 'е').match(/[\p{L}\p{N}-]+/gu) ?? [];
  const distinctive = tokens.map(normalize).filter(token => token.length >= 4 && !stopwords.has(token));
  const display = normalize(candidate.displayName);
  return distinctive.length > 0 && distinctive.every(token => display.includes(token));
}

const records = addresses.addresses.map(address => {
  const result = geocodes.results[address.id];
  const manualPoints = manualCoordinates[address.id]?.points ?? [];
  // A user-supplied point can cover a new address before the optional OSM cache is refreshed.
  if ((!result || result.query !== address.query) && manualPoints.length !== address.clubs.length) {
    throw new Error(`Missing current geocode for ${address.id}`);
  }
  if (!Array.isArray(manualPoints)) throw new Error(`Invalid manual points for ${address.id}`);
  const manualByClub = new Map();
  for (const point of manualPoints) {
    const locations = [point, ...(point.additionalPoints ?? [])];
    if (!address.clubs.some(club => club.name === point.clubName) || manualByClub.has(point.clubName) || locations.some(location => !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || location.latitude < 59.1 || location.latitude > 60.5 || location.longitude < 28.5 || location.longitude > 31.8 || !/^https:\/\/yandex\.ru\/maps\//.test(location.referenceUrl)) || new Set(locations.map(location => `${location.latitude},${location.longitude}`)).size !== locations.length) {
      throw new Error(`Invalid manual coordinates for ${address.id}: ${point.clubName}`);
    }
    manualByClub.set(point.clubName, point);
  }
  const candidate = result?.query === address.query ? result.candidates.find(inRegion) ?? result.candidates[0] ?? null : null;
  const reasons = [...address.review];
  const pendingClubs = address.clubs.filter(club => !manualByClub.has(club.name));
  let status;
  if (manualPoints.length && !pendingClubs.length) {
    status = 'user_provided';
    reasons.length = 0;
  } else if (manualPoints.length) {
    status = 'partially_user_provided';
  } else if (!candidate) {
    status = 'not_found';
  } else if (!inRegion(candidate)) {
    status = 'wrong_region';
    reasons.push('Точка вне Санкт-Петербурга');
  } else {
    if (candidate.addresstype !== 'building') reasons.push('Совпадение не уровня здания');
    if (!matchesHouse(candidate, address.address)) reasons.push('Номер дома не подтверждён');
    if (!matchesStreet(candidate, address.query)) reasons.push('Название улицы не подтверждено');
    status = reasons.length ? 'needs_review' : 'likely_match';
  }
  const candidateCoordinates = candidate && inRegion(candidate) ? { latitude: candidate.latitude, longitude: candidate.longitude } : null;
  const sameManualPoint = manualPoints.length === address.clubs.length && manualPoints.every(point => point.latitude === manualPoints[0].latitude && point.longitude === manualPoints[0].longitude);
  const sharedCoordinates = manualPoints.length ? sameManualPoint ? {latitude: manualPoints[0].latitude, longitude: manualPoints[0].longitude} : null : candidateCoordinates;
  return {
    id: address.id,
    district: address.district,
    address: address.address,
    clubs: address.clubs,
    pendingClubs,
    status,
    reasons,
    coordinates: sharedCoordinates,
    coordinateSource: manualPoints.length ? sameManualPoint ? 'user_provided' : 'per_club' : 'OpenStreetMap Nominatim',
    referenceUrl: sameManualPoint ? manualPoints[0].referenceUrl : null,
    mapLabel: sameManualPoint ? manualPoints[0].mapLabel ?? null : null,
    clubCoordinates: address.clubs.map(club => {
      const point = manualByClub.get(club.name);
      return {
        clubName: club.name,
        coordinates: point ? {latitude: point.latitude, longitude: point.longitude} : candidateCoordinates,
        source: point ? 'user_provided' : candidateCoordinates ? 'OpenStreetMap Nominatim candidate' : null,
        referenceUrl: point?.referenceUrl ?? null,
        mapLabel: point?.mapLabel ?? null,
        precision: point?.precision ?? null,
        locationNote: point?.locationNote ?? null,
        ...(point?.additionalPoints?.length ? { additionalPoints: point.additionalPoints } : {}),
      };
    }),
    match: candidate ? {
      displayName: candidate.displayName,
      type: candidate.addresstype,
      osmUrl: `https://www.openstreetmap.org/${candidate.osmType}/${candidate.osmId}`,
    } : null,
  };
});

const summary = Object.fromEntries(['user_provided', 'partially_user_provided', 'likely_match', 'needs_review', 'not_found', 'wrong_region'].map(status => [status, records.filter(record => record.status === status).length]));
const userProvidedClubCount = records.flatMap(record => record.clubCoordinates).filter(club => club.source === 'user_provided').length;
const output = {
  description: 'Координаты клубов. clubCoordinates содержит точку для каждого клуба. user_provided предоставлены пользователем; likely_match означает автоматическую проверку дома и улицы без ручного подтверждения.',
  source: geocodes.source,
  attribution: geocodes.attribution,
  license: geocodes.license,
  clubCount: addresses.clubCount,
  addressCount: addresses.addressCount,
  userProvidedClubCount,
  summary,
  addresses: records,
};
await writeGeneratedFile(path.join(dataDir, 'club-coordinates.json'), `${JSON.stringify(output, null, 2)}\n`);

const problemRows = records.filter(record => !['user_provided', 'likely_match'].includes(record.status));
const report = [
  '# Проверка координат клубов',
  '',
  `Всего: ${addresses.clubCount} клубов, ${addresses.addressCount} уникальных адреса.`,
  `Координаты предоставлены для ${userProvidedClubCount} клубов. Полностью закрыты: ${summary.user_provided} адресов; частично: ${summary.partially_user_provided}. Предварительно совпали с домом и улицей: ${summary.likely_match}. Требуют проверки: ${summary.needs_review}. Не найдены: ${summary.not_found}. Найдены вне Петербурга: ${summary.wrong_region}.`,
  '',
  `Источник автоматических кандидатов: ${geocodes.attribution} (${geocodes.license}).`,
  '',
  '## Адреса для ручной проверки',
  '',
  ...problemRows.map(record => `- **${record.district} · ${record.address}** — **Клубы для проверки:** ${record.pendingClubs.map(club => `**${club.name}**`).join('; ')}. ${record.status}; ${record.reasons.join(', ') || 'совпадений нет'}${record.match ? `; [совпадение](${record.match.osmUrl})` : ''}.`),
  '',
].join('\n');
await writeGeneratedFile(path.join(dataDir, 'map-geocoding-report.md'), report);

const statusNames = {partially_user_provided:'Часть клубов без подтверждённой точки', needs_review:'Требует проверки', not_found:'Адрес не найден', wrong_region:'Точка вне Петербурга'};
const htmlRows = problemRows.map(record => `<li class="entry" id="${escapeHtml(record.id)}">
  <div class="address"><span class="district">${escapeHtml(record.district)}</span> ${escapeHtml(record.address)}</div>
  <div class="clubs">${record.pendingClubs.map(club => `<strong class="club-name">${escapeHtml(club.name)}</strong>`).join('<span class="separator">, </span>')}</div>
  <div class="detail"><span class="status">${statusNames[record.status]}</span>${record.reasons.length ? `: ${escapeHtml(record.reasons.join(', '))}` : ''}${record.match ? `. <a href="${escapeHtml(record.match.osmUrl)}" target="_blank" rel="noopener noreferrer">Открыть точку в&nbsp;OpenStreetMap</a>` : ''}</div>
</li>`).join('\n');
const htmlReport = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Проверка координат клубов</title>
<style>
  :root { color-scheme: light; font-family: Arial, sans-serif; color: #242b28; background: #f6f8f5; }
  * { box-sizing: border-box; }
  body { max-width: 1100px; margin: 0 auto; padding: 32px 20px 64px; }
  h1, h2 { text-wrap: balance; }
  p, li { text-wrap: pretty; }
  h1 { margin: 0 0 14px; font-size: clamp(28px, 4vw, 40px); }
  h2 { margin: 32px 0 16px; font-size: 23px; }
  p { line-height: 1.55; }
  a { color: #12664b; }
  ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
  .entry { background: #fff; border: 1px solid #dfe7df; border-radius: 12px; padding: 16px 20px; line-height: 1.5; }
  .address { font-weight: 700; }
  .district { color: #62716a; font-size: 13px; font-weight: 400; margin-right: 8px; }
  .clubs { margin-top: 6px; }
  .club-name { color: #147047; font-weight: 800; }
  .detail { margin-top: 6px; color: #525d57; font-size: 14px; }
  .status { font-weight: 700; }
  @media print { :root { background: #fff; } body { padding: 0; } .entry { break-inside: avoid; } }
</style>
</head>
<body>
<main>
<h1>Проверка координат клубов</h1>
<p>Всего: ${addresses.clubCount} клуба, ${addresses.addressCount} уникальных адреса. Координаты предоставлены для&nbsp;${userProvidedClubCount} клуба. Полностью закрыты: ${summary.user_provided} адресов, частично: ${summary.partially_user_provided}. Предварительно совпали с&nbsp;домом и&nbsp;улицей: ${summary.likely_match}. Требуют проверки: ${summary.needs_review}. Не&nbsp;найдены: ${summary.not_found}. Найдены вне Петербурга: ${summary.wrong_region}.</p>
<h2>Адреса для&nbsp;ручной проверки</h2>
<ol>${htmlRows}</ol>
<p>Источник автоматических кандидатов: <a href="${escapeHtml(geocodes.license)}">${escapeHtml(geocodes.attribution)}</a>.</p>
</main>
</body>
</html>
`;
await writeGeneratedFile(path.join(dataDir, 'map-geocoding-report.html'), htmlReport);
console.log(JSON.stringify(summary));
