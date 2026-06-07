import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/login.css';

const usuariosTeste = [
  {
    perfil: 'Admin',
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

  // Atualiza qualquer campo do formulário de login.
  function atualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  // Preenche email e senha com um usuário de teste.
  function preencherUsuario(email, senha) {
    setForm({
      Email: email,
      Senha: senha,
    });
  }

  // Escolhe a rota inicial de acordo com o perfil retornado pelo backend.
  function obterRotaInicialPorRole(role) {
    if (role === 'TECNICO') return '/tecnico/painel';
    if (role === 'ADMIN') return '/admin/relatorios';
    if (role === 'OPERADOR') return '/operador/agendamentos/calendario';

    return '/login';
  }

  // Envia as credenciais para a API e salva o usuário autenticado localmente.
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
        <aside className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-logo">
              Motor<span>Mind</span>
            </div>

            <div>
              <h1>Controle inteligente para oficinas.</h1>
              <p>
                Organize clientes, veículos, checklists, agendamentos e ordens
                de serviço em um só sistema.
              </p>
            </div>
          </div>

          <div className="login-brand-footer">
            <span>Gestão automotiva</span>
            <strong>MotorMind</strong>
          </div>
        </aside>

        <section className="login-form-panel">
          <form className="login-form" onSubmit={entrar}>
            <div className="login-title">
              <span>Acesso ao sistema</span>
              <h2>Entrar</h2>
              <p>Informe suas credenciais para acessar o painel.</p>
            </div>

            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                value={form.Email}
                onChange={(event) => atualizarCampo('Email', event.target.value)}
                placeholder="seuemail@motormind.com"
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label>Senha</label>
              <input
                type="password"
                value={form.Senha}
                onChange={(event) => atualizarCampo('Senha', event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Acessar sistema'}
            </button>
          </form>

          <div className="login-test-users">
            <div className="login-test-header">
              <span>Usuários de teste</span>
            </div>

            <div className="login-users-list">
              {usuariosTeste.map((usuario) => (
                <button
                  key={usuario.email}
                  type="button"
                  onClick={() => preencherUsuario(usuario.email, usuario.senha)}
                >
                  {usuario.perfil}
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Login;