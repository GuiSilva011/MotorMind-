import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/login.css';

const usuariosTeste = [
  {
    perfil: 'Administrador',
    email: 'admin@motormind.com',
    senha: 'admin123',
  },
  {
    perfil: 'Operador',
    email: 'operador@motormind.com',
    senha: 'operador123',
  },
  {
    perfil: 'Técnico',
    email: 'tecnico@motormind.com',
    senha: 'tecnico123',
  },
];

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    Email: '',
    Senha: '',
  });

  const [carregando, setCarregando] = useState(false);

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function preencherUsuario(email, senha) {
    setForm({
      Email: email,
      Senha: senha,
    });
  }

  function obterRotaInicialPorRole(role) {
    if (role === 'TECNICO') {
      return '/tecnico/painel';
    }

    if (role === 'ADMIN') {
      return '/operador/ordem-servico';
    }

    if (role === 'OPERADOR') {
      return '/operador/ordem-servico';
    }

    return '/login';
  }

  async function entrar(event) {
    event.preventDefault();

    try {
      if (!form.Email.trim()) {
        toast.warning('Informe o email.');
        return;
      }

      if (!form.Senha.trim()) {
        toast.warning('Informe a senha.');
        return;
      }

      setCarregando(true);

      const response = await api.post('/auth/login', {
        Email: form.Email.trim(),
        Senha: form.Senha.trim(),
      });

      const usuario = response.data?.usuario;

      if (!usuario) {
        toast.error('Resposta de login inválida.');
        return;
      }

      localStorage.setItem('motormind_usuario', JSON.stringify(usuario));

      toast.success(`Bem-vindo, ${usuario.Nome}!`);

      navigate(obterRotaInicialPorRole(usuario.Role));
    } catch (error) {
      console.error('Erro ao fazer login:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao fazer login.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <h1>
            Motor<span>Mind</span>
          </h1>

          <p>Sistema de gestão para oficina automotiva</p>
        </div>

        <form className="login-form" onSubmit={entrar}>
          <div className="login-title">
            <h2>Acessar sistema</h2>
            <span>Entre com um usuário pré-cadastrado.</span>
          </div>

          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={form.Email}
              onChange={(event) => atualizarCampo('Email', event.target.value)}
              placeholder="Digite seu email"
            />
          </div>

          <div className="login-field">
            <label>Senha</label>
            <input
              type="password"
              value={form.Senha}
              onChange={(event) => atualizarCampo('Senha', event.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          <button type="submit" className="login-btn" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-test-users">
          <strong>Usuários de teste</strong>

          <div className="login-users-list">
            {usuariosTeste.map((usuario) => (
              <button
                key={usuario.email}
                type="button"
                onClick={() => preencherUsuario(usuario.email, usuario.senha)}
              >
                <span>{usuario.perfil}</span>
                <small>{usuario.email}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;