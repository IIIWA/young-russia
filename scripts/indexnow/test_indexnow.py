import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('indexnow', Path(__file__).with_name('indexnow.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Notifications(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.root = self.directory / 'site'
        self.root.mkdir()
        self.config = {'root': str(self.root), 'host': 'young-russia.ru', 'key': '12345678'}
        self.state_file = self.directory / 'state.json'
        self.urls = ['https://young-russia.ru/', 'https://young-russia.ru/club.html']
        self.sitemap(self.urls)
        self.page('index.html', 'Home')
        self.page('club.html', 'Club')

    def sitemap(self, urls):
        xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        xml += ''.join('<url><loc>' + url + '</loc></url>' for url in urls) + '</urlset>'
        (self.root / 'sitemap.xml').write_text(xml, encoding='utf-8')

    def page(self, name, text, extra='', build='one'):
        (self.root / name).write_text('<html><head><title>Title</title>' + extra +
            '</head><body><main>' + text + '</main><script src="/_nuxt/' + build +
            '.js">' + build + '</script></body></html>', encoding='utf-8')

    def baseline(self):
        return {'version': 1, 'host': self.config['host'],
                'pages': module.snapshot(self.config), 'pending': {}}

    def test_initialization_sends_nothing_and_wont_overwrite(self):
        with patch.object(module, 'submit') as api:
            module.run(self.config, self.state_file, initialize=True)
            api.assert_not_called()
            with self.assertRaises(ValueError):
                module.run(self.config, self.state_file, initialize=True)

    def test_added_updated_deleted_and_unchanged(self):
        state = self.baseline()
        self.page('index.html', 'Changed')
        (self.root / 'club.html').unlink()
        self.page('new.html', 'New')
        self.sitemap([self.urls[0], 'https://young-russia.ru/new.html'])
        result = module.advance(state, module.snapshot(self.config), 100)
        self.assertEqual({k: v['reason'] for k, v in result['pending'].items()},
            {self.urls[0]: 'updated', self.urls[1]: 'deleted',
             'https://young-russia.ru/new.html': 'new'})
        self.assertEqual(module.advance(result, result['pages'], 200)['pending'], result['pending'])

    def test_build_hashes_do_not_trigger_notifications(self):
        before = module.snapshot(self.config)
        self.page('index.html', 'Home', build='new-build')
        self.assertEqual(before, module.snapshot(self.config))

    def test_noindex_excluded(self):
        self.page('club.html', 'Club', '<meta content="NOINDEX, follow" name="robots">')
        self.assertNotIn(self.urls[1], module.snapshot(self.config))

    def test_missing_target_and_bad_sitemap_abort(self):
        (self.root / 'club.html').unlink()
        with self.assertRaises(FileNotFoundError):
            module.snapshot(self.config)
        self.sitemap([])
        with self.assertRaises(ValueError):
            module.snapshot(self.config)

    def test_foreign_hosts_queries_and_traversal_rejected(self):
        for url in ('https://evil.test/', 'https://young-russia.ru/%2e%2e/private.html',
                    'https://young-russia.ru/?x=1', 'http://young-russia.ru/'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                module.url_file(self.root.resolve(), self.config['host'], url)

    def test_pending_retained_for_202_and_errors_removed_only_after_200(self):
        original = self.baseline()
        original['pending'][self.urls[0]] = {'reason': 'updated', 'since': 0}
        for status in (202, 403, 422, 429, 500, 200):
            module.save(self.state_file, copy.deepcopy(original))
            with patch.object(module, 'verify_key'), patch.object(module, 'submit', return_value=status):
                module.run(self.config, self.state_file)
            actual = json.loads(self.state_file.read_text(encoding='utf-8'))
            self.assertEqual(bool(actual['pending']), status != 200)
            self.assertEqual(actual['last_http'], status)

    def test_settle_time_and_backoff_block_repeated_sends(self):
        state = self.baseline()
        state['pending'][self.urls[0]] = {'reason': 'updated', 'since': 999}
        module.save(self.state_file, state)
        with patch.object(module.time, 'time', return_value=1000), patch.object(module, 'submit') as api:
            module.run(self.config, self.state_file)
            api.assert_not_called()
        state['pending'][self.urls[0]]['since'] = 0
        state['retry_at'] = 2000
        module.save(self.state_file, state)
        with patch.object(module.time, 'time', return_value=1000), patch.object(module, 'submit') as api:
            module.run(self.config, self.state_file)
            api.assert_not_called()

    def test_network_failure_preserves_queue(self):
        module.save(self.state_file, self.baseline())
        self.page('index.html', 'Changed')
        module.run(self.config, self.state_file)
        with patch.object(module.time, 'time', return_value=9999999999), \
             patch.object(module, 'verify_key', side_effect=OSError('offline')):
            with self.assertRaises(OSError):
                module.run(self.config, self.state_file)
        self.assertIn(self.urls[0], json.loads(self.state_file.read_text())['pending'])

    def test_real_request_shape_and_endpoint(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        response.__enter__.return_value.status = 200
        with patch.object(module, 'urlopen', return_value=response) as network:
            self.assertEqual(module.submit(self.config, [self.urls[0]]), 200)
        request = network.call_args.args[0]
        self.assertEqual(request.full_url, 'https://yandex.com/indexnow')
        body = json.loads(request.data)
        self.assertEqual(body['urlList'], [self.urls[0]])
        self.assertEqual(body['keyLocation'], 'https://young-russia.ru/12345678.txt')

    def test_public_key_must_match_and_have_no_redirect(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        context = response.__enter__.return_value
        context.status = 200
        context.geturl.return_value = 'https://young-russia.ru/12345678.txt'
        context.read.return_value = b'12345678\n'
        with patch.object(module, 'urlopen', return_value=response):
            module.verify_key(self.config)
            context.geturl.return_value = 'https://other.test/12345678.txt'
            with self.assertRaises(ValueError):
                module.verify_key(self.config)


if __name__ == '__main__':
    unittest.main()
