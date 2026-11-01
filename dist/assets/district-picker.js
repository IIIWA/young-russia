// Progressive enhancement: retain the native select as the filter's source of truth.
export function enhanceDistrictSelect(select) {
  const choices = [...select.options].map(option => ({ value:option.value, label:option.textContent }));
  const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
  const root = document.createElement('div');
  root.className = 'district-picker';
  const input = document.createElement('input');
  input.id = `${select.id}-search`;
  input.type = 'text';
  input.className = 'district-picker-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('role','combobox');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-expanded','false');
  input.setAttribute('aria-controls',`${select.id}-options`);
  input.setAttribute('aria-describedby',`${select.id}-hint`);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'district-picker-toggle';
  toggle.setAttribute('aria-label','Показать районы');
  toggle.setAttribute('aria-controls',`${select.id}-options`);
  toggle.setAttribute('aria-expanded','false');
  const list = document.createElement('div');
  list.id = `${select.id}-options`;
  list.className = 'district-picker-options';
  list.setAttribute('role','listbox');
  list.setAttribute('aria-label','Районы Петербурга');
  list.hidden = true;
  const hint = document.createElement('small');
  hint.id = `${select.id}-hint`;
  hint.className = 'district-picker-hint';
  hint.textContent = 'Можно ввести название района';
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role','status');
  root.append(input,toggle,list,hint,status);
  select.after(root);
  const label = document.querySelector(`label[for="${select.id}"]`);
  if (label) label.htmlFor = input.id;
  select.hidden = true;
  let opened = false;
  let matches = choices;
  let active = -1;

  function activate(index) {
    active = index;
    [...list.querySelectorAll('[role="option"]')].forEach((option,i) => {
      option.classList.toggle('is-active',i === active);
    });
    const option = list.querySelectorAll('[role="option"]')[active];
    if (option) {
      input.setAttribute('aria-activedescendant',option.id);
      option.scrollIntoView({block:'nearest'});
    } else input.removeAttribute('aria-activedescendant');
  }
  function render(query = '') {
    matches = choices.filter(choice => normalize(choice.label).includes(normalize(query)));
    list.replaceChildren();
    for (const [i,choice] of matches.entries()) {
      const option = document.createElement('div');
      option.id = `${select.id}-option-${choices.indexOf(choice)}`;
      option.className = 'district-picker-option';
      option.setAttribute('role','option');
      option.setAttribute('aria-selected',String(choice.value === select.value));
      option.textContent = choice.label;
      option.addEventListener('pointerdown',event => event.preventDefault());
      option.addEventListener('click',() => choose(i));
      list.append(option);
    }
    if (!matches.length) {
      const message = document.createElement('p');
      message.className = 'district-picker-empty';
      message.textContent = 'Район не найден';
      list.append(message);
    }
    active = -1;
    input.removeAttribute('aria-activedescendant');
    status.textContent = `Найдено вариантов: ${matches.length}.`;
  }
  function open(selectText = true) {
    if (opened) return;
    opened = true;
    list.hidden = false;
    input.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Скрыть районы');
    render();
    if (selectText) input.select();
  }
  function close() {
    opened = false;
    list.hidden = true;
    input.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Показать районы');
    input.removeAttribute('aria-activedescendant');
    input.value = choices.find(choice => choice.value === select.value)?.label || choices[0].label;
  }
  function choose(index) {
    const choice = matches[index];
    if (!choice) return;
    const changed = select.value !== choice.value;
    select.value = choice.value;
    close();
    input.focus({preventScroll:true});
    // Focusing after a pointer selection must not reopen the popup.
    close();
    if (changed) select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  input.addEventListener('focus',() => input.select());
  input.addEventListener('click',() => open());
  input.addEventListener('input',() => { open(false); render(input.value); });
  input.addEventListener('keydown',event => {
    if (event.key === 'Escape') { if(opened){ event.preventDefault(); close(); } return; }
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown','ArrowUp','Enter'].includes(event.key)) {
      event.preventDefault();
      if (!opened) { open(); if(event.key === 'Enter')return; }
      if (event.key === 'Enter') { if(active >= 0)choose(active); else if(matches.length === 1)choose(0); return; }
      if (!matches.length) return;
      activate(event.key === 'ArrowDown' ? (active + 1) % matches.length : (active < 0 ? matches.length - 1 : (active + matches.length - 1) % matches.length));
    }
    if(opened && ['Home','End'].includes(event.key) && event.altKey) {
      event.preventDefault(); activate(event.key === 'Home' ? 0 : matches.length - 1);
    }
  });
  toggle.addEventListener('click',() => {
    if(opened)close();else {input.focus({preventScroll:true});open();}
  });
  root.addEventListener('focusout',event => { if(!root.contains(event.relatedTarget))close(); });
  document.addEventListener('pointerdown',event => { if(opened && !root.contains(event.target))close(); });
  select.addEventListener('change',close);
  close();
  return {sync:close};
}
