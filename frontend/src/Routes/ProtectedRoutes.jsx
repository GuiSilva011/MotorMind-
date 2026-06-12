import { Navigate } from 'react-router-dom';

/**
 * Garante acesso somente a usuários autenticados e, quando configurado,
 * restringe a navegação aos perfis permitidos.
 *
 * @param {{ children: import('react').ReactNode, allowedRoles?: string[] }} props - Configuração da rota protegida.
 * @returns {JSX.Element}
 */
// Bloqueia acesso a páginas internas quando não há usuário logado ou o perfil não confere.
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