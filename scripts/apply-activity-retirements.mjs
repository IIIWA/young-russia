import fs from 'node:fs/promises';
import path from 'node:path';

async function rejectSymlinkPath(filename) {
  let cursor = path.resolve(filename);
  for (;;) {
    try {if ((await fs.lstat(cursor)).isSymbolicLink()) throw new Error('Symlink retirement path is not allowed');}
    catch(error) {if(error.code!=='ENOENT')throw error;}
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
}

export async function applyActivityRetirements({dist, routes, retirements, backupRoot}) {
  const seen = new Set();
  const targets = (retirements.records ?? []).map(record => {
    const relative = record.route;
    const target = path.resolve(dist, relative);
    if (!/^activities\/[a-z0-9-]+\.html$/.test(relative) || seen.has(relative)
      || routes.includes('/'+relative) || path.relative(dist,target).replaceAll(path.sep,'/') !== relative) throw new Error('Unsafe or still-active retirement target');
    seen.add(relative);
    return {relative,target};
  });
  const snapshots = [];
  for (const item of targets) {
    await rejectSymlinkPath(item.target);
    await rejectSymlinkPath(backupRoot);
    let bytes;
    try {bytes = await fs.readFile(item.target);} catch(error) {if(error.code==='ENOENT')continue;throw error;}
    const backup = path.join(backupRoot,path.basename(item.relative));
    if (path.resolve(backup) === item.target) throw new Error('Retirement backup aliases target');
    await rejectSymlinkPath(backup);
    try {if (!(await fs.readFile(backup)).equals(bytes)) throw new Error('Retirement backup conflicts with current bytes');} catch(error) {if(error.code!=='ENOENT')throw error;}
    snapshots.push({...item,bytes,backup});
  }
  if (snapshots.length) await fs.mkdir(backupRoot,{recursive:true});
  for (const {bytes,backup} of snapshots) {
    await rejectSymlinkPath(backup);
    try {await fs.writeFile(backup,bytes,{flag:'wx'});} catch(error) {
      if(error.code!=='EEXIST' || !(await fs.readFile(backup)).equals(bytes))throw error;
    }
    await rejectSymlinkPath(backup);
    if (!(await fs.readFile(backup)).equals(bytes)) throw new Error('Retirement backup readback mismatch');
  }
  for (const {target,bytes,backup} of snapshots) {
    await rejectSymlinkPath(target);
    await rejectSymlinkPath(backup);
    if (!(await fs.readFile(backup)).equals(bytes)) throw new Error('Retirement backup changed after preflight');
    if (!(await fs.readFile(target)).equals(bytes)) throw new Error('Retirement target changed after preflight');
    await fs.rm(target);
  }
  return targets.map(item => item.relative);
}
