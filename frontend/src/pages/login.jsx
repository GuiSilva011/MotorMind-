import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiUsers, FiTool, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import '../website/landingPage.css';
import '../website/cadastroOficina.css';
import '../styles/login.css';

const usuariosTeste = [
  { perfil: 'Admin', email: 'admin@motormind.com', senha: 'admin123', icon: FiShield },
  { perfil: 'Operador', email: 'operador@motormind.com', senha: 'operador123', icon: FiUsers },
  { perfil: 'Técnico', email: 'tecnico@motormind.com', senha: 'tecnico123', icon: FiTool },
];

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Email: '', Senha: '' });
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Entrar no MotorMind — Acesso à oficina';
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, []);

  function atualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  function preencherUsuario(email, senha) {
    setForm({ Email: email, Senha: senha });
  }

  function obterRotaInicialPorRole(role) {
    if (role === 'OWNER' || role === 'ADMIN') return '/admin/relatorios';
    if (role === 'OPERADOR') return '/operador/agendamentos/calendario';
    if (role === 'TECNICO') return '/tecnico/painel';
    return '/login';
  }

  async function entrar(event) {
    event.preventDefault();
    try {
      if (!form.Email.trim()) { toast.warning('Informe o email.'); return; }
      if (!form.Senha.trim()) { toast.warning('Informe a senha.'); return; }
      setCarregando(true);
      const response = await api.post('/auth/login', {
        Email: form.Email.trim(),
        Senha: form.Senha,
      });
      const usuario = response.data?.usuario;
      const token = response.data?.token;
      if (!usuario || !token) { toast.error('Resposta de login inválida.'); return; }
      localStorage.setItem('motormind_usuario', JSON.stringify(usuario));
      localStorage.setItem('motormind_token', token);
      toast.success(`Bem-vindo, ${usuario.Nome}!`);
      navigate(obterRotaInicialPorRole(usuario.Role));
    } catch (error) {
      toast.error(error.response?.data?.erro || error.response?.data?.detalhe || 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="landing-page ml-page">
      <div className="mm-ambient-light light-top" aria-hidden="true" />
      <header className="mm-header scrolled">
        <div className="mm-container header-inner">
          <Link to="/" className="mm-brand" aria-label="MotorMind — página inicial">
            <img src="/logo.png" alt="MotorMind" className="mm-logo-img" />
          </Link>
          <div className="header-actions">
            <Link className="co-btn-text" to="/">Voltar ao site</Link>
            <Link className="mm-button small" to="/cadastro-oficina">Cadastrar oficina <FiArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <main className="ml-main">
        <div className="ml-layout">
          <section className="ml-form-panel" aria-labelledby="ml-title">
            <Link to="/" className="co-back-link"><FiArrowLeft /> Voltar ao site</Link>
            <div className="ml-heading">
              <span className="co-eyebrow">ACESSO RESTRITO</span>
              <h1 id="ml-title">Bem-vindo <span>de volta.</span></h1>
              <p>Informe as suas credenciais para aceder ao painel da sua oficina.</p>
            </div>

            <div className="ml-access-card">
              <div className="ml-card-heading">
                <span className="ml-step-badge"><FiLock aria-hidden="true" /></span>
                <div>
                  <strong>Entrar na sua oficina</strong>
                  <p>Utilize seus dados de acesso</p>
                </div>
              </div>
              <form className="ml-form" onSubmit={entrar} aria-busy={carregando}>
                <div className="ml-field">
                  <label htmlFor="email">E-mail</label>
                  <div className="ml-input-wrap">
                    <FiMail aria-hidden="true" />
                    <input id="email" type="email" value={form.Email}
                      onChange={e => atualizarCampo('Email', e.target.value)}
                      placeholder="seuemail@motormind.com" autoComplete="email" disabled={carregando} />
                  </div>
                </div>
                <div className="ml-field">
                  <label htmlFor="senha">Senha</label>
                  <div className="ml-input-wrap">
                    <FiLock aria-hidden="true" />
                    <input id="senha" type={mostrarSenha ? 'text' : 'password'} value={form.Senha}
                      onChange={e => atualizarCampo('Senha', e.target.value)}
                      placeholder="Digite a sua senha" autoComplete="current-password" disabled={carregando} />
                    <button type="button" className="ml-password-toggle"
                      onClick={() => setMostrarSenha(v => !v)}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={mostrarSenha}>
                      {mostrarSenha ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="co-btn-primary ml-submit" disabled={carregando}>
                  {carregando ? <><span className="ml-spinner" /> A entrar...</> : <>Acessar sistema <FiArrowRight /></>}
                </button>
              </form>
            </div>

            <div className="ml-test-users">
              <div className="ml-test-heading">
                <div><span className="ml-test-dot" /> <strong>Usuários de teste</strong></div>
                <small>Preenchimento rápido</small>
              </div>
              <div className="ml-test-grid">
                {usuariosTeste.map(usuario => {
                  const UserIcon = usuario.icon;
                  return (
                    <button key={usuario.email} type="button" disabled={carregando}
                      onClick={() => preencherUsuario(usuario.email, usuario.senha)}>
                      <UserIcon aria-hidden="true" />
                      <span>{usuario.perfil}</span>
                      <FiArrowRight className="ml-test-arrow" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="ml-aside" aria-label="Conheça o MotorMind">
            <div className="ml-aside-glow" aria-hidden="true" />
            <div className="ml-aside-content">
              <span className="co-badge">PLATAFORMA MOTORMIND</span>
              <h2>O controle da sua oficina, <span>em um só lugar.</span></h2>
              <p>Da recepção ao box, mantenha a operação conectada com uma experiência feita para cada perfil da equipe.</p>
              <div className="ml-aside-divider" />
              <ul className="ml-feature-list">
                <li><span><FiCheck /></span> Ordens de serviço e agendamentos integrados</li>
                <li><span><FiCheck /></span> Estoque, checklists e solicitações de peças</li>
                <li><span><FiCheck /></span> Comunicação entre operador e técnico</li>
                <li><span><FiCheck /></span> Painéis específicos para cada perfil</li>
              </ul>
              <div className="ml-aside-note">
                <FiShield aria-hidden="true" />
                <div><strong>Um ambiente para a sua equipe</strong><p>Administrador, operador e técnico acedem aos recursos de acordo com as suas permissões.</p></div>
              </div>
              <div className="ml-aside-footer">
                <span>Ainda não cadastrou a sua oficina?</span>
                <Link to="/cadastro-oficina">Começar com MotorMind <FiArrowRight /></Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer className="co-footer ml-footer"><div className="mm-container"><p>© {new Date().getFullYear()} MotorMind · Sistema Web Integrado para Oficinas Mecânicas</p></div></footer>
    </div>
  );
}

export default Login;
