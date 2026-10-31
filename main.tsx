import React from 'react';
import { initBotId } from 'botid/client/core';
import { createRoot } from 'react-dom/client';
import 'material-symbols/outlined.css';
import './style.css';
import App from './App';
// Local builds do not have Vercel's challenge proxy. Vercel builds enable it.
if (import.meta.env.VITE_BOTID_ENABLED === 'true') {
  initBotId({protect: [{path: '/api/oracle', method: 'POST', advancedOptions: {checkLevel: 'basic'}}]});
}
createRoot(document.getElementById('root')!).render(<App />);
