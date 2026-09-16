// Guard window.fetch to ensure it has a setter across all browser/iframe contexts
try {
  let currentFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined;
  const descriptor = {
    get: () => currentFetch,
    set: (val: any) => {
      currentFetch = val;
    },
    configurable: true,
    enumerable: true,
  };
  if (typeof Window !== 'undefined' && Window.prototype) {
    try {
      Object.defineProperty(Window.prototype, 'fetch', descriptor);
    } catch (_) {}
  }
  try {
    Object.defineProperty(window, 'fetch', descriptor);
  } catch (_) {}
} catch (_) {}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
