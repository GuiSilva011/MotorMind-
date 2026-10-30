# MotorMind — contexto e instruções para continuar o projeto

## 1. Como usar este documento

Este arquivo deve ficar na raiz do MotorMind, ao lado de `backend/` e `frontend/`. Ele registra a evolução do projeto, as regras de negócio, o estado da última entrega e as próximas etapas. É um ponto de partida para trabalhar com Guilherme; não é uma ordem para implementar todo o roteiro de uma vez.

Estado de referência: módulo de estoque integrado à ordem de serviço. Na aba Estoque, o OPERADOR permanece somente leitura; dentro da OS, ele pode escolher uma peça física pela opção **Pegar do estoque**, e a baixa é confirmada ao salvar. O código das peças de estoque é automático e a unidade é escolhida entre UN, PAR e L. O botão **Enviar OS para o cliente** foi removido; a geração e o compartilhamento do documento ficam centralizados em **Imprimir OS**, que permite salvar em PDF.

Atualização de 12/09/2026: primeira etapa de tickets e chat implementada. O técnico solicita peças em uma OS atribuída a ele; o operador assume atomicamente e conversa com o solicitante. Há status, histórico permanente, notificações individuais e anexos privados com expiração de 48 horas. A baixa continua exclusivamente no fluxo já existente da OS: o ticket não movimenta estoque nesta etapa. Consulte `TICKETS-LEIA-ME.md` e a seção 6.6.

Continuidade do painel técnico: o vínculo só é confirmado quando o operador salva a OS. O painel agora lista somente veículos com OS que não estejam `FINALIZADA`, `FECHADA` ou `CANCELADA` e que estejam atribuídas ao técnico. **Exibir ordem de serviço** abre os itens salvos em somente leitura; **Solicitar peça ao operador**, dentro dessa visualização, cria o ticket e leva à conversa. A lista geral de tickets serve para acompanhamento, não para abrir pedidos fora da OS. Detalhes na seção 6.7.

Atualização de 30/09/2026: por decisão de Guilherme, a confirmação de e-mail pelo Brevo foi removida do cadastro. `/cadastro-oficina` cria oficina e licença `ATIVA`, com responsável `ADMIN`, em uma única transação, e redireciona imediatamente para `/login`. O responsável entra com o e-mail/senha cadastrados. Não há envio de e-mail, token de confirmação, pagamento ou sessão automática. Contas anteriores pendentes não foram ativadas em massa; schema e migrations existentes foram preservados. Consulte `CADASTRO-OFICINA-LEIA-ME.md` e a seção 7.1.

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
- A landing page será a entrada pública comercial do MotorMind, separada da área autenticada da oficina. Seu fluxo planejado conduz da apresentação do sistema à “compra” e ao cadastro inicial da oficina.
- O cadastro inicial deve criar o ambiente isolado da nova oficina e o primeiro acesso responsável por ela, sem permitir que dados ou usuários sejam vinculados a outra oficina.
- Dados e configuração da oficina devem servir à identificação do negócio e aos documentos/PDFs emitidos pelo sistema.
- A existência de `Oficina`, `Licenca` e verificações no login não comprova que checkout, pagamento, cadastro público da oficina ou ativação automática já estejam implementados.

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
| Histórico de atribuição e visão restrita de OS do técnico | Vínculo confirmado no salvamento, painel filtrado por veículos atribuídos e visualização técnica somente leitura entregues |
| Tickets de peças | Abertura, disputa atômica, atendimento, status e histórico entregues; baixa direta pelo ticket e compra estruturada ainda pendentes |
| Chat e anexos com expiração de 48 horas | API, tela, anexos privados e limpeza automática entregues |
| Notificações | Sino de estoque preservado; avisos individuais de tickets/chat/atribuições entregues; central geral ainda pendente |

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

### 6.6. Tickets e chat — primeira etapa (12/09/2026)

- Reorganização de 14/09/2026, solicitada por Guilherme: tickets seguem `routes` → `controllers` → Prisma. `ticketController.js` concentra as operações, transações e respostas de tickets/chat/notificações; `ticketRoutes.js` declara apenas endpoints e middlewares. `ticketService.js` foi removido. Auxiliares compartilhados ficam em `utils/ticketRegras.js`, `utils/ticketArquivos.js` e `utils/notificacaoTicket.js`; validação de sessão, upload e tratamento de erros ficam em `middlewares/ticketMiddleware.js`. Preservar esse padrão no módulo. Sem mudança de endpoints, schema ou dependências. Passaram 13 testes de regras e 17 cenários HTTP/PostgreSQL (18 testes contando o agrupador), além da conferência de sintaxe/imports do backend. Detalhes em `TICKETS-LEIA-ME.md`.
- Tela compartilhada `/tickets` e detalhe `/tickets/:id`, acessíveis pelo menu **Solicitações de peças**. O técnico vê suas OS atribuídas e solicita peças por nome e quantidade inteira (até 20 linhas).
- A OS agora usa **Mecânico responsável** em vez de enviar `tecnicoId: 1`; o operador vem da sessão ao criar. Atribuições são abertas/encerradas com histórico e notificação. `FINALIZADA`, `FECHADA` e `CANCELADA` deixam a lista ativa do técnico, embora continuem estados distintos da OS.
- Técnico consulta somente seus tickets. Operadores da mesma oficina veem a fila e são os únicos que podem assumir tickets. ADMIN pode consultar tickets, mas na tela acessa somente as abas Histórico e Conversa, em modo de leitura; não pode assumir, alterar status nem enviar mensagens. O primeiro operador a assumir vence por bloqueio transacional e atualização condicional. Não existe transferência de responsável nesta etapa.
- Código automático `TKT-000001` derivado do ID. Ticket, itens, conversa, primeiro histórico e notificações são criados juntos. Chaves UUID impedem duplicação de abertura e de envio por repetição imediata da mesma requisição.
- Chat de escrita restrito ao solicitante e ao responsável; outro operador ou OWNER não participante não pode ler mensagens nem baixar anexos. ADMIN pode apenas consultar mensagens/anexos em modo de leitura. É necessário um OPERADOR assumir explicitamente antes que os participantes conversem.
- O responsável atualiza atendimento, espera, disponibilidade, entrega ou cancelamento. Entrega exige disponibilidade anterior e confirmação de todas as quantidades. O técnico pode cancelar antes de o ticket ser assumido. Cancelamento exige motivo.
- `RequisicaoPecaHistorico` registra cada transição nova com autor, estados, data e motivo opcional. Não foi fabricado histórico retroativo para registros antigos.
- **Sem baixa pelo ticket nesta etapa.** A confirmação de entrega registra `quantidadeAtendida`, mas não verifica/comprova uma saída de estoque. O operador deve registrar a retirada pela OS. Origem, fornecedor, atendimento parcial e vínculo de movimentação ao item do ticket continuam pendentes; não ligar `SAIDA_REQUISICAO` sem definir a transição para evitar dupla baixa.
- OS com tickets pendentes não pode fechar, cancelar ou trocar de técnico. OS com qualquer ticket ou histórico de atribuição não pode ser excluída pela API. Encerre/cancele preservando os registros.
- Mensagens têm até 2.000 caracteres; até três anexos de 5 MB (JPG, PNG, WebP ou PDF), com checagem de assinatura/MIME. Arquivos ficam em `backend/private/tickets/`, fora de `/uploads`; downloads exigem JWT, oficina, participação e prazo válido. Essa checagem não é antivírus.
- Imagens JPG, PNG e WebP aparecem em prévia no chat, com ampliação ao clicar e fechamento por botão ou Escape. `frontend/src/components/ImagemTicket.jsx` carrega o arquivo pela mesma rota privada usando Axios/JWT e uma URL temporária em memória, sem publicar o anexo. Cancela chamadas e libera a URL ao sair/expirar; falhas oferecem nova tentativa. Download continua opcional e PDFs mantêm o botão de download. Sem migration ou dependência nova. Build, lint focado, 13 testes de regras e 14 cenários integrados passaram, incluindo imagem autenticada, MIME, conteúdo, bloqueios e expiração; visualização manual ainda pendente por indisponibilidade do navegador.
- API oculta conteúdo expirado imediatamente. Limpeza no início do backend e a cada cinco minutos remove arquivos e mensagens vencidas, sem apagar tickets, OS, histórico, atribuições ou notificações. Falha de disco mantém a mensagem para nova tentativa. Órfãos com mais de 48 horas são reavaliados; não há serviço externo de limpeza enquanto o backend estiver desligado.
- Notificações de abertura (operadores), atribuição, ticket assumido, disponibilidade/status e mensagem. Chat gera aviso genérico sem copiar conteúdo efêmero. Painel mostra as 30 recentes, permite leitura individual ou marcar todas do usuário como lidas; isso não resolve nem marca alertas de estoque.
- Configurações `notificarTicketsSistema` e `notificarChatSistema` são respeitadas na geração dos avisos. Atualização por consulta periódica: fila/avisos 15 s, detalhe 10 s, chat 5 s. Não foram adicionados WebSocket nem novas dependências.
- Migration `20260912120000_tickets_chat` aplicada no banco local e Prisma Client regenerado. A migration adiciona histórico/chaves e protege a relação OS–ticket contra exclusão em cascata.
- Validação: 13 testes de regras e dez cenários HTTP/PostgreSQL (incluindo concorrência real) passaram em schema descartável separado. Os dados fictícios e anexos de teste foram removidos. Build passou; lint dos arquivos novos sem erros. A OS mantém um aviso pré-existente de dependência de `useEffect`. Navegador indisponível na sessão: teste visual/manual continua necessário.

### 6.7. Painel técnico e abertura de tickets dentro da OS

- Reorganização de 16/09/2026, solicitada por Guilherme: o técnico segue `tecnicoRoutes.js` → `tecnicoController.js` → Prisma. O controller concentra consultas e respostas HTTP do painel, OS técnica e histórico; as rotas declaram endpoints e middlewares. `tecnicoService.js` foi removido. Filtros, seleções de campos e bloqueio de vínculo ficam em `utils/tecnicoRegras.js`, reutilizados pelos controllers de veículos, OS e checklist; cache e erros ficam em `middlewares/tecnicoMiddleware.js`. Endpoints, permissões e formatos de resposta foram preservados, sem mudança de schema, migrations ou dependências.
- Validação desta reorganização: 13 testes de regras e 18 cenários HTTP/PostgreSQL em schema descartável passaram (19 testes incluindo o agrupador). A suíte cobre também equivalência das consultas técnicas pelas rotas antigas, perda de acesso após encerramento, IDs inválidos, erros JSON e ausência de cache. O schema temporário e os anexos de teste foram removidos pela suíte. Não houve alteração de frontend nem nova validação visual.
- O operador seleciona **Mecânico responsável** e salva. Selecionar um nome no formulário não efetiva a atribuição. A gravação da OS, do vínculo, dos itens e do aviso permanece transacional; erro ao salvar reverte também a atribuição.
- `/tecnico/painel` consulta `GET /tecnico/veiculos`: somente veículos da oficina com pelo menos uma OS atribuída ao usuário autenticado e não `FINALIZADA`/`FECHADA`/`CANCELADA`. Ao salvar a OS como `FINALIZADA`, o operador encerra sua atribuição ativa e ela deixa imediatamente a lista e os acessos ativos do técnico, preservando o histórico. Várias OS do mesmo veículo geram um cartão com acesso separado a cada ordem, não veículos duplicados. O painel atualiza a cada 15 segundos e ao retornar à janela.
- Permanecem **Nova checklist**, consulta de **Checklists** e **Histórico veicular**. O vínculo atual também é exigido pela API das checklists; a criação bloqueia as OS vinculadas durante a transação para não confirmar uma checklist após perder a atribuição.
- A listagem antiga de veículos e sua busca também filtram o perfil TECNICO. Não considerar isso uma auditoria completa dos demais endpoints legados ou da publicação antiga de fotos de checklist em `/uploads`.
- **Exibir ordem de serviço** abre `/tecnico/ordens-servico/:id`, usando `GET /tecnico/ordens/:id`. Somente a OS ativa atribuída ao técnico pode ser aberta nessa visão, incluindo checagem de oficina.
- A visualização traz exclusivamente os diagnósticos, serviços e peças persistidos, com nomes, descrições técnicas, quantidades e seus agrupamentos. Não traz preços, custos, formulários de edição ou cadastros completos do cliente. Não preenche dados com o catálogo atual nem com rascunhos do navegador.
- Peças de serviços, peças avulsas e eventuais vínculos diretos a diagnósticos já persistidos são exibidos sem duplicação. A nova tela não acrescenta um novo caminho de cadastro de peças diretas no formulário do operador.
- **Solicitar peça ao operador** abre o formulário dentro da OS; somente a confirmação cria ticket, itens, conversa e avisos. Depois, o técnico é levado ao ticket. A conversa é liberada quando um operador assume, preservando a disputa atômica existente. Abrir a OS ou o formulário não cria ticket.
- A lista `/tickets` mantém acompanhamento/chat e um link para o painel técnico; não contém mais a abertura de pedido por uma lista paralela de OS. Notificações de atribuição levam à visualização da OS.
- O histórico é consultado por `GET /tecnico/veiculos/:veiculoId/historico` e `.../historico/:ordemId`. Enquanto houver vínculo ativo com o veículo, o técnico consulta também OS anteriores dele, inclusive encerradas ou realizadas por outro técnico da mesma oficina. Isso não permite solicitar peças por essas OS antigas nem consultar veículos sem vínculo atual.
- O componente técnico é reutilizado no histórico para mostrar todos os grupos de itens e evitar contagem duplicada. Encerrar/cancelar a última OS vinculada retira o veículo da lista ativa, sem apagar seu histórico.
- Arquivos centrais: `backend/src/controllers/tecnicoController.js`, `backend/src/routes/tecnicoRoutes.js`, `backend/src/utils/tecnicoRegras.js`, `backend/src/middlewares/tecnicoMiddleware.js`, controllers de veículos/checklist/OS; `frontend/src/pages/tecnico/painel.jsx`, `ordemServico.jsx`, `historicoVeicular.jsx`, `frontend/src/components/ConteudoOrdemTecnica.jsx` e `NovaSolicitacao.jsx`.
- Nenhum schema, migration ou dependência foi alterado nesta continuidade. Validação: 14 cenários integrados HTTP/PostgreSQL em schema descartável passaram (15 testes contando o agrupador), incluindo vínculo após salvamento, rollback, múltiplas OS, troca de mecânico, snapshots do catálogo, checklist, histórico e regressão de tickets/chat. Build passou. Validação visual/manual ainda deve ser feita no ambiente local.

### 6.8. Exclusão de funcionários e reset local (30/09/2026)

- A exclusão de operadores/técnicos agora é lógica: `Usuario.excluidoEm` registra a data. Usuário e funcionário são preservados no banco para manter nomes, OS, atribuições, tickets, mensagens e movimentações. A ação remove o funcionário das listas e encerra seu acesso. Não trocar vínculos históricos por exclusão em cascata.
- `DELETE /funcionarios/:id` exige ADMIN/OWNER e oficina da sessão. Bloqueia exclusão do próprio usuário e de ADMIN/OWNER por esse endpoint. IDs inválidos retornam `400`, outra oficina `404`, e repetir a exclusão retorna sucesso sem mudar a data.
- Tickets pendentes do solicitante/responsável devem ser concluídos ou cancelados antes da exclusão, com resposta `409` indicando o ticket. A abertura/assunção e a exclusão bloqueiam o usuário em transação para evitar atendimento novo após sua remoção.
- Login recusa excluídos. O middleware JWT consulta o usuário/oficina a cada requisição, rejeita excluídos ou inexistentes e usa o perfil atual do banco. Tokens anteriores à criação do registro também são recusados, evitando reutilizar IDs recriados após reset.
- Listas de funcionários/técnicos e novos destinatários de notificações ignoram excluídos. O e-mail continua reservado pelo registro histórico; não há reativação pela interface nesta etapa.
- OS existentes mantêm os responsáveis e podem ser editadas, encerradas ou transferidas para outro técnico. O seletor identifica o mecânico anterior como fora da equipe. Novas atribuições e reabertura com técnico excluído são recusadas pela API.
- Cadastro e edição de funcionários também exigem ADMIN/OWNER no backend; a consulta usada pela OS continua autenticada. A API de edição não altera registros excluídos.
- Migration aditiva `20260930160000_exclusao_logica_usuario` aplicada e Prisma Client regenerado. Testes integrados em schema descartável cobrem permissões, isolamento, histórico, tickets pendentes, sessões antigas, listas, duplicação, edição/reabertura de OS e repetição da exclusão.
- Reset solicitado por Guilherme executado no PostgreSQL local `localhost:5432`, banco `motormind`, schema `public`, reaplicando as dez migrations, sem seed. O banco ficou vazio para um novo cadastro público. Arquivos de upload não fazem parte do reset do banco.
- Validação final: zero registros de negócio nas 30 tabelas do schema, dez migrations aplicadas e backend respondendo após o reset. Passaram 32 testes de regras e 37 cenários HTTP/PostgreSQL (72 testes contando subtestes e agrupadores), além de build e lint focado sem erros. Permanecem os avisos anteriores de tamanho do bundle e dependência de `useEffect` na OS; teste visual/manual não realizado nesta sessão.

### 6.9. Botão de exclusão de clientes (30/09/2026)

- A visualização do cliente oculta **Excluir** quando houver agendamento vinculado ao cliente ou OS, checklist ou agendamento de algum de seus veículos. O botão permanece para clientes sem esses vínculos, conforme a regra de exclusão já existente.
- Listagem e busca por nome retornam `podeExcluir`, calculado pelo backend a partir dos vínculos persistidos. A interface só mostra o botão quando recebe permissão explícita. A operação de exclusão e sua proteção no banco permanecem iguais; não houve migration.

### 6.10. Sidebar recolhível (01/10/2026)

- O modelo de navegação recebido em TXT foi adaptado ao JSX/CSS existente. A estrutura reutilizável fica em `frontend/src/components/ui/navbars.jsx`; opções, ícones e filtros de perfil continuam em `Sidebar.jsx`. Não foram adicionados shadcn, Tailwind, TypeScript ou dependências.
- A lateral usa fundo claro, cabeçalho **Menu**, itens compactos, destaque da rota atual e setas nos submenus. O nome MotorMind e o bloco com nome/perfil da conta foram removidos da sidebar, conforme solicitação de Guilherme.
- No desktop, o botão alterna entre 256 px e 64 px; o menu tem rolagem interna e **Sair** permanece no rodapé. Os submenus da rota atual abrem automaticamente. Os ícones SVG e React Icons existentes foram preservados.
- Até 900 px, a navegação abre em um `dialog` nativo pelo botão **Abrir menu**. Escape, clique no fundo, botão de fechamento ou seleção de um link fecham o painel. O dialog mantém o foco no painel enquanto aberto e a rolagem de fundo é bloqueada.
- `Layout.jsx` importa os estilos compartilhados diretamente. Não houve mudança de API, permissões, schema ou migrations.
- Build e lint dos três componentes alterados passaram. A renderização foi conferida em seis cenários de perfis/rotas, incluindo menus ADMIN/OPERADOR/TECNICO/OWNER, submenus da rota atual e ausência do nome/conta na lateral. O navegador estava indisponível; interação e aparência ainda precisam de conferência manual.

### 6.11. Identidade visual da Ordem de Serviço (01/10/2026)

- A OS do operador adota uma identidade sóbria com paletas claro/escuro, ações principais azuis, tipografia de 13–14 px, título de 26 px e superfícies/bordas discretas. `styles/temaOficina.css` centraliza as cores e permite reutilização posterior; esta entrega aplica o tema à OS e à navegação compartilhada enquanto ela está aberta.
- O seletor **Claro / Escuro** usa sol/lua e `aria-pressed`. `useTemaOficina.js` persiste `motormind_tema`, com claro como padrão. A troca altera atributos/variáveis, preservando o formulário, a edição, os itens e os menus abertos. Sidebar, solicitações, alertas, campos, estados vazios, botões, modais e avisos do Toastify recebem a paleta escolhida.
- `OrdemServicoTela.jsx` concentra a apresentação e delega todas as ações às funções existentes em `pages/operador/ordemServico.jsx`. A coluna principal reúne atendimento e itens; a lateral de 240 px contém **Gestão da OS**, **Resumo financeiro** e **Documentos e cotação**, passando para baixo em larguras menores. Por decisão de Guilherme em 03/10/2026, **Imprimir OS** e **Enviar cotação para fornecedor** ficam nesse painel direito, em botões de largura total; handlers e condições de habilitação permanecem iguais. **Voltar** continua no final da coluna principal.
- Cliente/veículo têm resumo compacto, placa identificada e **Ver dados completos do veículo**, com os mesmos campos somente leitura. Observações passam a textarea. Diagnósticos, serviços e peças são agrupados em cartões. Identificadores `D.01`/`S.01`/`P.01` são de apresentação; os códigos internos, cotações e impressão mantêm seus fluxos.
- Ajuste de inclusão solicitado por Guilherme: na criação/edição, os campos de serviços/peças e a escolha de catálogo/estoque ficam visíveis, sem exigir expansão. **Adicionar serviço** fica em **Serviços deste diagnóstico** e **Adicionar peça** em **Peças deste serviço**, com nomes acessíveis indicando o grupo. Cada item novo aparece antes do respectivo botão. Serviços sem diagnóstico e peças avulsas têm áreas próprias e explicação do vínculo, inclusive quando vazias. Na consulta, os campos permanecem bloqueados e expansíveis por **Ver dados e valores**. O ajuste altera somente apresentação, CSS e testes; usa as mesmas funções de inclusão e seleção.
- `utils/ordemServicoCalculos.js` reúne a regra anterior de desconto por item e piso zero. O financeiro apresenta serviços/peças antes dos descontos, os descontos efetivamente aplicados e o total líquido; os totais líquidos usados na impressão permanecem disponíveis. Os dois botões **Salvar OS** usam a mesma função existente.
- `ModalOficina.jsx` usa dialog nativo com título associado, foco modal, Escape, fechamento por botão/fundo e bloqueio da rolagem de fundo. Campos têm labels associados; remoções têm nomes acessíveis. Tabelas viram linhas identificadas no mobile. A busca de OS também oferece o status interno `FECHADA`, já existente no sistema.
- Nenhuma API, permissão, regra de atribuição, regra de baixa/devolução, schema, migration ou dependência foi alterada. A auditoria estrutural preservou as 85 funções operacionais da OS; a tabela do catálogo recebeu apenas identificação/acessibilidade, e a renderização das peças foi transferida para o componente visual.
- Build, lint focado sem erros e 20 testes (`npm run test:os`, em `frontend/`) passaram após o ajuste de inclusão. A suíte usa funções reais com API simulada e renderização React para conferir campos novos disponíveis sem expansão, inclusão no grupo escolhido, criação/busca/edição, seleção, estoque, totais, envio, falhas, consulta e tema. Mantêm-se os avisos anteriores de dependência do efeito de inicialização e tamanho do bundle. Navegador indisponível: aparência, responsividade, foco e alternância em interação real ainda requerem conferência manual. Detalhes em `ORDEM-SERVICO-LEIA-ME.md`.

### 6.12. Uniformidade dos cadastros e sidebar azul (03/10/2026)

- Cadastros de peças e diagnósticos adotam a identidade da OS: títulos de 26 px, textos de 13–14 px, cartões discretos, campos e ações azuis. Ambos usam `useTemaOficina` e `SeletorTema`, compartilhando a preferência claro/escuro já persistida pela OS.
- `frontend/src/styles/oficinaUi.css` centraliza página, cabeçalho, cartões, formulários, botões e tabelas. `Layout.jsx` importa os estilos compartilhados; `OrdemServicoTela.jsx` usa as mesmas classes de página/cabeçalho/cartões. Os CSS de peças e diagnósticos ficam responsáveis pelas grades específicas de cada cadastro.
- Labels foram associados aos campos; ações da tabela identificam o registro e as células têm rótulos para exibição em celular. Consulta, edição, exclusão, validação, geração de códigos e chamadas da API dos cadastros foram preservadas.
- A sidebar compartilhada passa a ter gradiente azul escuro em todos os perfis, nos dois temas, expandida, recolhida e no painel mobile. Textos/ícones claros, destaque da rota atual, bordas e foco foram ajustados ao fundo. As regras de tema deixam de substituir esse gradiente por uma superfície clara/escura.
- Nenhuma API, permissão, regra de OS/estoque, schema, migration ou dependência foi alterada. Build e lint dos componentes alterados passaram, assim como os 20 testes existentes da OS. A renderização React dos dois cadastros foi conferida nos dois temas, com labels, seleção de tema, rota atual e campos somente leitura; comparação do código confirmou preservação dos fluxos operacionais.
- Permanece o aviso anterior de tamanho do bundle. Não havia navegador disponível na sessão; aparência, responsividade e interação manual ainda precisam de conferência no ambiente local.

### 6.13. Cadastro de serviços e nova topbar (03/10/2026)

- `pages/operador/servicos.jsx` passa a usar o padrão compartilhado de peças, diagnósticos e OS, com temas claro/escuro, cartões, campos e botões de `oficinaUi.css`. Labels/IDs, ações por registro e rótulos das células no celular foram acrescentados; `servicos.css` contém somente a grade responsiva. Código automático, valores, filtros e fluxos de cadastro/edição/exclusão foram preservados.
- `Topbar.jsx` agrupa tema e avisos à direita. Por decisão mais recente de Guilherme, o texto **Oficina > página** foi removido da barra, junto com o mapa de títulos e seus estilos; o alinhamento dos controles foi ajustado. `estoqueAlertas.css` concentra o layout da barra e dos painéis, usando a paleta da tela ou cores claras de referência nas telas anteriores. Controles de avisos ficam compactos em larguras menores, mantendo nomes acessíveis e indicação de contagem/carregamento/erro.
- Topbar controla qual painel está aberto; tickets e estoque não se sobrepõem. Botões de fechamento e Escape devolvem o foco ao controle de origem; clique fora e mudança de rota fecham o painel. `NotificacoesTickets.jsx` recebe o estado de abertura e mantém consultas, leitura individual/todas, navegação e tratamento de erros existentes.
- Regras antigas de posicionamento da topbar foram retiradas de `tickets.css` e `temaOficina.css` para evitar conflitos. Permissões, consultas periódicas, avisos de estoque e suas regras de resolução permanecem iguais; nenhuma API, dependência ou banco foi alterado.
- Build e lint focado passaram, assim como os 20 testes existentes da OS. Renderização React conferida nos dois temas para serviços e em seis cenários de perfil/rota para a topbar; painel de solicitações aberto também foi renderizado. Os handlers reais foram executados com estado/API simulados para conferir exclusividade, fechamento/foco/rota, leitura e navegação de notificações, incluindo falhas. O código de consultas de estoque e os fluxos de serviços foram comparados com os anteriores e preservados.
- Permanece o aviso anterior de tamanho do bundle. Não havia navegador disponível na sessão; validação visual e interação em navegador continuam pendentes.

### 6.14. Atalhos inferiores e identidade de estoque/tickets (03/10/2026)

- `Sidebar.jsx` lista **Solicitações de peças** e **Estoque** depois dos menus específicos de cada perfil, antes do rodapé **Sair**. A ordem e os filtros de perfil são compartilhados pelo desktop e pelo painel mobile; TECNICO continua sem acesso ao Estoque.
- `pages/admin/estoque.jsx` e `pages/tickets.jsx` adotam `oficina-theme`, o seletor claro/escuro e a preferência persistida já usada pelos cadastros e pela OS. Páginas e cabeçalhos usam as classes compartilhadas. Estoque recebe cartões de resumo, estados de saldo, tabela e modais com a mesma paleta; tickets recebem lista, detalhe, status, histórico, chat, anexos e diálogos com cores e medidas uniformes.
- `adminStyles/estoque.css` e `tickets.css` passam a usar variáveis da paleta. `temaOficina.css` acrescenta cores de aviso para saldo baixo e tickets em espera nos dois temas. Tabelas de estoque/histórico e itens do ticket têm rótulos por célula para celular. Diálogos de tickets usam cores de referência quando abertos em telas que ainda não adotam o tema.
- A alteração é de apresentação e ordenação. OPERADOR permanece somente leitura na aba Estoque; cadastro, histórico e movimentação permanecem administrativos. Chat mantém `podeLerChat`, leitura após encerramento e anexos privados; ticket não gera baixa. Consultas, filtros, salvamento, transições, quantidades e endpoints foram preservados, sem mudança de backend, schema, migration ou dependências.
- Build e os 20 testes existentes da OS passaram. Renderização React com dados simulados conferiu ordem do menu nos quatro perfis, desktop/mobile, temas, ações administrativas, bloqueio visual do chat sem acesso, leitura após entrega e modal de estoque com código automático/unidades/quantidades inteiras. Comparação do código confirmou preservação dos fluxos operacionais.
- Sidebar e tickets passam no lint; Estoque mantém dois erros anteriores de `react-hooks/set-state-in-effect` nos efeitos de carregamento, confirmados também na versão de referência. Não foram introduzidos novos diagnósticos de lint. O aviso de tamanho do bundle permanece. Navegador indisponível: conferência visual e interação manual continuam pendentes.
- Refinamento solicitado na mesma data: Estoque ganha ícones nos resumos/ações, busca identificada, título e contagem de resultados e estados vazios orientados por perfil. Solicitações usam os cartões compartilhados, resumo de OS/veículo/participantes, indicação do item selecionado, contagem total do filtro, histórico em linha do tempo e ações de atendimento/chat com ícones. `oficinaUi.css` reúne títulos de seção, busca com ícone e estados vazios reutilizáveis. Quantidades, permissões, consultas e funções operacionais permanecem iguais.
- A renderização React do refinamento passou em 18 cenários com dados simulados, além das verificações de chat sem permissão e ticket encerrado. Foram conferidos os dois temas, os quatro perfis, seleção/contagem, estados de carregamento/erro/vazio e OPERADOR sem ações administrativas. As seis funções de abertura/fechamento/salvamento de estoque e envio/download/atendimento de tickets foram comparadas com o estado anterior e preservadas. Esta verificação não substitui a conferência visual em navegador.

### 6.15. Identidade visual dos clientes (03/10/2026)

- `pages/operador/cadastroCliente.jsx` e `visualizarClientes.jsx` adotam `oficina-theme`, o seletor claro/escuro e os mesmos estilos de página, cartões, campos, tabelas e botões usados pelos cadastros e pela OS. `operadorStyles/clientes.css` concentra placas, mensagens e identificação do modo de visualização; os CSS de cadastro/consulta ficam limitados ao workspace de clientes, sem seletores genéricos de outros módulos.
- Cadastro, edição e visualização preservam os dados pessoais, endereço, máscaras e vínculos de veículos. A tabela de veículos passa a ter cabeçalhos semânticos, ações por placa e rótulos das células no celular. Campos da visualização permanecem bloqueados; **Excluir** continua condicionado a `podeExcluirCliente`, ID e término do carregamento, mantendo a regra de clientes sem vínculos.
- O modal de veículo reutiliza `ModalOficina` com dialog nativo, título associado, foco modal, Escape, botão/fundo para fechar e paleta compartilhada. Na consulta de veículo o título é **Dados do veículo** e os campos continuam bloqueados. Mensagens de validação do veículo aparecem dentro do modal; cadastro/remoção local e confirmação ao salvar permanecem iguais.
- A consulta apresenta busca identificada por nome/placa, contagem de resultados e cartões com dados de contato e veículos. **Novo cliente** abre a rota existente, e falhas de consulta oferecem nova tentativa pela função de carregamento já existente. Busca normalizada por placa, navegação com dados do cliente, retorno após edição/exclusão e mensagens existentes foram preservados. Nenhuma API, permissão, schema, migration ou dependência foi alterada.
- Build passou. Renderização React com dados simulados passou em 32 cenários, cobrindo dois temas, perfis OPERADOR/OWNER, criação/edição/visualização, bloqueio de exclusão de cliente vinculado, veículos removidos, dialog de veículo, labels/IDs, busca de placa com hífen e estados vazio/carregando/erro. Comparação estrutural confirmou preservação de 41 funções/callbacks; somente o antigo controle de propagação do overlay foi substituído pelo dialog compartilhado.
- Lint mantém os dois erros anteriores de `react-hooks/set-state-in-effect` em `visualizarClientes.jsx` e um aviso anterior de dependência do efeito em `cadastroCliente.jsx`, confirmados na versão de referência. Não houve novo diagnóstico. Mantém-se o aviso de tamanho do bundle. Navegador indisponível: conferência visual, responsividade e foco em interação real permanecem pendentes.
- Apresentação atual de **Consultar clientes**, conforme decisão mais recente de Guilherme: cards detalhados e compactos em grade responsiva, com nome/CPF, celular/e-mail, endereço/complemento/bairro/cidade/UF/CEP e todos os veículos vinculados. Veículos usam ícone de carro, placa identificada, modelo e informações disponíveis de fabricante/ano/cor. **Visualizar** permanece no cabeçalho de cada card e mantém a navegação existente. Temas, cadastro, detalhe, modal e regras de exclusão permanecem iguais.
- A busca tem legenda visível acima do campo. Lupa e input ocupam colunas distintas de uma grade, sem posicionamento absoluto; o foco destaca o controle inteiro. Isso elimina a sobreposição entre ícone, legenda e texto do campo. Build e 11 cenários de renderização React com dados simulados passaram, cobrindo temas, OPERADOR/OWNER, cards, contatos/endereço, múltiplos veículos, estrutura da busca, filtros e estados vazio/carregando/erro. Estado, efeitos, filtros, formatação e navegação foram comparados com a referência e preservados. Permanecem os dois erros anteriores de lint da consulta; conferência visual em navegador continua pendente.

### 6.16. Identidade visual dos agendamentos (03/10/2026)

- `pages/operador/agendamentos.jsx` e `calendarioAgendamentos.jsx` adotam a paleta compartilhada, seletor claro/escuro na topbar e os mesmos padrões de página, campos e botões das telas já atualizadas. Os dois CSS ficam limitados a `agendamentos-workspace`, removendo os antigos seletores genéricos que afetavam outros módulos.
- O cadastro organiza cliente/veículo e dados do atendimento em dois blocos compactos, com labels associados aos campos, resumo do cliente selecionado e atalho para visualizar agendamentos. A lupa ocupa uma coluna própria junto ao input; a legenda fica acima. Veículos usam `TbCar`. Busca por nome/CPF/placa, seleção e troca de cliente, validações, limpeza e payload de cadastro permanecem iguais, inclusive o nome do técnico e o status `AGENDADO`.
- O calendário mantém as visões mês/semana/dia/agenda, com barra própria para Hoje, período anterior/próximo e troca de visão. Eventos mostram serviço, cliente e placa disponível, com título original preservado. Há contagem total de cadastros, atualização e atalho para novo agendamento. No celular, as grades de mês/semana permitem rolagem horizontal e os controles ficam na largura da tela; dia e agenda oferecem visões alternativas.
- Os detalhes usam `ModalOficina` com dialog nativo, título associado, Escape/fundo/botão para fechar, dados em lista semântica e descrição preservando quebras de linha. **Excluir agendamento** e **Gerar ordem de serviço** mantêm as funções e navegação existentes. Nenhuma API, permissão, schema, migration ou dependência foi alterada; o período de uma hora usado na exibição de cada evento permanece igual.
- Build passou. Foram preservadas 18 funções/efeitos/filtros por comparação estrutural. Verificação React com dados simulados passou em 44 cenários de renderização/controles: temas, OPERADOR/OWNER, busca por placa, seleção, labels, carregamento, quatro visões, detalhes, resumo do evento e encaminhamento das ações da barra ao calendário. A visão mensal mede suas linhas no navegador; o resumo do evento foi validado separadamente, sem alegar medição real da grade.
- Lint não ganhou novos diagnósticos: permanecem dois erros anteriores de `react-hooks/immutability` no cadastro e um aviso anterior de `react-hooks/exhaustive-deps` no calendário. Mantém-se o aviso de tamanho do bundle. Navegador indisponível nesta sessão; conferência visual, responsividade e foco em interação real permanecem pendentes.

### 6.17. Identidade visual das telas administrativas (04/10/2026)

- Cadastro e consulta de funcionários/fornecedores e Relatórios adotam o mesmo `Layout`, tema claro/escuro, preferência persistida, cartões, campos, botões e tabelas das telas já atualizadas. `adminStyles/administracao.css` concentra as grades, seções, busca e modais dos quatro cadastros; os quatro CSS anteriores foram substituídos por esse arquivo compartilhado. Estoque já usava essa identidade e foi preservado.
- Formulários recebem labels associados, ícones de seção e atalhos entre cadastro/consulta. Consultas mantêm filtros e ações, com células identificadas para celular. Os dois modais de edição reutilizam `ModalOficina`, com dialog nativo, título associado, Escape, fechamento pelo fundo/botão e bloqueio da rolagem. Relatórios mantêm as contagens/rankings existentes, com paleta compartilhada, nomes legíveis e ocorrências visíveis nas barras.
- **Relatórios** passa a ser o último link do menu ADMIN, depois de **Estoque** e antes de **Sair**, tanto no desktop quanto no painel mobile. Os filtros de perfil permanecem iguais. Nenhuma API, permissão, regra de negócio, schema, migration ou dependência foi alterada; a alteração local existente em `services/api.js` foi preservada.
- Build e lint focado passaram. Comparação estrutural confirmou preservação de 46 funções operacionais; 36 cenários de renderização React com dados simulados passaram, incluindo temas, cadastro, consulta, carregamento, filtros, edição, rankings e navegação nos quatro perfis em desktop/mobile. Essas verificações não comprovam medidas ou interação real no navegador. O navegador estava indisponível; conferência visual, responsividade e foco continuam pendentes. Mantém-se o aviso anterior de tamanho do bundle.

### 6.18. Relatórios gerenciais em abas (04/10/2026)

- `pages/admin/relatorios.jsx` passa a organizar o conteúdo em **Visão geral**, **Evolução**, **Status e valores**, **Rankings** e **Ordens de serviço**, conforme o refinamento solicitado por Guilherme. As abas ficam logo abaixo do título da página, acima dos filtros, conforme a decisão mais recente. Somente o painel selecionado fica visível; os demais permanecem montados para preservar tipos de gráfico e estados da tabela. Abas têm associação semântica, seleção, foco e navegação por setas/Home/End, com rolagem horizontal no celular.
- Filtros compartilhados por período de emissão, status e técnico, com períodos rápidos e intervalo personalizado. Visão geral mostra quantidade de OS, valor dos itens, ticket médio, ordens ativas/concluídas e clientes distintos. **FINALIZADA** e **FECHADA** continuam estados separados. Valores representam as OS emitidas no período, sem afirmar recebimento ou lucro; canceladas entram nas contagens/status, mas saem dos valores, clientes e rankings.
- `utils/relatoriosGerenciais.js` normaliza a resposta existente, remove duplicações por ID entre peças/serviços listados em diferentes grupos e soma valores em centavos. Usa o total líquido persistido do item ou, quando ausente, a regra compartilhada de descontos da OS. Rankings contemplam peças por quantidade, serviços, modelos, marcas e técnicos; homônimos de técnicos permanecem separados por ID.
- `components/GraficoRelatorio.jsx` oferece barras horizontais, colunas, linha, rosca e tabelas conforme a análise. Evolução preenche dias/meses sem emissão; períodos maiores são agrupados por mês. Rankings mostram os dez primeiros nos gráficos e todos na tabela paginada; a rosca agrupa os demais em **Outros** sem perder o total. A tabela de OS tem busca, paginação e exportação CSV dos resultados filtrados, com BOM, decimal brasileiro e campos textuais protegidos contra interpretação como fórmula.
- Mantidos Layout, preferência claro/escuro, posição de Relatórios na sidebar, Axios/JWT e consulta `GET /ordens-servico`. A consulta continua buscando todas as OS da oficina e filtrando/paginando no frontend. Nenhum endpoint, permissão, schema, migration ou dependência foi alterado. Atualizações falhas preservam a última consulta válida e informam o erro; consultas são canceladas ao sair da tela ou iniciar outra atualização.
- Build, lint focado e 31 testes (`npm run test:relatorios`, em `frontend/`) passaram. A suíte valida cálculos, deduplicação, datas, canceladas, rankings, CSV, cinco representações, abas, handlers de filtros/carregamento e estados de tela com API/dados simulados e renderização React. Navegador indisponível: aparência, responsividade, foco real e download do CSV continuam sem conferência manual. Permanece o aviso anterior de tamanho do bundle.

### 6.19. Área do mecânico e navegação simplificada (04/10/2026)

- As seis telas de `pages/tecnico/` passam a usar Layout, tema claro/escuro persistido, seletor na topbar, controles e paleta compartilhados. `tecnicoStyles/tecnico.css`, `painelMecanico.css`, `inspecao.css` e `conteudoOrdem.css` substituem os seis CSS anteriores. Por decisão mais recente de Guilherme, o retângulo azul com **Painel técnico** foi removido: a tela começa diretamente em **Meus atendimentos** e no acompanhamento dos pedidos. Os estilos exclusivos desse cabeçalho também foram removidos. Build e lint focado do painel passaram após a remoção; conferência visual permanece pendente.
- O painel oferece visões **Por OS** e **Por veículo**, busca e filtros rápidos pelos status ativos. A visão de OS ordena por último salvamento e apresenta somente a ação de abrir a ordem; os veículos agrupam suas OS e oferecem checklist e histórico por veículo. Vínculos, atualização de 15 segundos e retorno à janela permanecem no fluxo existente.
- Peças disponíveis e outros pedidos ativos são consultados pelos endpoints de tickets já existentes, filtrados pelo usuário. Solicitações disponíveis não se repetem na lista dos demais pedidos. A abertura continua exclusivamente dentro da OS; os atalhos de pedidos abrem o ticket correspondente, sem criar requisição ou movimentar estoque.
- Conforme a decisão mais recente de Guilherme, foram retirados os quatro cards de **Veículos em atendimento**, **Ordens de serviço ativas**, **OS aguardando peça** e **Solicitações pendentes**. Também foram removidas ações repetidas para atualizar o painel, abrir a lista geral de solicitações e retornar ao painel pela troca de veículo. O histórico atualiza pela ação da linha do tempo, sem repetir a placa em um campo de busca somente leitura.
- Checklist exibe os 55 itens com nomes completos, legenda de ✓/X/não preenchido, contagem de preenchimento por etapa, observações associadas aos campos e quatro fotos com seleção acessível por teclado. Mantidos os valores, ciclo, formulário multipart e impressão. Detalhes de checklist e histórico reutilizam `ModalOficina` com título associado, foco modal, Escape e fechamento pelo fundo/botão; a impressão da checklist também fica disponível no celular.
- `ConteudoOrdemTecnica.jsx` mantém os agrupamentos e snapshots persistidos, sem valores financeiros, com tabelas identificadas por célula no celular. `StatusOrdemTecnica.jsx` apresenta os seis status existentes com nomes legíveis e cores dos dois temas, mantendo FINALIZADA e FECHADA distintos. Nenhuma API, permissão, schema, migration ou dependência foi alterada.
- Build e lint focado passaram sem erros; permanece o aviso anterior de dependência do efeito em `checklistsVeiculo.jsx` e o aviso de tamanho do bundle. Verificação temporária passou em 50 cenários de renderização React com dados simulados, cobrindo temas, TECNICO/OWNER, visões, busca/status, ordenação, carregamento/erro/vazio, ausência dos quatro cards e de atalhos repetidos, detalhes e impressão. Comparação estrutural confirmou preservação de 47 funções operacionais. Navegador indisponível: aparência, responsividade, foco real e impressão manual continuam sem conferência em navegador.

### 6.20. Solicitações de peças em abas (04/10/2026)

- O detalhe em `pages/tickets.jsx` organiza o conteúdo em **Pedido**, **Atendimento**, **Conversa** e **Histórico**, mantendo código/status sempre visíveis. Apenas o painel selecionado aparece. Por decisão de Guilherme, **Atendimento não aparece para TECNICO**; o mecânico mantém somente Pedido, Conversa e Histórico, com cancelamento do próprio pedido ainda aberto dentro de Pedido.
- Assumir com sucesso abre Conversa; falhas preservam a aba atual. Abas têm associação semântica, foco, navegação por setas/Home/End e rolagem horizontal em telas estreitas. Alternar preserva os campos de atendimento e o rascunho/anexos da mensagem. O chat é montado na primeira visita e suspende consultas/prévias quando oculto, retomando ao abrir a conversa.
- Lista, filtros, paginação, temas e regras de atendimento/chat permanecem no fluxo existente. Nenhuma API, permissão de backend, baixa de estoque, schema, migration ou dependência foi alterada. Detalhes em `TICKETS-LEIA-ME.md`.
- Build e lint focado passaram. Verificação temporária passou em 57 cenários de renderização React e handlers com dados/API simulados, incluindo os quatro perfis, ausência de Atendimento para TECNICO, cancelamento em Pedido, painéis visíveis, chat restrito/somente leitura, carregamento/erro, navegação por teclado e abertura da conversa após assumir. Navegador indisponível: aparência, responsividade e interação real continuam sem conferência manual. Permanece o aviso anterior de tamanho do bundle.

### 6.21. Login baseado na referência visual de Guilherme

- `pages/login.jsx` e `styles/login.css` adotam a referência enviada: fundo grafite, cartão central com transparência/gradiente discretos, símbolo circular, campos escuros e botão arredondado. A adaptação usa a marca MotorMind, JSX/CSS e React Icons já instalados; o layout se ajusta ao celular, com campos de 16 px para evitar zoom automático e respeito à preferência de movimento reduzido.
- Login continua usando `api.js`, `POST /auth/login`, campos `Email`/`Senha`, as mesmas chaves de sessão e destinos de OWNER/ADMIN/OPERADOR/TECNICO. Acrescentados mostrar/ocultar senha, aviso de Caps Lock, erros junto aos campos e erro geral, carregamento anunciado e bloqueio de envio simultâneo. Labels ficam acessíveis a leitores de tela; foco vai ao primeiro campo inválido. Os atalhos e credenciais fixas de teste foram removidos; o acesso usa credenciais da própria oficina. Links para o site/cadastro permanecem disponíveis.
- Nenhum backend, permissão, schema, migration ou dependência foi alterado. Build e lint focado passaram, assim como 24 verificações temporárias com API/dados simulados e handlers reais/renderização React: validação, destinos dos quatro perfis, resposta incompleta, falha/repetição, envio duplicado, preenchimento, Caps Lock, campos, referências acessíveis e estados de tela. Não foram criados testes permanentes. Navegador indisponível: aparência, responsividade e interação real continuam sem conferência manual. Permanece o aviso anterior de tamanho do bundle.

## 7. Próximos passos

Estoque, integração da OS, painel técnico e primeira etapa de tickets/chat são considerados concluídos para a fase atual. As evoluções técnicas que ainda aparecem neste roteiro permanecem registradas, mas não devem ser iniciadas automaticamente. A próxima fase ativa é a landing page e o ingresso de uma nova oficina; seguir cada solicitação de Guilherme passo a passo.

### 7.1. Landing page, “compra” e cadastro da oficina — fase ativa

Objetivo definido: disponibilizar uma landing page pública do MotorMind onde o interessado conhece o sistema, inicia a “compra” e pode cadastrar sua oficina para obter acesso ao ambiente correspondente.

Estado atual desta fase:

- Em 13/09/2026, a versão React recebida foi integrada à rota `/`. `LandingPage.jsx` ganhou os links de aquisição e o CSS ausente, mantendo paleta e identidade da base. Os HTML/CSS/JS estáticos recebidos continuam como referência; o ponto de entrada é o frontend Vite.
- `/cadastro-oficina` envia para `POST /auth/cadastro-oficina`. Campos obrigatórios: nome da oficina, telefone, nome do responsável, e-mail de acesso, senha e confirmação da senha. Demais dados comerciais/endereço são opcionais. O backend valida e cria `Oficina`, `Usuario` (`ADMIN`, conforme decisão de Guilherme), `Licenca` e `ConfiguracaoOficina` em transação; oficina/licença ficam `ATIVA`, com `Licenca.ativadaEm` definida pelo servidor, sem JWT ou pagamento. Após o sucesso, a interface redireciona imediatamente para `/login`.
- Duplicação por e-mail/CNPJ é bloqueada inclusive sob concorrência, com bloqueios transacionais e restrições únicas. Reenvios recebem `409`, sem novo cadastro. Senha bcrypt, lista explícita de campos aceitos e limite de tentativas por IP protegem a operação pública. O login conserva as verificações de oficina/licença ativas.
- A confirmação via Brevo, integrada em 14/09/2026, foi removida em 30/09/2026 por decisão de Guilherme. Foram retirados os endpoints de confirmação/reenvio, serviços exclusivos, tela, links, textos e ferramentas do provedor. `/confirmar-oficina` no frontend apenas redireciona para `/login`; os antigos POSTs retornam `404`. Não há envio nem geração de tokens no cadastro.
- `ConfirmacaoEmailOficina` e a migration aplicada `20260913180000_confirmacao_email_oficina` permanecem no banco/schema como histórico, sem novos registros. Contas antigas pendentes mantêm seus estados e credenciais; o login orienta suporte para ativação, sem solicitar confirmação por e-mail. Oficinas suspensas/canceladas e licenças pendentes/canceladas continuam bloqueadas.
- O cadastro público tem um único **E-mail da oficina**, obrigatório, usado também para login ADMIN. A entrada `Email` grava o mesmo endereço normalizado em `Oficina.email` e `Usuario.Email`; a resposta exibe o endereço persistido. Formulários antigos com dois e-mails divergentes são recusados. Credenciais de cadastros anteriores não são alteradas automaticamente.
- Validação da remoção: 19 testes de regras (incluindo subtestes), 12 cenários HTTP/PostgreSQL isolados (13 testes com agrupador), build e lint focado passaram. Testes cobrem login imediato, ausência de envio/tokens, estados bloqueados, isolamento, duplicação, concorrência, rollback e remoção das rotas. Sem mudança de schema, migration ou dependências. Navegador indisponível; validação visual/manual pendente. Detalhes em `CADASTRO-OFICINA-LEIA-ME.md`.
- Nenhum checkout, pagamento, webhook, cadastro público de oficina ou ativação automática deve ser considerado pronto apenas por existir uma interface.
- O desenvolvimento será incremental. Implementar somente a etapa solicitada em cada conversa e validar sua integração com o projeto existente.
- O modelo comercial de referência continua sendo compra única, sem assinatura recorrente, salvo decisão posterior de Guilherme.

Fluxo de produto pretendido, ainda sujeito às decisões de cada etapa:

1. O visitante acessa a landing page pública e consulta a apresentação do MotorMind.
2. Uma ação de compra conduz ao fluxo comercial que for definido.
3. Nesta etapa, o usuário cadastra a oficina e seu primeiro responsável, recebe acesso liberado e segue para o login, sem confirmação por e-mail. A associação com compra aprovada será definida na etapa comercial.
4. O backend cria os registros necessários de oficina, usuário inicial e licença de forma consistente, mantendo o isolamento por `oficinaId`.
5. Com a oficina e a licença em estado autorizado, o usuário pode seguir para o login e acessar somente o ambiente da própria oficina.

Decisões que devem ser confirmadas antes das respectivas implementações:

- Se a “compra” será inicialmente simulada/demonstrativa, aprovada manualmente ou integrada a um provedor de pagamento real.
- Qual provedor, meio de pagamento, valor, confirmação, cancelamento e tratamento de falhas serão usados, caso exista integração real.
- Em que momento o cadastro da oficina será liberado e como uma compra aprovada será associada com segurança a um único cadastro.
- Quais dados da oficina e do primeiro usuário serão obrigatórios, além das regras de aceite, verificação e recuperação de acesso.
- Como a futura aprovação comercial será combinada à liberação imediata no cadastro e se haverá tela administrativa para aprovação de compra.

Garantias que devem permanecer em todas as etapas:

- A landing page e as rotas estritamente necessárias ao ingresso são públicas; painéis e dados operacionais continuam protegidos por autenticação e perfil.
- Não confiar em `oficinaId`, perfil, preço, aprovação ou estado de pagamento enviados pelo navegador. Uma futura confirmação real de pagamento deve ser validada no backend conforme o provedor escolhido.
- Senhas devem continuar protegidas com hash; não registrar senhas, tokens, dados de pagamento ou credenciais em logs, documentação ou respostas.
- A criação de oficina, primeiro usuário, licença e eventual vínculo com a compra deve evitar cadastros parciais e duplicados. Definir transação e idempotência quando o contrato do fluxo estiver claro.
- Não misturar a landing page comercial com um portal do cliente final da oficina; esse portal continua fora do escopo atual.

### 7.2. Consolidar o estoque e concluir os e-mails

1. Validar com login de OPERADOR que a tela mostra somente itens ativos e não apresenta histórico nem ações; chamadas diretas aos endpoints administrativos devem retornar 403.
2. Validar isolamento por oficina, concorrência e rollback com PostgreSQL de desenvolvimento. Exemplo: saldo 1 e duas retiradas simultâneas de 1; somente uma pode concluir.
3. Implementar configuração e envio de e-mail de estoque baixo, usando `ConfiguracaoOficina.notificarEstoqueEmail` e `emailNotificacaoEstoque`; definir explicitamente o comportamento quando não houver endereço configurado.
4. Usar o provedor/configuração que o projeto adotar, sem inventar credenciais. Uma falha no e-mail não deve desfazer uma movimentação já confirmada; registrar estado e permitir tentativas controladas.
5. Evitar e-mails repetidos para um mesmo alerta e marcar `emailEnviadoEm` somente após envio confirmado.

Idempotência das movimentações e tratamento de alertas antigos são pendências técnicas identificadas; avaliar quando forem necessárias ao fluxo, sem modificar o banco de forma especulativa.

### 7.3. Completar OS vinculada ao mecânico

Base integrada aos tickets e ao painel técnico (seções 6.6 e 6.7). As regras abaixo continuam como referência; não refazer atribuição, histórico, filtro, visualização da OS ou aviso já implementados.

Decisão de negócio: o mecânico deve trabalhar nas OS atribuídas a ele. A OS atribuída e aberta precisa aparecer em sua lista; quando `FINALIZADA`, `FECHADA` ou `CANCELADA`, deve deixar a lista ativa, encerrando a atribuição sem apagar seu histórico.

- Reaproveitar `OrdemServico.operadorId`, `tecnicoId` e `OrdemServicoAtribuicao`.
- O controller já recebe/valida técnico da mesma oficina; conferir e completar o fluxo, sem recriar a OS.
- Implementar atribuição, troca/encerramento da atribuição, histórico e filtro no backend para o técnico.
- Preservar a consulta histórica de quem executou/recebeu a OS; não apagar dados apenas para escondê-la da lista ativa.
- Preservar a distinção de negócio entre `FINALIZADA` e `FECHADA`, embora ambas retirem a OS do painel técnico; `EM_ANDAMENTO` e `AGUARDANDO_PECA` continuam estados ativos.
- Integrar aviso de nova OS atribuída.

### 7.4. Implementar tickets de solicitação de peças

Abertura, responsável, status, histórico e chat já implementados na primeira etapa. Restam atendimento estruturado por estoque/fornecedor, entregas parciais e a reconciliação de baixa com a OS. O fluxo abaixo é referência de produto, não indicação de que tudo permanece pendente.

Fluxo definido:

1. Mecânico, na OS vinculada a ele, aciona **Solicitar peça**.
2. Abre-se uma requisição ligada à OS, com itens e quantidades, visível/notificada aos operadores da mesma oficina.
3. O primeiro operador que assumir/responder se torna responsável. A disputa entre dois operadores deve ser resolvida atomicamente no backend.
4. O responsável verifica disponibilidade no estoque físico ou providencia compra com fornecedor.
5. O sistema acompanha disponibilidade, entrega e encerramento, preservando os registros do atendimento.

Modelos existentes: `RequisicaoPeca` e `RequisicaoPecaItem`. Estados já modelados: `ABERTA`, `EM_ATENDIMENTO`, `AGUARDANDO_PECA`, `DISPONIVEL`, `ENTREGUE` e `CANCELADA`. Origem do atendimento: `ESTOQUE` ou `COMPRA_FORNECEDOR`.

Para atendimento pelo estoque, reutilizar as garantias de saldo, histórico e transação. Vincular a movimentação ao item da requisição e impedir baixa duplicada. Não descontar uma segunda vez uma peça já retirada pela OS ou manualmente para o mesmo atendimento; definir essa transição antes de ligar tickets ao fluxo existente.

Avaliar se o schema atual é suficiente para histórico de mudanças de status: ele contém estado atual e datas relevantes, mas não se deve alegar um histórico completo de todas as transições sem uma implementação que o registre.

### 7.5. Evoluir notificações

Avisos de tickets/chat/atribuição com leitura por destinatário já existem ao lado do sino de estoque. A central geral ainda é uma evolução futura.

Reutilizar `Notificacao` e `NotificacaoUsuario`, além do sino atual. Eventos previstos: estoque baixo, nova OS atribuída, solicitação de peça, ticket assumido, peça disponível, nova mensagem e avisos gerais.

Implementar destinatários e permissões por oficina/usuário, leitura individual e apresentação dos eventos. Preservar o comportamento dos alertas ativos de estoque. Ler uma notificação não deve resolver um estoque que continua abaixo do mínimo.

### 7.6. Implementar chat temporário do ticket

Primeira implementação concluída na seção 6.6; manter as garantias abaixo e validar a interface no ambiente de Guilherme. Não recriar as tabelas nem a rotina de expiração já entregues.

Reutilizar `ConversaTicket`, `MensagemTicket` e `MensagemAnexo` para a conversa mecânico–operador, incluindo fotos/anexos quando necessários.

- Autorizar participantes e oficina no backend, incluindo acesso aos anexos.
- Definir `expiresAt` das mensagens para 48 horas após criação, conforme a decisão já registrada.
- Implementar limpeza automática do conteúdo expirado e dos arquivos temporários correspondentes.
- Manter requisição, OS, movimentações, estados/histórico relevantes e atribuições.
- O campo `expiresAt` sozinho não executa limpeza; é necessária uma rotina real.

### 7.7. Revisões posteriores

- Revisar o papel do proprietário quando Guilherme solicitar a etapa de permissões.
- Atualizar requisitos, diagrama de classes e documentação conforme funcionalidades efetivamente implementadas.
- Retomar cotações/comparação de fornecedores quando essa etapa for solicitada, verificando o que já existe. Houve discussão de importação por imagem/texto/manual, revisão humana e montagem de pedido para envio manual pelo WhatsApp; não tratar esse plano como uma integração pronta.
- Landing page, checkout, compra, cadastro público da oficina e ativação automática devem seguir a fase ativa da seção 7.1; não presumir integração pronta antes de cada entrega ser implementada e validada.

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

Testes dos relatórios gerenciais, em `frontend/`:

```bash
npm run test:relatorios
```

## 10. Retomada recomendada no VS Code

Ao receber a próxima tarefa, conferir primeiro os arquivos atuais e o estado do estoque. Resumir brevemente o que já existe e implementar o pedido de Guilherme. Não presumir acesso automático às conversas antigas nem repetir etapas concluídas.

Pontos que precisam continuar verdadeiros: isolamento entre oficinas, estoque separado do catálogo da OS, operador somente leitura na aba Estoque mas autorizado a retirar pela OS, baixa/devolução transacional com histórico permanente e expiração restrita ao conteúdo temporário do chat.
