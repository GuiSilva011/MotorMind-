# Tickets de peças e chat — 12/09/2026

## Como usar

1. Reinicie o backend após a atualização. A migration `20260912120000_tickets_chat` já foi aplicada no banco local e o Prisma Client foi regenerado.
2. Entre como OPERADOR, abra uma OS, escolha **Mecânico responsável** e salve.
3. Entre como esse TECNICO e abra **Solicitações de peças**. Em **Minhas ordens de serviço**, escolha **Solicitar peça**, informe nomes/quantidades e confirme.
4. Entre como OPERADOR, abra o ticket na fila e clique em **Assumir ticket e abrir chat**. Se outro operador já assumiu, a API informa o conflito e preserva o primeiro responsável.
5. Mecânico e responsável podem enviar mensagens e até três anexos de 5 MB por envio (JPG, PNG, WebP ou PDF). O chat atualiza a cada cinco segundos.
6. O responsável registra os estados do atendimento. Para entregar, marque primeiro **Disponível**, depois **Entregue** e confirme que todas as peças/quantidades foram entregues.
7. Use **Todos (inclui histórico)** para consultar tickets encerrados. Mensagens vencidas não aparecem, mas pedido, itens, estados e motivos ficam registrados.

## Limites desta etapa

- Não há retirada direta de estoque pelo ticket. Use **Pegar do estoque** na OS e salve: este continua sendo o único fluxo de baixa da OS. Marcar **Entregue** confirma o relato de entrega, não prova/valida movimentação física.
- Origem de atendimento, fornecedor estruturado, atendimento parcial, transferência de operador e baixa vinculada ao item da requisição ficam para a próxima etapa. Não emitir `SAIDA_REQUISICAO` sem reconciliar peças já retiradas pela OS ou manualmente.
- ADMIN/OWNER podem consultar/assumir tickets da própria oficina, mas não leem chat de outro responsável. Somente o técnico atribuído pode abrir uma solicitação.
- Não é possível fechar/cancelar a OS ou trocar o mecânico enquanto houver tickets pendentes. OS com tickets ou histórico de atribuição não pode ser excluída pela API.
- Ticket entregue/cancelado mantém o chat em somente leitura até cada mensagem completar 48 horas.
- Notificações de chat não copiam o texto das mensagens. Os avisos individuais são separados dos alertas ativos de estoque.
- A API bloqueia acesso aos anexos expirados mesmo antes da limpeza física. O backend remove o conteúdo vencido ao iniciar e a cada cinco minutos; se estiver desligado, a remoção física aguarda a próxima inicialização.
- A checagem de assinatura/MIME restringe formatos, mas não substitui antivírus. Anexos são baixados por rota autenticada e não publicados como arquivos estáticos.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `backend/prisma/schema.prisma` e nova migration | Histórico permanente, chaves de repetição e proteção da OS |
| `backend/src/services/ticketRegras.js` | Validação de entrada, participação e transições |
| `backend/src/services/ticketService.js` | Tickets, responsabilidade transacional, chat e notificações |
| `backend/src/services/ticketArquivos.js` | Arquivos privados e limpeza automática |
| `backend/src/services/ordemAtribuicaoService.js` | Atribuição e encerramento com histórico |
| `backend/src/routes/ticketRoutes.js` | Rotas autenticadas, upload, download e leitura de avisos |
| `backend/src/controllers/ordemServicoController.js` | Integração da atribuição e preservação de registros |
| `backend/src/server/server.js` | Registro das rotas e início da limpeza |
| `frontend/src/pages/tickets.jsx` e `frontend/src/styles/tickets.css` | Fila, solicitações, atendimento e chat |
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
| `GET /tickets?status=ATIVOS&pagina=1` | Fila paginada (30), com filtros de status, responsável e OS |
| `POST /tickets` | Técnico abre pedido, com `chaveAbertura` UUID v4 |
| `GET /tickets/:id` | Pedido, itens, responsáveis e histórico |
| `POST /tickets/:id/assumir` | Assume atomicamente; concorrente recebe 409 |
| `PATCH /tickets/:id/status` | Próximo estado e motivo permanente |
| `GET /tickets/:id/mensagens?antesDe=ID` | Últimas 50 mensagens válidas; cursor para anteriores |
| `POST /tickets/:id/mensagens` | Texto/anexos com `chaveEnvio` UUID v4; multipart para arquivos |
| `GET /tickets/:id/anexos/:anexoId` | Download privado e limitado a 48 horas |
| `GET /tickets/notificacoes` | Até 30 avisos recentes e contagem individual de não lidos |
| `PATCH /tickets/notificacoes/:id/lida` | Marca aviso próprio como lido |
| `PATCH /tickets/notificacoes/lidas` | Marca avisos próprios de tickets/atribuição como lidos |

## Validação

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

Resultados: 13 testes de regras e dez cenários integrados passaram (o runner contabiliza também o agrupador, totalizando 11 no arquivo integrado). Incluem isolamento, papel, técnico atribuído, concorrência real, rollback ao tentar fechar/trocar OS com ticket pendente, repetição idempotente, download privado, expiração física e preservação do histórico.

Build do frontend passou. Lint focado sem erros, com um aviso anterior de dependência de `useEffect` na tela de OS. Não foi possível validar visualmente: a skill de navegador não encontrou navegador disponível nesta sessão. Faça o roteiro acima com dois logins no ambiente local, incluindo layout em tela pequena e envio/abertura de imagens reais.
