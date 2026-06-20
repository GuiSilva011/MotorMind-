import { Navigate } from 'react-router-dom';

/**
 * Controla o acesso às rotas protegidas do sistema.
 *
 * Verifica se existe um usuário autenticado e se o perfil possui
 * permissão para acessar a rota solicitada.
 *
 * @component
 * @function ProtectedRoute
 * @param {Object} props - Propriedades do componente.
 * @param {*} props.children - Conteúdo protegido que será renderizado.
 * @param {string[]} [props.allowedRoles=[]] - Perfis autorizados a acessar a rota.
 * @returns {JSX.Element} Conteúdo autorizado ou redirecionamento para o login.
 */

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