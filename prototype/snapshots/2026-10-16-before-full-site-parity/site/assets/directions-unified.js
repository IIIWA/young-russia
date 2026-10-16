(() => {
  const taxonomyElement = document.querySelector('#direction-taxonomy');
  if (!taxonomyElement) return;
  const taxonomy = JSON.parse(taxonomyElement.textContent);
  const defaultTopic = 'knowledge';
  const topicButtons = [...document.querySelectorAll('[data-topic-button]')];
  const subtopicButtons = [...document.querySelectorAll('[data-subtopic-button]')];
  const subgroups = document.querySelector('#subgroup-list');
  const subtopicSelection = document.querySelector('#direction-subtopic-selection');
  const compactSubgroups = matchMedia('(max-width:1050px)');
  const cards = [...document.querySelectorAll('.direction-result')];
  const districtSelect = document.querySelector('#direction-district');
  const heading = document.querySelector('#direction-title');
  const summary = document.querySelector('#direction-summary');
  const empty = document.querySelector('#direction-empty');
  const more = document.querySelector('#direction-more');
  const reset = document.querySelector('#direction-reset');
  let topic = defaultTopic;
  let subtopic = '';
  let limit = 12;

  function readUrl() {
    const params = new URLSearchParams(location.search);
    const requested = params.get('topic');
    topic = Object.hasOwn(taxonomy,requested) ? requested : defaultTopic;
    const requestedSubtopic = params.get('subtopic');
    subtopic = Object.hasOwn(taxonomy[topic].subtopics,requestedSubtopic) ? requestedSubtopic : '';
    const requestedDistrict = params.get('district') || '';
    districtSelect.value = [...districtSelect.options].some(option => option.value === requestedDistrict) ? requestedDistrict : '';
    limit = 12;
  }

  function writeUrl() {
    const url = new URL(location.href);
    url.searchParams.set('topic',topic);
    if (subtopic) url.searchParams.set('subtopic',subtopic); else url.searchParams.delete('subtopic');
    if (districtSelect.value) url.searchParams.set('district',districtSelect.value); else url.searchParams.delete('district');
    history.pushState(null,'',url);
  }

  function render() {
    const group = taxonomy[topic];
    const eligibleSubtopics = new Set(Object.keys(group.subtopics));
    heading.textContent = group.label;
    document.title = `${group.label} | Прототип ПМК Петербурга`;
    topicButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.topicButton === topic)));
    subtopicButtons.forEach(input => {
      input.closest('.direction-subgroup').hidden = Boolean(input.dataset.group && input.dataset.group !== topic);
      input.checked = input.dataset.subtopicButton === subtopic;
    });
    subtopicSelection.textContent = subtopicButtons.find(input => input.checked)?.closest('.direction-subgroup').querySelector('strong').textContent || 'Все занятия';

    const matches = [];
    for (const card of cards) {
      const activities = JSON.parse(card.dataset.activities);
      const matchedActivity = activities.find(activity => activity.subtopics.some(code => subtopic ? code === subtopic : eligibleSubtopics.has(code)));
      if (matchedActivity && (!districtSelect.value || card.dataset.district === districtSelect.value)) {
        card.querySelector('[data-matched-activity]').textContent = matchedActivity.label;
        card.querySelector('[data-activity-provisional]').hidden = !matchedActivity.provisional;
        matches.push(card);
      }
      card.hidden = true;
    }
    matches.slice(0,limit).forEach(card => { card.hidden = false; });
    summary.textContent = `Найдено площадок: ${matches.length}. Показано: ${Math.min(matches.length,limit)}.`;
    empty.hidden = matches.length !== 0;
    more.hidden = matches.length <= limit;
    document.dispatchEvent(new CustomEvent('prototype:direction-filter', {detail:{matchingKeys:matches.map(card => card.dataset.mapKey).filter(Boolean),matchCount:matches.length}}));
  }

  topicButtons.forEach(button => button.addEventListener('click',() => {
    if (topic === button.dataset.topicButton) return;
    topic = button.dataset.topicButton;
    subtopic = '';
    limit = 12;
    writeUrl();
    render();
    document.querySelector('#subgroups')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  subtopicButtons.forEach(input => input.addEventListener('change',() => {
    subtopic = input.dataset.subtopicButton;
    limit = 12;
    writeUrl();
    render();
    if (compactSubgroups.matches) subgroups.open = false;
    document.querySelector('#results')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  const syncSubgroups = () => { subgroups.open = !compactSubgroups.matches; };
  compactSubgroups.addEventListener('change',syncSubgroups);
  districtSelect.addEventListener('change',() => { limit = 12; writeUrl(); render(); });
  more.addEventListener('click',() => { limit += 12; render(); });
  reset.addEventListener('click',() => { subtopic = ''; districtSelect.value = ''; limit = 12; writeUrl(); render(); });
  addEventListener('popstate',() => { readUrl(); render(); });
  readUrl();
  render();
  syncSubgroups();
})();
