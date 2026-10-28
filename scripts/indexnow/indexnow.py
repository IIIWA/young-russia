#!/usr/bin/env python3
"""IndexNow notifications for a published static Nuxt site; Python 3.6+, stdlib."""
import argparse
import contextlib
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ENDPOINT = 'https://yandex.com/indexnow'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


class Content(HTMLParser):
    """Ignore Nuxt build IDs, scripts and CSS, retain visible content and SEO."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.body = False
        self.title = False
        self.skip = 0
        self.noindex = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style', 'noscript'):
            self.skip += 1
            return
        if self.skip:
            return
        if tag == 'body':
            self.body = True
        if tag == 'title':
            self.title = True
        name = (attrs.get('name') or '').lower()
        if tag == 'meta' and name in ('robots', 'yandex', 'bingbot'):
            tokens = re.split(r'[\s,]+', (attrs.get('content') or '').lower())
            self.noindex |= 'noindex' in tokens or 'none' in tokens
        if tag == 'meta' and name in ('description', 'robots', 'yandex', 'bingbot'):
            self.parts.append(('meta', name, attrs.get('content')))
        if tag == 'link' and (attrs.get('rel') or '').lower() == 'canonical':
            self.parts.append(('canonical', attrs.get('href')))
        if self.body:
            semantic = tuple(sorted((k, v) for k, v in attrs.items()
                                    if k in ('href', 'src', 'alt', 'title', 'datetime', 'value')))
            self.parts.append((tag, semantic))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if self.body:
            self.parts.append(('/' + tag,))
        if tag == 'body':
            self.body = False
        if tag == 'title':
            self.title = False

    def handle_data(self, data):
        if not self.skip and (self.body or self.title):
            value = ' '.join(data.split())
            if value:
                self.parts.append(('text', value))


def url_file(root, host, url):
    parsed = urlsplit(url)
    if (parsed.scheme != 'https' or parsed.netloc != host or parsed.query or parsed.fragment):
        raise ValueError('Sitemap URL must use the canonical HTTPS host without query/fragment')
    decoded = unquote(parsed.path)
    if '\\' in decoded or '\x00' in decoded or '..' in decoded.split('/'):
        raise ValueError('Unsafe URL path')
    relative = decoded.lstrip('/') or 'index.html'
    if not relative.endswith('.html'):
        raise ValueError('Expected an HTML page: ' + parsed.path)
    filename = (root / relative).resolve()
    if root not in filename.parents:
        raise ValueError('Page is outside document root')
    return filename


def signature(filename):
    stat = filename.stat()
    return stat.st_ino, stat.st_size, stat.st_mtime_ns


def snapshot(config):
    root = Path(config['root']).resolve()
    root_stamp = root.stat().st_ino
    sitemap = root / 'sitemap.xml'
    source = sitemap.read_bytes()
    document = ET.fromstring(source)
    if document.tag != NS + 'urlset':
        raise ValueError('Expected a single sitemap urlset')
    urls = [item.findtext(NS + 'loc') for item in document.findall(NS + 'url')]
    if not urls or len(set(urls)) != len(urls):
        raise ValueError('Empty sitemap or duplicate URLs; scan aborted')
    pages, signatures = {}, {}
    for url in urls:
        filename = url_file(root, config['host'], url)
        before = signature(filename)  # Missing sitemap targets indicate an incomplete publication.
        content = Content()
        content.feed(filename.read_text(encoding='utf-8'))
        content.close()
        if signature(filename) != before:
            raise RuntimeError('Publication is changing; retry on next run')
        signatures[filename] = before
        if not content.noindex:
            payload = json.dumps(content.parts, ensure_ascii=False, separators=(',', ':'))
            pages[url] = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    if (sitemap.read_bytes() != source or root.stat().st_ino != root_stamp or
            any(signature(p) != stamp for p, stamp in signatures.items())):
        raise RuntimeError('Publication changed during scan; retry on next run')
    if not pages:
        raise ValueError('No indexable pages; scan aborted')
    return pages


def advance(state, pages, now):
    queue = dict(state.get('pending', {}))
    old = state['pages']
    for url in sorted(set(old) | set(pages)):
        if old.get(url) != pages.get(url):
            reason = 'deleted' if url not in pages else 'updated' if url in old else 'new'
            queue[url] = {'reason': reason, 'since': now}
    return dict(state, pages=pages, pending=queue)


def save(filename, state):
    temporary = filename.with_suffix('.tmp')
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.chmod(str(temporary), 0o600)
    os.replace(str(temporary), str(filename))


def verify_key(config):
    key_url = 'https://' + config['host'] + '/' + config['key'] + '.txt'
    request = Request(key_url,
                      headers={'User-Agent': 'YoungRussia-IndexNow/1.0'})
    with urlopen(request, timeout=30) as response:
        if (response.status != 200 or response.geturl() != key_url or
                response.read(1024).decode('utf-8').strip() != config['key']):
            raise ValueError('Public key file does not match')


def submit(config, urls):
    if not 1 <= len(urls) <= 10000:
        raise ValueError('IndexNow batch must contain 1..10000 URLs')
    for url in urls:
        url_file(Path(config['root']).resolve(), config['host'], url)
    payload = {'host': config['host'], 'key': config['key'],
               'keyLocation': 'https://' + config['host'] + '/' + config['key'] + '.txt',
               'urlList': urls}
    request = Request(ENDPOINT, data=json.dumps(payload).encode('utf-8'),
                      headers={'Content-Type': 'application/json; charset=utf-8',
                               'User-Agent': 'YoungRussia-IndexNow/1.0'})
    try:
        with urlopen(request, timeout=30) as response:
            return response.status
    except HTTPError as error:
        return error.code


@contextlib.contextmanager
def lock(filename):
    # Linux cron runs must not overlap. Windows is used only for local dry runs/tests.
    with filename.open('a') as handle:
        if os.name == 'posix':
            import fcntl
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def run(config, state_file, initialize=False, dry_run=False, manual=None):
    now = int(time.time())
    if manual:
        url_file(Path(config['root']).resolve(), config['host'], manual)
        verify_key(config)
        status = submit(config, [manual])
        print(json.dumps({'event': 'test', 'http': status, 'count': 1}), flush=True)
        return 0 if status in (200, 202) else 1
    pages = snapshot(config)
    if initialize:
        if state_file.exists():
            raise ValueError('Refusing to replace an existing baseline')
        if not dry_run:
            save(state_file, {'version': 1, 'host': config['host'], 'pages': pages, 'pending': {}})
        print(json.dumps({'event': 'baseline', 'pages': len(pages), 'submitted': 0}))
        return 0
    state = json.loads(state_file.read_text(encoding='utf-8'))
    if state.get('version') != 1 or state.get('host') != config['host']:
        raise ValueError('State belongs to another host or version')
    state = advance(state, pages, now)
    state['last_scan'] = now
    if dry_run:
        print(json.dumps({'event': 'dry-run', 'pages': len(pages), 'pending': state['pending']}))
        return 0
    save(state_file, state)  # Persist detected changes even if the API is unavailable.
    if not state['pending'] or now < state.get('retry_at', 0):
        return 0
    urls = [url for url, item in sorted(state['pending'].items())
            if now - item['since'] >= config.get('settle_seconds', 300)][:1000]
    if not urls:
        return 0
    verify_key(config)
    status = submit(config, urls)
    if status == 200:
        for url in urls:
            del state['pending'][url]
        state['failures'] = 0
        state['retry_at'] = now + 300
    else:
        state['failures'] = state.get('failures', 0) + 1
        state['retry_at'] = now + min(86400, 900 * 2 ** min(state['failures'] - 1, 7))
    state['last_http'] = status
    state['last_attempt'] = now
    save(state_file, state)
    print(json.dumps({'event': 'submission', 'http': status, 'count': len(urls),
                      'pending': len(state['pending']), 'time': now}), flush=True)
    return 0 if status in (200, 202) else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True, type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--initialize', action='store_true')
    mode.add_argument('--submit', metavar='URL')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    if args.dry_run and args.submit:
        parser.error('--dry-run cannot be combined with --submit')
    config = json.loads(args.config.read_text(encoding='utf-8'))
    if not re.fullmatch(r'[A-Za-z0-9-]{8,128}', config['key']):
        raise ValueError('Invalid IndexNow key')
    state_file = args.config.resolve().parent / 'state.json'
    if Path(config['root']).resolve() in state_file.parents:
        raise ValueError('Configuration and state must be outside document root')
    if args.dry_run:
        return run(config, state_file, args.initialize, True)
    with lock(state_file.with_suffix('.lock')):
        return run(config, state_file, args.initialize, False, args.submit)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except BlockingIOError:
        pass  # Another cron run is active.
    except Exception as error:
        print('IndexNow error: ' + str(error), file=sys.stderr)
        sys.exit(1)
