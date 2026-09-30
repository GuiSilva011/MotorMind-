# Landing page e cadastro da oficina — 30/09/2026

A landing page pública fica em `/`. **Adquirir o MotorMind** abre `/cadastro-oficina`, e **Entrar** leva a `/login`. As rotas operacionais mantêm autenticação e perfis.

Por decisão de Guilherme, o cadastro não exige mais confirmação por e-mail. Ao concluir, a oficina e a licença já estão ativas; o frontend mostra a mensagem de sucesso e redireciona imediatamente para `/login`. O responsável entra como `ADMIN` com o e-mail e a senha cadastrados.

## Cadastro persistido

`POST /auth/cadastro-oficina` é público. O formulário usa o cliente Axios compartilhado.

- Obrigatórios: nome da oficina, telefone com DDD, nome do responsável, e-mail da oficina, senha e confirmação da senha.
- Há um único campo de e-mail, usado para identificar a oficina e entrar como ADMIN. A API recebe `Email` e grava o mesmo valor normalizado em `Oficina.email` e `Usuario.Email`. Formulários antigos que enviem também `email` com outro endereço recebem erro de validação.
- Opcionais: razão social, CNPJ, WhatsApp e endereço (CEP, rua, número, complemento, bairro, cidade e UF).
- CNPJ, telefone, WhatsApp e CEP recebem máscara. Telefone aceita fixo/celular com DDD e preserva `+55` quando informado. CNPJ mantém letras em maiúsculas. A edição preserva a posição do cursor.
- O backend mantém a validação de tipos, obrigatoriedade, tamanhos, formato dos contatos, CNPJ/CEP e UF. Não há consulta cadastral externa nem verificação dos dígitos do CNPJ.
- Senhas têm pelo menos 8 caracteres não compostos apenas por espaços e limite de 72 bytes do bcrypt. Espaços são preservados. A senha é armazenada como hash bcrypt com custo 12 e não retorna na resposta.
- Cria `Oficina` com status `ATIVA`, um `Usuario` com perfil `ADMIN`, `Licenca` com status `ATIVA` e `ativadaEm` definida pelo servidor, além de `ConfiguracaoOficina`, juntos em uma transação Prisma.
- Perfil, vínculos, oficina de destino e ativação são definidos pelo backend. Campos extras enviados pelo navegador não alteram esses controles. Um JWT existente também não vincula o cadastro a outra oficina.
- O e-mail é normalizado para minúsculas. A checagem de duplicação inclui cadastros antigos com outra capitalização. CNPJ é normalizado e comparado também com o formato pontuado.
- Bloqueios transacionais por e-mail/CNPJ serializam cadastros equivalentes. As restrições únicas permanecem. Uma falha reverte todos os novos registros.
- Repetições retornam `409` quando o e-mail ou CNPJ já foi registrado, inclusive após perda da resposta HTTP. Não criam outra oficina nem retornam sessão.
- Há limite de 10 tentativas por IP a cada 15 minutos, em memória por processo. Reinícios apagam o contador; múltiplas instâncias exigem estratégia compartilhada. O middleware usa `req.ip` sem confiar em cabeçalhos encaminhados arbitrariamente.

O cadastro não gera JWT nem efetua login automático. Após o redirecionamento, o login autentica as credenciais e continua exigindo oficina e licença `ATIVA`. Nenhum pagamento é registrado: `valor`, `codigoCompra` e `compradaEm` permanecem nulos.

## Remoção da confirmação por e-mail

- Removidos envio pelo Brevo, geração/consumo de tokens, endpoints de confirmação/reenvio, tela de confirmação, links e textos que exigiam essa etapa.
- `/confirmar-oficina` no frontend redireciona para `/login`, para receber URLs antigas sem apresentar um fluxo obsoleto. Os antigos POSTs `/auth/confirmar-oficina` e `/auth/reenviar-confirmacao` retornam `404`.
- Removidos os serviços exclusivos da confirmação, os testes do provedor, o exemplo de configuração e o script `email:verificar`. O cadastro não depende de configuração de e-mail; o `.env` local não foi alterado.
- O schema Prisma, a tabela histórica `ConfirmacaoEmailOficina` e a migration já aplicada `20260913180000_confirmacao_email_oficina` foram preservados. Nenhum registro novo de confirmação é criado.
- Contas anteriores pendentes não foram ativadas em massa. Seus estados e credenciais permanecem como estavam; o login informa a necessidade de suporte para ativação, sem orientar envio de e-mail. Oficinas suspensas/canceladas e licenças pendentes/canceladas continuam bloqueadas.

## Arquivos centrais

- Backend: `backend/src/services/cadastroOficinaService.js`, `backend/src/controllers/cadastroOficinaController.js`, `backend/src/controllers/authController.js` e `backend/src/routes/authRoutes.js`.
- Frontend: `frontend/src/website/CadastroOficina.jsx`, `frontend/src/website/LandingPage.jsx`, `frontend/src/website/cadastroOficina.css`, `frontend/src/pages/login.jsx` e `frontend/src/App.jsx`.
- Testes: `backend/tests/cadastroOficina.test.js` e `backend/tests/cadastroOficina.integration.test.js`.

## Executar e validar

Execute `npm run dev` em terminais separados, um em `backend/` e outro em `frontend/`.

Abra `/cadastro-oficina`, preencha os dados e conclua. O resultado esperado é o redirecionamento imediato para `/login`, onde as credenciais recém-cadastradas dão acesso de administrador à nova oficina. Um cadastro manual válido grava uma oficina no banco configurado; os testes abaixo usam um schema descartável.

Em `backend/`:

```powershell
node --test tests/cadastroOficina.test.js
$env:MOTORMIND_TESTE_CADASTRO = '1'
node --test tests/cadastroOficina.integration.test.js
```

O teste integrado cria um schema PostgreSQL aleatório `cadastro_test_<uuid>`, aplica nele as migrations existentes e remove somente esse schema ao terminar. Não executa seed nem altera oficinas reais. Chamadas HTTP externas são bloqueadas e verificadas pelo teste.

Em `frontend/`:

```powershell
npm run build
npx eslint src/website/LandingPage.jsx src/website/CadastroOficina.jsx src/App.jsx src/pages/login.jsx
```

Validação de 30/09/2026: passaram 19 testes de regras (incluindo subtestes), 12 cenários HTTP/PostgreSQL (13 testes contando o agrupador), build e lint focado. A suíte cobre acesso imediato, ausência de envio/tokens, credenciais, estados bloqueados, isolamento, duplicação, concorrência, rollback e remoção das rotas antigas. O build mantém o aviso de tamanho do bundle. Validação visual/manual pendente por indisponibilidade do navegador na sessão. Nenhuma migration ou dependência nova.
