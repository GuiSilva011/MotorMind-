# Tickets de peças e chat — 12/09/2026

## Organização do backend — 14/09/2026

O módulo segue o fluxo `ticketRoutes.js` → `ticketController.js` → Prisma. As rotas declaram os endpoints e seus middlewares; o controller recebe `req`/`res`, executa as operações de tickets, chat e leitura de notificações e retorna as respostas HTTP.

`ticketService.js` foi removido. Validações, arquivos privados/limpeza e geração compartilhada de notificações ficam em `backend/src/utils/`. O middleware de tickets concentra validação de sessão, configuração de upload e tratamento de erros. A autorização do chat continua sendo executada antes de receber anexos e é revalidada dentro da transação de envio.

Foram preservados os endpoints, formatos de resposta, permissões, transações, histórico, idempotência e expiração de 48 horas. Esta reorganização não exige migration nem dependência nova.

Em 16/09/2026, o módulo do técnico passou a seguir o mesmo padrão: `tecnicoRoutes.js` → `tecnicoController.js` → Prisma. O antigo `tecnicoService.js` foi removido. O controller atende painel, OS e histórico; `utils/tecnicoRegras.js` mantém os filtros e seleções compartilhados com veículos/OS e o bloqueio usado pela checklist. `middlewares/tecnicoMiddleware.js` mantém as respostas sem cache e o tratamento de erros. As URLs, permissões e respostas continuam iguais.

## Como usar

1. Reinicie o backend após a atualização. A migration `20260912120000_tickets_chat` já foi aplicada no banco local e o Prisma Client foi regenerado.
2. Entre como OPERADOR, abra uma OS, escolha **Mecânico responsável** e salve.
3. Entre como esse TECNICO e abra o **Painel técnico**. Somente veículos de OS salvas e atribuídas a ele aparecem. No veículo, clique em **Exibir ordem de serviço** e confira os diagnósticos, serviços e peças salvos. Nessa tela, use **Solicitar peça ao operador**, informe nomes/quantidades e confirme. Só a confirmação cria o ticket e abre sua tela de conversa.
4. Entre como OPERADOR, abra o ticket na fila e clique em **Assumir ticket e abrir chat**. Se outro operador já assumiu, a API informa o conflito e preserva o primeiro responsável.
5. Mecânico e responsável podem enviar mensagens e até três anexos de 5 MB por envio (JPG, PNG, WebP ou PDF). Imagens aparecem em miniatura na própria conversa: clique para ampliar e use **Fechar** ou Escape para voltar, sem precisar baixar. O download permanece opcional; PDFs continuam com **Baixar**. Se a prévia falhar, há **Tentar novamente**. O chat atualiza a cada cinco segundos.
6. O responsável registra os estados do atendimento. Para entregar, marque primeiro **Disponível**, depois **Entregue** e confirme que todas as peças/quantidades foram entregues.
7. Use **Todos (inclui histórico)** para consultar tickets encerrados. Mensagens vencidas não aparecem, mas pedido, itens, estados e motivos ficam registrados.

O painel mantém checklist e histórico veicular. Se um veículo tiver várias OS atribuídas, aparece uma única vez, com acesso separado a cada OS. Ao salvar uma OS como `FINALIZADA`, `FECHADA` ou `CANCELADA`, ela deixa a lista e os acessos ativos do técnico e sua atribuição é encerrada sem apagar o histórico. O histórico inclui atendimentos anteriores enquanto o técnico mantiver outra OS ativa nesse veículo. Trocar o nome no formulário do operador sem salvar não altera o painel.

Esta atualização do painel não exige nova migration nem instalação de dependências.

## Limites desta etapa

- Não há retirada direta de estoque pelo ticket. Use **Pegar do estoque** na OS e salve: este continua sendo o único fluxo de baixa da OS. Marcar **Entregue** confirma o relato de entrega, não prova/valida movimentação física.
- Origem de atendimento, fornecedor estruturado, atendimento parcial, transferência de operador e baixa vinculada ao item da requisição ficam para a próxima etapa. Não emitir `SAIDA_REQUISICAO` sem reconciliar peças já retiradas pela OS ou manualmente.
- ADMIN/OWNER podem consultar/assumir tickets da própria oficina, mas não leem chat de outro responsável. Somente o técnico atribuído pode abrir uma solicitação.
- Não é possível fechar/cancelar a OS ou trocar o mecânico enquanto houver tickets pendentes. OS com tickets ou histórico de atribuição não pode ser excluída pela API.
- Ticket entregue/cancelado mantém o chat em somente leitura até cada mensagem completar 48 horas.
- Notificações de chat não copiam o texto das mensagens. Os avisos individuais são separados dos alertas ativos de estoque.
- A API bloqueia acesso aos anexos expirados mesmo antes da limpeza física. O backend remove o conteúdo vencido ao iniciar e a cada cinco minutos; se estiver desligado, a remoção física aguarda a próxima inicialização.
- A checagem de assinatura/MIME restringe formatos, mas não substitui antivírus. Anexos são baixados por rota autenticada e não publicados como arquivos estáticos.
- As prévias usam a mesma rota autenticada, com URLs temporárias em memória, sem gravar imagens no armazenamento local da aplicação. Ao sair da conversa ou expirar o anexo, as chamadas são canceladas e as URLs liberadas, inclusive para a imagem ampliada.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `backend/prisma/schema.prisma` e nova migration | Histórico permanente, chaves de repetição e proteção da OS |
| `backend/src/controllers/ticketController.js` | Operações e respostas HTTP de tickets, atendimento transacional, chat, anexos e leitura de notificações |
| `backend/src/middlewares/ticketMiddleware.js` | Validação de sessão, limites de upload e tratamento de erros |
| `backend/src/utils/ticketRegras.js` | Validação de entrada, participação e transições compartilhadas |
| `backend/src/utils/ticketArquivos.js` | Arquivos privados e limpeza automática |
| `backend/src/utils/notificacaoTicket.js` | Geração de notificações reutilizada por tickets e atribuições de OS |
| `backend/src/services/ordemAtribuicaoService.js` | Atribuição e encerramento com histórico |
| `backend/src/controllers/tecnicoController.js` e `backend/src/routes/tecnicoRoutes.js` | Consultas e respostas HTTP de veículos vinculados, OS técnica somente leitura e histórico autorizado |
| `backend/src/utils/tecnicoRegras.js` e `backend/src/middlewares/tecnicoMiddleware.js` | Filtros, seleções e bloqueio de vínculo compartilhados; controle de cache e tratamento de erros |
| `backend/src/routes/ticketRoutes.js` | Declaração de endpoints e composição dos middlewares e controllers |
| `backend/src/controllers/ordemServicoController.js` | Integração da atribuição e preservação de registros |
| `backend/src/server/server.js` | Registro das rotas e início da limpeza |
| `frontend/src/pages/tickets.jsx` e `frontend/src/styles/tickets.css` | Fila, solicitações, atendimento e chat |
| `frontend/src/components/ImagemTicket.jsx` | Prévia privada, ampliação, tentativa de recarregar e liberação das imagens temporárias |
| `frontend/src/pages/tecnico/painel.jsx`, `ordemServico.jsx` e `historicoVeicular.jsx` | Painel por vínculo, visualização da OS e histórico do veículo |
| `frontend/src/components/ConteudoOrdemTecnica.jsx` e `NovaSolicitacao.jsx` | Itens técnicos agrupados e formulário de ticket reutilizado dentro da OS |
| `frontend/src/hooks/useConsultaTickets.js` | Consulta periódica e cancelamento de chamadas antigas |
| `frontend/src/components/NotificacoesTickets.jsx`, `Topbar.jsx`, `Sidebar.jsx` | Avisos e navegação |
| `frontend/src/pages/operador/ordemServico.jsx` e `frontend/src/App.jsx` | Seleção do mecânico, acesso por OS e rotas |
| `backend/tests/tickets.test.js` e `tickets.integration.test.js` | Regras e cenários HTTP/PostgreSQL |
| `.gitignore` | Mantém anexos privados fora do versionamento |

## Rotas

Todas exigem JWT e oficina da sessão. IDs de usuário/oficina recebidos no corpo não substituem a identidade autenticada.

| Método/rota | Uso |
| --- | --- |
| `GET /tickets/tecnicos` | Técnicos da oficina para atribuição pelo atendimento |
| `GET /tickets/ordens` | OS não fechadas/canceladas atribuídas ao técnico autenticado |
| `GET /tecnico/veiculos` | Um registro por veículo, com suas OS ativas atribuídas |
| `GET /tecnico/ordens/:id` | Somente os itens salvos da OS atribuída, sem edição ou preços |
| `GET /tecnico/veiculos/:id/historico` | Histórico do veículo atualmente vinculado |
| `GET /tecnico/veiculos/:id/historico/:ordemId` | Detalhe técnico de uma OS histórica desse veículo |
| `GET /tickets?status=ATIVOS&pagina=1` | Fila paginada (30), com filtros de status, responsável e OS |
| `POST /tickets` | Técnico abre pedido, com `chaveAbertura` UUID v4 |
| `GET /tickets/:id` | Pedido, itens, responsáveis e histórico |
| `POST /tickets/:id/assumir` | Assume atomicamente; concorrente recebe 409 |
| `PATCH /tickets/:id/status` | Próximo estado e motivo permanente |
| `GET /tickets/:id/mensagens?antesDe=ID` | Últimas 50 mensagens válidas; cursor para anteriores |
| `POST /tickets/:id/mensagens` | Texto/anexos com `chaveEnvio` UUID v4; multipart para arquivos |
| `GET /tickets/:id/anexos/:anexoId` | Arquivo privado para prévia/download, limitado a 48 horas |
| `GET /tickets/notificacoes` | Até 30 avisos recentes e contagem individual de não lidos |
| `PATCH /tickets/notificacoes/:id/lida` | Marca aviso próprio como lido |
| `PATCH /tickets/notificacoes/lidas` | Marca avisos próprios de tickets/atribuição como lidos |

## Validação

Na reorganização do técnico de 16/09/2026, passaram os 13 testes de regras e os 18 cenários HTTP/PostgreSQL (19 testes com o agrupador). Foram verificadas também a equivalência das respostas pelas rotas antigas de veículos/OS, a perda de acesso após encerramento, a validação dos IDs, os erros JSON e a ausência de cache nas consultas técnicas. A suíte removeu seu schema descartável e anexos. O frontend não foi alterado; não houve nova validação visual.

Na reorganização de 14/09/2026, passaram os 13 testes de regras e os 17 cenários HTTP/PostgreSQL (18 testes contando o agrupador). Foram acrescentadas verificações das consultas por perfil/oficina, sessão inválida, erros JSON, filtros da fila e autorização anterior ao processamento de uploads. Sintaxe e imports relativos dos 49 arquivos JavaScript do backend também foram conferidos. O schema descartável e seus anexos foram removidos ao final da suíte. A validação desta alteração foi de backend; não houve nova conferência visual.

No diretório `backend`, testes de regras sem acesso ao banco:

```powershell
node --test tests/tickets.test.js
```

Teste integrado opt-in (requer PostgreSQL de desenvolvimento e permissão de criar schema):

```powershell
$env:MOTORMIND_TESTE_TICKETS = '1'
node --test tests/tickets.integration.test.js
Remove-Item Env:MOTORMIND_TESTE_TICKETS
```

O teste integrado usa o servidor PostgreSQL configurado, mas cria um schema **novo e aleatório** `tickets_test_<uuid>` e aplica as migrations somente nele. Os cadastros são fictícios. Ao terminar, remove apenas esse schema e seus anexos; não executa seed ou reset no schema da oficina. Se o processo for encerrado à força, pode ser necessário conferir e remover manualmente o schema temporário restante antes de repetir.

Resultados: a suíte integrada ampliada passou em 14 cenários (15 testes contando o agrupador). Inclui vínculo após salvamento, rollback quando os itens são inválidos, múltiplas OS sem duplicar veículo, troca de mecânico, checklist autorizada, histórico anterior e leitura dos snapshots sem trazer alterações posteriores do catálogo. Mantém os cenários de isolamento, disputa de operadores, idempotência, anexos privados e expiração. A suíte separada de 13 testes de regras de tickets permanece disponível.

Build do frontend passou. Lint focado sem erros, com um aviso anterior de dependência de `useEffect` na tela de OS. Não foi possível validar visualmente: a skill de navegador não encontrou navegador disponível nesta sessão. Faça o roteiro acima com dois logins no ambiente local, incluindo layout em tela pequena e envio/abertura de imagens reais.

Na atualização das prévias, build e lint de `ImagemTicket.jsx`/`tickets.jsx` passaram, assim como os 13 testes de regras e os 14 cenários integrados. O cenário de anexos agora verifica também PNG para ambos os participantes, conteúdo binário, MIME, ausência de cache e bloqueio sem sessão, por outro operador, por outra oficina e após expiração. O schema temporário e os anexos fictícios foram removidos ao final. Esses testes não substituem a conferência visual: envie JPG/PNG/WebP, clique para ampliar, feche por botão/Escape e confirme que PDF mantém download e que mensagens expiradas não exibem a imagem.
