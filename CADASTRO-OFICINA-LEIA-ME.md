# Landing page, cadastro e confirmação da oficina — 14/09/2026

Ao abrir a raiz do frontend (`http://localhost:5173/` em desenvolvimento), o MotorMind apresenta a landing page pública. **Adquirir o MotorMind**, no cabeçalho, na apresentação e no cartão da licença, abre `/cadastro-oficina`. **Entrar** continua levando a `/login`; as rotas operacionais mantêm autenticação e perfis.

Foi integrada a versão React já existente em `frontend/src/website/LandingPage.jsx`. Ela referenciava um CSS ausente; `landingPage.css` agora fornece os estilos isolados da área pública, usando a paleta e a faixa quadriculada da base recebida. Os arquivos estáticos `website/index.html`, `style.css` e `script.js` continuam como referência e não são o ponto de entrada da aplicação.

## Cadastro persistido

`POST /auth/cadastro-oficina` é público. O formulário usa o cliente Axios compartilhado.

- Obrigatórios: nome da oficina, telefone com DDD, nome do responsável, e-mail da oficina, senha e confirmação.
- Há um único campo de e-mail, usado para identificar a oficina, receber a confirmação e entrar como ADMIN. A API mantém `Email` como entrada e grava o mesmo valor normalizado em `Oficina.email` e `Usuario.Email`; o envio usa o endereço persistido e o resultado do cadastro o exibe. Formulários antigos que enviem também `email` com outro endereço recebem erro de validação, sem criar registros.
- Cadastros anteriores não têm suas credenciais alteradas automaticamente; neles, confirmação e login continuam usando `Usuario.Email` do responsável.
- Opcionais: razão social, CNPJ, WhatsApp e endereço (CEP, rua, número, complemento, bairro, cidade e UF).
- CNPJ, telefone, WhatsApp e CEP recebem máscara ao digitar ou colar. Telefone aceita fixo/celular com DDD e preserva `+55` quando informado. CNPJ mantém letras em maiúsculas, conforme o formato aceito pelo backend. A edição preserva a posição do cursor; o backend continua normalizando e validando os dados.
- O backend valida tipos, obrigatoriedade, tamanhos, formato dos contatos, CNPJ/CEP e UF. CNPJ recebe validação de formato e normalização, sem verificação cadastral externa ou de dígitos verificadores.
- Senhas têm pelo menos 8 caracteres não compostos apenas por espaços e limite de 72 bytes do bcrypt. Espaços são preservados. A senha é armazenada como hash bcrypt com custo 12; não retorna na resposta.
- Cria `Oficina` com status `PENDENTE`, um `Usuario` com perfil `ADMIN`, `Licenca` com status `PENDENTE` e `ConfiguracaoOficina`, juntos em uma transação Prisma. Guilherme definiu que o responsável do cadastro usa o próprio e-mail/senha como administrador.
- Perfil, vínculos, oficina de destino, preço, compra e ativação são definidos pelo backend. Campos extras enviados pelo navegador não alteram esses controles. Um JWT existente também não vincula o cadastro a outra oficina.
- E-mail de acesso é normalizado para minúsculas. A checagem de duplicação inclui cadastros antigos com outra capitalização. CNPJ é normalizado e comparado também com o formato pontuado.
- Bloqueios transacionais por e-mail/CNPJ serializam cadastros equivalentes. As restrições únicas do banco permanecem. Uma falha reverte todos os novos registros.
- Reenvios retornam `409` quando o e-mail ou CNPJ já foi registrado, inclusive após perda da resposta HTTP. Não criam uma segunda oficina nem retornam sessão. Não há chave persistente que reproduza a resposta de sucesso anterior.
- Há limite de 10 tentativas por IP a cada 15 minutos, em memória por processo. Reinícios apagam o contador; implantação com múltiplas instâncias exige estratégia compartilhada. O middleware usa `req.ip` sem confiar em cabeçalhos encaminhados arbitrariamente.

## Confirmação por e-mail e ativação

Após salvar o cadastro, o backend envia pelo Brevo o link de confirmação ao e-mail de acesso. A oficina continua pendente até o responsável abrir o link e clicar em **Confirmar e ativar oficina**. Abrir o endereço por GET não ativa a oficina, evitando consumo por pré-visualização ou leitura automática do e-mail.

- A confirmação ativa `Oficina` e `Licenca`, grava `Licenca.ativadaEm` e garante perfil `ADMIN` para o responsável, sem alterar o e-mail ou a senha. Tudo ocorre na mesma transação, incluindo o consumo do link. Não cria outra conta nem envia senha por e-mail.
- Os cadastros anteriores desta etapa que ainda estão pendentes e têm o responsável `OWNER` também podem solicitar confirmação; na ativação, esse responsável passa a `ADMIN`. Oficinas já ativas e demais proprietários não são convertidos em massa.
- A tabela `ConfirmacaoEmailOficina` guarda somente SHA-256 do token aleatório de 32 bytes, oficina, usuário, e-mail destinatário, validade e datas de envio/consumo/invalidação. O código original não aparece nas respostas da API nem nos logs.
- Links valem 24 horas e só podem ser usados uma vez. A confirmação bloqueia oficina e usuário, revalida o vínculo/e-mail, ativa e consome o token na mesma transação. Repetições retornam `410`; o usuário pode ir ao login.
- O token vai no fragmento do endereço `/confirmar-oficina#token=...`, que não é enviado no GET ao servidor da página. O frontend envia o código no corpo do POST de confirmação e remove o fragmento após o sucesso.
- **Reenviar confirmação de e-mail** está disponível no login, no resultado do cadastro e em `/confirmar-oficina` sem token. A resposta normal não informa se o e-mail está cadastrado.
- Reenvio tem intervalo mínimo de 1 minuto e limite de 5 solicitações por oficina em 1 hora, persistidos no banco. Há também limite de IP: 10 tentativas por 15 minutos para reenvio e 30 para confirmação.
- Pedidos de reenvio são destinados somente ao primeiro responsável ADMIN/OWNER da oficina pendente. Operadores, técnicos e administradores secundários não podem ativar a oficina com outro e-mail.
- Reenviar não invalida um link anterior ainda válido; confirmar qualquer link invalida os demais. Assim, uma falha de entrega ou atraso do provedor não inutiliza um e-mail já recebido.
- Falha no Brevo preserva o cadastro pendente, não marca `enviadoEm` e informa na tela que o envio não foi concluído. Configuração ausente ou recusas HTTP 401/403 informam que o serviço precisa de ajuste, sem expor respostas ou credenciais do provedor. Após configurar/corrigir o serviço, o responsável pode solicitar novamente. Não existe fila automática ou webhook de entrega; `enviadoEm` indica aceitação pela API do Brevo, não comprova chegada à caixa de entrada.
- Link inválido/expirado, e-mail alterado e oficinas suspensas/canceladas não liberam acesso. Não existe ativação pública apenas por ID de oficina.

Login continua exigindo oficina **e** licença `ATIVA`. Uma oficina pendente recebe instrução de confirmação/reenvio. A confirmação não cria uma sessão: o administrador entra pelo login com suas credenciais.

Por decisão desta etapa, confirmar o e-mail libera o acesso. Isso **não confirma pagamento**: `valor`, `codigoCompra` e `compradaEm` não são preenchidos. Pagamento, recuperação de senha e eventual administração comercial das aprovações permanecem fora desta entrega.

## Configurar o Brevo

O modelo está em `backend/.env.brevo.example`. Preencha no `backend/.env`:

```dotenv
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=MotorMind
FRONTEND_URL=http://localhost:5173
```

Use uma chave da aba **API Keys**, não uma chave SMTP, e um remetente cadastrado e ativo no Brevo. O envio usa `POST https://api.brevo.com/v3/smtp/email`, conforme a [documentação oficial de e-mails transacionais](https://developers.brevo.com/docs/send-a-transactional-email). A chave fica exclusivamente no backend.

`FRONTEND_URL` deve ser a origem da aplicação, sem caminhos, parâmetros ou fragmentos. `http://localhost:5173` serve para abrir o link na mesma máquina do desenvolvimento. Para outros dispositivos, use a origem HTTPS publicada. Reinicie o backend após editar `.env`.

Em `backend/`, `npm run email:verificar` consulta a lista de remetentes do Brevo e informa se a autenticação foi aceita e se o remetente configurado está ativo. Não envia mensagens nem imprime credenciais. HTTP `401` exige revisar a chave API; eventuais restrições por IP também devem ser resolvidas na conta Brevo.

## Rotas e arquivos

| Rota | Comportamento |
| --- | --- |
| `POST /auth/cadastro-oficina` | Cria o cadastro pendente e tenta enviar a confirmação; falha no envio não desfaz o cadastro |
| `POST /auth/reenviar-confirmacao` | Recebe `Email`; solicita novo link dentro dos limites |
| `POST /auth/confirmar-oficina` | Recebe `token`; valida e ativa somente a oficina vinculada |
| `/confirmar-oficina` no frontend | Confirma o link ou apresenta o formulário de reenvio |

Arquivos centrais: `cadastroOficinaController.js`, `confirmacaoOficinaController.js`, `cadastroOficinaService.js`, `confirmacaoOficinaService.js`, `ativacaoOficinaService.js`, `emailBrevoService.js`, `authRoutes.js`; no frontend, `CadastroOficina.jsx`, `ConfirmarOficina.jsx`, `LandingPage.jsx`, `login.jsx` e `App.jsx`.

## Executar e validar

Em terminais separados:

```powershell
# Em backend/
npm run dev
```

```powershell
# Em frontend/
npm run dev
```

Abra a URL indicada pelo Vite e teste **Adquirir o MotorMind**. Um envio com dados novos registra uma oficina pendente no banco configurado; para testes automatizados, use o schema descartável abaixo.

```powershell
# Em backend/
node --test tests/cadastroOficina.test.js tests/emailBrevo.test.js
$env:MOTORMIND_TESTE_CADASTRO = '1'
node --test tests/cadastroOficina.integration.test.js
```

O teste integrado cria um schema PostgreSQL aleatório `cadastro_test_<uuid>`, aplica nele as migrations existentes e remove somente esse schema ao terminar. Não executa seed nem altera oficinas reais. As ativações executadas durante o teste pertencem exclusivamente às oficinas sintéticas. O Brevo é simulado e qualquer envio externo é bloqueado, mesmo com credenciais reais no `.env`.

```powershell
# Em frontend/
npm run build
npx eslint src/website/LandingPage.jsx src/website/CadastroOficina.jsx src/website/ConfirmarOficina.jsx src/App.jsx src/pages/login.jsx
```

Validação após unificar o e-mail: 23 testes de regras/contrato Brevo e 22 cenários HTTP/PostgreSQL (23 testes contando o agrupador) passaram, incluindo igualdade entre e-mail da oficina/login/destinatário, recusa de endereços divergentes, isolamento, confirmação, login ADMIN, links vencidos/usados, reenvio, falha de provedor, concorrência e rollback. Build e lint focado passaram; o build mantém o aviso de tamanho do bundle. A migration `20260913180000_confirmacao_email_oficina` foi aplicada no banco local em 14/09/2026; Prisma Client atualizado. Nenhuma dependência nova.

A validação visual e a interação manual no navegador ficaram pendentes porque o navegador integrado estava indisponível na sessão.

Na nova verificação real de 14/09/2026, após Guilherme informar atualização do `.env`, as variáveis locais estavam preenchidas, mas o Brevo ainda retornou HTTP `401` com chave não reconhecida. A entrega real de e-mail continua pendente dessa configuração. Depois de ajustar `BREVO_API_KEY` com uma chave da aba **API Keys**, execute `npm run email:verificar`, reinicie o backend e use **Reenviar confirmação de e-mail** para um cadastro já existente, informando o e-mail de acesso do responsável quando for um cadastro antigo.
