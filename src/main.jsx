import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './brand-colour-override.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

function createMemoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    removeItem(key) { values.delete(String(key)); },
    setItem(key, value) { values.set(String(key), String(value)); }
  };
}

function prepareBrowserRuntime() {
  const probeKey = '__genevieve_startup_probe__';
  try {
    const previous = localStorage.getItem(probeKey);
    localStorage.setItem(probeKey, 'ok');
    if (previous === null) localStorage.removeItem(probeKey);
    else localStorage.setItem(probeKey, previous);
  } catch {
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: createMemoryStorage()
      });
    } catch {
      // The startup boundary below will keep a browser storage failure visible rather than blank.
    }
  }

  if (globalThis.crypto && typeof globalThis.crypto.randomUUID !== 'function') {
    const fallbackUuid = () => `genevieve-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    try {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        value: fallbackUuid
      });
    } catch {
      try { globalThis.crypto.randomUUID = fallbackUuid; } catch {}
    }
  }
}

function startupCode(error) {
  const text = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  if (text.includes('storage') || text.includes('quota')) return 'G-STORAGE';
  if (text.includes('crypto') || text.includes('uuid')) return 'G-CRYPTO';
  if (text.includes('auth') || text.includes('neon')) return 'G-CLOUD';
  return 'G-START';
}

function StartupFallback({ error }) {
  return (
    <main style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '36px 22px 96px', background: '#f7f1df', color: '#1f4b3a', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 620, margin: '0 auto', background: '#fffdf7', border: '2px solid #c9a227', borderRadius: 24, padding: 24, boxShadow: '0 16px 40px rgba(31,75,58,.12)' }}>
        <strong style={{ display: 'block', fontSize: 28, letterSpacing: 1 }}>GENEVIEVE App™</strong>
        <span style={{ display: 'block', marginTop: 6 }}>Safety from roots to every journey.</span>
        <h1 style={{ margin: '28px 0 10px', fontSize: 24 }}>GENEVIEVE could not start safely.</h1>
        <p style={{ lineHeight: 1.5 }}>Your safety controls have not been activated on this screen. Reload the app once. If this message remains, the start-up code below identifies the fault without exposing any private information.</p>
        <p style={{ fontWeight: 700 }}>Start-up code: {startupCode(error)}</p>
        <button type="button" onClick={() => window.location.reload()} style={{ width: '100%', marginTop: 12, minHeight: 52, border: '2px solid #c9a227', borderRadius: 16, background: '#1f4b3a', color: '#fffdf7', fontSize: 17, fontWeight: 700 }}>Reload GENEVIEVE</button>
      </section>
    </main>
  );
}

class StartupBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('GENEVIEVE startup error', error, info);
  }

  render() {
    if (this.state.error) return <StartupFallback error={this.state.error} />;
    return this.props.children;
  }
}

async function startGenevieve() {
  prepareBrowserRuntime();
  try {
    const { default: App } = await import('./App.jsx');
    root.render(
      <StartupBoundary>
        <App />
      </StartupBoundary>
    );
  } catch (error) {
    console.error('GENEVIEVE module startup error', error);
    root.render(<StartupFallback error={error} />);
  }
}

startGenevieve();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
