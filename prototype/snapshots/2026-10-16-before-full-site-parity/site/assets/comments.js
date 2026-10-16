/* Block comments for the prototype. The local server and hosted PHP endpoint share one API. */
(() => {
  const script = document.querySelector('script[src$="comments.js"]');
  const prototypeRoot = new URL('../', script.src);
  const pageKey = location.pathname.startsWith(prototypeRoot.pathname)
    ? location.pathname.slice(prototypeRoot.pathname.length) || 'index.html'
    : location.pathname.replace(/^\/+/, '') || 'index.html';
  const commentsEndpoint = new URL('api/comments.php', prototypeRoot);
  const pageTitle = document.title.split(' | ')[0];
  const sections = [...document.querySelectorAll('main .wire-section[data-section]')];
  let comments = [];
  let selected = {key: 'page', label: 'Страница в целом'};
  let lastFocus = null;
  let apiAvailable = true;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const backdrop = element('div', 'comment-backdrop');
  backdrop.hidden = true;
  const panel = element('aside', 'comment-panel');
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'comment-panel-title');

  const head = element('div', 'comment-panel-head');
  const headText = element('div');
  headText.append(element('p', '', 'КОММЕНТАРИИ К ПРОТОТИПУ'));
  const panelTitle = element('h2', '', 'Замечания');
  panelTitle.id = 'comment-panel-title';
  headText.append(panelTitle);
  const closeButton = element('button', 'comment-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Закрыть комментарии');
  head.append(headText, closeButton);

  const body = element('div', 'comment-panel-body');
  const form = element('form');
  const label = element('label', '', 'Ваш комментарий');
  label.setAttribute('for', 'comment-text');
  const textarea = element('textarea');
  textarea.id = 'comment-text';
  textarea.name = 'comment';
  textarea.maxLength = 2000;
  textarea.required = true;
  textarea.placeholder = 'Что изменить или уточнить в этом блоке?';
  const submit = element('button', 'comment-submit', 'Сохранить комментарий');
  submit.type = 'submit';
  const message = element('p', 'comment-message');
  message.setAttribute('role', 'status');
  form.append(label, textarea, submit, message);

  const listTitle = element('h3', 'comment-list-title', 'Замечания к этому блоку');
  const list = element('div');
  const summary = element('div', 'comment-summary');
  const summaryTitle = element('h3', '', 'По страницам');
  const summaryList = element('div');
  summary.append(summaryTitle, summaryList);
  body.append(form, listTitle, list, summary);
  panel.append(head, body);
  document.body.append(backdrop, panel);

  const fab = element('button', 'comment-fab', 'Комментарии · 0');
  fab.type = 'button';
  document.body.append(fab);

  function setOpen(open) {
    backdrop.hidden = !open;
    panel.hidden = !open;
    document.body.classList.toggle('comment-open', open);
    if (open) textarea.focus();
    else if (lastFocus) lastFocus.focus();
  }

  function openComment(key, labelText, trigger) {
    selected = {key, label: labelText};
    lastFocus = trigger;
    panelTitle.textContent = labelText;
    label.textContent = `Комментарий: ${labelText}`;
    message.textContent = apiAvailable ? '' : 'Сервис комментариев временно недоступен.';
    textarea.value = '';
    render();
    setOpen(true);
  }

  for (const section of sections) {
    const trigger = element('button', 'comment-trigger', 'Комментировать блок');
    trigger.type = 'button';
    trigger.setAttribute('aria-label', `Комментировать блок ${section.dataset.sectionLabel}`);
    section.querySelector('.section-label-row').append(trigger);
    trigger.addEventListener('click', () => openComment(section.dataset.section, section.dataset.sectionLabel, trigger));
  }
  document.querySelectorAll('[data-page-comment]').forEach(trigger => {
    trigger.addEventListener('click', () => openComment('page', 'Страница в целом', trigger));
  });
  fab.addEventListener('click', () => openComment('page', 'Страница в целом', fab));
  closeButton.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  function formatDate(value) {
    try { return new Date(value).toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
    catch { return ''; }
  }

  function render() {
    const local = comments.filter(item => item.page === pageKey);
    fab.textContent = `Комментарии · ${local.length}`;
    for (const section of sections) {
      const total = local.filter(item => item.section === section.dataset.section).length;
      const trigger = section.querySelector('.comment-trigger');
      trigger.textContent = total ? `Комментарии: ${total}` : 'Комментировать блок';
    }
    list.replaceChildren();
    const relevant = local.filter(item => item.section === selected.key).slice().reverse();
    listTitle.textContent = selected.key === 'page' ? 'Замечания к странице' : 'Замечания к этому блоку';
    if (!relevant.length) list.append(element('p', 'comment-empty', 'Пока замечаний нет.'));
    for (const item of relevant) {
      const card = element('div', 'comment-item');
      card.append(element('small', '', formatDate(item.createdAt)));
      card.append(element('p', '', item.text));
      list.append(card);
    }
    summaryList.replaceChildren();
    const counts = new Map();
    for (const item of comments) counts.set(item.page, (counts.get(item.page) || 0) + 1);
    if (!counts.size) summaryList.append(element('p', 'comment-empty', 'На страницах пока нет замечаний.'));
    for (const [page, total] of [...counts].sort((a,b) => a[0].localeCompare(b[0], 'ru'))) {
      const row = element('div', 'comment-page-count');
      row.append(element('span', '', page === pageKey ? `${pageTitle} (текущая)` : page));
      row.append(element('strong', '', String(total)));
      summaryList.append(row);
    }
  }

  async function load() {
    try {
      const response = await fetch(commentsEndpoint, {cache:'no-store'});
      if (!response.ok) throw new Error('API unavailable');
      const items = await response.json();
      comments = Array.isArray(items) ? items : [];
      apiAvailable = true;
      render();
    } catch {
      apiAvailable = false;
      render();
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const content = textarea.value.trim();
    if (!content) return textarea.focus();
    submit.disabled = true;
    message.textContent = 'Сохраняем…';
    try {
      const response = await fetch(commentsEndpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({page:pageKey, section:selected.key, text:content})
      });
      if (!response.ok) throw new Error('save failed');
      textarea.value = '';
      message.textContent = 'Комментарий сохранён.';
      await load();
    } catch {
      message.textContent = 'Не удалось сохранить комментарий. Попробуйте позже.';
    } finally {
      submit.disabled = false;
    }
  });

  load();
})();
