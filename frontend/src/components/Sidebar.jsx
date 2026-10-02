import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiPackage, FiMessageSquare } from 'react-icons/fi';
import Navbars from './ui/navbars';

/**
 * Menu lateral responsivo que adapta as opções ao perfil do usuário.
 *
 * @returns {JSX.Element}
 */
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [submenus, setSubmenus] = useState(null);

  const usuarioSalvo = localStorage.getItem('motormind_usuario');
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  const role = usuario?.Role;

  const isAdmin = role === 'ADMIN';
  const isOperador = role === 'OPERADOR';
  const isTecnico = role === 'TECNICO';

  const agendamentoAtivo = location.pathname.startsWith(
    '/operador/agendamentos'
  );

  const ordemServicoAtivo =
    location.pathname.startsWith('/operador/ordem-servico') ||
    location.pathname.startsWith('/operador/diagnosticos') ||
    location.pathname.startsWith('/operador/servicos') ||
    location.pathname.startsWith('/operador/pecas');

  // A seção da rota atual abre automaticamente, sem um efeito adicional.
  const openAgendamento = submenus?.pathname === location.pathname
    ? submenus.agendamento : agendamentoAtivo;
  const openOrdemServico = submenus?.pathname === location.pathname
    ? submenus.ordemServico : ordemServicoAtivo;

  /** Indica se o perfil atual pode acessar a área do operador. */
  // Helpers simples para decidir quais menus aparecem para cada perfil.
  function podeVerOperador() {
    return isOperador;
  }

  /** Indica se o perfil atual pode acessar a área do técnico. */
  function podeVerTecnico() {
    return isTecnico;
  }

  /** Alterna o estado de expansão da sidebar. */
  function alternarSidebar() {
    setSidebarAberta(!sidebarAberta);
  }

  /** Alterna a visibilidade do submenu de agendamentos. */
  // Abre/fecha o submenu de agendamentos.
  function alternarAgendamento() {
    if (!sidebarAberta) {
      setSidebarAberta(true);
    }
    setSubmenus({ pathname: location.pathname,
      agendamento: !sidebarAberta || !openAgendamento, ordemServico: openOrdemServico });
  }

  /** Alterna a visibilidade do submenu de ordem de serviço. */
  // Abre/fecha o submenu de ordem de serviço.
  function alternarOrdemServico() {
    if (!sidebarAberta) {
      setSidebarAberta(true);
    }
    setSubmenus({ pathname: location.pathname,
      agendamento: openAgendamento, ordemServico: !sidebarAberta || !openOrdemServico });
  }

  /** Limpa os dados de sessão e redireciona o usuário para a tela de login. */
  // Encerra a sessão removendo os dados salvos localmente.
  function sair() {
    localStorage.removeItem('motormind_usuario');
    localStorage.removeItem('motormind_ordem_servico_rascunho');
    navigate('/login');
  }

  return (
    <Navbars expanded={sidebarAberta} onToggle={alternarSidebar} footer={
      <button type="button" className="logout-btn" onClick={sair} title="Sair" aria-label="Sair">
        <img src="/icons/logout.svg" alt="" className="menu-icon" />
        <span>Sair</span>
      </button>
    }>
        <nav id="sidebar-navigation" className="sidebar-menu" aria-label="Navegação principal">
          {['TECNICO', 'OPERADOR', 'ADMIN', 'OWNER'].includes(role) && <NavLink to="/tickets" title="Solicitações de peças"
            className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
            <FiMessageSquare className="menu-icon" aria-hidden="true" /><span>Solicitações de peças</span>
          </NavLink>}
          {(isAdmin || isOperador || role === 'OWNER') && (
            <NavLink to="/estoque" title="Estoque"
              className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
              <FiPackage className="menu-icon" aria-hidden="true" />
              <span>Estoque</span>
            </NavLink>
          )}
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
                <span>Cadastrar clientes</span>
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
                <span>Consultar clientes</span>
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
                aria-label="Agendamentos"
                aria-expanded={openAgendamento}
                aria-controls="submenu-agendamentos"
              >
                <img
                  src="/icons/agendamento.svg"
                  alt="Agendamentos"
                  className="menu-icon"
                />
                <span>Agendamentos</span>
                <span className={openAgendamento ? 'submenu-chevron is-open' : 'submenu-chevron'} aria-hidden="true" />
              </button>

              {openAgendamento && (
                <div id="submenu-agendamentos" className="submenu">
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
                    <span>Cadastrar agendamento</span>
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
                    <span>Visualizar calendário</span>
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
                aria-label="Ordem de serviço"
                aria-expanded={openOrdemServico}
                aria-controls="submenu-ordem-servico"
              >
                <img
                  src="/icons/ordemservico.svg"
                  alt="Ordem de serviço"
                  className="menu-icon"
                />
                <span>Ordem de serviço</span>
                <span className={openOrdemServico ? 'submenu-chevron is-open' : 'submenu-chevron'} aria-hidden="true" />
              </button>

              {openOrdemServico && (
                <div id="submenu-ordem-servico" className="submenu">
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
                    <span>Gerenciar OS</span>
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
                    <span>Diagnósticos</span>
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
                    <span>Serviços</span>
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
                    <span>Peças</span>
                  </NavLink>
                </div>
              )}
            </>
          )}

          {podeVerTecnico() && (
            <>
              <NavLink to="/tecnico/painel" title="Painel técnico" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                <FiPackage className="menu-icon" aria-hidden="true" /><span>Painel técnico</span>
              </NavLink>
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
                <span>Relatórios</span>
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
                <span>Cadastrar fornecedores</span>
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
                <span>Visualizar fornecedores</span>
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
                <span>Cadastrar funcionários</span>
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
                <span>Visualizar funcionários</span>
              </NavLink>
            </>
          )}
        </nav>
    </Navbars>
  );
}

export default Sidebar;
