# MotorMind — contexto e instruções para continuar o projeto

## 1. Como usar este documento

Este arquivo deve ficar na raiz do MotorMind, ao lado de `backend/` e `frontend/`. Ele registra a evolução do projeto, as regras de negócio, o estado da última entrega e as próximas etapas. É um ponto de partida para trabalhar com Guilherme; não é uma ordem para implementar todo o roteiro de uma vez.

Estado de referência: módulo de estoque integrado à ordem de serviço. Na aba Estoque, o OPERADOR permanece somente leitura; dentro da OS, ele pode escolher uma peça física pela opção **Pegar do estoque**, e a baixa é confirmada ao salvar. O código das peças de estoque é automático e a unidade é escolhida entre UN, PAR e L. O botão **Enviar OS para o cliente** foi removido; a geração e o compartilhamento do documento ficam centralizados em **Imprimir OS**, que permite salvar em PDF.

Atualização de 12/09/2026: primeira etapa de tickets e chat implementada. O técnico solicita peças em uma OS atribuída a ele; o operador assume atomicamente e conversa com o solicitante. Há status, histórico permanente, notificações individuais e anexos privados com expiração de 48 horas. A baixa continua exclusivamente no fluxo já existente da OS: o ticket não movimenta estoque nesta etapa. Consulte `TICKETS-LEIA-ME.md` e a seção 6.6.

Continuidade do painel técnico: o vínculo só é confirmado quando o operador salva a OS. O painel agora lista somente veículos com OS que não estejam `FINALIZADA`, `FECHADA` ou `CANCELADA` e que estejam atribuídas ao técnico. **Exibir ordem de serviço** abre os itens salvos em somente leitura; **Solicitar peça ao operador**, dentro dessa visualização, cria o ticket e leva à conversa. A lista geral de tickets serve para acompanhamento, não para abrir pedidos fora da OS. Detalhes na seção 6.7.

Atualização de 13/09/2026: landing page React integrada à rota pública `/`, com **Adquirir o MotorMind** levando a `/cadastro-oficina`. O cadastro público cria oficina, responsável `OWNER`, licença e configurações em uma transação, com oficina/licença `PENDENTE`. Login permanece condicionado à ativação de ambas. Não há pagamento, compra confirmada ou ativação automática nesta etapa. Consulte `CADASTRO-OFICINA-LEIA-ME.md` e a seção 7.1.

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

- Tela compartilhada `/tickets` e detalhe `/tickets/:id`, acessíveis pelo menu **Solicitações de peças**. O técnico vê suas OS atribuídas e solicita peças por nome e quantidade inteira (até 20 linhas).
- A OS agora usa **Mecânico responsável** em vez de enviar `tecnicoId: 1`; o operador vem da sessão ao criar. Atribuições são abertas/encerradas com histórico e notificação. `FINALIZADA`, `FECHADA` e `CANCELADA` deixam a lista ativa do técnico, embora continuem estados distintos da OS.
- Técnico consulta somente seus tickets. Operadores da mesma oficina veem a fila; ADMIN/OWNER também podem acompanhar/assumir. O primeiro responsável vence por bloqueio transacional e atualização condicional. Não existe transferência de responsável nesta etapa.
- Código automático `TKT-000001` derivado do ID. Ticket, itens, conversa, primeiro histórico e notificações são criados juntos. Chaves UUID impedem duplicação de abertura e de envio por repetição imediata da mesma requisição.
- Chat restrito ao solicitante e ao responsável; outro operador, ADMIN ou OWNER não participante não pode ler mensagens nem baixar anexos. É necessário assumir explicitamente antes de conversar.
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
- Arquivos centrais: `backend/src/services/tecnicoService.js`, `backend/src/routes/tecnicoRoutes.js`, controllers de veículos/checklist/OS; `frontend/src/pages/tecnico/painel.jsx`, `ordemServico.jsx`, `historicoVeicular.jsx`, `frontend/src/components/ConteudoOrdemTecnica.jsx` e `NovaSolicitacao.jsx`.
- Nenhum schema, migration ou dependência foi alterado nesta continuidade. Validação: 14 cenários integrados HTTP/PostgreSQL em schema descartável passaram (15 testes contando o agrupador), incluindo vínculo após salvamento, rollback, múltiplas OS, troca de mecânico, snapshots do catálogo, checklist, histórico e regressão de tickets/chat. Build passou. Validação visual/manual ainda deve ser feita no ambiente local.

## 7. Próximos passos

Estoque, integração da OS, painel técnico e primeira etapa de tickets/chat são considerados concluídos para a fase atual. As evoluções técnicas que ainda aparecem neste roteiro permanecem registradas, mas não devem ser iniciadas automaticamente. A próxima fase ativa é a landing page e o ingresso de uma nova oficina; seguir cada solicitação de Guilherme passo a passo.

### 7.1. Landing page, “compra” e cadastro da oficina — fase ativa

Objetivo definido: disponibilizar uma landing page pública do MotorMind onde o interessado conhece o sistema, inicia a “compra” e pode cadastrar sua oficina para obter acesso ao ambiente correspondente.

Estado atual desta fase:

- Em 13/09/2026, a versão React recebida foi integrada à rota `/`. `LandingPage.jsx` ganhou os links de aquisição e o CSS ausente, mantendo paleta e identidade da base. Os HTML/CSS/JS estáticos recebidos continuam como referência; o ponto de entrada é o frontend Vite.
- `/cadastro-oficina` envia para `POST /auth/cadastro-oficina`. Campos obrigatórios: nome da oficina, telefone, nome do responsável, e-mail de acesso, senha e confirmação. Demais dados comerciais/endereço são opcionais. O backend valida e cria `Oficina`, `Usuario` (`OWNER`), `Licenca` e `ConfiguracaoOficina` em transação; oficina/licença ficam `PENDENTE`, sem JWT ou pagamento.
- Duplicação por e-mail/CNPJ é bloqueada inclusive sob concorrência, com bloqueios transacionais e restrições únicas. Reenvios recebem `409`, sem novo cadastro. Senha bcrypt, lista explícita de campos aceitos e limite de tentativas por IP protegem a operação pública. O login conserva as verificações de oficina/licença ativas.
- Não houve alteração de schema, migration ou dependência. Build, lint focado, 18 testes de regras e 11 cenários HTTP/PostgreSQL em schema descartável passaram. Navegador integrado indisponível: validação visual/manual pendente. Detalhes, limites e comandos em `CADASTRO-OFICINA-LEIA-ME.md`.
- Nenhum checkout, pagamento, webhook, cadastro público de oficina ou ativação automática deve ser considerado pronto apenas por existir uma interface.
- O desenvolvimento será incremental. Implementar somente a etapa solicitada em cada conversa e validar sua integração com o projeto existente.
- O modelo comercial de referência continua sendo compra única, sem assinatura recorrente, salvo decisão posterior de Guilherme.

Fluxo de produto pretendido, ainda sujeito às decisões de cada etapa:

1. O visitante acessa a landing page pública e consulta a apresentação do MotorMind.
2. Uma ação de compra conduz ao fluxo comercial que for definido.
3. Nesta etapa, o usuário já pode cadastrar a oficina e seu primeiro responsável, ficando pendente de ativação. A associação com compra aprovada será definida na etapa comercial.
4. O backend cria os registros necessários de oficina, usuário inicial e licença de forma consistente, mantendo o isolamento por `oficinaId`.
5. Com a oficina e a licença em estado autorizado, o usuário pode seguir para o login e acessar somente o ambiente da própria oficina.

Decisões que devem ser confirmadas antes das respectivas implementações:

- Se a “compra” será inicialmente simulada/demonstrativa, aprovada manualmente ou integrada a um provedor de pagamento real.
- Qual provedor, meio de pagamento, valor, confirmação, cancelamento e tratamento de falhas serão usados, caso exista integração real.
- Em que momento o cadastro da oficina será liberado e como uma compra aprovada será associada com segurança a um único cadastro.
- Quais dados da oficina e do primeiro usuário serão obrigatórios, além das regras de aceite, verificação e recuperação de acesso.
- Quais estados e regras de ativação serão aplicados a `Oficina` e `Licenca` e se haverá alguma tela administrativa para aprovação.

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

## 10. Retomada recomendada no VS Code

Ao receber a próxima tarefa, conferir primeiro os arquivos atuais e o estado do estoque. Resumir brevemente o que já existe e implementar o pedido de Guilherme. Não presumir acesso automático às conversas antigas nem repetir etapas concluídas.

Pontos que precisam continuar verdadeiros: isolamento entre oficinas, estoque separado do catálogo da OS, operador somente leitura na aba Estoque mas autorizado a retirar pela OS, baixa/devolução transacional com histórico permanente e expiração restrita ao conteúdo temporário do chat.
