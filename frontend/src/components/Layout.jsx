import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Estrutura base das páginas internas, combinando menu lateral, topo e conteúdo.
 *
 * @param {{ children: import('react').ReactNode }} props - Conteúdo principal da página.
 * @returns {JSX.Element}
 */
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