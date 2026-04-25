import { Navigate, Route, Routes } from 'react-router-dom';
import CadastroCliente from './pages/cadastroCliente';
import VisualizarClientes from './pages/visualizarClientes';
import Agendamentos from './pages/agendamentos';
import CalendarioAgendamentos from './pages/calendarioAgendamentos'
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
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
      />
    </>
  );
}

export default App;