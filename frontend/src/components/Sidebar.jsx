import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const [openAgendamento, setOpenAgendamento] = useState(false);
  const [openOrdemServico, setOpenOrdemServico] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/agendamentos')) {
      setOpenAgendamento(true);
    }

    if (
      location.pathname.startsWith('/ordemServico') ||
      location.pathname.startsWith('/diagnosticos') ||
      location.pathname.startsWith('/servicos') ||
      location.pathname.startsWith('/pecas')
    ) {
      setOpenOrdemServico(true);
    }
  }, [location.pathname]);

  const agendamentoAtivo = location.pathname.startsWith('/agendamentos');

  const ordemServicoAtivo =
    location.pathname.startsWith('/ordemServico') ||
    location.pathname.startsWith('/diagnosticos') ||
    location.pathname.startsWith('/servicos') ||
    location.pathname.startsWith('/pecas');

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">
          Motor<span className="text-orange">Mind</span>
        </div>

        <nav className="sidebar-menu">
          <NavLink
            to="/clientes/cadastro"
            className={({ isActive }) =>
              isActive ? 'menu-item active' : 'menu-item'
            }
          >
            <img src="/icons/cliente.svg" alt="Clientes" className="menu-icon" />
            CADASTRAR CLIENTES
          </NavLink>

          <NavLink
            to="/clientes/consultar"
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
                to="/agendamentos"
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
                to="/agendamentos/calendario"
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
                to="/ordemServico"
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
                to="/diagnosticos/cadastro"
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
                to="/servicos/cadastro"
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
                to="/pecas/cadastro"
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
        </nav>
      </div>

      <button type="button" className="logout-btn">
        <img src="/icons/logout.svg" alt="Logout" className="menu-icon" />
        LOGOUT
      </button>
    </aside>
  );
}

export default Sidebar;