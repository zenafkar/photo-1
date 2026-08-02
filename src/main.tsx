import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

import { ErrorBoundary } from './components/ErrorBoundary';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (!PUBLISHABLE_KEY) {
  root.render(
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Configuration Error</h1>
      <p>Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code>.</p>
      <p>Please add this key to your Environment Variables settings.</p>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          signInFallbackRedirectUrl="/studio"
          signUpFallbackRedirectUrl="/studio"
          appearance={{
            variables: {
              colorBackground: '#0f172a',
              colorInputBackground: '#1e293b',
              colorInputText: '#e2e8f0',
              colorText: '#e2e8f0',
              colorTextSecondary: '#94a3b8',
              colorPrimary: '#3b82f6',
              colorNeutral: '#475569',
            },
          }}
        >
          <App />
        </ClerkProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
