const STATUS = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_PECA: 'Aguardando peça',
  FINALIZADA: 'Finalizada',
  FECHADA: 'Fechada',
  CANCELADA: 'Cancelada',
};

export default function StatusOrdemTecnica({ status }) {
  return <span className={`oficina-badge tecnico-status ${status || ''}`}>
    {STATUS[status] || status?.replaceAll('_', ' ') || 'Sem status'}
  </span>;
}
