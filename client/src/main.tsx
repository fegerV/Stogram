import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new Event('stogram:pwa-offline-ready'));
  },
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('stogram:pwa-update-available'));
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
