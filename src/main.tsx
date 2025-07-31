import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/solar/marker-icon-2x.png',
  iconUrl: '/solar/marker-icon.png',
  shadowUrl: '/solar/marker-shadow.png',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
