import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../styles/operadorStyles/layout.css';
import '../styles/temaOficina.css';
import '../styles/oficinaUi.css';

/**
 * Layout principal utilizado nas páginas do sistema.
 *
 * @function Layout
 * @param {Object} props - Propriedades do componente.
 * @param {*} props.children - Conteúdo principal da página.
 * @returns {Object} Estrutura visual da página.
 */
function Layout({ children, className = '', theme, topbarActions }) {
  return (
    // Estrutura base usada nas páginas internas: menu lateral + topo + conteúdo.
    <div className={`cadastro-page ${className}`.trim()} data-theme={theme}>
      <Sidebar />

      <div className="main-area">
        <Topbar actions={topbarActions} />
        {children}
      </div>
    </div>
  );
}

export default Layout;
