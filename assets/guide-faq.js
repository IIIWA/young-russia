export function initGuideFaq(signal) {
  const items = [...document.querySelectorAll('.guide-faq > details')];
  if (!items.length) return () => {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finishers = [];

  for (const details of items) {
    const summary = details.querySelector(':scope > summary');
    const answer = details.querySelector(':scope > p');
    if (!summary || !answer) continue;
    const originalHeight = details.style.height;
    let heightAnimation, opacityAnimation;
    let targetOpen = details.open;
    const cancel = () => {
      if (heightAnimation) heightAnimation.onfinish = null;
      heightAnimation?.cancel();
      opacityAnimation?.cancel();
      heightAnimation = opacityAnimation = undefined;
    };
    const finish = () => {
      cancel();
      details.open = targetOpen;
      details.style.height = originalHeight;
      details.removeAttribute('data-faq-closing');
    };
    summary.addEventListener('click', event => {
      event.preventDefault();
      targetOpen = heightAnimation ? !targetOpen : !details.open;
      const startHeight = details.getBoundingClientRect().height;
      const startOpacity = details.open ? Number(getComputedStyle(answer).opacity) : 0;
      cancel();
      if (reducedMotion.matches || typeof details.animate !== 'function') {
        finish();
        return;
      }
      // Keep native content visible until the closing animation has finished.
      details.open = true;
      details.toggleAttribute('data-faq-closing', !targetOpen);
      details.style.height = 'auto';
      const endHeight = targetOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      details.style.height = `${startHeight}px`;
      heightAnimation = details.animate([
        {height:`${startHeight}px`}, {height:`${endHeight}px`},
      ], {duration:260, easing:'cubic-bezier(.2, 0, 0, 1)', fill:'both'});
      opacityAnimation = answer.animate([
        {opacity:startOpacity}, {opacity:targetOpen ? 1 : 0},
      ], {duration:targetOpen ? 200 : 180, easing:'ease', fill:'both'});
      heightAnimation.onfinish = finish;
    }, {signal});
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches && heightAnimation) finish();
    }, {signal});
    finishers.push(finish);
  }
  return () => finishers.forEach(finish => finish());
}
