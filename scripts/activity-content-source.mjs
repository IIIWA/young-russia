import fs from 'node:fs/promises';
import {assertAllowedActivityIntake} from './activity-retirements.mjs';

export async function readActivityRetirements() {
  const registry = JSON.parse(await fs.readFile(new URL('../data/research/activity-retirements.json', import.meta.url), 'utf8'));
  if (registry.version !== 1 || !Array.isArray(registry.records)) throw new Error('Invalid mandatory activity retirement registry');
  return registry;
}

// Internal provenance ledger only. Never copy it to public assets or payloads.
export async function readActivityApprovals() {
  try {
    const approvals = JSON.parse(await fs.readFile(new URL('../data/research/activity-content-approved.json', import.meta.url), 'utf8'));
    const retirements = await readActivityRetirements();
    assertAllowedActivityIntake(approvals.records ?? [], retirements);
    return {...approvals, retirements};
  } catch (error) {
    if (error.code === 'ENOENT') return {version:1, records:[], retirements:await readActivityRetirements()};
    throw error;
  }
}
