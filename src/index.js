// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const supabase = createClient(
  'https://htcvvwvvlixmatxqpvyj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y3Z2d3Z2bGl4bWF0eHFwdnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzA3NTEsImV4cCI6MjA2ODQwNjc1MX0.CDN_-Z8LPZ5m-q279KPMlzHRCbUA31Dhx65oB6DZ1l0'
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      {/* 👇 This will force re-render when session changes */}
      <App key={Math.random()} />
    </SessionContextProvider>
  </React.StrictMode>
);

reportWebVitals();
