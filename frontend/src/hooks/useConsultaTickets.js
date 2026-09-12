import { useEffect, useState } from 'react';
import api from '../services/api';

export default function useConsultaTickets(url, intervalo = 15000, versao = 0) {
  const [resultado, setResultado] = useState({ url: null, dados: null, erro: '' });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let consultando = false;
    async function atualizar() {
      if (consultando || controller.signal.aborted) return;
      consultando = true;
      try {
        const { data } = await api.get(url, { signal: controller.signal });
        if (!controller.signal.aborted) setResultado({ url, dados: data, erro: '' });
      } catch (error) {
        const semAcesso = [401, 403, 404].includes(error.response?.status);
        if (!controller.signal.aborted) setResultado(anterior => ({ url, dados: !semAcesso && anterior.url === url ? anterior.dados : null, erro: error.response?.data?.erro || 'Não foi possível atualizar. Verifique sua conexão.' }));
      } finally { consultando = false; }
    }
    void atualizar();
    const timer = intervalo ? window.setInterval(atualizar, intervalo) : null;
    window.addEventListener('focus', atualizar);
    return () => { controller.abort(); if (timer) window.clearInterval(timer); window.removeEventListener('focus', atualizar); };
  }, [url, intervalo, versao]);
  return resultado.url === url ? { ...resultado, carregando: !resultado.dados && !resultado.erro } : { dados: null, erro: '', carregando: Boolean(url) };
}
