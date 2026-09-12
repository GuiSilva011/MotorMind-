import { mkdir, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PRAZO_CHAT_MS, TicketError } from './ticketRegras.js';

export const DIRETORIO_CHAT = fileURLToPath(new URL('../../private/tickets/', import.meta.url));
export const MAX_ARQUIVO = 5 * 1024 * 1024;
const NOME_SEGURO = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

export function caminhoAnexo(nome) {
  if (!NOME_SEGURO.test(nome)) throw new TicketError(404, 'Anexo inválido.');
  return path.join(DIRETORIO_CHAT, nome);
}

export function tipoArquivo(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  return null;
}

export const arquivosTicket = {
  validar(arquivos) {
    if (arquivos.length > 3) throw new TicketError(400, 'Envie no máximo 3 anexos por mensagem.');
    for (const arquivo of arquivos) {
      if (!arquivo.buffer?.length || arquivo.buffer.length > MAX_ARQUIVO) throw new TicketError(400, 'Cada anexo deve ter até 5 MB.');
      if (!tipoArquivo(arquivo.buffer) || tipoArquivo(arquivo.buffer) !== arquivo.mimetype) throw new TicketError(400, 'Anexe somente imagens PNG, JPG, WebP ou PDF válidos.');
    }
  },
  async salvar(arquivo) {
    await mkdir(DIRETORIO_CHAT, { recursive: true });
    const url = randomUUID();
    await writeFile(caminhoAnexo(url), arquivo.buffer, { flag: 'wx' });
    const nomeArquivo = (arquivo.originalname || 'anexo').replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0, 180);
    return { url, nomeArquivo, mimeType: tipoArquivo(arquivo.buffer), tamanhoBytes: arquivo.buffer.length };
  },
  async remover(nome) {
    try { await unlink(caminhoAnexo(nome)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  },
};

// Só o conteúdo efêmero é removido. Tickets, histórico e notificações não são apagados.
export async function limparChatExpirado(prisma, arquivos = arquivosTicket, agora = new Date()) {
  let removidas = 0;
  let cursor = 0;
  while (true) {
    const mensagens = await prisma.mensagemTicket.findMany({ where: { id: { gt: cursor }, expiresAt: { lte: agora } }, include: { anexos: true }, orderBy: { id: 'asc' }, take: 100 });
    if (!mensagens.length) break;
    for (const mensagem of mensagens) {
      cursor = mensagem.id;
      try {
        for (const anexo of mensagem.anexos) await arquivos.remover(anexo.url);
        await prisma.mensagemTicket.deleteMany({ where: { id: mensagem.id, expiresAt: { lte: agora } } });
        removidas++;
      } catch { console.error('Não foi possível limpar uma mensagem expirada; nova tentativa na próxima execução.'); }
    }
  }
  return removidas;
}

export async function limparAnexosOrfaos(prisma, agora = Date.now()) {
  let nomes;
  try { nomes = await readdir(DIRETORIO_CHAT, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entrada of nomes) {
    if (!entrada.isFile() || !NOME_SEGURO.test(entrada.name)) continue;
    try {
      const info = await stat(caminhoAnexo(entrada.name));
      if (info.mtimeMs > agora - PRAZO_CHAT_MS) continue;
      if (!await prisma.mensagemAnexo.findFirst({ where: { url: entrada.name }, select: { id: true } })) await arquivosTicket.remover(entrada.name);
    } catch (error) { if (error.code !== 'ENOENT') console.error('Não foi possível verificar um anexo temporário.'); }
  }
}

export function iniciarLimpezaChat(prisma) {
  let executando = false;
  const executar = async () => {
    if (executando) return;
    executando = true;
    try { await limparChatExpirado(prisma); await limparAnexosOrfaos(prisma); }
    catch { console.error('Limpeza do chat indisponível. Verifique o banco e as permissões de backend/private/tickets.'); }
    finally { executando = false; }
  };
  void executar();
  const intervalo = setInterval(executar, 5 * 60 * 1000);
  intervalo.unref();
  return () => clearInterval(intervalo);
}
