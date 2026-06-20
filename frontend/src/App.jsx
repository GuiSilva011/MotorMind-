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

import CadastrarFornecedor from './pages/admin/cadastrarFornecedores';
import VisualizarFornecedor from './pages/admin/visualizarFornecedores';
import CadastrarFuncionarios from './pages/admin/cadastrarFuncionarios';
import VisualizarFuncionarios from './pages/admin/visualizarFuncionarios';
import Relatorios from './pages/admin/relatorios';

/**
 * Componente principal responsável por configurar as rotas da aplicação.
 *
 * Define as rotas públicas e protegidas dos perfis de administrador,
 * operador e técnico, além dos redirecionamentos de rotas antigas e
 * da configuração global das notificações.
 *
 * @component
 * @function App
 * @returns {JSX.Element} Estrutura principal de rotas e notificações da aplicação.
 */
function App() {
  return (
    <>
      {/* Define todas as rotas da aplicação e protege áreas por perfil. */}
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Redireciona a raiz para a primeira tela principal do operador. */}
        <Route path="/" element={<Navigate to="/operador/ordem-servico" replace />} />

        <Route
          path="/operador/clientes/cadastro"
          element={
            <ProtectedRoute allowedRoles={[ 'OPERADOR']}>
              <CadastroCliente />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/clientes/consultar"
          element={
            <ProtectedRoute allowedRoles={[ 'OPERADOR']}>
              <VisualizarClientes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/agendamentos"
          element={
            <ProtectedRoute allowedRoles={[ 'OPERADOR']}>
              <Agendamentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/agendamentos/calendario"
          element={
            <ProtectedRoute allowedRoles={[ 'OPERADOR']}>
              <CalendarioAgendamentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/ordem-servico"
          element={
            <ProtectedRoute allowedRoles={[ 'OPERADOR']}>
              <OrdemServico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/diagnosticos"
          element={
            <ProtectedRoute allowedRoles={['OPERADOR']}>
              <Diagnosticos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/servicos"
          element={
            <ProtectedRoute allowedRoles={['OPERADOR']}>
              <Servicos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador/pecas"
          element={
            <ProtectedRoute allowedRoles={[ 'OPERADOR']}>
              <Pecas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tecnico/painel"
          element={
            <ProtectedRoute allowedRoles={[ 'TECNICO']}>
              <PainelTecnico />
            </ProtectedRoute>
          }
         />

      <Route
          path="/tecnico/veiculos"
          element={
            <ProtectedRoute allowedRoles={[ 'TECNICO']}>
              <VisualizarVeiculosTecnico />
            </ProtectedRoute>
          }
        />

      <Route
          path="/tecnico/checklist"
          element={
            <ProtectedRoute allowedRoles={[ 'TECNICO']}>
              <ChecklistTecnico />
            </ProtectedRoute>
        }
      />

      <Route
        path="/tecnico/historico-veicular"
        element={
        <ProtectedRoute allowedRoles={[ 'TECNICO']}>
          <HistoricoVeicular />
        </ProtectedRoute>
        } 
      />

      <Route
        path="/tecnico/checklists"
        element={
          <ProtectedRoute allowedRoles={[ 'TECNICO']}>
            <ChecklistsVeiculo />
          </ProtectedRoute>
       }
      />

      <Route
  path="/admin/fornecedores/cadastrar"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <CadastrarFornecedor />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/fornecedores"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <VisualizarFornecedor />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/funcionarios/cadastrar"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <CadastrarFuncionarios />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/funcionarios"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <VisualizarFuncionarios />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/relatorios"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Relatorios />
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