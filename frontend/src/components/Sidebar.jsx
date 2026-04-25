import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const [openAgendamento, setOpenAgendamento] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/agendamentos')) {
      setOpenAgendamento(true);
    }
  }, [location.pathname]);

  const agendamentoAtivo = location.pathname.startsWith('/agendamentos');

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
            className={agendamentoAtivo || openAgendamento ? 'menu-item active' : 'menu-item'}
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

          <button type="button" className="menu-item">
            <img
              src="/icons/ordemservico.svg"
              alt="Ordem de serviço"
              className="menu-icon"
            />
            ORDEM DE SERVIÇO
          </button>
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