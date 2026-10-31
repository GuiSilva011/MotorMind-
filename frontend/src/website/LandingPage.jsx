import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './landingPage.css';

const Icon = ({ name, size = 20, ...props }) => {
  const paths = {
    wrench: <><path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7Z"/></>,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-12 5h2m4 0h2"/></>,
    camera: <><path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="14" r="3.5"/></>,
    file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M13 2v7h7M8 13h8m-8 4h6"/></>,
    chat: <><path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.8-.3-4-1L3 21l1.8-5A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 11h8m-8 4h5"/></>,
    box: <><path d="m12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7M12 12v10"/></>,
    chart: <><path d="M4 20V4m0 16h16M8 16l4-5 3 2 5-7"/></>,
    check: <><path d="m4 12 5 5L20 6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-16a4 4 0 0 1 0 8m6 8v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    car: <><path d="m5 11 2-5h10l2 5M4 17H3v-5l2-2h14l2 2v5h-1m-16 0h16M6 17v3m12-3v3M7 14h2m6 0h2"/></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 8 10-8"/></>,
    bolt: <><path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    x: <path d="M5 5 19 19M19 5 5 19"/>,
    play: <path d="m9 6 10 6-10 6V6Z"/>,
    whatsapp: <><path d="M20.5 11.5A8.5 8.5 0 0 1 8 19l-5 2 1.6-5.1A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M9 8c0 4 3 7 7 7"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.wrench}</svg>;
};

const modules = [
  { id:'agenda', label:'Agenda e recepção', eyebrow:'01 / ORGANIZAÇÃO', icon:'calendar', title:'Cada atendimento começa com organização.', description:'Visualize os agendamentos por dia, semana ou mês. Evite conflitos de horário e mantenha cada compromisso vinculado ao cliente e ao veículo.', points:['Agenda visual sem horários sobrepostos','Cadastro integrado de clientes e veículos','Visão clara da rotina da recepção'] },
  { id:'checklist', label:'Checklist fotográfico', eyebrow:'02 / INSPEÇÃO', icon:'camera', title:'A condição do veículo, registrada em detalhes.', description:'Documente a entrada e o diagnóstico com observações e imagens dos ângulos definidos no sistema. Mais rastreabilidade para a equipe e para o atendimento.', points:['Duas etapas: entrada e diagnóstico','Fotos frontal, lateral, traseira e teto','Observações vinculadas ao histórico'] },
  { id:'os', label:'Ordem de serviço', eyebrow:'03 / EXECUÇÃO', icon:'file', title:'Tudo sobre o serviço em um só lugar.', description:'Organize diagnósticos, serviços, peças do estoque ou avulsas, valores e técnico responsável em uma ordem de serviço estruturada.', points:['Composição e cálculo do orçamento','Vinculação direta ao mecânico','Acompanhamento das etapas da OS'] },
  { id:'tickets', label:'Tickets e chat', eyebrow:'04 / COLABORAÇÃO', icon:'chat', title:'O box e o balcão falando a mesma língua.', description:'O técnico solicita peças adicionais pela própria OS. Um operador assume o ticket e conversa em um chat privado, inclusive com envio de imagens.', points:['Múltiplos itens no mesmo pedido','Status de atendimento em tempo real','Limpeza de mensagens e mídias após 48h'] },
  { id:'estoque', label:'Estoque e alertas', eyebrow:'05 / SUPRIMENTOS', icon:'box', title:'Mais controle sobre cada peça.', description:'Acompanhe entradas, saídas e devoluções, defina saldos mínimos e receba alertas automáticos na central de notificações e por e-mail.', points:['Movimentações ligadas às ordens de serviço','Alertas de estoque mínimo','Histórico de entradas e saídas'] },
  { id:'relatorios', label:'Cotações e relatórios', eyebrow:'06 / INTELIGÊNCIA', icon:'chart', title:'Da cotação à decisão, com informação.', description:'Gere mensagens padronizadas para WhatsApp com dados técnicos do veículo e consulte rankings de peças, serviços, modelos e marcas mais recorrentes.', points:['Cotação e orçamento via WhatsApp','Dados do veículo na mensagem','Relatórios e rankings analíticos'] },
];

const profiles = [
 { name:'Administrador', title:'Visão completa para quem administra.', subtitle:'Gestor / proprietário', icon:'shield', text:'Transforme dados operacionais em decisões e mantenha a estrutura da oficina organizada.', permissions:['Gestão de estoque, movimentações e limites mínimos','Relatórios de peças, serviços, veículos e marcas','Cadastro de equipe, perfis e fornecedores','Tickets, central de notificações e alertas críticos'], metric:'GESTÃO', metricDesc:'Controle administrativo' },
 { name:'Operador', title:'O controle do atendimento ao pátio.', subtitle:'Atendente / estoquista', icon:'users', text:'Conecte clientes, ordens de serviço, peças e equipe técnica em um único fluxo de trabalho.', permissions:['Cadastro de clientes, veículos e agendamentos','Criação de OS e atribuição ao técnico','Atendimento de tickets, status e chat','Estoque, cotações e orçamentos via WhatsApp'], metric:'OPERAÇÃO', metricDesc:'Recepção e suprimentos' },
 { name:'Técnico', title:'Mais foco no veículo, menos burocracia.', subtitle:'Mecânico', icon:'wrench', text:'Uma área de trabalho clara para acompanhar os serviços atribuídos e colaborar com a recepção.', permissions:['Painel individual das ordens atribuídas','Checklists de entrada e diagnóstico com fotos','Tickets para solicitar peças adicionais','Chat privado e histórico de manutenções'], metric:'BOX', metricDesc:'Execução mecânica' },
];

const faqs = [
 ['Preciso instalar algum programa na oficina?', 'O MotorMind é uma aplicação web acessada pelo navegador. A interface foi pensada para o computador da recepção e para o uso operacional em dispositivos compatíveis.'],
 ['O MotorMind cobra mensalidade?', 'A modalidade prevista no TCC é a compra de uma licença de uso com pagamento único, no cadastro da oficina. Os valores e condições comerciais devem ser apresentados na etapa de aquisição.'],
 ['Quando o sistema é liberado?', 'Após cadastrar a oficina e concluir a compra, a liberação das funcionalidades depende da confirmação do pagamento da licença.'],
 ['Como funciona o envio pelo WhatsApp?', 'O sistema prepara mensagens padronizadas com os dados do veículo e as peças ou serviços relacionados, destinadas à cotação com fornecedores ou ao orçamento para clientes.'],
 ['Como são solicitadas peças durante o serviço?', 'O técnico abre um ticket na ordem de serviço, informa os itens necessários e acompanha o atendimento. Um operador assume a solicitação e pode interagir com o técnico por chat exclusivo.'],
 ['Os dados de outras oficinas ficam visíveis?', 'Não. O projeto prevê isolamento de dados entre oficinas e controle de acesso conforme o perfil de cada usuário.'],
];

function useRotation(total, delay) {
 const [index,setIndex] = useState(0);
 const [paused,setPaused] = useState(false);
 const [cycle,setCycle] = useState(0);
 useEffect(()=>{if(paused)return;const t=setTimeout(()=>{setIndex(v=>(v+1)%total);setCycle(v=>v+1)},delay);return()=>clearTimeout(t)},[index,paused,cycle,total,delay]);
 const select = n=>{setIndex(n);setCycle(v=>v+1)};
 return {index,select,paused,setPaused,cycle};
}

function Dots({ count, active, onChange, label }) {return <div className="mm-dots" aria-label={label}>{Array.from({length:count},(_,i)=><button type="button" key={i} className={i===active?'active':''} aria-label={`Mostrar destaque ${i+1}`} aria-pressed={i===active} onClick={()=>onChange(i)}/>)}</div>}

function Preview({ type }) {
 if(type==='agenda')return <div className="demo-content"><div className="demo-topline"><span>Agenda da oficina</span><span className="demo-light-tag">SEMANA</span></div><div className="demo-calendar"><div className="demo-week">{['SEG','TER','QUA','QUI','SEX'].map((d,i)=><span key={d}>{d}<b>{19+i}</b></span>)}</div><div className="demo-schedule"><div className="demo-time">08h<br/>10h<br/>12h<br/>14h</div><div className="demo-events"><span className="event event-a">08:30 · Revisão preventiva</span><span className="event event-b">10:00 · Inspeção</span><span className="event event-c">13:30 · Troca de óleo</span></div></div></div><div className="demo-bottom"><Icon name="check" size={15}/> Horários organizados, sem sobreposição</div></div>;
 if(type==='checklist')return <div className="demo-content"><div className="demo-topline"><span>Inspeção do veículo</span><span className="demo-light-tag">ENTRADA</span></div><div className="demo-car"><Icon name="car" size={100}/><span>REGISTRO FOTOGRÁFICO</span></div><div className="demo-photo-grid">{['Frontal','Lateral','Traseira','Teto'].map(x=><div key={x}><Icon name="camera" size={20}/><small>{x}</small><Icon name="check" size={13}/></div>)}</div><div className="demo-bottom"><Icon name="check" size={15}/> Observações vinculadas ao checklist</div></div>;
 if(type==='tickets')return <div className="demo-content"><div className="demo-topline"><span>Ticket #024 · OS #1048</span><span className="demo-light-tag">EM ATENDIMENTO</span></div><div className="demo-chat"><div className="bubble theirs"><small>Técnico · 10:32</small>Preciso de 2 pastilhas dianteiras para concluir a OS.</div><div className="bubble ours"><small>Operador · 10:34</small>Recebi a solicitação. Vou verificar o estoque.</div><div className="bubble theirs"><small>Técnico · 10:35</small><Icon name="camera" size={15}/> Foto da peça anexada</div></div><div className="demo-bottom"><Icon name="lock" size={15}/> Chat exclusivo do ticket · mídias por 48h</div></div>;
 if(type==='estoque')return <div className="demo-content"><div className="demo-topline"><span>Estoque físico</span><span className="demo-light-tag">AO VIVO</span></div><div className="demo-table"><div className="demo-table-head"><span>PEÇA</span><span>SALDO</span><span>SITUAÇÃO</span></div>{[['Filtro de óleo','18','Disponível'],['Pastilha dianteira','02','Baixo'],['Correia dentada','11','Disponível']].map(([a,b,c])=><div className="demo-table-row" key={a}><span>{a}</span><b>{b}</b><em className={c==='Baixo'?'low':''}>{c}</em></div>)}</div><div className="demo-alert"><Icon name="bell" size={18}/> Estoque mínimo atingido: Pastilha dianteira</div></div>;
 if(type==='relatorios')return <div className="demo-content"><div className="demo-topline"><span>Indicadores da oficina</span><span className="demo-light-tag">RELATÓRIOS</span></div><div className="demo-stat-grid"><div><small>PEÇAS MAIS UTILIZADAS</small><b>Ranking</b></div><div><small>SERVIÇOS REALIZADOS</small><b>Resumo</b></div></div><div className="demo-bars">{[['Troca de óleo',90],['Filtros',72],['Freios',57],['Revisão',42]].map(([l,n])=><div key={l}><span>{l}</span><i><em style={{width:`${n}%`}}/></i></div>)}</div><div className="demo-bottom"><Icon name="whatsapp" size={16}/> Cotações com dados técnicos do veículo</div></div>;
 return <div className="demo-content"><div className="demo-topline"><span>Ordem de serviço #1048</span><span className="demo-light-tag">EM EXECUÇÃO</span></div><div className="demo-os-head"><div><small>VEÍCULO</small><strong>Veículo em atendimento</strong><span>Cliente e técnico vinculados</span></div><Icon name="car" size={40}/></div><div className="demo-os-lines"><div><Icon name="check" size={16}/> Diagnóstico registrado <b>Concluído</b></div><div><Icon name="check" size={16}/> Serviços e peças <b>Vinculados</b></div><div><Icon name="clock" size={16}/> Execução mecânica <b>Em andamento</b></div></div><div className="demo-total"><span>Total da OS</span><strong>Calculado automaticamente</strong></div></div>;
}

function DemoFrame({type, label}) {return <div className="demo-shell"><div className="demo-chrome"><div className="demo-dots"><i/><i/><i/></div><span>MotorMind / {label}</span><Icon name="lock" size={13}/></div><div key={type} className="demo-swap"><Preview type={type}/></div></div>}

function AppSection({label,title,description}) {return <div className="section-intro reveal"><span className="eyebrow">{label}</span><h2>{title}</h2><p>{description}</p></div>}

export default function LandingPage(){
 const hero=useRotation(3,4800), mods=useRotation(modules.length,6500), users=useRotation(profiles.length,7400);
 const [menu,setMenu]=useState(false), [openFaq,setOpenFaq]=useState(0),[scrolled,setScrolled]=useState(false);
 const heroItems=[{type:'os',name:'Ordens de serviço'},{type:'tickets',name:'Tickets e chat'},{type:'checklist',name:'Checklist com fotos'}];
 const activeModule=modules[mods.index], activeProfile=profiles[users.index];

 useEffect(()=>{const old=document.title;document.title='MotorMind | Gestão inteligente para oficinas mecânicas';const onScroll=()=>setScrolled(window.scrollY>24);window.addEventListener('scroll',onScroll,{passive:true});onScroll();return()=>{document.title=old;window.removeEventListener('scroll',onScroll)}},[]);
 useEffect(()=>{if(!('IntersectionObserver' in window))return;const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.landing-page .reveal').forEach(el=>obs.observe(el));return()=>obs.disconnect()},[]);

 return (
  <div className="landing-page" id="topo">
   <header className={`mm-header ${scrolled?'scrolled':''}`}>
    <div className="mm-container header-inner">
     
     {/* CABEÇALHO - LOGO ATUALIZADA AQUI */}
     <a href="#topo" className="mm-brand" onClick={()=>setMenu(false)}>
      <img src="/logo.png" alt="MotorMind" className="mm-logo-img" />
     </a>

     <nav className={menu?'open':''} aria-label="Navegação principal" id="mm-navigation">
      <a href="#funcionalidades" onClick={()=>setMenu(false)}>Funcionalidades</a>
      <a href="#perfis" onClick={()=>setMenu(false)}>Perfis</a>
      <a href="#licenca" onClick={()=>setMenu(false)}>Licença</a>
      <a href="#duvidas" onClick={()=>setMenu(false)}>Dúvidas</a>
      <div className="mobile-links">
       <Link to="/login">Entrar</Link>
       <Link to="/cadastro-oficina">Adquirir licença</Link>
      </div>
     </nav>
     <div className="header-actions">
      <Link className="signin" to="/login">Entrar</Link>
      <Link className="mm-button small" to="/cadastro-oficina">Adquirir licença <Icon name="arrow" size={16}/></Link>
     </div>
     <button className="nav-toggle" aria-controls="mm-navigation" aria-expanded={menu} aria-label={menu?'Fechar menu':'Abrir menu'} onClick={()=>setMenu(v=>!v)}>
      <Icon name={menu?'x':'menu'} size={25}/>
     </button>
    </div>
   </header>

   <main>
    <section className="mm-hero">
     <div className="hero-grid-glow"/>
     <div className="mm-container hero-layout">
      <div className="hero-copy">
       <div className="eyebrow hero-pill"><span className="pulse"/> TECNOLOGIA PARA UMA OFICINA MAIS ORGANIZADA</div>
       <h1>Sua oficina evolui quando <span>tudo trabalha junto.</span></h1>
       <p>Chega de planilhas soltas, informações perdidas e retrabalho. Centralize ordens de serviço, agendamentos, estoque e comunicação com a equipe em um único sistema.</p>
       <div className="hero-actions">
        <Link to="/cadastro-oficina" className="mm-button">Transformar minha oficina <Icon name="arrow" size={19}/></Link>
        <a className="mm-button mm-button-secondary" href="#funcionalidades">Explorar funcionalidades</a>
       </div>
       <div className="hero-trust">
        <span><Icon name="check" size={16}/> Operação centralizada</span>
        <span><Icon name="check" size={16}/> 3 perfis de acesso</span>
        <span><Icon name="check" size={16}/> Licença única</span>
       </div>
      </div>
      <div className="hero-showcase" onMouseEnter={()=>hero.setPaused(true)} onMouseLeave={()=>hero.setPaused(false)} onFocusCapture={()=>hero.setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))hero.setPaused(false)}}>
       <div className="showcase-label">
        <span><span className="status-dot"/> VISÃO DO SISTEMA</span>
        <span>PRÉVIA ILUSTRATIVA</span>
       </div>
       <DemoFrame type={heroItems[hero.index].type} label={heroItems[hero.index].name}/>
       <div className="showcase-bottom">
        <span>{heroItems[hero.index].name}</span>
        <Dots count={3} active={hero.index} onChange={hero.select} label="Destaques da plataforma"/>
       </div>
       <div className="showcase-progress" key={`hero-${hero.cycle}`} style={{animationPlayState:hero.paused?'paused':'running',animationDuration:'4800ms'}}/>
      </div>
     </div>
     <div className="mm-container hero-bottom">
      <div><Icon name="layers" size={20}/> UMA PLATAFORMA, TODA A OFICINA</div>
      <span>RECEPÇÃO <b>→</b> DIAGNÓSTICO <b>→</b> SERVIÇO <b>→</b> GESTÃO</span>
     </div>
    </section>

    <section id="funcionalidades" className="mm-section features-section">
     <div className="mm-container">
      <AppSection label="O MOTOR DA SUA OPERAÇÃO" title={<>Um sistema completo.<br/><span className="gradient-text">Fluxos que se conectam.</span></>} description="Da primeira conversa com o cliente até os relatórios de desempenho, cada módulo foi pensado para reduzir etapas manuais e manter a informação no lugar certo."/>
      <div className="feature-layout">
       <div className="feature-selector" onMouseEnter={()=>mods.setPaused(true)} onMouseLeave={()=>mods.setPaused(false)}>
        {modules.map((m,i)=>(
         <button type="button" key={m.id} className={`feature-tab ${mods.index===i?'selected':''}`} onClick={()=>mods.select(i)} aria-pressed={mods.index===i}>
          <span className="tab-icon"><Icon name={m.icon} size={21}/></span>
          <span className="tab-copy"><strong>{m.label}</strong><small>{m.eyebrow.split(' / ')[1]}</small></span>
          <Icon name="arrow" size={17}/>
          {mods.index===i&&<i key={`bar-${mods.cycle}`} className="tab-progress" style={{animationPlayState:mods.paused?'paused':'running',animationDuration:'6500ms'}}/>}
         </button>
        ))}
       </div>
       <div className="feature-content" onMouseEnter={()=>mods.setPaused(true)} onMouseLeave={()=>mods.setPaused(false)}>
        <div className="feature-head" key={`head-${mods.index}`}>
         <span className="eyebrow">{activeModule.eyebrow}</span>
         <h3>{activeModule.title}</h3>
         <p>{activeModule.description}</p>
         <ul>{activeModule.points.map(x=><li key={x}><Icon name="check" size={16}/>{x}</li>)}</ul>
        </div>
        <DemoFrame type={activeModule.id==='relatorios'?'relatorios':activeModule.id} label={activeModule.label}/>
        <div className="feature-footer">
         <span>DEMONSTRAÇÃO VISUAL DO FLUXO</span>
         <span>{String(mods.index+1).padStart(2,'0')} / 06</span>
        </div>
       </div>
      </div>
     </div>
    </section>

    <section className="mm-section benefits-section">
     <div className="mm-container">
      <div className="benefits-grid">
       <div className="reveal">
        <span className="eyebrow">MENOS RUÍDO. MAIS CONTROLE.</span>
        <h2>O que antes era disperso, <span className="gradient-text">agora está conectado.</span></h2>
       </div>
       <div className="benefit-items reveal">
        <div><Icon name="layers" size={22}/><strong>Informações centralizadas</strong><p>Clientes, veículos, serviços e histórico disponíveis no mesmo ambiente.</p></div>
        <div><Icon name="bolt" size={22}/><strong>Comunicação ágil</strong><p>Tickets, notificações e mensagens ligadas ao trabalho em andamento.</p></div>
        <div><Icon name="chart" size={22}/><strong>Decisões com dados</strong><p>Relatórios para compreender a movimentação e as demandas da oficina.</p></div>
       </div>
      </div>
     </div>
    </section>

    <section id="perfis" className="mm-section profiles-section">
     <div className="mm-container">
      <AppSection label="CADA UM NO SEU LUGAR" title={<>A ferramenta certa para <span className="gradient-text">cada função.</span></>} description="Três perfis com acessos e responsabilidades definidos, para que cada pessoa trabalhe com as informações de que realmente precisa."/>
      <div className="profile-tabs">
       {profiles.map((p,i)=>(
        <button key={p.name} type="button" className={users.index===i?'active':''} onClick={()=>users.select(i)} aria-pressed={users.index===i}>
         <Icon name={p.icon} size={19}/>{p.name}
         {users.index===i&&<i key={`profile-${users.cycle}`} className="profile-progress" style={{animationPlayState:users.paused?'paused':'running',animationDuration:'7400ms'}}/>}
        </button>
       ))}
      </div>
      <div className="profile-card" onMouseEnter={()=>users.setPaused(true)} onMouseLeave={()=>users.setPaused(false)}>
       <div className="profile-info" key={activeProfile.name}>
        <span className="eyebrow">PERFIL {String(users.index+1).padStart(2,'0')} / 03 · {activeProfile.subtitle}</span>
        <h3>{activeProfile.title}</h3>
        <p>{activeProfile.text}</p>
        <div className="permission-title">PRINCIPAIS ACESSOS</div>
        <ul>{activeProfile.permissions.map(t=><li key={t}><span><Icon name="check" size={15}/></span>{t}</li>)}</ul>
       </div>
       <div className="profile-visual">
        <div className="profile-window">
         <div className="pw-top">
          <div className="pw-logo"><Icon name="wrench" size={17}/> MotorMind</div>
          <span><Icon name="bell" size={16}/> <Icon name="user" size={17}/></span>
         </div>
         <div className="pw-heading">
          <small>ÁREA DE TRABALHO</small>
          <strong>{activeProfile.name}</strong>
          <p>{activeProfile.subtitle}</p>
         </div>
         <div className="pw-badge">
          <Icon name={activeProfile.icon} size={24}/>
          <div>
           <small>ÁREA PRINCIPAL</small>
           <strong>{activeProfile.metric}</strong>
           <span>{activeProfile.metricDesc}</span>
          </div>
         </div>
         <div className="pw-permissions">
          {activeProfile.permissions.slice(0,3).map((x,i)=>(
           <div key={x}>
            <span>{String(i+1).padStart(2,'0')}</span>
            <span>{x}</span>
            <Icon name="check" size={15}/>
           </div>
          ))}
         </div>
        </div>
        <span className="visual-caption"><Icon name="shield" size={15}/> Permissões específicas por perfil</span>
       </div>
      </div>
     </div>
    </section>

    <section id="licenca" className="mm-section license-section">
     <div className="mm-container">
      <AppSection label="INVISTA NA ORGANIZAÇÃO" title={<>Uma licença. <span className="gradient-text">Uma oficina mais conectada.</span></>} description="Adquira o acesso ao MotorMind por pagamento único e organize a rotina da sua oficina com os recursos da plataforma."/>
      <div className="license-grid">
       <div className="license-steps reveal">
        <span className="eyebrow">COMO COMEÇAR</span>
        {[['01','Cadastre sua oficina','Informe os dados da oficina e do proprietário.'],['02','Conclua a compra','Realize o pagamento da licença pelo fluxo de aquisição.'],['03','Acesse o MotorMind','Após a confirmação do pagamento, utilize os módulos disponíveis para sua oficina.']].map(([no,title,desc])=>(
         <div className="license-step" key={no}>
          <span>{no}</span>
          <div><h3>{title}</h3><p>{desc}</p></div>
         </div>
        ))}
       </div>
       <div className="license-card reveal">
        <div className="license-card-top">
         <div>
          <span className="eyebrow">LICENÇA MOTORMIND</span>
          <h3>Todo o controle em um só lugar.</h3>
         </div>
         <span className="license-stamp"><Icon name="shield" size={22}/></span>
        </div>
        <div className="license-payment">
         <span>PAGAMENTO ÚNICO</span>
         <strong>Sem mensalidade recorrente prevista</strong>
         <small>Valor e condições informados no processo de compra.</small>
        </div>
        <div className="license-include">O QUE ESTÁ INCLUÍDO</div>
        <ul className="license-list">
         {['Ordens de serviço e gestão de agendamentos','Checklists digitais com fotos','Estoque físico e alertas automáticos','Tickets de peças e chat interno','Cotações e orçamentos via WhatsApp','Relatórios analíticos e 3 perfis de acesso'].map(t=>(
          <li key={t}><Icon name="check" size={17}/>{t}</li>
         ))}
        </ul>
        <div className="license-actions">
         <Link to="/cadastro-oficina" className="mm-button">Adquirir licença <Icon name="arrow" size={18}/></Link>
         <Link to="/login" className="mm-button mm-button-secondary">Já tenho acesso</Link>
        </div>
        <p className="license-note"><Icon name="lock" size={14}/> Acesso liberado após a confirmação do pagamento.</p>
       </div>
      </div>
     </div>
    </section>

    <section id="duvidas" className="mm-section faq-section">
     <div className="mm-container faq-layout">
      <div className="faq-left reveal">
       <span className="eyebrow">CENTRAL DE DÚVIDAS</span>
       <h2>Perguntas frequentes<span className="gradient-text">.</span></h2>
       <p>Respostas diretas sobre o funcionamento, o acesso e a licença da plataforma.</p>
       <a href="#licenca" className="faq-text-link">Conhecer a licença <Icon name="arrow" size={17}/></a>
      </div>
      <div className="faq-list reveal">
       {faqs.map(([q,a],i)=>(
        <div className={`faq-item ${openFaq===i?'opened':''}`} key={q}>
         <button type="button" onClick={()=>setOpenFaq(v=>v===i?-1:i)} aria-expanded={openFaq===i} aria-controls={`faq-answer-${i}`}>
          <span>{q}</span>
          <span className="faq-chevron"><Icon name="chevron" size={19}/></span>
         </button>
         <div className="faq-answer" id={`faq-answer-${i}`} aria-hidden={openFaq!==i}>
          <div><p>{a}</p></div>
         </div>
        </div>
       ))}
      </div>
     </div>
    </section>
   </main>

   {/* FOOTER */}
   <footer className="mm-footer">
    <div className="mm-container footer-grid">
     <div className="footer-about">
      
      {/* RODAPÉ - LOGO ATUALIZADA AQUI TAMBÉM */}
      <a href="#topo" className="mm-brand">
       <img src="/logo.png" alt="MotorMind" className="mm-logo-img" />
      </a>
      
      <p>Tecnologia que conecta pessoas, processos e informações na rotina das oficinas mecânicas.</p>
     </div>
     <div className="footer-nav">
      <strong>Explorar</strong>
      <a href="#funcionalidades">Funcionalidades</a>
      <a href="#perfis">Perfis de acesso</a>
      <a href="#licenca">Licença</a>
      <a href="#duvidas">Dúvidas frequentes</a>
     </div>
     <div className="footer-access">
      <strong>Sua oficina começa aqui</strong>
      <p>Organize o trabalho da recepção ao box.</p>
      <div className="footer-actions">
       <Link to="/cadastro-oficina" className="mm-button small">Adquirir licença</Link>
       <Link to="/login" className="mm-button mm-button-secondary small">Entrar</Link>
      </div>
     </div>
    </div>
    <div className="mm-container footer-bottom">
     <span>© {new Date().getFullYear()} MotorMind. Projeto acadêmico de gestão para oficinas mecânicas.</span>
     <a href="#topo">Voltar ao topo ↑</a>
    </div>
   </footer>
  </div>
 );
}
