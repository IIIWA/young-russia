(() => {
  const buttons = [...document.querySelectorAll('[data-subtopic-button]')];
  const cards = [...document.querySelectorAll('.direction-result')];
  const district = document.querySelector('#direction-district');
  const summary = document.querySelector('#direction-summary');
  const empty = document.querySelector('#direction-empty');
  const more = document.querySelector('#direction-more');
  const reset = document.querySelector('#direction-reset');
  if (!district || !buttons.length) return;
  let subtopic = new URLSearchParams(location.search).get('subtopic') || '';
  if (!buttons.some(button => button.dataset.subtopicButton === subtopic)) subtopic = '';
  let limit = 12;
  const update = () => {
    const matches = cards.filter(card => (!subtopic || card.dataset.subtopics.split(' ').includes(subtopic)) && (!district.value || card.dataset.district === district.value));
    cards.forEach(card => { card.hidden = !matches.includes(card) || matches.indexOf(card) >= limit; });
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.subtopicButton === subtopic)));
    summary.textContent = `Найдено площадок: ${matches.length}`;
    empty.hidden = matches.length > 0;
    more.hidden = matches.length <= limit;
  };
  buttons.forEach(button => button.addEventListener('click',() => {
    subtopic = subtopic === button.dataset.subtopicButton ? '' : button.dataset.subtopicButton;
    limit = 12;
    const url = new URL(location.href);
    if (subtopic) url.searchParams.set('subtopic',subtopic); else url.searchParams.delete('subtopic');
    history.replaceState(null,'',url);
    update();
    document.querySelector('#results')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  district.addEventListener('change',() => { limit = 12; update(); });
  more.addEventListener('click',() => { limit += 12; update(); });
  reset.addEventListener('click',() => { subtopic = ''; district.value = ''; limit = 12; history.replaceState(null,'',location.pathname); update(); });
  update();
})();
