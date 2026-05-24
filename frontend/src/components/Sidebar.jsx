import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [openAgendamento, setOpenAgendamento] = useState(false);
  const [openOrdemServico, setOpenOrdemServico] = useState(false);

  const usuarioSalvo = localStorage.getItem('motormind_usuario');
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  const role = usuario?.Role;

  const isAdmin = role === 'ADMIN';
  const isOperador = role === 'OPERADOR';
  const isTecnico = role === 'TECNICO';

  useEffect(() => {
    if (location.pathname.startsWith('/operador/agendamentos')) {
      setOpenAgendamento(true);
    }

    if (
      location.pathname.startsWith('/operador/ordem-servico') ||
      location.pathname.startsWith('/operador/diagnosticos') ||
      location.pathname.startsWith('/operador/servicos') ||
      location.pathname.startsWith('/operador/pecas')
    ) {
      setOpenOrdemServico(true);
    }
  }, [location.pathname]);

  const agendamentoAtivo = location.pathname.startsWith(
    '/operador/agendamentos'
  );

  const ordemServicoAtivo =
    location.pathname.startsWith('/operador/ordem-servico') ||
    location.pathname.startsWith('/operador/diagnosticos') ||
    location.pathname.startsWith('/operador/servicos') ||
    location.pathname.startsWith('/operador/pecas');

  function podeVerOperador() {
    return isAdmin || isOperador;
  }

  function podeVerTecnico() {
    return isAdmin || isTecnico;
  }

  function sair() {
    localStorage.removeItem('motormind_usuario');
    localStorage.removeItem('motormind_ordem_servico_rascunho');
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">
          Motor<span className="text-orange">Mind</span>
        </div>

        {usuario && (
          <div className="sidebar-user">
            <strong>{usuario.Nome}</strong>
            <span>{usuario.Role}</span>
          </div>
        )}

        <nav className="sidebar-menu">
          {podeVerOperador() && (
            <>
              <NavLink
                to="/operador/clientes/cadastro"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/cliente.svg"
                  alt="Clientes"
                  className="menu-icon"
                />
                CADASTRAR CLIENTES
              </NavLink>

              <NavLink
                to="/operador/clientes/consultar"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/consultar-clientes.svg"
                  alt="Consultar clientes"
                  className="menu-icon"
                />
                CONSULTAR CLIENTES
              </NavLink>

              <button
                type="button"
                className={
                  agendamentoAtivo || openAgendamento
                    ? 'menu-item active'
                    : 'menu-item'
                }
                onClick={() => setOpenAgendamento(!openAgendamento)}
              >
                <img
                  src="/icons/agendamento.svg"
                  alt="Agendamentos"
                  className="menu-icon"
                />
                AGENDAMENTOS
              </button>

              {openAgendamento && (
                <div className="submenu">
                  <NavLink
                    to="/operador/agendamentos"
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/cadastrar-agendamento.svg"
                      alt="Cadastrar agendamento"
                      className="submenu-icon"
                    />
                    CADASTRAR AGENDAMENTO
                  </NavLink>

                  <NavLink
                    to="/operador/agendamentos/calendario"
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/calendario.svg"
                      alt="Calendário"
                      className="submenu-icon"
                    />
                    VISUALIZAR CALENDÁRIO
                  </NavLink>
                </div>
              )}

              <button
                type="button"
                className={
                  ordemServicoAtivo || openOrdemServico
                    ? 'menu-item active'
                    : 'menu-item'
                }
                onClick={() => setOpenOrdemServico(!openOrdemServico)}
              >
                <img
                  src="/icons/ordemservico.svg"
                  alt="Ordem de serviço"
                  className="menu-icon"
                />
                ORDEM DE SERVIÇO
              </button>

              {openOrdemServico && (
                <div className="submenu">
                  <NavLink
                    to="/operador/ordem-servico"
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/ordemservico.svg"
                      alt="Gerenciar OS"
                      className="submenu-icon"
                    />
                    GERENCIAR OS
                  </NavLink>

                  <NavLink
                    to="/operador/diagnosticos"
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/diagnostico.svg"
                      alt="Diagnósticos"
                      className="submenu-icon"
                    />
                    DIAGNÓSTICOS
                  </NavLink>

                  <NavLink
                    to="/operador/servicos"
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/servicos.svg"
                      alt="Serviços"
                      className="submenu-icon"
                    />
                    SERVIÇOS
                  </NavLink>

                  <NavLink
                    to="/operador/pecas"
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/pecas.svg"
                      alt="Peças"
                      className="submenu-icon"
                    />
                    PEÇAS
                  </NavLink>
                </div>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/admin/fornecedores"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/cliente.svg"
                  alt="Fornecedores"
                  className="menu-icon"
                />
                FORNECEDORES
              </NavLink>

              <NavLink
                to="/admin/usuarios"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/usuario.svg"
                  alt="Usuários"
                  className="menu-icon"
                />
                USUÁRIOS
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <button type="button" className="logout-btn" onClick={sair}>
        <img src="/icons/logout.svg" alt="Logout" className="menu-icon" />
        LOGOUT
      </button>
    </aside>
  );
}

export default Sidebar;