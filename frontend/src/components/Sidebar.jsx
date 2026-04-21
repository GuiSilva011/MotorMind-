function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        
        {/* LOGO */}
        <div className="logo">
          Motor<span className="text-orange">Mind</span>
        </div>

            {/* MENU */}
        <nav className="sidebar-menu">

          <button className="menu-item active">
            <img
              src="/icons/cliente.svg"
              alt="Clientes"
              className="menu-icon"
            />
            CADASTRAR CLIENTES
          </button>

          <button className="menu-item">
            <img
              src="/icons/consultar-clientes.svg"
              alt="Consultar clientes"
              className="menu-icon"
            />
            CONSULTAR CLIENTES
          </button>

          <button className="menu-item">
            <img
              src="/icons/agendamento.svg"
              alt="Agendamentos"
              className="menu-icon"
            />
            AGENDAMENTOS
          </button>

          <button className="menu-item">
            <img
              src="/icons/ordemservico.svg"
              alt="Ordem de serviço"
              className="menu-icon"
            />
            ORDEM DE SERVIÇO
          </button>

        </nav>
      </div>

      {/* LOGOUT */}
      <button className="logout-btn">
        <img
          src="/icons/logout.svg"
          alt="Logout"
          className="menu-icon"
        />
        LOGOUT
      </button>
    </aside>
  );
}

export default Sidebar;