import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './Dashboard';
import './index.css';

// Mounts the standalone layout directly into the single page template root
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);