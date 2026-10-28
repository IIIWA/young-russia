(() => {
  const sidebar = document.querySelector('#guide-sidebar');
  const toggle = document.querySelector('.guide-nav-toggle');
  const closeButton = document.querySelector('.guide-nav-close');
  const backdrop = document.querySelector('.guide-nav-backdrop');
  if (!sidebar || !toggle || !closeButton || !backdrop) return;

  const mobile = window.matchMedia('(max-width: 960px)');
  const root = document.documentElement;
  let open = false;
  let previousOverflow = '';
  root.classList.add('guide-nav-ready');

  function close(restoreFocus = true) {
    if (!open) return;
    open = false;
    root.classList.remove('guide-navigation-open');
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    sidebar.inert = mobile.matches;
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
    if (mobile.matches) sidebar.setAttribute('aria-hidden', 'true');
    else sidebar.removeAttribute('aria-hidden');
    if (restoreFocus && mobile.matches) toggle.focus();
  }

  function show() {
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
  }

  function syncViewport() {
    if (!mobile.matches) close(false);
    sidebar.inert = mobile.matches && !open;
    if (mobile.matches && !open) sidebar.setAttribute('aria-hidden', 'true');
    else sidebar.removeAttribute('aria-hidden');
  }

  toggle.addEventListener('click', () => open ? close() : show());
  closeButton.addEventListener('click', () => close());
  backdrop.addEventListener('click', () => close());
  sidebar.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !open) return;
    const href = link.getAttribute('href');
    close(!href.startsWith('#'));
    if (href.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled]), summary')]
        .filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  mobile.addEventListener('change', syncViewport);
  syncViewport();
})();
