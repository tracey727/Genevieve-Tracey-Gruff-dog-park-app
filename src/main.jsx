import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './brand-colour-override.css';

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
