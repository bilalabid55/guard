import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Configure axios base URL to the service root (not including '/api') - MUST be set before any API calls
// On localhost, always use the local backend and ignore REACT_APP_API_URL to avoid accidentally hitting Render.
const apiEnv = process.env.REACT_APP_API_URL;
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const apiBase = isLocalhost
  ? 'http://localhost:5000/api'
  : (apiEnv || 'http://localhost:5000/api');
const serviceRoot = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
axios.defaults.baseURL = serviceRoot;

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering React app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial; text-align: center;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Please check the browser console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; text-align: left; overflow: auto;">${errorMessage}</pre>
      </div>
    `;
  }
}