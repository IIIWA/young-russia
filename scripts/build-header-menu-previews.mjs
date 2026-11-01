import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'prototype/site/reviews/header-menu-2026-10-31');
const source = await fs.readFile(path.join(root, '.data/legacy/index.html'), 'utf8');
const variants = [
  ['reveal', 'Появляется при прокрутке вверх', 'Стеклянная шапка скрывается при движении вниз и возвращается при движении вверх. Одинаковое поведение на телефоне и компьютере.'],
  ['glass', 'Всегда закреплено: стекло', 'Меню всегда под рукой. Полупрозрачный фон с размытием, светлой границей и мягкой тенью.'],
  ['solid', 'Всегда закреплено: светлый фон', 'Плотный светлый фон и тонкая граница. Спокойный вариант без размытия.'],
];
await fs.mkdir(target, { recursive: true });
for (const [id, title] of variants) {
  const page = source
    .replace('<head>', `<head><base href="/"><meta name="robots" content="noindex,nofollow"><meta name="header-preview" content="${id}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}: просмотр меню</title>`)
    .replace(/<script src="(?:\.\.\/)*assets\/[^"<>]+" defer><\/script>/, '')
    .replace('</head>', '<link rel="stylesheet" href="/__review/header/preview.css"><script src="/__review/header/preview.js" defer></script></head>');
  await fs.writeFile(path.join(target, `${id}.html`), page);
}
const cards = variants.map(([id, title, description], i) => `<article class="variant-card"><span class="number">0${i + 1}</span><h2>${title}</h2><p>${description}</p><button type="button" data-variant="${id}" aria-pressed="${i === 0}">Показать внизу</button><a href="${id}.html" target="_blank" rel="noopener">Открыть на весь экран ↗</a></article>`).join('');
await fs.writeFile(path.join(target, 'index.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Три варианта верхнего меню</title><link rel="stylesheet" href="/__review/header/comparison.css"><script src="/__review/header/comparison.js" defer></script></head><body><main><p class="kicker">Просмотр перед выбором</p><h1>Верхнее меню: три варианта</h1><p class="intro">Одна главная страница, три способа показать меню. Сравни на&nbsp;телефоне и&nbsp;компьютере: прокручивай содержимое внутри окна или открой вариант на&nbsp;весь экран.</p><div class="variants">${cards}</div><section class="viewer" aria-label="Просмотр выбранного варианта"><div class="viewer-tools"><strong id="viewer-title">${variants[0][1]}</strong><div role="group" aria-label="Ширина просмотра"><button type="button" data-width="390" aria-pressed="false">Телефон 390</button><button type="button" data-width="768" aria-pressed="false">Планшет 768</button><button type="button" data-width="1280" aria-pressed="true">Десктоп 1280</button></div></div><p id="viewer-help">Прокручивай страницу внутри окна. Размеры показаны в&nbsp;пикселях.</p><div class="frame-window"><iframe id="preview-frame" src="reveal.html" title="Меню с появлением при прокрутке вверх"></iframe></div></section><p class="note">Это отдельные варианты для выбора. Меню опубликованного сайта пока не&nbsp;изменено.</p></main></body></html>`);
console.log(`Header previews: ${path.relative(root, target)} (3 variants + comparison)`);
