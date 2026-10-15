import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const files = (await fs.readdir(dataDir)).filter(name => /^clubs-.*\.json$/.test(name)).sort();
const addresses = new Map();
let clubCount = 0;

for (const file of files) {
  const district = file === 'clubs-vo.json' ? 'vasileostrovsky' : file.slice('clubs-'.length, -'.json'.length);
  const clubs = JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8'));
  if (!Array.isArray(clubs)) throw new Error(`${file}: expected an array`);

  for (const [index, club] of clubs.entries()) {
    if (!club.name || !club.address) throw new Error(`${file} #${index + 1}: club name or address is missing`);
    clubCount++;
    const address = club.address.trim();
    const key = `${district}\0${address.toLocaleLowerCase('ru')}`;
    let record = addresses.get(key);
    if (!record) {
      const searchAddress = address.replace(/\s*\([^)]*\)/g, '').trim();
      const houseMatch = searchAddress.match(/^(.*?),\s*д\.\s*([^,]+)/i);
      const street = (houseMatch?.[1] ?? searchAddress)
        .replace(/(^|[\s,])ул\./gi, '$1улица')
        .replace(/(^|[\s,])пр\./gi, '$1проспект')
        .replace(/(^|[\s,])ш\./gi, '$1шоссе')
        .replace(/(^|[\s,])пер\./gi, '$1переулок')
        .replace(/(^|[\s,])наб\./gi, '$1набережная')
        .replace(/(^|[\s,])пл\./gi, '$1площадь')
        .replace(/(^|[\s,])б-р\b/gi, '$1бульвар');
      const localityMatch = street.match(/^(?:г\.|пос\.)\s*([^,]+),\s*(.+)$/i);
      const place = localityMatch ? `${localityMatch[2]}, ${localityMatch[1]}` : street;
      const review = [];
      if (!/(?:^|[\s,])д\.|(?:^|[\s,])дом(?:[\s,]|$)/i.test(searchAddress)) review.push('Нет номера дома');
      if (address !== searchAddress) review.push('Есть уточнение о входе');
      if (/(?:^|[\s,])д\.\s*\d+\s*[-–]\s*\d+/i.test(searchAddress)) review.push('Диапазон домов');
      if (/(?:^|[\s,])д\.\s*\d+\s*\/\s*\d+/i.test(searchAddress)) review.push('Двойной номер дома');
      if (/(?:^|[\s,])(?:корп\.|к\.|лит\.)/i.test(searchAddress)) review.push('Корпус или литера');
      if (address.includes(';')) review.push('Указано несколько адресов');
      record = {
        id: createHash('sha256').update(key).digest('hex').slice(0, 12),
        district,
        address,
        query: houseMatch
          ? `${houseMatch[2].trim()}, ${place}, ${localityMatch ? '' : 'Санкт-Петербург, '}Россия`
          : `${place}, ${localityMatch ? '' : 'Санкт-Петербург, '}Россия`,
        review,
        clubs: [],
      };
      addresses.set(key, record);
    }
    record.clubs.push({ name: club.name, source: `data/${file}`, index });
  }
}

const records = [...addresses.values()].sort((a, b) => a.district.localeCompare(b.district) || a.address.localeCompare(b.address, 'ru'));
const output = {
  description: 'Адреса клубов для проверки и поиска координат. Координаты здесь пока не указаны.',
  clubCount,
  addressCount: records.length,
  addresses: records,
};
const target = path.join(dataDir, 'map-addresses.json');
await fs.writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Prepared ${clubCount} clubs at ${records.length} unique addresses; ${records.filter(record => record.review.length).length} addresses need extra review.`);
