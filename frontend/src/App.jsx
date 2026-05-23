import { Navigate, Route, Routes } from 'react-router-dom';
import CadastroCliente from './pages/cadastroCliente';
import VisualizarClientes from './pages/visualizarClientes';
import Agendamentos from './pages/agendamentos';
import OrdemServico from './pages/ordemServico';
import Diagnosticos from './pages/diagnosticos';
import Servicos from './pages/servicos';
import Pecas from './pages/pecas';
import CalendarioAgendamentos from './pages/calendarioAgendamentos';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/clientes/cadastro" replace />} />
        <Route path="/clientes/cadastro" element={<CadastroCliente />} />
        <Route path="/clientes/consultar" element={<VisualizarClientes />} />
        <Route path="/agendamentos" element={<Agendamentos />} />
        <Route
          path="/agendamentos/calendario"
          element={<CalendarioAgendamentos />}
        />
        <Route path="/ordemServico" element={<OrdemServico />} />
        <Route path="/diagnosticos/cadastro" element={<Diagnosticos />} />
        <Route path="/diagnosticos" element={<Diagnosticos />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/servicos/cadastro" element={<Servicos />} />
        <Route path="/pecas" element={<Pecas />} />
        <Route path="/pecas/cadastro" element={<Pecas />} />
      </Routes>

      <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
    </>
  );
}

export default App;