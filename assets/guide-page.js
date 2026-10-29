import { initGuideLanguageSelection, languageMarkerOptions } from './guide-languages.js';
import { initSpeakingBadges } from './guide-speaking-badges.js';
import { initGuideFaq } from './guide-faq.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
let mapsReady;

function loadMaps() {
  if (mapsReady) return mapsReady;
  mapsReady = new Promise((resolve, reject) => {
    const ready = () => window.ymaps.ready(() => resolve(window.ymaps), reject);
    if (window.ymaps) return ready();
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=c615fafc-18f3-4567-a34b-587069896dd1&lang=ru_RU';
    script.onload = ready;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return mapsReady;
}

export function initGuidePage() {
  const controller = new AbortController();
  const signal = controller.signal;
  const disposers = [];
  disposers.push(initGuideLanguageSelection(signal));
  disposers.push(initSpeakingBadges(signal));
  disposers.push(initGuideFaq(signal));
  const root = document.documentElement;
  const sidebar = document.querySelector('#guide-sidebar');
  const toggle = document.querySelector('.guide-nav-toggle');
  const closeButton = document.querySelector('.guide-nav-close');
  const backdrop = document.querySelector('.guide-nav-backdrop');
  if (sidebar && toggle && closeButton && backdrop) {
    const mobile = window.matchMedia('(max-width: 960px)');
    let open = false;
    let previousOverflow = '';
    root.classList.add('guide-nav-ready');
    const close = (restoreFocus = true) => {
      if (!open) return;
      open = false;
      root.classList.remove('guide-navigation-open');
      backdrop.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = previousOverflow;
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      sidebar.inert = mobile.matches;
      if (mobile.matches) sidebar.setAttribute('aria-hidden', 'true');
      else sidebar.removeAttribute('aria-hidden');
      if (restoreFocus && mobile.matches) toggle.focus();
    };
    const show = () => {
      if (!mobile.matches || open) return;
      open = true;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      sidebar.inert = false;
      sidebar.removeAttribute('aria-hidden');
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      toggle.setAttribute('aria-expanded', 'true');
      backdrop.hidden = false;
      root.classList.add('guide-navigation-open');
      closeButton.focus();
    };
    const syncViewport = () => {
      if (!mobile.matches) close(false);
      sidebar.inert = mobile.matches && !open;
      if (mobile.matches && !open) sidebar.setAttribute('aria-hidden', 'true');
      else sidebar.removeAttribute('aria-hidden');
    };
    toggle.addEventListener('click', () => open ? close() : show(), {signal});
    closeButton.addEventListener('click', () => close(), {signal});
    backdrop.addEventListener('click', () => close(), {signal});
    sidebar.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || !open) return;
      const href = link.getAttribute('href');
      close(!href.startsWith('#'));
      if (href.startsWith('#')) {
        const target = document.getElementById(href.slice(1));
        target?.setAttribute('tabindex', '-1');
        target?.focus({preventScroll:true});
      }
    }, {signal});
    document.addEventListener('keydown', event => {
      if (!open) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const focusable = [...sidebar.querySelectorAll('a[href],button:not([disabled]),summary')]
        .filter(element => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    }, {signal});
    mobile.addEventListener('change', syncViewport, {signal});
    syncViewport();
    disposers.push(() => { close(false); root.classList.remove('guide-nav-ready', 'guide-navigation-open'); });
  }

  const mapElement = document.querySelector('#topic-map');
  const dataElement = document.querySelector('#topic-map-data');
  const select = document.querySelector('#topic-district');
  const languageSelect = document.querySelector('#topic-language');
  if (mapElement && dataElement && select) {
    const points = JSON.parse(dataElement.textContent);
    const rows = [...document.querySelectorAll('[data-topic-club]')];
    const status = document.querySelector('#topic-map-status');
    const count = document.querySelector('#topic-result-count');
    const languageMarks = new Map();
    const rowLanguages = new Map(rows.map(row => [row, JSON.parse(row.dataset.topicLanguages || '[]')]));
    const matchesLanguage = languages => !languageSelect?.value || (languageSelect.value === 'unknown' ? languages.length === 0 : languages.includes(languageSelect.value));
    mapElement.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      const marker = event.target.closest('[data-topic-language-marker]');
      if (!marker) return;
      event.preventDefault();
      languageMarks.get(marker.dataset.topicLanguageMarker)?.balloon.open();
    }, {signal});
    let map, ymaps, started = false;
    const update = () => {
      const selected = points.filter(point => (!select.value || point.district === select.value) && matchesLanguage(point.languages || []));
      rows.forEach(row => { row.hidden = Boolean(select.value && row.dataset.district !== select.value) || !matchesLanguage(rowLanguages.get(row)); });
      count.textContent = `Показано ${rows.filter(row => !row.hidden).length} из ${rows.length} клубов`;
      if (!map) return;
      map.geoObjects.removeAll();
      languageMarks.clear();
      selected.forEach(point => {
        const links = point.activities.map(activity => `<a style="color:#1d4ed8!important;text-decoration:underline!important" href="${escapeHtml(activity.url)}">${escapeHtml(activity.activity)}</a>`).join('<br>');
        const languages = Array.isArray(point.languages) ? `<br><strong>Языки:</strong> ${point.languages.length ? point.languages.map(escapeHtml).join(', ') : 'уточнить у&nbsp;клуба'}` : '';
        const format = point.formatNote ? `<br><small>${escapeHtml(point.formatNote)}</small>` : '';
        for (const [index, coordinates] of [point.coordinates, ...(point.additionalCoordinates || [])].entries()) {
          const key = `${point.id}-${index}`;
          const placemark = new ymaps.Placemark(coordinates, {
            hintContent:point.name, balloonContentHeader:escapeHtml(point.name),
            balloonContentBody:`${escapeHtml(point.address)}${languages}${format}<br>${links}${point.provisional ? '<br><small>Точка предварительная</small>' : ''}`,
          }, languageMarkerOptions(ymaps, point, key));
          if (Array.isArray(point.languages)) languageMarks.set(key, placemark);
          map.geoObjects.add(placemark);
        }
      });
      if (map.geoObjects.getLength() > 1) map.setBounds(map.geoObjects.getBounds(), {checkZoomRange:true,zoomMargin:40});
      else if (selected.length === 1) map.setCenter(selected[0].coordinates, 15);
      status.hidden = selected.length > 0;
      if (!selected.length) status.textContent = languageSelect ? 'Для выбранных фильтров пока нет точек.' : 'Для выбранного района пока нет точек.';
    };
    select.addEventListener('change', update, {signal});
    languageSelect?.addEventListener('change', update, {signal});
    update();
    let observer;
    const start = async () => {
      if (started || signal.aborted) return;
      started = true;
      observer?.disconnect();
      try {
        ymaps = await loadMaps();
        if (signal.aborted) return;
        map = new ymaps.Map(mapElement, {center:[59.94,30.27],zoom:11,controls:['zoomControl']});
        update();
      } catch {
        if (!signal.aborted) status.textContent = 'Не удалось загрузить карту. Адреса доступны в списке клубов ниже.';
      }
    };
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) start(); }, {rootMargin:'250px'});
      observer.observe(mapElement);
    } else start();
    // Also start after interaction if an observer is unavailable or delayed.
    for (const event of ['scroll','touchstart','click']) window.addEventListener(event, start, {once:true,passive:true,signal});
    disposers.push(() => { observer?.disconnect(); languageMarks.clear(); map?.destroy(); });
  }
  return () => { controller.abort(); disposers.forEach(dispose => dispose()); };
}
