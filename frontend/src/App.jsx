import { Navigate, Route, Routes } from 'react-router-dom';
import CadastroCliente from './pages/cadastroCliente';
import VisualizarClientes from './pages/visualizarClientes';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/clientes/cadastro" replace />} />
      <Route path="/clientes/cadastro" element={<CadastroCliente />} />
      <Route path="/clientes/consultar" element={<VisualizarClientes />} />
    </Routes>
  );
}

export default App;