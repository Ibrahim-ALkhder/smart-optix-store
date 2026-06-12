import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || '';
if (API_URL) {
  const origFetch = window.fetch;
  window.fetch = function (url, options) {
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = API_URL + url;
    }
    return origFetch.call(this, url, options);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
