import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Make sure CSS is imported before the app
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)