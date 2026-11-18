import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './estilos.css';

// Ponto de entrada da interface: coloca o componente <App /> dentro da <div id="root">.
const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado no index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
