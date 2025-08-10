import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SchoolProvider } from './SchoolContext.jsx';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SchoolProvider>
      <App />
      </SchoolProvider>
  </StrictMode>,
)
