# MotorMind — contexto e instruções para continuar o projeto

## 1. Como usar este documento

Este arquivo deve ficar na raiz do MotorMind, ao lado de `backend/` e `frontend/`. Ele registra a evolução do projeto, as regras de negócio, o estado da última entrega e as próximas etapas. É um ponto de partida para trabalhar com Guilherme; não é uma ordem para implementar todo o roteiro de uma vez.

Estado de referência: módulo de estoque integrado à ordem de serviço. Na aba Estoque, o OPERADOR permanece somente leitura; dentro da OS, ele pode escolher uma peça física pela opção **Pegar do estoque**, e a baixa é confirmada ao salvar. O código das peças de estoque é automático e a unidade é escolhida entre UN, PAR e L. O botão **Enviar OS para o cliente** foi removido; a geração e o compartilhamento do documento ficam centralizados em **Imprimir OS**, que permite salvar em PDF.

Antes de alterar código:

1. Entenda a solicitação atual de Guilherme e leia este arquivo e eventuais instruções específicas da pasta afetada.
2. Confira os arquivos e as alterações locais existentes. Não suponha que o projeto ainda está exatamente na versão descrita aqui.
3. Consulte `ESTOQUE-LEIA-ME.md` para os detalhes da entrega de estoque, quando ele estiver presente.
4. Identifique o que já está implementado, o que está apenas modelado e o que falta para a tarefa atual.
5. Faça a mudança solicitada, preserve trabalho existente e valide o comportamento afetado.

As decisões explícitas mais recentes de Guilherme prevalecem sobre este registro. Se houver diferença entre a documentação e o código, explique a diferença e trabalhe a partir do estado real. Não refaça um módulo concluído apenas porque esta documentação ficou desatualizada.

## 2. Objetivo e limites do produto

MotorMind é um sistema web de gestão de oficinas mecânicas, desenvolvido no contexto do TCC de Análise e Desenvolvimento de Sistemas. Centraliza a operação interna da oficina: clientes, veículos, colaboradores, fornecedores, agendamentos, ordens de serviço, checklists, peças e histórico.

A arquitetura foi evoluída para atender várias oficinas. Cada oficina tem seu próprio ambiente de dados, identificado por `oficinaId`. Um usuário de uma oficina não pode consultar nem alterar dados de outra, mesmo conhecendo o ID do registro.

Decisões de produto já registradas:

- Aplicação web com frontend e backend separados; não introduzir Electron ou Docker.
- O escopo atual é a oficina. Não criar portal ou aplicativo do cliente final sem uma nova solicitação.
- Modelo comercial planejado: compra única, sem assinatura recorrente, com liberação do acesso após aprovação da compra.
- Dados e configuração da oficina devem servir à identificação do negócio e aos documentos/PDFs emitidos pelo sistema.
- A existência de `Oficina`, `Licenca` e verificações no login não comprova que checkout, pagamento e ativação automática já estejam implementados.

## 3. Stack e organização existente

As versões abaixo descrevem a base inspecionada; use `package.json` e os lockfiles atuais como referência executável. Não atualize dependências por rotina durante uma alteração funcional.

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 8, React Router DOM 7, JavaScript/JSX e CSS próprio |
| Interface e dados | Axios, React Toastify, React Icons, React Big Calendar e date-fns |
| Backend | Node.js, JavaScript com ES Modules, Express 5 |
| Persistência | PostgreSQL, Prisma 5 e `@prisma/client` |
| Autenticação | JWT com `jsonwebtoken` e hash de senha com `bcryptjs` |
| Outros recursos | Multer para uploads, dotenv para configuração e nodemon em desenvolvimento |

| Caminho | Responsabilidade |
| --- | --- |
| `backend/prisma/schema.prisma` | Modelos, enums, relações e restrições |
| `backend/prisma/migrations/` | Histórico de migrations existente |
| `backend/prisma/seed.js` | Preparação de dados; inspecionar antes de executar |
| `backend/src/server/server.js` | Entrada da API e registro das rotas |
| `backend/src/config/prisma.js` | Instância compartilhada do Prisma |
| `backend/src/middlewares/authMiddleware.js` | JWT, `req.user` e `authorizeRoles` |
| `backend/src/controllers/` | Controllers dos módulos |
| `backend/src/routes/` | Rotas da API |
| `backend/src/services/` | Regras de estoque e futuras regras que precisem ser reutilizadas |
| `backend/tests/estoque.test.js` | Testes de regras e permissões do estoque |
| `frontend/src/App.jsx` | Rotas da aplicação |
| `frontend/src/Routes/ProtectedRoutes.jsx` | Proteção das telas por sessão e perfil |
| `frontend/src/services/api.js` | Axios compartilhado e envio do token |
| `frontend/src/components/` | Layout, Sidebar e Topbar |
| `frontend/src/pages/` | Telas de admin, operador e técnico |
| `frontend/src/styles/` | Estilos globais e por módulo |

O projeto possui `package.json` e `package-lock.json` separados em frontend e backend. Não presumir scripts npm na raiz. Preserve os nomes e a capitalização dos campos existentes, por exemplo `Usuario.Nome`, `Email`, `Senha` e `Role`, além dos campos com inicial minúscula de outros modelos.

## 4. Evolução do trabalho até aqui

### 4.1. Base da aplicação e módulos operacionais

O trabalho começou pela organização frontend/backend, conexão Express–Prisma–PostgreSQL e fluxo de cadastro/consulta de clientes. Entre os ajustes iniciais esteve a leitura do corpo das requisições com `express.json()`.

A base recebida nesta continuidade já continha telas, rotas e controllers para:

- Clientes e seus veículos.
- Agendamentos e calendário.
- Ordens de serviço, diagnósticos, serviços e peças da OS.
- Cadastros de fornecedores e funcionários/colaboradores.
- Checklists técnicos, imagens e histórico veicular.
- Área do técnico e tela de relatórios.

Esses módulos não foram todos criados nem auditados integralmente durante a entrega de estoque. Preserve o que existe e inspecione o módulo quando a tarefa o envolver. O README também menciona cotações/WhatsApp; não deduza que importação de cotações, OCR ou comparador estejam completos sem localizar o fluxo real.

### 4.2. Evolução para múltiplas oficinas

Foi adotada a entidade `Oficina` como base de isolamento. Os cadastros e registros operacionais foram relacionados à oficina, e unicidades passaram a considerar a oficina onde fazia sentido, como códigos de peças, fornecedores e OS.

Foram trabalhados o schema, relações, migrations e seed para adaptar a base existente sem perder os dados. Houve correções de modelagem envolvendo `Usuario`/`Funcionario`, modelos duplicados e ações de exclusão em relações.

Guilherme informou aplicação bem-sucedida das migrations de preparação do estoque/tickets em agosto de 2026. Isso não dispensa verificar o status das migrations do banco local no VS Code; não aplicar novamente, reescrever ou resetar migrations antigas para reconstruir uma etapa concluída.

### 4.3. Autenticação e acesso

Foram trabalhados login com bcrypt/JWT, middleware de autenticação, rotas privadas e envio do token pelo Axios. Entre os problemas tratados estavam configuração/carregamento de `JWT_SECRET`, imports de middleware e respostas 401 após login.

Na base inspecionada:

- `POST /auth/login` é público; `GET /auth/me` exige autenticação.
- O login verifica usuário/senha, vínculo com oficina, oficina `ATIVA` e licença `ATIVA`.
- O token identifica usuário, oficina e perfil. O middleware disponibiliza `req.user.id`, `req.user.oficinaId` e `req.user.role`.
- O frontend usa `motormind_token` e `motormind_usuario`, e o cliente Axios envia `Authorization: Bearer ...`.
- A base da API em desenvolvimento está definida em `frontend/src/services/api.js` como `http://localhost:3000`.

Não remover autenticação nem trocar uma rota privada por pública para resolver um 401. Verificar sessão, token, configuração e uso do cliente Axios compartilhado. Também não tratar proteção visual de uma tela como substituta da autorização no backend.

### 4.4. Preparação do banco para novas funcionalidades

Antes desta entrega, o schema já havia sido ampliado para estoque, atribuição de OS ao mecânico, tickets, chat e notificações. A distinção de estado é:

| Recurso | Estado de referência |
| --- | --- |
| Isolamento por oficina e autenticação | Presentes na base; preservar e validar nas novas operações |
| Estoque físico, movimentações e alerta visual | API e tela entregues; primeira entrega confirmada por Guilherme |
| Acesso do OPERADOR ao estoque | Somente leitura dos itens ativos e seus saldos; sem histórico ou movimentações |
| Peça do estoque na OS | Seleção e baixa transacional entregues; edição reconcilia apenas a diferença e remoção devolve o saldo |
| E-mail de estoque baixo | Configuração/campos modelados; envio ainda não implementado |
| Relações OS–operador/técnico | Campos e uso básico de `tecnicoId` já existem no controller da OS |
| Histórico de atribuição e visão restrita de OS do técnico | Modelagem preparada; fluxo completo ainda precisa ser integrado/verificado |
| Tickets de peças | Schema preparado; fluxo de API e telas ainda pendente nesta entrega |
| Chat e anexos com expiração de 48 horas | Schema preparado; conversa e limpeza automática ainda pendentes |
| Notificações | Persistência de estoque e sino entregues; central geral e leitura individual pendentes |

Ter um modelo no Prisma não significa que sua funcionalidade esteja pronta. Não recriar as tabelas abaixo sem primeiro conferir sua definição atual:

- `ConfiguracaoOficina`, `OrdemServicoAtribuicao`.
- `EstoquePeca`, `EstoqueMovimentacao`, `AlertaEstoque`.
- `RequisicaoPeca`, `RequisicaoPecaItem`.
- `ConversaTicket`, `MensagemTicket`, `MensagemAnexo`.
- `Notificacao`, `NotificacaoUsuario`.

## 5. Regras essenciais de negócio

### 5.1. Estoque físico e catálogo da OS são independentes

Esta é uma decisão explícita de Guilherme:

- `PecaCatalogo` é o cadastro usado no fluxo atual de peças da OS.
- `EstoquePeca` representa peças físicas armazenadas na oficina.
- Não criar relação entre esses dois cadastros.
- Não unificar tabelas, sincronizar saldos ou provocar baixa automática ao adicionar uma peça do catálogo à OS.
- A opção **Pegar do estoque** vincula `OrdemPecaItem` diretamente a `EstoquePeca`; escolher uma peça do catálogo continua sem provocar baixa. Um item da OS não pode apontar simultaneamente para catálogo e estoque.
- A futura requisição pode relacionar a OS e uma peça física por meio do ticket/item de requisição. Isso não autoriza vincular `PecaCatalogo` a `EstoquePeca`.

### 5.2. Perfis e proprietário

Os valores atuais do enum são `OWNER`, `ADMIN`, `OPERADOR` e `TECNICO`. Na linguagem do negócio, o mecânico corresponde a `TECNICO`. Não reintroduzir nomes antigos como `GERENTE`, `ATENDENTE` ou `MECANICO` no banco sem uma mudança expressamente solicitada.

O operador atua nos fluxos de atendimento/OS e pode apenas consultar os itens ativos e seus saldos no estoque. O administrador mantém os cadastros, o histórico e as movimentações de estoque. O técnico deverá solicitar peças pelo fluxo de tickets, além de atuar nas OS atribuídas.

Permissões efetivamente entregues para o estoque:

| Operação | ADMIN | OPERADOR | TECNICO | OWNER no código atual |
| --- | --- | --- | --- | --- |
| Consultar peças ativas e saldo | Sim | Sim | Não | Sim |
| Consultar peças inativas e histórico | Sim | Não | Não | Sim |
| Consultar alertas de estoque | Sim | Sim | Não | Sim |
| Registrar retirada manual (`SAIDA`) | Sim | Não | Não | Sim |
| Retirar peça vinculada ao salvamento da OS | Sim | Sim | Não | Sim |
| Cadastrar/editar peças | Sim | Não | Não | Sim |
| Repor, devolver, ajustar e inativar/reativar | Sim | Não | Não | Sim |

Na aba Estoque, o operador apenas visualiza os itens disponíveis: a interface não apresenta ações, a API retorna somente peças ativas e histórico e movimentações manuais permanecem restritos ao administrador. A retirada pelo operador ocorre somente dentro de uma OS, pela opção **Pegar do estoque**, ficando vinculada e registrada como movimentação da OS.

O proprietário foi discutido como responsável por manter a oficina, sem necessariamente atuar na operação diária. Entretanto, `authorizeRoles` e `ProtectedRoute` ainda têm uma exceção que permite acesso amplo ao `OWNER`. A entrega do estoque preservou esse comportamento; a restrição do proprietário não foi implementada. Tratar essa divergência numa tarefa específica de permissões, sem presumir que proprietário e administrador são semanticamente o mesmo papel.

### 5.3. Dados permanentes e temporários

Preservar os registros estruturados do negócio: OS, atribuições, requisições, estados relevantes das requisições, movimentações de estoque e notificações relevantes.

A expiração de 48 horas se aplica ao conteúdo efêmero do chat e seus anexos. Não usar a limpeza do chat para apagar a requisição, a OS, o histórico de movimentações ou o histórico de atribuições. A futura implementação deve cuidar tanto dos registros de anexos quanto dos arquivos físicos correspondentes.

## 6. Estoque entregue em detalhe

### 6.1. Funcionalidades

- Cadastro com código automático, nome, marca, aplicação, unidade, localização, quantidade atual inicial e quantidade mínima.
- Código imutável no formato `EST-000001`, derivado do ID da peça pelo backend. A restrição única por oficina permanece como garantia adicional.
- Unidade restrita a `UN` (unidade), `PAR` (par) ou `L` (litro), selecionada por lista suspensa na tela administrativa.
- Quantidades inteiras, conforme os campos `Int` existentes. Não introduzir frações sem revisar explicitamente esse requisito e a modelagem.
- Saldo inicial positivo registrado como entrada no histórico, com usuário e oficina.
- Edição cadastral sem alterar diretamente `quantidadeAtual`; alteração de saldo exige movimentação.
- Tipos manuais: `ENTRADA`, `SAIDA`, `DEVOLUCAO`, `AJUSTE_ENTRADA` e `AJUSTE_SAIDA`.
- Quantidade da movimentação é um delta positivo; o tipo determina se entra ou sai. Motivo obrigatório.
- Nenhuma saída pode deixar saldo negativo. Peça inativa não pode ser movimentada.
- Inativação em vez de exclusão definitiva, exigindo saldo zero e ausência de requisições pendentes. Histórico permanece.
- Busca por código, nome, marca, aplicação ou localização; filtros de ativas, inativas, todas e abaixo do mínimo.
- Histórico com usuário, data, tipo, motivo e saldos antes/depois; paginação de 30 registros.

Todas as alterações de saldo, histórico e alerta são realizadas na mesma transação Prisma. Para alterar uma peça existente, o serviço adquire bloqueio de linha com `SELECT ... FOR UPDATE`, filtrando ID e oficina. Preservar essa propriedade em qualquer futura baixa por ticket.

O operador não recebe botões de ação na tela e não pode consultar o histórico nem chamar endpoints de movimentação. A autorização é aplicada também no backend; todas as movimentações manuais são restritas ao administrador. O usuário da movimentação vem da sessão autenticada, não de um nome/ID enviado no formulário.

`SAIDA_REQUISICAO` existe no enum, mas é rejeitado no endpoint de movimentação manual. Fica reservado para a futura baixa vinculada ao ticket. `SAIDA_OS` e `DEVOLUCAO_OS` também não são tipos manuais; são gerados exclusivamente pela reconciliação da ordem de serviço.

### 6.2. Alertas

- Abrir alerta quando a peça estiver ativa e `quantidadeAtual < quantidadeMinima`.
- Saldo igual ao mínimo é regular: resolve o alerta ao atingir ou superar o mínimo.
- Não criar um novo alerta/notificação a cada movimentação enquanto o mesmo alerta continuar ativo.
- Uma nova queda após resolução gera um novo alerta.
- Cadastro, edição do mínimo, movimentação e ativação/inativação reavaliam o estado.
- O sino consulta alertas ativos da oficina. Atualiza após alteração na tela, ao retornar à janela e a cada 60 segundos.
- `notificarEstoqueSistema = false` desativa os avisos do sino, mas não oculta saldo baixo na tabela.
- São criados `AlertaEstoque`, `Notificacao` e destinatários `NotificacaoUsuario` para ADMIN/OPERADOR da mesma oficina.
- O sino atual não representa uma central completa com leitura individual de todas as notificações.
- Envio de e-mail ainda não existe. Não preencher `emailEnviadoEm` como se uma mensagem tivesse sido enviada.

### 6.3. Arquivos e rotas principais

| Arquivo | Papel no estoque |
| --- | --- |
| `backend/src/services/estoqueService.js` | Validação, regras, transações, saldo, histórico, alertas e permissão de movimentação |
| `backend/src/controllers/estoqueController.js` | Identidade da sessão, parâmetros, respostas e tratamento de erros |
| `backend/src/routes/estoqueRoutes.js` | Autenticação e acesso por perfil |
| `backend/src/server/server.js` | Registro de `/estoque` |
| `frontend/src/pages/admin/estoque.jsx` | Tela compartilhada por admin e operador, apesar do caminho da pasta |
| `frontend/src/styles/adminStyles/estoque.css` | Estilos da tela e dos diálogos |
| `frontend/src/components/Sidebar.jsx` | Item Estoque |
| `frontend/src/components/Topbar.jsx` | Sino de estoque |
| `frontend/src/styles/estoqueAlertas.css` | Estilos do sino e painel |
| `frontend/src/App.jsx` | Rota protegida `/estoque` |

| Método e rota | Uso |
| --- | --- |
| `GET /estoque` | Listar peças da oficina |
| `GET /estoque/alertas` | Listar alertas ativos |
| `POST /estoque` | Cadastrar peça |
| `PUT /estoque/:id` | Editar dados cadastrais, sem `quantidadeAtual` |
| `PATCH /estoque/:id/ativo` | Inativar/reativar |
| `POST /estoque/:id/movimentacoes` | Movimentar; somente ADMIN |
| `GET /estoque/:id/movimentacoes?pagina=1` | Histórico paginado; somente ADMIN |

### 6.4. Validação realizada e limites conhecidos

- A primeira entrega passou em 11 testes de regras; uma atualização anterior que liberava retiradas para o operador passou em 12 testes, mas essa permissão foi posteriormente removida por decisão de negócio.
- Os testes usam banco simulado. Eles não comprovam concorrência, bloqueios e rollback em um PostgreSQL real.
- Foram conferidas sintaxe JavaScript/JSX e resolução dos imports locais dos arquivos alterados.
- O build do Vite foi executado com sucesso após os ajustes de código automático, unidades e integração da OS ao estoque. Ainda não houve teste manual completo em navegador.
- Guilherme confirmou que a primeira entrega funcionou em seu ambiente. Não transformar esse retorno em alegação de cobertura completa de testes.
- A integração OS–estoque criou e aplicou a migration `20260908233000_vincula_estoque_ordem_servico`; nenhuma dependência nova foi adicionada.
- Registros que já estivessem baixos antes da funcionalidade são reavaliados ao editar, movimentar ou reativar a peça; não foi criada uma carga retroativa automática de alertas.
- A tela bloqueia clique duplo durante o envio, mas ainda não há chave de idempotência para reenvios HTTP. Após timeout, conferir histórico antes de repetir a movimentação.

### 6.5. Integração da ordem de serviço com o estoque

- Cada linha de peça da OS oferece caminhos separados: **Selecionar do catálogo** e **Pegar do estoque**.
- O modal de estoque mostra código, nome, saldo, unidade e localização; peças sem saldo não podem ser selecionadas na interface.
- A API valida novamente peça ativa, oficina, quantidade inteira e saldo disponível. A seleção feita no navegador não é usada como garantia de saldo.
- Ao criar a OS, a quantidade escolhida é baixada com `SAIDA_OS`. Ao editar, o backend compara as quantidades anteriores e atuais por peça, movimentando somente a diferença.
- Reduzir ou remover uma peça do estoque da OS gera `DEVOLUCAO_OS`. Excluir a OS também devolve as quantidades vinculadas antes de apagar seus itens.
- A OS e as peças de estoque são bloqueadas em ordem estável durante a transação para evitar baixa duplicada e saldo negativo em alterações concorrentes.
- Movimentação, saldo, itens da OS e alertas são confirmados ou revertidos juntos. O histórico mantém usuário, motivo e `ordemServicoId` enquanto a OS existir; na exclusão física, a referência fica nula, mas o código da OS permanece na observação da movimentação.
- Peças escolhidas no estoque não entram na lista de cotação para fornecedores, e o campo de fornecedor fica desabilitado para essas linhas.
- A integração adicionou `OrdemPecaItem.estoquePecaId`, `EstoqueMovimentacao.ordemServicoId` e os tipos `SAIDA_OS`/`DEVOLUCAO_OS`. Isso não cria relação entre `PecaCatalogo` e `EstoquePeca`.

## 7. Próximos passos

O estoque foi escolhido por Guilherme como primeira prioridade, antes de tickets/chat. A ordem abaixo organiza o restante por dependência; seguir a tarefa que ele solicitar, sem iniciar todos os itens automaticamente.

### 7.1. Consolidar o estoque e concluir os e-mails

1. Validar com login de OPERADOR que a tela mostra somente itens ativos e não apresenta histórico nem ações; chamadas diretas aos endpoints administrativos devem retornar 403.
2. Validar isolamento por oficina, concorrência e rollback com PostgreSQL de desenvolvimento. Exemplo: saldo 1 e duas retiradas simultâneas de 1; somente uma pode concluir.
3. Implementar configuração e envio de e-mail de estoque baixo, usando `ConfiguracaoOficina.notificarEstoqueEmail` e `emailNotificacaoEstoque`; definir explicitamente o comportamento quando não houver endereço configurado.
4. Usar o provedor/configuração que o projeto adotar, sem inventar credenciais. Uma falha no e-mail não deve desfazer uma movimentação já confirmada; registrar estado e permitir tentativas controladas.
5. Evitar e-mails repetidos para um mesmo alerta e marcar `emailEnviadoEm` somente após envio confirmado.

Idempotência das movimentações e tratamento de alertas antigos são pendências técnicas identificadas; avaliar quando forem necessárias ao fluxo, sem modificar o banco de forma especulativa.

### 7.2. Completar OS vinculada ao mecânico

Decisão de negócio: o mecânico deve trabalhar nas OS atribuídas a ele. A OS atribuída e aberta precisa aparecer em sua lista; quando `FECHADA`, deve deixar a lista ativa, encerrando a atribuição sem apagar seu histórico.

- Reaproveitar `OrdemServico.operadorId`, `tecnicoId` e `OrdemServicoAtribuicao`.
- O controller já recebe/valida técnico da mesma oficina; conferir e completar o fluxo, sem recriar a OS.
- Implementar atribuição, troca/encerramento da atribuição, histórico e filtro no backend para o técnico.
- Preservar a consulta histórica de quem executou/recebeu a OS; não apagar dados apenas para escondê-la da lista ativa.
- Definir a apresentação dos estados intermediários já existentes, como `EM_ANDAMENTO` e `AGUARDANDO_PECA`, sem confundir `FINALIZADA` com `FECHADA`.
- Integrar aviso de nova OS atribuída.

### 7.3. Implementar tickets de solicitação de peças

Fluxo definido:

1. Mecânico, na OS vinculada a ele, aciona **Solicitar peça**.
2. Abre-se uma requisição ligada à OS, com itens e quantidades, visível/notificada aos operadores da mesma oficina.
3. O primeiro operador que assumir/responder se torna responsável. A disputa entre dois operadores deve ser resolvida atomicamente no backend.
4. O responsável verifica disponibilidade no estoque físico ou providencia compra com fornecedor.
5. O sistema acompanha disponibilidade, entrega e encerramento, preservando os registros do atendimento.

Modelos existentes: `RequisicaoPeca` e `RequisicaoPecaItem`. Estados já modelados: `ABERTA`, `EM_ATENDIMENTO`, `AGUARDANDO_PECA`, `DISPONIVEL`, `ENTREGUE` e `CANCELADA`. Origem do atendimento: `ESTOQUE` ou `COMPRA_FORNECEDOR`.

Para atendimento pelo estoque, reutilizar as garantias de saldo, histórico e transação. Vincular a movimentação ao item da requisição e impedir baixa duplicada. Não descontar uma segunda vez uma peça já retirada pela OS ou manualmente para o mesmo atendimento; definir essa transição antes de ligar tickets ao fluxo existente.

Avaliar se o schema atual é suficiente para histórico de mudanças de status: ele contém estado atual e datas relevantes, mas não se deve alegar um histórico completo de todas as transições sem uma implementação que o registre.

### 7.4. Evoluir notificações

Reutilizar `Notificacao` e `NotificacaoUsuario`, além do sino atual. Eventos previstos: estoque baixo, nova OS atribuída, solicitação de peça, ticket assumido, peça disponível, nova mensagem e avisos gerais.

Implementar destinatários e permissões por oficina/usuário, leitura individual e apresentação dos eventos. Preservar o comportamento dos alertas ativos de estoque. Ler uma notificação não deve resolver um estoque que continua abaixo do mínimo.

### 7.5. Implementar chat temporário do ticket

Reutilizar `ConversaTicket`, `MensagemTicket` e `MensagemAnexo` para a conversa mecânico–operador, incluindo fotos/anexos quando necessários.

- Autorizar participantes e oficina no backend, incluindo acesso aos anexos.
- Definir `expiresAt` das mensagens para 48 horas após criação, conforme a decisão já registrada.
- Implementar limpeza automática do conteúdo expirado e dos arquivos temporários correspondentes.
- Manter requisição, OS, movimentações, estados/histórico relevantes e atribuições.
- O campo `expiresAt` sozinho não executa limpeza; é necessária uma rotina real.

### 7.6. Revisões posteriores

- Revisar o papel do proprietário quando Guilherme solicitar a etapa de permissões.
- Atualizar requisitos, diagrama de classes e documentação conforme funcionalidades efetivamente implementadas.
- Retomar cotações/comparação de fornecedores quando essa etapa for solicitada, verificando o que já existe. Houve discussão de importação por imagem/texto/manual, revisão humana e montagem de pedido para envio manual pelo WhatsApp; não tratar esse plano como uma integração pronta.
- Checkout, compra e ativação automática da licença permanecem dependentes de inspeção/implementação específica.

## 8. Forma de trabalhar e preservar o projeto

- Responder em português do Brasil, com explicações diretas, informando o que mudou e como validar.
- Manter JavaScript/JSX, ES Modules, CSS e bibliotecas existentes. Não migrar para Next.js, TypeScript, Tailwind ou outra arquitetura sem pedido.
- Reutilizar `api.js` no frontend para manter o envio do JWT e o tratamento de sessão.
- Manter a identidade visual atual: azul-marinho, fundos claros, laranja e azul como apoio; reutilizar Layout, Sidebar e padrões de formulário/tabela.
- Código novo deve ser legível; evitar JSDoc extenso e comentários que apenas repitam a implementação. Preservar comentários antigos fora do escopo.
- Validar no backend os dados recebidos, as permissões e a oficina de cada relação. Não confiar em `oficinaId`, usuário, perfil ou saldo enviados pelo navegador.
- Preservar alterações locais, módulos de OS e catálogo, dados existentes e migrations aplicadas. Não executar reset de banco, exclusão em massa ou seed por rotina.
- Explicar alterações de schema/migration antes de executá-las. Ações destrutivas precisam de autorização específica; alterações comuns e reversíveis já solicitadas podem prosseguir.
- Não expor senhas, tokens, `.env`, URLs de banco com credenciais ou dados reais de clientes em respostas, exemplos e commits.
- Fazer verificações focadas no comportamento alterado. Diferenciar teste com banco simulado, teste integrado, build e teste manual.
- Ao terminar, informar arquivos alterados, comportamento resultante, validação feita e limitações reais. Atualizar este registro quando uma etapa ou decisão importante mudar.

## 9. Comandos disponíveis

Executar no diretório indicado. Verificar os scripts atuais antes de usar, pois podem evoluir.

Backend, em `backend/`:

```bash
npm run dev
```

Teste de regras de estoque, em `backend/`:

```bash
node --test tests/estoque.test.js
```

Conferir estado das migrations, em `backend/`, com o banco correto configurado:

```bash
npx prisma migrate status
```

Gerar o Prisma Client quando necessário, em `backend/`:

```bash
npx prisma generate
```

Frontend, em `frontend/`:

```bash
npm run dev
```

Build do frontend, em `frontend/`:

```bash
npm run build
```

Há também scripts `npm start`, `npm run seed` e `npm run docs` no backend, e `npm run lint`/`npm run docs` no frontend. A existência do script não significa que ele tenha sido executado ou validado nesta entrega. Não executar seed para resolver um problema de autenticação sem verificar seu efeito sobre os dados.

## 10. Retomada recomendada no VS Code

Ao receber a próxima tarefa, conferir primeiro os arquivos atuais e o estado do estoque. Resumir brevemente o que já existe e implementar o pedido de Guilherme. Não presumir acesso automático às conversas antigas nem repetir etapas concluídas.

Pontos que precisam continuar verdadeiros: isolamento entre oficinas, estoque separado do catálogo da OS, operador somente leitura na aba Estoque mas autorizado a retirar pela OS, baixa/devolução transacional com histórico permanente e expiração restrita ao conteúdo temporário do chat.
