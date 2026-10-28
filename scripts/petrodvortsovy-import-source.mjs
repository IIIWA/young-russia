import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const sourceNote='data/research/petrodvortsovy-import-2026-10-28.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

// Keep the accepted October 26 package immutable; use the explicitly launched
// October 28 import as the current private view for this district only.
export async function applyPetrodvortsovyImport(results){
  const data=JSON.parse(await fs.readFile(sourceNote,'utf8'));
  if(data.schemaVersion!=='S-79-B-R2/1'||data.followupTask!=='S-79-B-R2')throw Error('Petrodvortsovy import identity missing');
  for(const ref of [data.sourceBaseline,data.followupBaseline]){
    if(!ref?.path||sha(await fs.readFile(ref.path))!==ref.sha256)throw Error(`Petrodvortsovy source changed: ${ref?.path}`);
  }
  return results.map(item=>{
    if(item.config.code!=='petrodvortsovy')return item;
    if(data.clubs.length!==item.baseline.length)throw Error('Petrodvortsovy club coverage changed');
    for(const club of item.baseline){
      if(data.clubs.filter(c=>c.catalogMatch?.existingName===club.name).length!==1)throw Error(`Petrodvortsovy match missing: ${club.name}`);
    }
    return {...item,config:{...item.config,task:data.followupTask},data,sourceNote};
  });
}
