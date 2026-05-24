import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './Routes/ProtectedRoutes';

import Login from './pages/login';

import CadastroCliente from './pages/operador/cadastroCliente';
import VisualizarClientes from './pages/operador/visualizarClientes';
import Agendamentos from './pages/operador/agendamentos';
import CalendarioAgendamentos from './pages/operador/calendarioAgendamentos';

import OrdemServico from './pages/operador/ordemServico';
import Diagnosticos from './pages/operador/diagnosticos';
import Servicos from './pages/operador/servicos';
import Pecas from './pages/operador/pecas';

import PainelTecnico from './pages/tecnico/painel';
import VisualizarVeiculosTecnico from './pages/tecnico/visualizarVeiculos';
import ChecklistTecnico from './pages/tecnico/checklist';
import HistoricoVeicular from './pages/tecnico/historicoVeicular';
import ChecklistsVeiculo from './pages/tecnico/checklistsVeiculo';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Navigate to="/operador/ordem-servico" replace />} />

        <Route
          path="/operador/clientes/cadastro"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <CadastroCliente />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/clientes/consultar"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <VisualizarClientes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/agendamentos"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Agendamentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/agendamentos/calendario"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <CalendarioAgendamentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/ordem-servico"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <OrdemServico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/diagnosticos"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Diagnosticos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/servicos"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Servicos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/pecas"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERADOR']}>
              <Pecas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tecnico/painel"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TECNICO']}>
              <PainelTecnico />
            </ProtectedRoute>
          }
         />

      <Route
          path="/tecnico/veiculos"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TECNICO']}>
              <VisualizarVeiculosTecnico />
            </ProtectedRoute>
          }
        />

      <Route
          path="/tecnico/checklist"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TECNICO']}>
              <ChecklistTecnico />
            </ProtectedRoute>
        }
      />

      <Route
        path="/tecnico/historico-veicular"
        element={
        <ProtectedRoute allowedRoles={['ADMIN', 'TECNICO']}>
          <HistoricoVeicular />
        </ProtectedRoute>
        } 
      />

      <Route
        path="/tecnico/checklists"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'TECNICO']}>
            <ChecklistsVeiculo />
          </ProtectedRoute>
       }
      />

        <Route path="/clientes/cadastro" element={<Navigate to="/operador/clientes/cadastro" replace />} />
        <Route path="/clientes/consultar" element={<Navigate to="/operador/clientes/consultar" replace />} />
        <Route path="/agendamentos" element={<Navigate to="/operador/agendamentos" replace />} />
        <Route path="/agendamentos/calendario" element={<Navigate to="/operador/agendamentos/calendario" replace />} />
        <Route path="/ordemServico" element={<Navigate to="/operador/ordem-servico" replace />} />
        <Route path="/diagnosticos" element={<Navigate to="/operador/diagnosticos" replace />} />
        <Route path="/diagnosticos/cadastro" element={<Navigate to="/operador/diagnosticos" replace />} />
        <Route path="/servicos" element={<Navigate to="/operador/servicos" replace />} />
        <Route path="/servicos/cadastro" element={<Navigate to="/operador/servicos" replace />} />
        <Route path="/pecas" element={<Navigate to="/operador/pecas" replace />} />
        <Route path="/pecas/cadastro" element={<Navigate to="/operador/pecas" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
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