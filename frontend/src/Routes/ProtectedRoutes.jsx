import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const usuarioSalvo = localStorage.getItem('motormind_usuario');

  if (!usuarioSalvo) {
    return <Navigate to="/login" replace />;
  }

  const usuario = JSON.parse(usuarioSalvo);

  if (allowedRoles.length > 0 && !allowedRoles.includes(usuario.Role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;