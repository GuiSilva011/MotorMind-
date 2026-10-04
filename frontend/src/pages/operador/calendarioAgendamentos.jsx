import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiFileText, FiPlus, FiRefreshCw, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../../services/api';
import Layout from '../../components/Layout';
import ModalOficina from '../../components/ModalOficina';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/operadorStyles/calendarioAgendamentos.css';
import '../../styles/operadorStyles/layout.css';

/**
 * Lista de idiomas utilizada pelo calendário.
 *
 * @constant {Object}
 */
const locales = {
  'pt-BR': ptBR,
};

/**
 * Configuração de localização do calendário usando date-fns.
 *
 * @constant {Object}
 */
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const nomesVisoes = { month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Agenda' };

function BarraCalendario({ label, onNavigate, onView, view, views }) {
  return (
    <div className="calendario-toolbar">
      <div className="calendario-navegacao" role="group" aria-label="Navegar pelo calendário">
        <button type="button" className="oficina-btn" onClick={() => onNavigate('TODAY')}>Hoje</button>
        <button type="button" className="oficina-btn calendario-icon-btn" aria-label="Período anterior"
          onClick={() => onNavigate('PREV')}><FiChevronLeft aria-hidden="true" /></button>
        <button type="button" className="oficina-btn calendario-icon-btn" aria-label="Próximo período"
          onClick={() => onNavigate('NEXT')}><FiChevronRight aria-hidden="true" /></button>
      </div>
      <h2 className="calendario-periodo" aria-live="polite">{label}</h2>
      <div className="calendario-visoes" role="group" aria-label="Visualização do calendário">
        {views.map((nome) => (
          <button key={nome} type="button" aria-pressed={view === nome} onClick={() => onView(nome)}>
            {nomesVisoes[nome] || nome}
          </button>
        ))}
      </div>
    </div>
  );
}

function EventoCalendario({ event }) {
  const agendamento = event.resource || {};
  return (
    <span className="calendario-evento-resumo">
      <strong>{agendamento.tipo_servico || agendamento.servico || 'Serviço'}</strong>
      <span>{agendamento.cliente?.nome || 'Cliente'}{agendamento.veiculo?.placa ? ` · ${agendamento.veiculo.placa}` : ''}</span>
    </span>
  );
}

// Mantém as referências dos componentes entre renders do calendário.
const componentesCalendario = { toolbar: BarraCalendario, event: EventoCalendario };

/**
 * Tela responsável por exibir os agendamentos em formato de calendário,
 * permitindo visualizar detalhes, gerar ordem de serviço e excluir agendamentos.
 *
 * @component
 * @function CalendarioAgendamento
 * @returns {JSX.Element} Tela de calendário de agendamentos.
 */
function CalendarioAgendamento() {
  const navigate = useNavigate();
  const [tema, setTema] = useTemaOficina();
  const [visao, setVisao] = useState('month');

  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);


  useEffect(() => {
    carregarAgendamentos();
  }, []);

/**
 * Busca os agendamentos cadastrados e converte cada registro em evento do calendário.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarAgendamentos() {
    try {
      setCarregando(true);

      const { data } = await api.get('/agendamentos');

      const eventosFormatados = Array.isArray(data)
        ? data.map((agendamento) => {
            const dataInicio = new Date(agendamento.dataHora);
            const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000);

            return {
              id: agendamento.id,
              title: montarTituloEvento(agendamento),
              start: dataInicio,
              end: dataFim,
              resource: agendamento,
            };
          })
        : [];

      setEventos(eventosFormatados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos.');
    } finally {
      setCarregando(false);
    }
  }

/**
 * Monta o título exibido no evento do calendário.
 *
 * @param {Object} agendamento - Agendamento usado para montar o título.
 * @returns {string} Título resumido do evento.
 */
  function montarTituloEvento(agendamento) {
    const servico = agendamento.tipo_servico || agendamento.servico || 'Serviço';
    const cliente = agendamento.cliente?.nome || 'Cliente';

    return `${servico} - ${cliente}`;
  }

/**
 * Formata uma data e hora para exibição no padrão brasileiro.
 *
 * @param {string|Date} data - Data que será formatada.
 * @returns {string} Data e hora formatadas ou hífen.
 */
  function formatarDataHora(data) {
    if (!data) return '-';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

/**
 * Abre o modal de detalhes do agendamento selecionado.
 *
 * @param {Object} evento - Evento selecionado no calendário.
 * @returns {void}
 */
  function abrirDetalhes(evento) {
    setEventoSelecionado(evento);
  }

/**
 * Fecha o modal de detalhes do agendamento.
 *
 * @returns {void}
 */
  function fecharDetalhes() {
    setEventoSelecionado(null);
  }

/**
 * Redireciona o usuário para a tela de ordem de serviço
 * utilizando os dados do agendamento selecionado.
 *
 * @returns {void}
 */
  function gerarOrdemServico() {
    if (!eventoSelecionado?.resource) {
      toast.warning('Selecione um agendamento válido.');
      return;
    }

    const agendamento = eventoSelecionado.resource;

    if (!agendamento.cliente || !agendamento.veiculo) {
      toast.warning('Este agendamento não possui cliente ou veículo vinculado.');
      return;
    }

    navigate('/operador/ordem-servico', {
      state: {
        cliente: agendamento.cliente,
        veiculo: agendamento.veiculo,
        agendamento,
      },
    });
  }

/**
 * Exclui o agendamento selecionado e atualiza os eventos do calendário.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function excluirAgendamento() {
    try {
      if (!eventoSelecionado?.id) return;

      await api.delete(`/agendamentos/${eventoSelecionado.id}`);

      toast.success('Agendamento excluído com sucesso!');
      fecharDetalhes();
      await carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir agendamento.'
      );
    }
  }
  
/**
 * Renderiza o modal de detalhes do agendamento quando houver um evento selecionado.
 *
 * @returns {JSX.Element|null} Modal de detalhes ou null.
 */
  function renderModalDetalhes() {
    if (!eventoSelecionado) return null;

    const agendamento = eventoSelecionado.resource || {};
    const cliente = agendamento.cliente || {};
    const veiculo = agendamento.veiculo || {};

    return (
      <ModalOficina className="calendario-modal" labelledBy="calendario-detalhes-titulo" onClose={fecharDetalhes}>
        <div className="calendario-modal-header">
          <div>
            <h2 id="calendario-detalhes-titulo">Detalhes do agendamento</h2>
            <p><FiClock aria-hidden="true" /> {formatarDataHora(agendamento.dataHora)}</p>
          </div>

          <button type="button" className="oficina-btn calendario-icon-btn" onClick={fecharDetalhes}
            aria-label="Fechar detalhes do agendamento">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <dl className="calendario-modal-grid">
          <div>
            <dt><FiUser aria-hidden="true" /> Cliente</dt>
            <dd>{cliente.nome || '-'}</dd>
          </div>

          <div>
            <dt><TbCar aria-hidden="true" /> Veículo</dt>
            <dd>
              {veiculo.placa || '-'}{' '}
              {veiculo.modelo ? `- ${veiculo.modelo}` : ''}
            </dd>
          </div>

          <div>
            <dt>Técnico responsável</dt>
            <dd>{agendamento.mecanico || '-'}</dd>
          </div>

          <div>
            <dt>Tipo de serviço</dt>
            <dd>{agendamento.tipo_servico || '-'}</dd>
          </div>

          <div>
            <dt>Data e hora</dt>
            <dd>{formatarDataHora(agendamento.dataHora)}</dd>
          </div>
        </dl>

        <section className="calendario-modal-descricao" aria-labelledby="calendario-descricao-titulo">
          <h3 id="calendario-descricao-titulo">Descrição do serviço</h3>
          <p>{agendamento.servico || 'Sem descrição informada.'}</p>
        </section>

        <div className="calendario-modal-actions">
            <button
              type="button"
              className="oficina-btn oficina-btn-danger"
              onClick={excluirAgendamento}
            >
              <FiTrash2 aria-hidden="true" /> Excluir agendamento
            </button>
            <button
              type="button"
              className="oficina-btn"
              onClick={fecharDetalhes}
            >
              Fechar
            </button>
            <button
              type="button"
              className="oficina-btn oficina-btn-primary"
              onClick={gerarOrdemServico}
            >
              <FiFileText aria-hidden="true" /> Gerar ordem de serviço
            </button>
          </div>
        </ModalOficina>
      );
    }

    return (
      <Layout className="oficina-theme agendamentos-workspace" theme={tema}
        topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
        <main className="oficina-page calendario-page">
          <header className="oficina-page-header">
            <div>
              <h1>Visualizar agendamentos</h1>
              <p>Acompanhe os horários da oficina e abra um agendamento para ver os detalhes.</p>
            </div>
            <div className="calendario-header-actions">
            <button
              type="button"
              className="oficina-btn"
              onClick={carregarAgendamentos}
              disabled={carregando}
            >
              <FiRefreshCw aria-hidden="true" /> Atualizar
            </button>
            <Link className="oficina-btn oficina-btn-primary" to="/operador/agendamentos">
              <FiPlus aria-hidden="true" /> Novo agendamento
            </Link>
          </div>
        </header>

        <section className="oficina-panel calendario-panel" aria-label="Calendário de agendamentos" aria-busy={carregando}>
          <div className="calendario-panel-info">
            <span className="calendario-panel-label"><FiCalendar aria-hidden="true" /> Agenda da oficina</span>
            <span className="calendario-contagem" role="status">
              {carregando ? 'Carregando agendamentos...' : `${eventos.length} agendamento${eventos.length === 1 ? '' : 's'} cadastrado${eventos.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <div className={`calendario-scroll calendario-visao-${visao}`}>
            <Calendar
              localizer={localizer}
              culture="pt-BR"
              events={eventos}
              components={componentesCalendario}
              view={visao}
              onView={setVisao}
              views={['month', 'week', 'day', 'agenda']}
              onSelectEvent={abrirDetalhes}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={() => ({
                className: 'calendario-evento',
              })}
              messages={{
                today: 'Hoje',
                previous: 'Anterior',
                next: 'Próximo',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Nenhum agendamento neste período.',
                showMore: (total) => `+${total} mais`,
              }}
            />
          </div>
          <p className="calendario-hint"><FiClock aria-hidden="true" /> Selecione um agendamento para consultar o cliente, o veículo e o serviço.</p>
        </section>

        {renderModalDetalhes()}
      </main>
    </Layout>
  );
}

export default CalendarioAgendamento;
