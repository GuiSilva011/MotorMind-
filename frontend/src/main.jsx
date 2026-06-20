import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

/**
 * Inicializa a aplicação React no elemento raiz do documento.
 *
 * Configura o modo estrito do React, habilita o roteamento com
 * BrowserRouter e renderiza o componente principal da aplicação.
 *
 * @returns {void}
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
