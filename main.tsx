import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const rootElement = document.getElementById('root')!;

if (!clerkPublishableKey) {
  createRoot(rootElement).render(
    <StrictMode>
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1220', color: '#e2e8f0', padding: '24px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div>
          <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Clerk is not configured</h1>
          <p style={{ opacity: 0.9, marginBottom: '6px' }}>Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to a <code>.env</code> file in the project root.</p>
          <p style={{ opacity: 0.7, fontSize: '14px' }}>Then restart the dev server.</p>
        </div>
      </div>
    </StrictMode>,
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}
