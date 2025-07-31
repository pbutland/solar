import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: import.meta.env.BASE_URL + 'marker-icon-2x.png',
  iconUrl: import.meta.env.BASE_URL + 'marker-icon.png',
  shadowUrl: import.meta.env.BASE_URL + 'marker-shadow.png',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
