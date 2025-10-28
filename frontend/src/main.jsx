// frontend/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import
import './index.css';
import App from './App.jsx';

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}> {/* Wrap App */}
      <App />
    </QueryClientProvider>
  </StrictMode>,
);