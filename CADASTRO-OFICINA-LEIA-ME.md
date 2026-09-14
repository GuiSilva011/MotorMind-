# Landing page e cadastro público de oficina — 13/09/2026

Ao abrir a raiz do frontend (`http://localhost:5173/` em desenvolvimento), o MotorMind apresenta a landing page pública. **Adquirir o MotorMind**, no cabeçalho, na apresentação e no cartão da licença, abre `/cadastro-oficina`. **Entrar** continua levando a `/login`; as rotas operacionais mantêm autenticação e perfis.

Foi integrada a versão React já existente em `frontend/src/website/LandingPage.jsx`. Ela referenciava um CSS ausente; `landingPage.css` agora fornece os estilos isolados da área pública, usando a paleta e a faixa quadriculada da base recebida. Os arquivos estáticos `website/index.html`, `style.css` e `script.js` continuam como referência e não são o ponto de entrada da aplicação.

## Cadastro persistido

`POST /auth/cadastro-oficina` é público. O formulário usa o cliente Axios compartilhado.

- Obrigatórios: nome da oficina, telefone com DDD, nome do responsável, e-mail de acesso, senha e confirmação.
- Opcionais: razão social, CNPJ, e-mail comercial, WhatsApp e endereço (CEP, rua, número, complemento, bairro, cidade e UF).
- O backend valida tipos, obrigatoriedade, tamanhos, formato dos contatos, CNPJ/CEP e UF. CNPJ recebe validação de formato e normalização, sem verificação cadastral externa ou de dígitos verificadores.
- Senhas têm pelo menos 8 caracteres não compostos apenas por espaços e limite de 72 bytes do bcrypt. Espaços são preservados. A senha é armazenada como hash bcrypt com custo 12; não retorna na resposta.
- Cria `Oficina` com status `PENDENTE`, um `Usuario` com perfil `OWNER`, `Licenca` com status `PENDENTE` e `ConfiguracaoOficina`, juntos em uma transação Prisma.
- Perfil, vínculos, oficina de destino, preço, compra e ativação são definidos pelo backend. Campos extras enviados pelo navegador não alteram esses controles. Um JWT existente também não vincula o cadastro a outra oficina.
- E-mail de acesso é normalizado para minúsculas. A checagem de duplicação inclui cadastros antigos com outra capitalização. CNPJ é normalizado e comparado também com o formato pontuado.
- Bloqueios transacionais por e-mail/CNPJ serializam cadastros equivalentes. As restrições únicas do banco permanecem. Uma falha reverte todos os novos registros.
- Reenvios retornam `409` quando o e-mail ou CNPJ já foi registrado, inclusive após perda da resposta HTTP. Não criam uma segunda oficina nem retornam sessão. Não há chave persistente que reproduza a resposta de sucesso anterior.
- Há limite de 10 tentativas por IP a cada 15 minutos, em memória por processo. Reinícios apagam o contador; implantação com múltiplas instâncias exige estratégia compartilhada. O middleware usa `req.ip` sem confiar em cabeçalhos encaminhados arbitrariamente.

## O que o cadastro confirma

Confirma somente o registro da oficina e de seu responsável. A tela de sucesso informa **Aguardando ativação**. O formulário não realiza cobrança e não confirma compra.

Nenhum valor, código de compra ou data de pagamento/ativação é fabricado. Login continua exigindo oficina **e** licença `ATIVA`; uma oficina pendente recebe explicação do bloqueio. O login aceita variações de maiúsculas/minúsculas no e-mail e preserva espaços na senha, priorizando a conta de e-mail exato quando houver registros antigos.

Permanecem para uma próxima decisão: valor, pagamento, aprovação da aquisição, ativação, verificação de e-mail, recuperação de senha e eventual tela de administração das aprovações. Não foi implementado endpoint público de ativação nem uma simulação de pagamento.

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
node --test tests/cadastroOficina.test.js
$env:MOTORMIND_TESTE_CADASTRO = '1'
node --test tests/cadastroOficina.integration.test.js
```

O teste integrado cria um schema PostgreSQL aleatório `cadastro_test_<uuid>`, aplica nele as migrations existentes e remove somente esse schema ao terminar. Não executa seed nem altera oficinas reais. As ativações executadas durante o teste pertencem exclusivamente às oficinas sintéticas.

```powershell
# Em frontend/
npm run build
npx eslint src/website/LandingPage.jsx src/website/CadastroOficina.jsx src/App.jsx src/pages/login.jsx
```

Validação da entrega: 18 testes de regras e 11 cenários HTTP/PostgreSQL (12 testes contando o agrupador) passaram, incluindo cadastro público, isolamento, bloqueio de login pendente, concorrência por e-mail/CNPJ, duplicação e rollback real. Build e lint focado passaram. O build mantém o aviso de tamanho do bundle. Migrations locais conferidas como atualizadas; nenhum schema, migration ou dependência alterado.

A validação visual e a interação manual no navegador ficaram pendentes porque o navegador integrado estava indisponível na sessão.
