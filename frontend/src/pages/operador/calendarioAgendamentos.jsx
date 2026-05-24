import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import api from '../../services/api';
import Layout from '../../components/Layout';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/operadorStyles/calendarioAgendamentos.css';
import '../../styles/operadorStyles/layout.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function CalendarioAgendamento() {
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

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

  function montarTituloEvento(agendamento) {
    const servico = agendamento.tipo_servico || agendamento.servico || 'Serviço';
    const cliente = agendamento.cliente?.nome || 'Cliente';

    return `${servico} - ${cliente}`;
  }

  function formatarDataHora(data) {
    if (!data) return '-';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function abrirDetalhes(evento) {
    setEventoSelecionado(evento);
  }

  function fecharDetalhes() {
    setEventoSelecionado(null);
  }

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

  function renderModalDetalhes() {
    if (!eventoSelecionado) return null;

    const agendamento = eventoSelecionado.resource || {};
    const cliente = agendamento.cliente || {};
    const veiculo = agendamento.veiculo || {};

    return (
      <div className="calendario-modal-overlay">
        <div className="calendario-modal">
          <div className="calendario-modal-header">
            <div>
              <h2>Detalhes do agendamento</h2>
              <span>{formatarDataHora(agendamento.dataHora)}</span>
            </div>

            <button type="button" onClick={fecharDetalhes}>
              ×
            </button>
          </div>

          <div className="calendario-modal-grid">
            <div>
              <span>Cliente</span>
              <strong>{cliente.nome || '-'}</strong>
            </div>

            <div>
              <span>Veículo</span>
              <strong>
                {veiculo.placa || '-'}{' '}
                {veiculo.modelo ? `- ${veiculo.modelo}` : ''}
              </strong>
            </div>

            <div>
              <span>Técnico responsável</span>
              <strong>{agendamento.mecanico || '-'}</strong>
            </div>

            <div>
              <span>Tipo de serviço</span>
              <strong>{agendamento.tipo_servico || '-'}</strong>
            </div>

            <div>
              <span>Data e hora</span>
              <strong>{formatarDataHora(agendamento.dataHora)}</strong>
            </div>
          </div>

          <div className="calendario-modal-descricao">
            <span>Descrição do serviço</span>
            <p>{agendamento.servico || 'Sem descrição informada.'}</p>
          </div>

          <div className="calendario-modal-actions">
            <button
              type="button"
              className="calendario-btn calendario-btn-outline"
              onClick={fecharDetalhes}
            >
              Fechar
            </button>

            <button
              type="button"
              className="calendario-btn calendario-btn-primary"
              onClick={gerarOrdemServico}
            >
              Gerar ordem de serviço
            </button>

            <button
              type="button"
              className="calendario-btn calendario-btn-danger"
              onClick={excluirAgendamento}
            >
              Excluir agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <main className="calendario-page">
        <section className="calendario-header">
          <div>
            <h1>Calendário de Agendamentos</h1>
            <p>Visualize os serviços agendados por dia, semana ou mês.</p>

            {carregando && <small>Carregando agendamentos...</small>}
          </div>

          <button
            type="button"
            className="calendario-refresh"
            onClick={carregarAgendamentos}
            disabled={carregando}
          >
            Atualizar
          </button>
        </section>

        <section className="calendar-section">
          <Calendar
            localizer={localizer}
            culture="pt-BR"
            events={eventos}
            onSelectEvent={abrirDetalhes}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={() => ({
              className: 'calendario-evento',
            })}
            style={{ height: 620 }}
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
        </section>

        {renderModalDetalhes()}
      </main>
    </Layout>
  );
}

export default CalendarioAgendamento;