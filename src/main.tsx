import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadOptions } from './lib/catalog';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Varianten & Services im Hintergrund nachladen, sobald die Seite steht
const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (f: () => void) => void }).requestIdleCallback(cb) : setTimeout(cb, 200));
idle(() => void loadOptions());
