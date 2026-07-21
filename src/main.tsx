import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Support clean URLs on static hosting by redirecting them to HashRouter equivalent
const pathname = window.location.pathname;
if (pathname && pathname !== "/" && pathname !== "/index.html" && !pathname.includes(".")) {
  const cleanPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const search = window.location.search;
  window.location.replace(`${window.location.origin}/#${cleanPath}${search}`);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

