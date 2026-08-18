import { initStage3 } from './stage3.js';
import { initStage4 } from './stage4.js';
import { initStage5 } from './stage5.js';

const screens = [...document.querySelectorAll('[data-screen]')];
const navButtons = [...document.querySelectorAll('[data-screen-target]')];
const screenContent = document.querySelector('#screen-content');

function showScreen(name, focus = true) {
  const target = screens.find(screen => screen.dataset.screen === name) ?? screens[0];
  const targetName = target.dataset.screen;

  screens.forEach(screen => {
    const active = screen === target;
    screen.hidden = !active;
    screen.classList.toggle('is-active', active);
  });

  navButtons.forEach(button => {
    const active = button.dataset.screenTarget === targetName;
    button.classList.toggle('is-current', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (focus) {
    screenContent.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  history.replaceState(null, '', `#${targetName}`);
}

navButtons.forEach(button => {
  button.addEventListener('click', () => showScreen(button.dataset.screenTarget));
});

document.querySelectorAll('[data-open-screen]').forEach(button => {
  button.addEventListener('click', () => showScreen(button.dataset.openScreen));
});

const initial = location.hash.replace('#', '');
showScreen(screens.some(screen => screen.dataset.screen === initial) ? initial : 'today', false);

const dialog = document.querySelector('#emergency-dialog');
const holdButton = document.querySelector('#emergency-hold');
const closeEmergency = document.querySelector('#close-emergency');
let holdTimer = null;

function cancelHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
  holdButton.classList.remove('is-holding');
}

function startHold(event) {
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  if (holdTimer) return;
  if (event.type === 'keydown') event.preventDefault();

  holdButton.classList.add('is-holding');
  holdTimer = setTimeout(() => {
    cancelHold();
    dialog.showModal();
  }, 3000);
}

['pointerdown', 'keydown'].forEach(type => holdButton.addEventListener(type, startHold));
['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(type => holdButton.addEventListener(type, cancelHold));

closeEmergency.addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', cancelHold);

document.querySelector('[data-emergency-screen]').addEventListener('click', () => {
  dialog.close();
  showScreen('emergency');
});

function updateFreshness() {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
  document.querySelector('#freshness').textContent = formatter.format(new Date());
}

updateFreshness();
setInterval(updateFreshness, 1000);

async function checkFoundation() {
  const status = document.querySelector('#backend-status');
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    const data = await response.json();

    if (data.database === 'connected') status.textContent = 'Neon foundation connected';
    else if (data.database === 'not-configured') status.textContent = 'Foundation healthy · DB binding pending';
    else status.textContent = 'Foundation check unavailable';
  } catch {
    status.textContent = navigator.onLine ? 'Foundation check unavailable' : 'Offline structure';
  }
}

checkFoundation();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}


async function initLinkedStages() {
  await initStage3();
  await initStage4();
  await initStage5();
}

initLinkedStages();
