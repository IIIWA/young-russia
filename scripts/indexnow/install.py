#!/usr/bin/env python3
"""Install only IndexNow assets. Run on server via the reviewed SSH launcher."""
import base64
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import time

HOME = Path('/var/www/u3013321/data')
ROOT = HOME / 'www/young-russia.ru'
TARGET = HOME / 'automation/young-russia-indexnow'
MARKER = '# young-russia-indexnow'


def crontab():
    result = subprocess.run(['crontab', '-l'], universal_newlines=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode == 0:
        return result.stdout
    if result.returncode == 1 and 'no crontab' in result.stderr.lower():
        return ''
    raise RuntimeError('Cannot read crontab: ' + result.stderr.strip())


def set_crontab(text):
    subprocess.run(['crontab', '-'], input=text, universal_newlines=True, check=True)


def main():
    print(json.dumps({'event': 'runtime', 'python': sys.version.split()[0]}), flush=True)
    if sys.version_info < (3, 6):
        raise RuntimeError('Python 3.6+ is required')
    payload = json.loads(sys.stdin.readline())
    key = payload['key']
    if not re.fullmatch(r'[A-Za-z0-9-]{8,128}', key):
        raise ValueError('Invalid key')
    if not (ROOT / 'index.html').is_file() or not (ROOT / 'sitemap.xml').is_file():
        raise RuntimeError('Unexpected document root')
    if TARGET.exists() or TARGET.is_symlink():
        raise RuntimeError('IndexNow directory already exists; inspect it before changing anything')
    old_cron = crontab()
    if MARKER in old_cron:
        raise RuntimeError('IndexNow cron entry already exists')
    key_file = ROOT / (key + '.txt')
    if key_file.exists() or key_file.is_symlink():
        raise RuntimeError('Key file already exists; inspect before overwriting')
    # Do not install a second notifier over another IndexNow implementation.
    candidates = [p for p in ROOT.glob('*.txt')
                  if re.fullmatch(r'[A-Za-z0-9-]{8,128}\.txt', p.name)
                  and p.stat().st_size <= 256 and p.read_text(errors='replace').strip() == p.stem]
    if candidates:
        raise RuntimeError('Possible existing IndexNow key detected; inspect before installing')
    backup = HOME / 'backups' / ('young-russia-indexnow-' + time.strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True, exist_ok=False, mode=0o700)
    (backup / 'crontab.before.txt').write_text(old_cron, encoding='utf-8')
    (backup / 'crontab.before.txt').chmod(0o600)
    (backup / 'installation.json').write_text(json.dumps({
        'target': str(TARGET), 'root': str(ROOT), 'key_file': key_file.name,
        'existing_site_files_replaced': 0}, indent=2), encoding='utf-8')
    TARGET.mkdir(parents=True, mode=0o700)
    watcher = TARGET / 'indexnow.py'
    watcher.write_bytes(base64.b64decode(payload['watcher']))
    watcher.chmod(0o700)
    config = TARGET / 'config.json'
    config.write_text(json.dumps({'host': 'young-russia.ru', 'root': str(ROOT),
                                 'key': key, 'settle_seconds': 300}), encoding='utf-8')
    config.chmod(0o600)
    key_file.write_text(key + '\n', encoding='utf-8')
    key_file.chmod(0o644)
    command = [sys.executable, str(watcher), '--config', str(config)]
    installed = False
    try:
        subprocess.run(command + ['--initialize'], check=True)
        test = subprocess.run(command + ['--submit', 'https://young-russia.ru/'],
                              check=True, universal_newlines=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(test.stdout.strip(), flush=True)
        report = json.loads(test.stdout)
        if report['http'] == 202:
            state_file = TARGET / 'state.json'
            state = json.loads(state_file.read_text(encoding='utf-8'))
            state['pending']['https://young-russia.ru/'] = {'reason': 'test', 'since': 0}
            state['retry_at'] = int(time.time()) + 900
            state_file.write_text(json.dumps(state, indent=2), encoding='utf-8')
        cron_command = ' '.join(shlex.quote(part) for part in command)
        line = '*/5 * * * * ' + cron_command + ' >> ' + shlex.quote(str(TARGET / 'run.log')) + ' 2>&1 ' + MARKER
        # Preserve any unrelated edits made while verification was running.
        current_cron = crontab()
        if MARKER in current_cron:
            raise RuntimeError('Another IndexNow installer changed crontab')
        set_crontab(current_cron.rstrip('\n') + '\n' + line + '\n')
        installed = True
        if line not in crontab().splitlines():
            raise RuntimeError('Cron entry was not saved')
        result = {'event': 'installed', 'http': report['http'], 'cron': 'every 5 minutes',
                  'target': str(TARGET), 'backup': str(backup), 'site_files_replaced': 0}
        (TARGET / 'installation.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
        print(json.dumps(result), flush=True)
    except Exception:
        if installed:
            set_crontab('\n'.join(line for line in crontab().splitlines() if MARKER not in line) + '\n')
        if key_file.exists() and key_file.read_text().strip() == key:
            key_file.unlink()
        print('Installation failed; cron/key rolled back. Diagnostic files: ' + str(TARGET),
              file=sys.stderr, flush=True)
        raise
    if payload.get('wait_for_cron', True):
        print(json.dumps({'event': 'waiting_for_first_cron', 'max_seconds': 360}), flush=True)
        started = int(time.time())
        for _ in range(72):
            time.sleep(5)
            state = json.loads((TARGET / 'state.json').read_text(encoding='utf-8'))
            if state.get('last_scan', 0) >= started:
                print(json.dumps({'event': 'cron_verified', 'pages': len(state['pages']),
                                  'pending': len(state['pending']), 'last_scan': state['last_scan']}), flush=True)
                return
        print(json.dumps({'event': 'cron_not_observed', 'log': str(TARGET / 'run.log')}), flush=True)


if __name__ == '__main__':
    main()
