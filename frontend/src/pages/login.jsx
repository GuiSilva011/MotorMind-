import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  TbAlertCircle, TbArrowLeft, TbArrowRight, TbBox, TbCar,
  TbEngine, TbEye, TbEyeOff,
  TbLock, TbMail, TbShieldCheck, TbUsers,
} from 'react-icons/tb';
import api from '../services/api';
import '../styles/login.css';

const errosVazios = { email: '', senha: '', geral: '' };

function obterRotaInicialPorRole(role) {
  if (role === 'OWNER' || role === 'ADMIN') return '/admin/relatorios';
  if (role === 'OPERADOR') return '/operador/agendamentos/calendario';
  if (role === 'TECNICO') return '/tecnico/painel';
  return '/login';
}

function Login() {
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const senhaRef = useRef(null);
  const envioEmAndamento = useRef(false);
  const [form, setForm] = useState({ Email: '', Senha: '' });
  const [carregando, setCarregando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [erros, setErros] = useState(errosVazios);

  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = 'Entrar — MotorMind';
    return () => { document.title = tituloAnterior; };
  }, []);

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({
      ...prev,
      [campo === 'Email' ? 'email' : 'senha']: '',
      geral: '',
    }));
  }

  function verificarCapsLock(event) {
    setCapsLock(Boolean(event.getModifierState?.('CapsLock')));
  }

  async function entrar(event) {
    event.preventDefault();
    if (envioEmAndamento.current) return;

    const novosErros = { ...errosVazios };
    if (!form.Email.trim()) {
      novosErros.email = 'Informe seu e-mail de acesso.';
    } else if (emailRef.current?.validity.typeMismatch) {
      novosErros.email = 'Informe um e-mail válido.';
    }
    if (!form.Senha.trim()) novosErros.senha = 'Informe sua senha.';
    setErros(novosErros);

    if (novosErros.email || novosErros.senha) {
      (novosErros.email ? emailRef : senhaRef).current?.focus();
      return;
    }

    envioEmAndamento.current = true;
    setCarregando(true);

    try {
      const response = await api.post('/auth/login', {
        Email: form.Email.trim(),
        Senha: form.Senha,
      });
      const usuario = response.data?.usuario;
      const token = response.data?.token;

      if (!usuario || !token) {
        setErros({ ...errosVazios, geral: 'Não foi possível concluir o acesso. Tente novamente.' });
        return;
      }

      localStorage.setItem('motormind_usuario', JSON.stringify(usuario));
      localStorage.setItem('motormind_token', token);
      toast.success('Bem-vindo, ' + usuario.Nome + '!');
      navigate(obterRotaInicialPorRole(usuario.Role));
    } catch (error) {
      setErros({
        ...errosVazios,
        geral: error.response?.data?.erro || error.response?.data?.detalhe ||
          'Não foi possível conectar ao sistema. Tente novamente em instantes.',
      });
    } finally {
      envioEmAndamento.current = false;
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <Link className="login-back-link" to="/"><TbArrowLeft aria-hidden="true" /> Voltar ao site</Link>

      <div className="login-shell">
        <section className="login-card" aria-labelledby="login-title">
          <header className="login-title">
            <Link className="login-brand-mark" to="/" aria-label="MotorMind — página inicial">
              <TbEngine aria-hidden="true" />
            </Link>
            <h1 id="login-title">MotorMind</h1>
            <p>Entre para acessar sua oficina.</p>
          </header>

          <form className="login-form" onSubmit={entrar} noValidate aria-busy={carregando}>
            {erros.geral && (
              <div className="login-error-banner" role="alert">
                <TbAlertCircle aria-hidden="true" /><p>{erros.geral}</p>
              </div>
            )}

            <div className="login-field">
              <label className="login-sr-only" htmlFor="email">E-mail de acesso</label>
              <div className={'login-input-wrap' + (erros.email ? ' login-input-invalid' : '')}>
                <TbMail aria-hidden="true" />
                <input ref={emailRef} id="email" name="Email" type="email" value={form.Email}
                  onChange={(event) => atualizarCampo('Email', event.target.value)}
                  placeholder="E-mail de acesso" autoComplete="username" autoCapitalize="none"
                  spellCheck={false} required disabled={carregando}
                  aria-invalid={Boolean(erros.email)} aria-describedby={erros.email ? 'login-email-error' : undefined} />
              </div>
              {erros.email && <p id="login-email-error" className="login-field-error" role="alert">{erros.email}</p>}
            </div>

            <div className="login-field">
              <label className="login-sr-only" htmlFor="senha">Senha</label>
              <div className={'login-input-wrap' + (erros.senha ? ' login-input-invalid' : '')}>
                <TbLock aria-hidden="true" />
                <input ref={senhaRef} id="senha" name="Senha" type={senhaVisivel ? 'text' : 'password'} value={form.Senha}
                  onChange={(event) => atualizarCampo('Senha', event.target.value)}
                  onKeyDown={verificarCapsLock} onKeyUp={verificarCapsLock} onBlur={() => setCapsLock(false)}
                  placeholder="Senha" autoComplete="current-password" required disabled={carregando}
                  aria-invalid={Boolean(erros.senha)}
                  aria-describedby={(erros.senha ? 'login-password-error ' : '') + (capsLock ? 'login-caps-warning' : '') || undefined} />
                <button className="login-password-toggle" type="button"
                  onClick={() => setSenhaVisivel((prev) => !prev)} onMouseDown={(event) => event.preventDefault()}
                  aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={senhaVisivel}
                  aria-controls="senha" title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'} disabled={carregando}>
                  {senhaVisivel ? <TbEyeOff aria-hidden="true" /> : <TbEye aria-hidden="true" />}
                </button>
              </div>
              {erros.senha && <p id="login-password-error" className="login-field-error" role="alert">{erros.senha}</p>}
              <p id="login-caps-warning" className="login-caps-warning" role="status">
                {capsLock && <><TbAlertCircle aria-hidden="true" /> A tecla Caps Lock está ativada.</>}
              </p>
            </div>

            <div className="login-form-divider" aria-hidden="true" />

            <button type="submit" className="login-btn" disabled={carregando}>
              {carregando ? <><span className="login-spinner" aria-hidden="true" /> Entrando...</> : <>Entrar <TbArrowRight aria-hidden="true" /></>}
            </button>
            <span className="login-sr-only" role="status">{carregando ? 'Validando suas credenciais. Aguarde.' : ''}</span>
          </form>

          <p className="login-signup">
            Sua oficina ainda não tem acesso?<br />
            <Link to="/cadastro-oficina">Cadastrar minha oficina</Link>
          </p>

          <p className="login-security-note"><TbShieldCheck aria-hidden="true" /> Acesso exclusivo para sua equipe.</p>
        </section>

        <footer className="login-page-footer">
          <p>Menos tarefas soltas.<br /><strong>Mais controle da sua oficina.</strong></p>
          <div className="login-workshop-icons" aria-hidden="true">
            <span><TbCar /></span><span><TbBox /></span><span><TbUsers /></span>
          </div>
          <span className="login-footer-caption">Atendimento · Estoque · Equipe</span>
        </footer>
      </div>
    </main>
  );
}

export default Login;
