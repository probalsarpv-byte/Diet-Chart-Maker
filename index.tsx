import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { registerOfflineDietServiceWorker } from './services/offlineDietCacheService';

// Register VitePWA Service Worker & Offline Diet Chart / Recent Logs Cache Worker
try {
  registerSW({ immediate: true });
} catch {
  // Fallback registration
}
registerOfflineDietServiceWorker();

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}