import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Layout principal utilizado nas páginas do sistema.
 *
 * @function Layout
 * @param {Object} props - Propriedades do componente.
 * @param {*} props.children - Conteúdo principal da página.
 * @returns {Object} Estrutura visual da página.
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