import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'urql';
import { shopifyClient } from './services/shopify';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider value={shopifyClient}>
      <App />
    </Provider>
  </StrictMode>
);