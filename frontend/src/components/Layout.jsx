import Sidebar from './Sidebar';
import Topbar from './Topbar';

function Layout({ children }) {
  return (
    // Estrutura base usada nas páginas internas: menu lateral + topo + conteúdo.
    <div className="cadastro-page">
      <Sidebar />

      <div className="main-area">
        <Topbar />
        {children}
      </div>
    </div>
  );
}

export default Layout;