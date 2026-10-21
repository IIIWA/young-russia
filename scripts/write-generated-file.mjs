import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function writeGeneratedFile(target, content) {
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, 'utf8');
    await fs.rename(temporary, target);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}
