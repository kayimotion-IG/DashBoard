import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Fatal Error: KlenCare Root element missing from DOM.");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}