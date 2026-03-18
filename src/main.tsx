import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/newsreader/700.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

import App from './App'
import './index.css'
import { registerServiceWorker } from './lib/pwa'

void registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
