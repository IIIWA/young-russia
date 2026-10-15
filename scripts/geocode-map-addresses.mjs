import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// One-off preparation only. See https://operations.osmfoundation.org/policies/nominatim/.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(await fs.readFile(path.join(root, 'data', 'map-addresses.json'), 'utf8'));
const target = path.join(root, 'data', 'map-geocodes.json');
const temp = `${target}.tmp`;
const maxRequestsArg = process.argv.find(arg => arg.startsWith('--max-requests='));
const maxRequests = maxRequestsArg ? Number(maxRequestsArg.split('=')[1]) : Infinity;
const districtArg = process.argv.find(arg => arg.startsWith('--district='));
const districtFilter = districtArg?.split('=')[1];
const idArg = process.argv.find(arg => arg.startsWith('--id='));
const idFilter = idArg?.split('=')[1];
if (!(maxRequests > 0)) throw new Error('--max-requests must be positive');

let output;
try {
  output = JSON.parse(await fs.readFile(target, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  output = {
    source: 'OpenStreetMap Nominatim',
    attribution: '© OpenStreetMap contributors',
    license: 'https://www.openstreetmap.org/copyright',
    policy: 'https://operations.osmfoundation.org/policies/nominatim/',
    addressCount: source.addressCount,
    results: {},
  };
}
if (output.addressCount !== source.addressCount) throw new Error('Address manifest changed; review cache before continuing');

async function save() {
  await fs.writeFile(temp, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await fs.rename(temp, target);
}

let requested = 0;
for (const address of source.addresses) {
  if (districtFilter && address.district !== districtFilter) continue;
  if (idFilter && address.id !== idFilter) continue;
  const cached = output.results[address.id];
  if (cached?.query === address.query) continue;
  const previous = cached?.previousQueries?.find(entry => entry.query === address.query);
  if (previous) {
    output.results[address.id] = {
      ...previous,
      previousQueries: [...cached.previousQueries.filter(entry => entry.query !== address.query), {
        query: cached.query, checkedAt: cached.checkedAt, candidates: cached.candidates,
      }],
    };
    await save();
    continue;
  }
  if (requested >= maxRequests) break;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({
    q: address.query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '3',
    countrycodes: 'ru',
  });
  const started = Date.now();
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YoungRussiaMapPrep/1.0 (+https://young-russia.ru/)',
      Referer: 'https://young-russia.ru/',
    },
  });
  if (!response.ok) throw new Error(`Nominatim returned HTTP ${response.status} for address ${address.id}; stopped without retry`);
  const found = await response.json();
  if (!Array.isArray(found)) throw new Error(`Unexpected Nominatim response for address ${address.id}`);

  output.results[address.id] = {
    query: address.query,
    checkedAt: new Date().toISOString(),
    previousQueries: cached ? [...(cached.previousQueries ?? []), { query: cached.query, checkedAt: cached.checkedAt, candidates: cached.candidates }] : [],
    candidates: found.map(candidate => ({
      latitude: Number(candidate.lat),
      longitude: Number(candidate.lon),
      displayName: candidate.display_name,
      addresstype: candidate.addresstype,
      type: candidate.type,
      osmType: candidate.osm_type,
      osmId: candidate.osm_id,
      boundingbox: candidate.boundingbox,
    })),
  };
  await save();
  requested++;
  if (requested === 1 || requested % 25 === 0 || requested === source.addressCount) {
    console.log(`${Object.keys(output.results).length}/${source.addressCount} addresses cached; ${requested} requested this run`);
  }
  const delay = 1250 - (Date.now() - started);
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
}

const results = Object.values(output.results);
console.log(`Done: ${results.length}/${source.addressCount}; ${results.filter(result => result.candidates.length === 0).length} without candidates.`);
