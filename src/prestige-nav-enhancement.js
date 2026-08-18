import './prestige-nav-enhancement.css';
import './hazard-photo-cards.css';

const NAV_META = [
  { label: 'Today', purpose: 'Home', primary: true },
  { label: 'Journey', purpose: 'Park', primary: true },
  { label: 'Mate', purpose: 'Dog', primary: true },
  { label: 'Handler', purpose: 'Profile', primary: false, description: 'Your profile, privacy and membership' },
  { label: 'Emergency', purpose: 'Help', primary: false, description: 'Emergency contacts and safety actions' },
  { label: 'Hazard', purpose: 'Report', primary: true },
  { label: 'Travel', purpose: 'Trips', primary: false, description: 'Trip planning and safe stops' },
  { label: 'Guard', purpose: 'GPS', primary: false, description: 'Supervision and boundary awareness' },
  { label: 'Conduct', purpose: 'Rules', primary: false, description: 'Conduct, expectations and resolution' }
];

let lastSignature = '';
let moreOpen = false;

function originalButtons() {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return [];
  return [...nav.querySelectorAll(':scope > button:not(.genevieve-more-tab)')];
}

function activeIndex() {
  return originalButtons().findIndex((button) => button.classList.contains('active'));
}

function screenSignature() {
  const title = document.querySelector('.main-stage .screen-title h1, .main-stage .today-hero h1')?.textContent?.trim() || '';
  return `${activeIndex()}|${title}`;
}

function hardResetToTop() {
  try { window.history.scrollRestoration = 'manual'; } catch {}
  try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { window.scrollTo(0, 0); }

  const scrollingElement = document.scrollingElement;
  if (scrollingElement) scrollingElement.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  for (const selector of ['.app-shell', '.main-stage', 'main', '.screen']) {
    document.querySelectorAll(selector).forEach((node) => {
      try { node.scrollTop = 0; } catch {}
    });
  }

  const shell = document.querySelector('.app-shell');
  if (shell?.scrollIntoView) {
    try { shell.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' }); } catch {}
  }
}

function scheduleTopReset() {
  requestAnimationFrame(() => requestAnimationFrame(hardResetToTop));
  setTimeout(hardResetToTop, 0);
  setTimeout(hardResetToTop, 70);
  setTimeout(hardResetToTop, 180);
}

function closeMore() {
  const sheet = document.querySelector('.genevieve-more-shell');
  if (sheet) sheet.hidden = true;
  document.documentElement.classList.remove('genevieve-more-open');
  moreOpen = false;
}

function openMore() {
  const sheet = ensureMoreSheet();
  sheet.hidden = false;
  document.documentElement.classList.add('genevieve-more-open');
  moreOpen = true;
  sheet.querySelector('.genevieve-more-close')?.focus();
}

function syncMoreState() {
  const more = document.querySelector('.genevieve-more-tab');
  if (!more) return;
  const index = activeIndex();
  const meta = NAV_META[index];
  const secondaryActive = Boolean(meta && !meta.primary);
  more.classList.toggle('active', secondaryActive || moreOpen);
  const current = more.querySelector('.nav-purpose');
  if (current) current.textContent = secondaryActive ? meta.label : 'Menu';
}

function ensureMoreSheet() {
  let shell = document.querySelector('.genevieve-more-shell');
  if (shell) return shell;

  shell = document.createElement('div');
  shell.className = 'genevieve-more-shell';
  shell.hidden = true;
  shell.innerHTML = `
    <div class="genevieve-more-backdrop" aria-hidden="true"></div>
    <section class="genevieve-more-sheet" role="dialog" aria-modal="true" aria-labelledby="genevieveMoreTitle">
      <div class="genevieve-more-head">
        <div>
          <small>GENEVIEVE APP™</small>
          <h2 id="genevieveMoreTitle">More</h2>
          <p>Secondary tools, kept out of the main dock so the app stays clear and easy to use.</p>
        </div>
        <button type="button" class="genevieve-more-close" aria-label="Close More menu">×</button>
      </div>
      <div class="genevieve-more-grid"></div>
    </section>`;
  document.body.appendChild(shell);

  const grid = shell.querySelector('.genevieve-more-grid');
  NAV_META.forEach((meta, index) => {
    if (meta.primary) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'genevieve-more-choice';
    button.dataset.index = String(index);
    button.innerHTML = `<strong>${meta.label}</strong><span>${meta.description}</span>`;
    button.addEventListener('click', () => {
      const target = originalButtons()[index];
      closeMore();
      target?.click();
      scheduleTopReset();
    });
    grid.appendChild(button);
  });

  shell.querySelector('.genevieve-more-close')?.addEventListener('click', closeMore);
  shell.querySelector('.genevieve-more-backdrop')?.addEventListener('click', closeMore);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && moreOpen) closeMore();
  });
  return shell;
}

function decorateNavigation() {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;

  const buttons = originalButtons();
  buttons.forEach((button, index) => {
    const meta = NAV_META[index] || { label: `Section ${index + 1}`, purpose: '' };
    button.dataset.navIndex = String(index);
    button.classList.toggle('nav-primary', Boolean(meta.primary));
    button.classList.toggle('nav-secondary', !meta.primary);
    button.setAttribute('aria-label', `${meta.label} — ${meta.purpose}`);

    const label = button.querySelector('span:not(.nav-purpose)');
    if (label) label.textContent = meta.label;
    button.querySelector('i')?.setAttribute('aria-hidden', 'true');

    let purpose = button.querySelector('.nav-purpose');
    if (!purpose) {
      purpose = document.createElement('span');
      purpose.className = 'nav-purpose';
      button.appendChild(purpose);
    }
    purpose.textContent = meta.purpose;
  });

  let more = nav.querySelector('.genevieve-more-tab');
  if (!more) {
    more = document.createElement('button');
    more.type = 'button';
    more.className = 'genevieve-more-tab nav-primary';
    more.setAttribute('aria-haspopup', 'dialog');
    more.setAttribute('aria-label', 'More — open secondary sections');
    more.innerHTML = '<span>More</span><span class="nav-purpose">Menu</span>';
    more.addEventListener('click', () => {
      if (moreOpen) closeMore(); else openMore();
      syncMoreState();
    });
    nav.appendChild(more);
  }

  ensureMoreSheet();
  syncMoreState();
}

function installScreenChangeReset() {
  const root = document.getElementById('root');
  if (!root) return;

  lastSignature = screenSignature();
  const observer = new MutationObserver(() => {
    decorateNavigation();
    const next = screenSignature();
    if (next !== lastSignature) {
      lastSignature = next;
      closeMore();
      syncMoreState();
      scheduleTopReset();
    }
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  document.addEventListener('click', (event) => {
    const navButton = event.target.closest('.bottom-nav button, .genevieve-more-choice');
    if (navButton) scheduleTopReset();
  }, true);
}

window.addEventListener('DOMContentLoaded', () => {
  decorateNavigation();
  installScreenChangeReset();
});
