// Run only after the user confirms they are currently on their personal server.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

if (!process.argv.includes('--server-confirmed')) {
  throw new Error('Сначала получите свежее подтверждение пользователя: «Я сейчас на сервере».');
}
const directory = path.dirname(fileURLToPath(import.meta.url));
const keyFile = fs.readFileSync(path.join(directory, 'key-file.txt'), 'utf8').trim();
const key = keyFile.replace(/\.txt$/, '');
if (!/^[a-zA-Z0-9-]{8,128}\.txt$/.test(keyFile)) throw new Error('Invalid key file name');
const sourceKey = fs.readFileSync(path.join(directory, '../../public', keyFile), 'utf8').trim();
if (sourceKey !== key) throw new Error('Source key file does not match');
const program = fs.readFileSync(path.join(directory, 'install.py'));
const payload = {key, watcher:fs.readFileSync(path.join(directory, 'indexnow.py')).toString('base64'), wait_for_cron:true};
const command = `python3 -u -c "import sys;code=sys.stdin.buffer.read(int(sys.stdin.buffer.readline()));exec(compile(code,'indexnow-install','exec'))"`;
const child = spawn('ssh', ['-T', '-i', path.join(os.homedir(), '.ssh/personal_server262_20261014'),
  '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'ConnectTimeout=15',
  'u3013321@server262.hosting.reg.ru', command], {stdio:['pipe','pipe','pipe']});
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
child.stdin.on('error', error => console.error('SSH input:', error.message));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
child.stdin.end(Buffer.concat([Buffer.from(program.length + '\n'), program,
  Buffer.from(JSON.stringify(payload) + '\n')]));
