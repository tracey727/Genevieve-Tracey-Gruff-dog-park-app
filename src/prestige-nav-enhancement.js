import './prestige-nav-enhancement.css';

const PURPOSES = [
  'Home & live safety',
  'Park & conditions',
  'Dog profile',
  'My profile',
  'Emergency help',
  'Report a hazard',
  'Trip planning',
  'GPS supervision',
  'Conduct & rules'
];

function decorateNavigation() {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;
  const buttons = [...nav.querySelectorAll('button')];
  buttons.forEach((button, index) => {
    const label = button.querySelector('span:not(.nav-purpose)')?.textContent?.trim() || `Section ${index + 1}`;
    button.setAttribute('aria-label', `${label} — ${PURPOSES[index] || 'GENEVIEVE section'}`);
    if (!button.querySelector('.nav-purpose')) {
      const purpose = document.createElement('span');
      purpose.className = 'nav-purpose';
      purpose.textContent = PURPOSES[index] || '';
      button.appendChild(purpose);
    }
  });
}

function resetPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const shell = document.querySelector('.app-shell');
  if (shell && shell.scrollTop) shell.scrollTop = 0;
}

function installScreenChangeReset() {
  const root = document.getElementById('root');
  if (!root) return;
  let lastScreen = document.querySelector('.main-stage .screen');

  const observer = new MutationObserver(() => {
    decorateNavigation();
    const currentScreen = document.querySelector('.main-stage .screen');
    if (currentScreen && currentScreen !== lastScreen) {
      lastScreen = currentScreen;
      requestAnimationFrame(() => requestAnimationFrame(resetPageToTop));
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.bottom-nav button');
    if (!button) return;
    requestAnimationFrame(() => requestAnimationFrame(resetPageToTop));
  }, true);
}

window.addEventListener('DOMContentLoaded', () => {
  decorateNavigation();
  installScreenChangeReset();
});
