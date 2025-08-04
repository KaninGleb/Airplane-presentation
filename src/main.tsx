import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { LoadingProvider } from './components/LoadingProvider.tsx'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </StrictMode>,
)
