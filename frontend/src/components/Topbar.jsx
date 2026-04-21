

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-btn">
          <img
            src="/icons/menu.svg"
            alt="Abrir menu"
            className="topbar-icon"
          />
        </button>
      </div>

      <div className="topbar-right">
        <button type="button" className="topbar-btn">
          <img
            src="/icons/notificacao.svg"
            alt="Notificações"
            className="topbar-icon"
          />
        </button>

        <button type="button" className="avatar-placeholder">
          <img
            src="/icons/usuario.svg"
            alt="Perfil"
            className="avatar-icon"
          />
        </button>
      </div>
    </header>
  );
}

export default Topbar;