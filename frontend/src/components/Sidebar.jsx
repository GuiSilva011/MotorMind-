import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

/**
 * Menu lateral responsivo que adapta as opções ao perfil do usuário.
 *
 * @returns {JSX.Element}
 */
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [openAgendamento, setOpenAgendamento] = useState(false);
  const [openOrdemServico, setOpenOrdemServico] = useState(false);

  const usuarioSalvo = localStorage.getItem('motormind_usuario');
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  const role = usuario?.Role;

  const isAdmin = role === 'ADMIN';
  const isOperador = role === 'OPERADOR';
  const isTecnico = role === 'TECNICO';

  /** Mantém o submenu visível quando a navegação já está dentro de uma seção relacionada. */
  // Mantém os submenus abertos quando o usuário navega por páginas relacionadas.
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

  /** Indica se o perfil atual pode acessar a área do operador. */
  // Helpers simples para decidir quais menus aparecem para cada perfil.
  function podeVerOperador() {
    return isOperador;
  }

  /** Indica se o perfil atual pode acessar a área do técnico. */
  function podeVerTecnico() {
    return isTecnico;
  }

  /** Alterna o estado de expansão da sidebar e limpa os submenus quando ela fecha. */
  // Recolhe ou expande a sidebar e fecha os submenus quando necessário.
  function alternarSidebar() {
    setSidebarAberta((prevState) => {
      const novaSituacao = !prevState;

      if (!novaSituacao) {
        setOpenAgendamento(false);
        setOpenOrdemServico(false);
      }

      return novaSituacao;
    });
  }

    /** Alterna a visibilidade do submenu de agendamentos. */
  // Abre/fecha o submenu de agendamentos.
  function alternarAgendamento() {
    if (!sidebarAberta) {
      setSidebarAberta(true);
      setOpenAgendamento(true);
      return;
    }

    setOpenAgendamento((prevState) => !prevState);
  }

  /** Alterna a visibilidade do submenu de ordem de serviço. */
  // Abre/fecha o submenu de ordem de serviço.
  function alternarOrdemServico() {
    if (!sidebarAberta) {
      setSidebarAberta(true);
      setOpenOrdemServico(true);
      return;
    }

    setOpenOrdemServico((prevState) => !prevState);
  }

  /** Limpa os dados de sessão e redireciona o usuário para a tela de login. */
  // Encerra a sessão removendo os dados salvos localmente.
  function sair() {
    localStorage.removeItem('motormind_usuario');
    localStorage.removeItem('motormind_ordem_servico_rascunho');
    navigate('/login');
  }

  return (
    <aside className={sidebarAberta ? 'sidebar' : 'sidebar sidebar-collapsed'}>
      <div className="sidebar-top">
        <div className="sidebar-header">
          {sidebarAberta && (
            <div className="logo">
              Motor<span className="text-orange">Mind</span>
            </div>
          )}

          <button
            type="button"
            className="sidebar-toggle"
            onClick={alternarSidebar}
            title={sidebarAberta ? 'Recolher menu' : 'Expandir menu'}
          >
            <img
              src="/icons/menu.svg"
              alt={sidebarAberta ? 'Recolher menu' : 'Expandir menu'}
              className="sidebar-toggle-icon"
            />
          </button>
        </div>

        {usuario && sidebarAberta && (
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
                end
                title="Cadastrar clientes"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/cliente.svg"
                  alt="Clientes"
                  className="menu-icon"
                />
                <span>CADASTRAR CLIENTES</span>
              </NavLink>

              <NavLink
                to="/operador/clientes/consultar"
                end
                title="Consultar clientes"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/consultar-clientes.svg"
                  alt="Consultar clientes"
                  className="menu-icon"
                />
                <span>CONSULTAR CLIENTES</span>
              </NavLink>

              <button
                type="button"
                title="Agendamentos"
                className={
                  agendamentoAtivo || openAgendamento
                    ? 'menu-item active'
                    : 'menu-item'
                }
                onClick={alternarAgendamento}
              >
                <img
                  src="/icons/agendamento.svg"
                  alt="Agendamentos"
                  className="menu-icon"
                />
                <span>AGENDAMENTOS</span>
              </button>

              {sidebarAberta && openAgendamento && (
                <div className="submenu">
                  <NavLink
                    to="/operador/agendamentos"
                    end
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/cadastrar-agendamento.svg"
                      alt="Cadastrar agendamento"
                      className="submenu-icon"
                    />
                    <span>CADASTRAR AGENDAMENTO</span>
                  </NavLink>

                  <NavLink
                    to="/operador/agendamentos/calendario"
                    end
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/calendario.svg"
                      alt="Calendário"
                      className="submenu-icon"
                    />
                    <span>VISUALIZAR CALENDÁRIO</span>
                  </NavLink>
                </div>
              )}

              <button
                type="button"
                title="Ordem de serviço"
                className={
                  ordemServicoAtivo || openOrdemServico
                    ? 'menu-item active'
                    : 'menu-item'
                }
                onClick={alternarOrdemServico}
              >
                <img
                  src="/icons/ordemservico.svg"
                  alt="Ordem de serviço"
                  className="menu-icon"
                />
                <span>ORDEM DE SERVIÇO</span>
              </button>

              {sidebarAberta && openOrdemServico && (
                <div className="submenu">
                  <NavLink
                    to="/operador/ordem-servico"
                    end
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/ordemservico.svg"
                      alt="Gerenciar OS"
                      className="submenu-icon"
                    />
                    <span>GERENCIAR OS</span>
                  </NavLink>

                  <NavLink
                    to="/operador/diagnosticos"
                    end
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/diagnostico.svg"
                      alt="Diagnósticos"
                      className="submenu-icon"
                    />
                    <span>DIAGNÓSTICOS</span>
                  </NavLink>

                  <NavLink
                    to="/operador/servicos"
                    end
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/servicos.svg"
                      alt="Serviços"
                      className="submenu-icon"
                    />
                    <span>SERVIÇOS</span>
                  </NavLink>

                  <NavLink
                    to="/operador/pecas"
                    end
                    className={({ isActive }) =>
                      isActive ? 'submenu-item active' : 'submenu-item'
                    }
                  >
                    <img
                      src="/icons/pecas.svg"
                      alt="Peças"
                      className="submenu-icon"
                    />
                    <span>PEÇAS</span>
                  </NavLink>
                </div>
              )}
            </>
          )}

          {podeVerTecnico() && (
            <>
              {/* Sidebar do técnico removida conforme regra atual. */}
            </>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/admin/relatorios"
                end
                title="Relatórios"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/informacoes.svg"
                  alt="Relatórios"
                  className="menu-icon"
                />
                <span>RELATÓRIOS</span>
              </NavLink>

              <NavLink
                to="/admin/fornecedores/cadastrar"
                end
                title="Cadastrar fornecedores"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/cliente.svg"
                  alt="Cadastrar fornecedores"
                  className="menu-icon"
                />
                <span>CADASTRAR FORNECEDORES</span>
              </NavLink>

              <NavLink
                to="/admin/fornecedores"
                end
                title="Visualizar fornecedores"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/consultar-clientes.svg"
                  alt="Visualizar fornecedores"
                  className="menu-icon"
                />
                <span>VISUALIZAR FORNECEDORES</span>
              </NavLink>

              <NavLink
                to="/admin/funcionarios/cadastrar"
                end
                title="Cadastrar funcionários"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/usuario.svg"
                  alt="Cadastrar funcionários"
                  className="menu-icon"
                />
                <span>CADASTRAR FUNCIONÁRIOS</span>
              </NavLink>

              <NavLink
                to="/admin/funcionarios"
                end
                title="Visualizar funcionários"
                className={({ isActive }) =>
                  isActive ? 'menu-item active' : 'menu-item'
                }
              >
                <img
                  src="/icons/consultar-clientes.svg"
                  alt="Visualizar funcionários"
                  className="menu-icon"
                />
                <span>VISUALIZAR FUNCIONÁRIOS</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <button type="button" className="logout-btn" onClick={sair} title="Sair">
        <img src="/icons/logout.svg" alt="Logout" className="menu-icon" />
        <span>LOGOUT</span>
      </button>
    </aside>
  );
}

export default Sidebar;