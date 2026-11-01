import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const districts = [
  ['admiralteysky','Адмиралтейский',1114193], ['vasileostrovsky','Василеостровский',1114252],
  ['vyborgsky','Выборгский',1114354], ['kalininsky','Калининский',1114806],
  ['kirovsky','Кировский',1114809], ['kolpinsky','Колпинский',337424],
  ['krasnogvardeysky','Красногвардейский',1114895], ['krasnoselsky','Красносельский',363103],
  ['kronshtadtsky','Кронштадтский',1115082], ['kurortny','Курортный',1115366],
  ['moskovsky','Московский',338636], ['nevsky','Невский',368287],
  ['petrogradsky','Петроградский',1114905], ['petrodvortsovy','Петродворцовый',367375],
  ['primorsky','Приморский',1115367], ['pushkinsky','Пушкинский',338635],
  ['frunzensky','Фрунзенский',369514], ['tsentralny','Центральный',1114902],
];
const cache = 'outputs/S-99/osm-districts-raw.json';
const endpoint = 'https://overpass-api.de/api/interpreter';
await fs.mkdir('outputs/S-99', { recursive: true });
if (process.argv.includes('--download')) {
  const query = `[out:json][timeout:55];rel(id:${districts.map(x=>x[2]).join(',')});out geom;`;
  const response = await fetch(`${endpoint}?${new URLSearchParams({data:query})}`, {
    headers:{'User-Agent':'YoungRussia district-map preparation; https://young-russia.ru/'}, signal:AbortSignal.timeout(65000) });
  assert(response.ok, `Overpass HTTP ${response.status}`);
  const body = await response.text();
  const parsed = JSON.parse(body);
  assert.equal(parsed.elements.length, 18);
  assert(!parsed.remark, parsed.remark);
  await fs.writeFile(cache, body);
}
const raw = await fs.readFile(cache, 'utf8');
const data = JSON.parse(raw);
const same = (a,b) => a[0] === b[0] && a[1] === b[1];
const squaredDistance = (p,a,b) => {
  const dx=(b[0]-a[0])*.5, dy=b[1]-a[1];
  const t=dx || dy ? Math.max(0,Math.min(1,((p[0]-a[0])*.5*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))) : 0;
  return ((p[0]-a[0])*.5-t*dx)**2+(p[1]-a[1]-t*dy)**2;
};
// Simplify each shared way once, retaining both endpoints and a maximum ~2 m deviation.
function simplify(points) {
  if (points.length < 3) return points;
  let max=0, at=0;
  for(let i=1;i<points.length-1;i++){const d=squaredDistance(points[i],points[0],points.at(-1));if(d>max){max=d;at=i;}}
  if(max <= .000018**2) return [points[0],points.at(-1)];
  return [...simplify(points.slice(0,at+1)).slice(0,-1),...simplify(points.slice(at))];
}
const ways = new Map();
function rings(members) {
  const pending=members.map(member=>{
    assert.equal(member.type,'way',`Unexpected boundary member ${member.type}`);
    assert(member.geometry?.length>1,`Missing way ${member.ref}`);
    if(!ways.has(member.ref)) ways.set(member.ref,simplify(member.geometry.map(p=>[p.lon,p.lat])));
    return ways.get(member.ref).slice();
  });
  const result=[];
  while(pending.length){
    let ring=pending.shift();
    while(!same(ring[0],ring.at(-1))){
      const i=pending.findIndex(w=>same(w[0],ring.at(-1))||same(w.at(-1),ring.at(-1)));
      assert(i>=0,'Boundary has an open ring');
      let part=pending.splice(i,1)[0];if(!same(part[0],ring.at(-1)))part=part.reverse();
      ring.push(...part.slice(1));
    }
    assert(ring.length>=4,'Degenerate boundary ring');result.push(ring);
  }
  return result;
}
const inside=(p,ring)=>{
  let hit=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }return hit;
};
const area=ring=>Math.abs(ring.slice(1).reduce((sum,p,i)=>sum+ring[i][0]*p[1]-p[0]*ring[i][1],0));
function labelPoint(polygon){
  const ring=polygon[0],xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
  let bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],best=null,score=-1;
  for(let pass=0;pass<5;pass++){
    const dx=(bounds[2]-bounds[0])/10,dy=(bounds[3]-bounds[1])/10;
    for(let x=0;x<=10;x++)for(let y=0;y<=10;y++){
      const p=[bounds[0]+x*dx,bounds[1]+y*dy];
      if(!inside(p,ring)||polygon.slice(1).some(h=>inside(p,h)))continue;
      const d=Math.min(...polygon.flatMap(r=>r.slice(1).map((v,i)=>squaredDistance(p,r[i],v))));
      if(d>score){score=d;best=p;}
    }
    assert(best,'No interior label position');bounds=[best[0]-dx,best[1]-dy,best[0]+dx,best[1]+dy];
  }return best.map(v=>Number(v.toFixed(6)));
}
const features=districts.map(([slug,name,id])=>{
  const relation=data.elements.find(x=>x.id===id);
  assert.equal(relation?.tags.admin_level,'5');assert.equal(relation.tags.boundary,'administrative');
  assert.equal(relation.tags['name:ru']||relation.tags.name,`${name} район`);
  const boundaryMembers=relation.members.filter(m=>m.role==='outer'||m.role==='inner'||m.role==='');
  const outer=rings(boundaryMembers.filter(m=>m.role!=='inner'));
  const holes=rings(boundaryMembers.filter(m=>m.role==='inner'));
  const polygons=outer.map(r=>[r]);
  for(const hole of holes){const polygon=polygons.find(p=>inside(hole[0],p[0]));assert(polygon,'Unassigned inner ring');polygon.push(hole);}
  const largest=polygons.slice().sort((a,b)=>area(b[0])-area(a[0]))[0];
  return {type:'Feature',id:slug,properties:{slug,name,osmRelation:id,sourceUrl:`https://www.openstreetmap.org/relation/${id}`,labelPoint:labelPoint(largest)},geometry:{type:'MultiPolygon',coordinates:polygons}};
});
const geojson={type:'FeatureCollection',source:'© OpenStreetMap contributors',license:'ODbL-1.0',sourceTimestamp:data.osm3s.timestamp_osm_base,features};
const output=JSON.stringify(geojson);
await fs.writeFile('assets/district-boundaries.geojson',output+'\n');
const evidence={createdAt:new Date().toISOString(),source:endpoint,relationRegistry:'https://wiki.openstreetmap.org/wiki/RU:Санкт-Петербург/Районы',
  sourceTimestamp:geojson.sourceTimestamp,rawSha256:createHash('sha256').update(raw).digest('hex'),license:'https://www.openstreetmap.org/copyright',
  transform:'Shared ways simplified independently to ~2 m maximum deviation; endpoints, closed rings, islands and holes preserved; GeoJSON longitude/latitude.',
  districts:features.map(f=>({slug:f.id,name:f.properties.name,sourceUrl:f.properties.sourceUrl,polygons:f.geometry.coordinates.length,holes:f.geometry.coordinates.reduce((s,p)=>s+p.length-1,0)})),bytes:Buffer.byteLength(output),
  sha256:createHash('sha256').update(output+'\n').digest('hex')};
await fs.writeFile('outputs/S-99/boundary-source.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({districts:features.length,bytes:evidence.bytes,sourceTimestamp:geojson.sourceTimestamp}));
