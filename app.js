import { initStage3 } from './stage3.js';
import { initStage4 } from './stage4.js';
import { initStage5 } from './stage5.js';

function restoreApprovedShell() {
  const logoPath = '/assets/genevieve-official-logo.jpeg';
  const headerLogo = document.querySelector('.brand-header img');
  if (headerLogo) {
    headerLogo.src = logoPath;
    headerLogo.alt = 'GENEVIEVE App official tree, roots and infinity logo';
  }

  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.append(favicon);
  }
  favicon.href = logoPath;
  favicon.type = 'image/jpeg';

  const nav = document.querySelector('.bottom-nav');
  if (nav) {
    nav.setAttribute('aria-label', 'GENEVIEVE nine screen navigation');
    nav.innerHTML = `
      <button class="is-current" data-screen-target="today" aria-label="Today" aria-current="page"><span>⌂</span><small>Today</small></button>
      <button data-screen-target="journey" aria-label="Journey"><span>◎</span><small>Journey</small></button>
      <button data-screen-target="dog" aria-label="Mate profile"><span>🐾</span><small>Mate</small></button>
      <button data-screen-target="handler" aria-label="Handler profile"><span>♙</span><small>Handler</small></button>
      <button data-screen-target="emergency" aria-label="Emergency"><span>✚</span><small>Emergency</small></button>
      <button data-screen-target="hazards" aria-label="Hazard"><span>⚠</span><small>Hazard</small></button>
      <button data-screen-target="travel" aria-label="Travel"><span>↗</span><small>Travel</small></button>
      <button data-screen-target="supervision" aria-label="Guard"><span>◉</span><small>Guard</small></button>
      <button data-screen-target="community" aria-label="Code"><span>⚖</span><small>Code</small></button>`;
  }

  const handler = document.querySelector('[data-screen="handler"]');
  if (handler && !document.querySelector('#accessibility-communication')) {
    handler.insertAdjacentHTML('beforeend', `
      <article class="panel accessibility-panel" id="accessibility-communication">
        <div class="panel-title">Accessibility & communication</div>
        <p>GENEVIEVE must remain usable without relying on colour alone. This area preserves the approved accessibility architecture while unverified specialist content stays clearly unavailable.</p>
        <div class="accessibility-grid">
          <div><strong>Mobility & routes</strong><span>Wheelchair, pram and accessible-route context, including dry-sand access where verified.</span></div>
          <div><strong>Reading & display</strong><span>Plain language, larger text, high contrast, reduced motion, keyboard focus, screen-reader labels and 200% zoom/reflow.</span></div>
          <div><strong>Alert choices</strong><span>Sound + vibration, vibration-only and silent visual alert options are part of the approved communication design.</span></div>
          <div><strong>Visual communication</strong><span>Visual emergency information, language preferences and visual dog-command support.</span></div>
        </div>
        <div class="deaf-auslan-card" aria-labelledby="deaf-auslan-title">
          <span class="verification-badge">VERIFICATION PENDING</span>
          <strong id="deaf-auslan-title">Deaf / Auslan communication</strong>
          <p>A dedicated Deaf/Auslan communication area is preserved here. Auslan material may only come from verified Deaf-community sources; GENEVIEVE will never invent signs.</p>
          <p class="microcopy">The expanded Deaf/Auslan package is not being claimed as live until specialist verification is completed.</p>
        </div>
      </article>`);
  }

  const today = document.querySelector('[data-screen="today"]');

  // The full GENEVIEVE brand header belongs to Screen 1 only.
  const brandHeader = document.querySelector('.brand-header');
  if (today && brandHeader && brandHeader.parentElement !== today) {
    const heading = today.querySelector('.screen-heading');
    if (heading) today.insertBefore(brandHeader, heading);
    else today.prepend(brandHeader);
    brandHeader.dataset.screenOneOnly = 'true';
  }

  // The red emergency control is permitted on Screen 1 (Today) only.
  const emergencyWrap = document.querySelector('.emergency-wrap');
  if (today && emergencyWrap && emergencyWrap.parentElement !== today) {
    const heading = today.querySelector('.screen-heading');
    if (heading) heading.insertAdjacentElement('afterend', emergencyWrap);
    else today.append(emergencyWrap);
    emergencyWrap.dataset.screenOneOnly = 'true';
  }

  if (!document.querySelector('#genevieve-approved-brand-restoration')) {
    const style = document.createElement('style');
    style.id = 'genevieve-approved-brand-restoration';
    style.textContent = `
      :root{--brand-forest:#103f31;--brand-forest-2:#215d36;--brand-field:#27964b;--brand-gold:#C9A227;--brand-paper:#f8fff8}
      html{background:var(--brand-forest)}
      body{background:radial-gradient(circle at 10% 0%,rgba(39,150,75,.28),transparent 30rem),linear-gradient(180deg,#103f31 0%,#215d36 34%,rgba(39,150,75,.54) 100%)}
      .app-shell{width:min(960px,100%);background:linear-gradient(180deg,#e8f8eb 0%,#fbfffb 48%,#eaf8ed 100%);border-left:7px solid var(--brand-forest);border-right:7px solid var(--brand-forest)}
      .brand-header{margin:0 -18px 18px;padding:15px 18px;border-bottom:4px solid #082719;background:linear-gradient(135deg,#103f31 0%,#072719 100%);color:#fff;position:static;top:auto;z-index:auto;box-shadow:0 10px 28px rgba(7,39,25,.18)}
      .brand-header img{width:64px;height:64px;object-fit:cover;object-position:center;border:2px solid rgba(201,162,39,.82);border-radius:18px;background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.24)}
      .brand-header .eyebrow{color:#fff}.brand-header h1{color:#f7efd0;font-weight:650}
      .stage-pill{border-color:rgba(201,162,39,.92);background:rgba(255,255,255,.10);color:#fff4c2}
      .status-row div,.panel,.form-shell,.search-shell{border-color:rgba(16,63,49,.18);background:linear-gradient(180deg,rgba(39,150,75,.14) 0%,rgba(255,255,255,.96) 72%)}
      .panel-title,.screen-heading h2,.search-shell{color:var(--brand-forest)}
      .screen-heading>span{border-color:rgba(201,162,39,.75);background:linear-gradient(145deg,#103f31,#215d36)}
      .stage5-panel{border-color:rgba(201,162,39,.52)}
      .accessibility-panel{border-left:5px solid var(--brand-gold);background:linear-gradient(135deg,rgba(255,249,224,.96),rgba(235,248,238,.98) 48%,#fff 100%)}
      .accessibility-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}
      .accessibility-grid>div{padding:13px;border:1px solid rgba(16,63,49,.16);border-radius:14px;background:rgba(255,255,255,.82)}
      .accessibility-grid strong,.accessibility-grid span{display:block}.accessibility-grid strong{color:var(--brand-forest);font-size:.86rem}.accessibility-grid span{margin-top:5px;color:var(--muted);font-size:.76rem;line-height:1.45}
      .deaf-auslan-card{margin-top:12px;padding:15px;border:1px solid rgba(201,162,39,.62);border-radius:16px;background:#fffdf4}.deaf-auslan-card>strong{display:block;margin-top:7px;color:var(--brand-forest);font-size:1rem}
      .verification-badge{display:inline-block;padding:5px 8px;border:1px solid #d3b45b;border-radius:999px;background:#fff3c8;color:#66500d;font-size:.66rem;font-weight:950;letter-spacing:.08em}
      .emergency-hold.is-armed{background:linear-gradient(135deg,#5b151c,#941d28);box-shadow:0 0 0 4px rgba(148,29,40,.14),0 12px 28px rgba(148,29,40,.24)}
      .emergency-slide-shell{margin-top:9px;padding:12px 13px;border:1px solid rgba(148,29,40,.22);border-radius:15px;background:#fff7f6;color:#70131c}
      .emergency-slide-shell[hidden]{display:none!important}
      .emergency-slide-label{display:grid;gap:7px;font-size:.76rem;font-weight:900;letter-spacing:.02em}
      .emergency-slide{width:100%;margin:0;accent-color:#941d28;touch-action:pan-x}
      .bottom-nav{width:min(940px,calc(100% - 18px));grid-template-columns:repeat(9,1fr);gap:4px;padding:7px;border:1px solid rgba(201,162,39,.42);border-radius:20px 20px 0 0;background:linear-gradient(135deg,#103f31 0%,#072719 100%);box-shadow:0 -12px 34px rgba(7,39,25,.28)}
      .bottom-nav button{min-width:0;min-height:54px;padding:5px 2px;border:1px solid transparent;border-radius:12px;color:#fff}.bottom-nav button span{color:#fff;font-size:1rem}.bottom-nav button small{color:#fff;font-size:.58rem;font-weight:800}
      .bottom-nav button.is-current{border-color:rgba(201,162,39,.92);background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 0 0 1px rgba(201,162,39,.28)}
      @media(max-width:780px){.brand-header{grid-template-columns:auto 1fr}.stage-pill{grid-column:1/-1;justify-self:start;margin-top:0}.bottom-nav{gap:2px;padding:6px 4px calc(6px + env(safe-area-inset-bottom))}.bottom-nav button{min-height:50px;border-radius:10px}.bottom-nav button small{display:none}.bottom-nav button span{font-size:1.15rem}}
      @media(max-width:560px){.app-shell{padding-inline:12px;border-left-width:5px;border-right-width:5px}.brand-header{margin-inline:-12px;padding-inline:12px}.brand-header img{width:58px;height:58px}.accessibility-grid{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }
}

restoreApprovedShell();

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
const emergencyHelp = document.querySelector('#emergency-help');
const holdCopy = holdButton?.querySelector('small');
const emergencyWrap = holdButton?.closest('.emergency-wrap');
let emergencySliderShell = document.querySelector('#emergency-slide-shell');

if (holdCopy) holdCopy.textContent = 'Hold 3 seconds, then slide';

if (emergencyWrap && !emergencySliderShell) {
  emergencySliderShell = document.createElement('div');
  emergencySliderShell.id = 'emergency-slide-shell';
  emergencySliderShell.className = 'emergency-slide-shell';
  emergencySliderShell.hidden = true;
  emergencySliderShell.innerHTML = `
    <label class="emergency-slide-label" for="emergency-slide">
      <span>Slide fully right to open emergency assistance</span>
      <input id="emergency-slide" class="emergency-slide" type="range" min="0" max="100" value="0" step="1" disabled aria-label="Slide to open emergency assistance" />
    </label>`;
  holdButton.insertAdjacentElement('afterend', emergencySliderShell);
}

const emergencySlider = document.querySelector('#emergency-slide');
let holdTimer = null;
let emergencyArmed = false;

function resetEmergencyControl(message = 'Opening this control does not dispatch help or transmit your location.') {
  clearTimeout(holdTimer);
  holdTimer = null;
  emergencyArmed = false;
  holdButton?.classList.remove('is-holding', 'is-armed');
  if (holdCopy) holdCopy.textContent = 'Hold 3 seconds, then slide';
  if (emergencySlider) {
    emergencySlider.value = '0';
    emergencySlider.disabled = true;
  }
  if (emergencySliderShell) emergencySliderShell.hidden = true;
  if (emergencyHelp) emergencyHelp.textContent = message;
}

function cancelHold() {
  if (emergencyArmed) return;
  clearTimeout(holdTimer);
  holdTimer = null;
  holdButton?.classList.remove('is-holding');
}

function armEmergency() {
  clearTimeout(holdTimer);
  holdTimer = null;
  emergencyArmed = true;
  holdButton?.classList.remove('is-holding');
  holdButton?.classList.add('is-armed');
  if (holdCopy) holdCopy.textContent = 'Hold complete — slide fully right';
  if (emergencySliderShell) emergencySliderShell.hidden = false;
  if (emergencySlider) {
    emergencySlider.disabled = false;
    emergencySlider.value = '0';
    emergencySlider.focus({ preventScroll: true });
  }
  if (emergencyHelp) emergencyHelp.textContent = 'Three-second hold complete. Slide fully right to open the protected emergency assistance panel.';
  navigator.vibrate?.([90, 60, 90]);
}

function startHold(event) {
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  if (holdTimer || emergencyArmed) return;
  if (event.type === 'keydown') event.preventDefault();

  holdButton?.classList.add('is-holding');
  holdTimer = setTimeout(armEmergency, 3000);
}

['pointerdown', 'keydown'].forEach(type => holdButton?.addEventListener(type, startHold));
['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(type => holdButton?.addEventListener(type, cancelHold));

emergencySlider?.addEventListener('input', () => {
  if (!emergencyArmed) {
    emergencySlider.value = '0';
    return;
  }

  if (Number(emergencySlider.value) >= 95) {
    emergencyArmed = false;
    emergencySlider.disabled = true;
    emergencySlider.value = '0';
    if (emergencySliderShell) emergencySliderShell.hidden = true;
    holdButton?.classList.remove('is-armed');
    if (holdCopy) holdCopy.textContent = 'Emergency assistance open';
    if (emergencyHelp) emergencyHelp.textContent = 'Emergency assistance is open. No help or location has been dispatched automatically.';
    dialog?.showModal();
    navigator.vibrate?.(120);
  }
});

emergencySlider?.addEventListener('change', () => {
  if (emergencyArmed && Number(emergencySlider.value) < 95) emergencySlider.value = '0';
});

// Navigating away from Screen 1 always disarms the emergency gesture.
document.addEventListener('click', event => {
  const navigation = event.target.closest?.('[data-screen-target],[data-open-screen]');
  if (!navigation) return;
  const destination = navigation.dataset.screenTarget || navigation.dataset.openScreen;
  if (destination && destination !== 'today') resetEmergencyControl();
}, true);

closeEmergency?.addEventListener('click', () => {
  dialog?.close();
  resetEmergencyControl();
});

dialog?.addEventListener('cancel', () => resetEmergencyControl());

document.querySelector('[data-emergency-screen]')?.addEventListener('click', () => {
  dialog?.close();
  resetEmergencyControl();
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
