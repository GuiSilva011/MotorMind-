import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const usuarioSalvo = localStorage.getItem(
    "motormind_usuario"
  );

  const token = localStorage.getItem(
    "motormind_token"
  );

  if (!usuarioSalvo || !token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const usuario = JSON.parse(usuarioSalvo);

    if (usuario.Role === "OWNER") {
      return children;
    }

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(usuario.Role)
    ) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch {
    localStorage.removeItem("motormind_usuario");
    localStorage.removeItem("motormind_token");

    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;