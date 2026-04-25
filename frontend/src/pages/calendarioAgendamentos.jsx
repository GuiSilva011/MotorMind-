import { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import "../styles/layout.css";

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';

const locales = {
  'pt-BR': ptBR
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

function CalendarioAgendamento() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  async function carregarAgendamentos() {
    try {
      const { data } = await api.get('/agendamentos');

      const eventosFormatados = data.map((agendamento) => ({
        id: agendamento.id,
        title: `${agendamento.servico} - ${agendamento.cliente.nome}`,
        start: new Date(agendamento.dataHora),
        end: new Date(agendamento.dataHora)
      }));

      setEventos(eventosFormatados);
    } catch (error) {
      console.error(error);
    }
  }
async function excluirAgendamento(evento) {
  try {
    await api.delete(`/agendamentos/${evento.id}`);
    await carregarAgendamentos();

    toast.success('Agendamento excluído com sucesso!');
  } catch (error) {
    console.error(error);
    toast.error('Erro ao excluir agendamento.');
  }
}

function confirmarExclusao(evento) {
  toast(
    ({ closeToast }) => (
      <div>
        <p>Excluir este agendamento?</p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={async () => {
              await excluirAgendamento(evento);
              closeToast();
            }}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px'
            }}
          >
            Excluir
          </button>

          <button
            onClick={closeToast}
            style={{
              background: '#e5e7eb',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false
    }
  );
}

  return (
    <Layout>
      <main className="calendario">
        <div className="agendamento-header">
          <h1>Calendário de Agendamentos</h1>
          <p>Visualize os serviços agendados por dia, semana ou mês.</p>
        </div>

        <section className="calendar-section">
          <Calendar
            localizer={localizer}
            events={eventos}
            onSelectEvent={confirmarExclusao}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            messages={{
              today: 'Hoje',
              previous: 'Anterior',
              next: 'Próximo',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia'
            }}
          />
        </section>
      </main>
    </Layout>
  );
}

export default CalendarioAgendamento;