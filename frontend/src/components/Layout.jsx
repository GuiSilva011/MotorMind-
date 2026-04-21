import Sidebar from './Sidebar';
import Topbar from './Topbar';

function Layout({ children }) {
  return (
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