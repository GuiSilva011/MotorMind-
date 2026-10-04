# Ordem de Serviço — identidade visual de 01/10/2026

A OS passa a usar superfícies neutras, ações azuis e temas claro/escuro. O seletor no topo salva a preferência em `motormind_tema`; sem preferência, a tela abre clara. A troca preserva o estado do formulário e aplica as cores aos componentes compartilhados enquanto a OS está aberta.

Cliente e veículo aparecem em um resumo compacto, com placa identificada e dados completos expansíveis. Os campos de veículo/cliente mantêm sua condição de somente leitura; observações da OS usam textarea. Diagnósticos, serviços e peças são cartões agrupados. Na criação e edição, seleção, descrição, quantidade e valores aparecem diretamente; na consulta, os dados completos de serviços/peças ficam em **Ver dados e valores**.

A inclusão foi simplificada a pedido de Guilherme: **Adicionar diagnóstico** fica na área de diagnósticos; dentro de cada diagnóstico há **Serviços deste diagnóstico** e **Adicionar serviço**; dentro de cada serviço há **Peças deste serviço** e **Adicionar peça**. Cada item novo aparece antes do botão de inclusão, pronto para preencher. A peça oferece diretamente **Selecionar do catálogo** e **Pegar do estoque**. Serviços sem diagnóstico e peças avulsas têm áreas e botões próprios, com explicação do vínculo. Esses botões também aparecem quando as áreas estão vazias em criação/edição.

O desktop usa uma coluna principal e uma lateral de 240 px para gestão, financeiro e documentos. **Imprimir OS** e **Enviar cotação para fornecedor** ficam no painel direito, em **Documentos e cotação**, com os mesmos handlers e condições de habilitação; **Voltar** permanece no final da coluna principal. A lateral passa para baixo em telas menores. Os dois botões **Salvar OS** chamam o mesmo fluxo. O financeiro apresenta valores brutos, descontos efetivamente aplicados e total líquido, respeitando o piso zero de cada item. A impressão continua usando os totais líquidos anteriores.

As funções de criação, busca, edição, salvamento, seleção, atribuição, estoque, cotação e impressão foram preservadas. O backend, seus contratos e suas autorizações continuam iguais. Não houve dependência nova nem mudança de banco.

## Arquivos

| Arquivo | Alteração |
| --- | --- |
| `frontend/src/pages/operador/ordemServico.jsx` | Conecta a nova apresentação, o tema e os diálogos aos fluxos existentes. |
| `frontend/src/components/OrdemServicoTela.jsx` | Layout, atendimento, inclusão contextual de itens, campos visíveis na edição, gestão, financeiro e ações. |
| `frontend/src/styles/operadorStyles/ordemServico.css` | Estilos da OS, formulários, cartões por nível de vínculo, modais e responsividade. |
| `frontend/src/styles/temaOficina.css` | Paletas e adaptação de sidebar, topo, notificações e avisos. |
| `frontend/src/hooks/useTemaOficina.js` | Preferência persistida e aplicação do tema aos avisos externos ao Layout. |
| `frontend/src/components/SeletorTema.jsx` | Seletor acessível com sol/lua. |
| `frontend/src/components/ModalOficina.jsx` | Dialog nativo, Escape, foco modal e fechamento pelo fundo. |
| `frontend/src/components/Layout.jsx` | Props opcionais de tema, classe e ações no topo. |
| `frontend/src/components/Topbar.jsx` | Slot opcional para o seletor, preservando solicitações/alertas. |
| `frontend/src/utils/ordemServicoCalculos.js` | Regra financeira compartilhada entre linhas e resumo. |
| `frontend/tests/ordemServico.test.js` | Renderização, ações da interface, valores, acessibilidade e preferência. |
| `frontend/tests/ordemServicoFluxos.test.js` | Funções reais da OS com estado e API simulados. |
| `frontend/package.json` | Script `test:os`; dependências preservadas. |
| `AGENTS.md` | Registro da entrega e limites de validação. |
| `ORDEM-SERVICO-LEIA-ME.md` | Documentação desta entrega. |

Para adotar a identidade em outra tela, a paleta está isolada em `temaOficina.css`, ativada pela classe `oficina-theme` e `data-theme="claro"`/`"escuro"`. A apresentação específica da OS está em `ordemServico.css`.

Em 03/10/2026, peças e diagnósticos passaram a usar essa mesma identidade e preferência de tema. `Layout.jsx` importa a paleta e `oficinaUi.css`, que centraliza a apresentação de páginas, cabeçalhos, cartões, formulários, botões e tabelas. A OS também reutiliza as classes compartilhadas de página, cabeçalho e cartões; mantém sua organização de atendimento, itens, gestão e financeiro.

A sidebar compartilhada usa gradiente azul escuro em todos os perfis e nos dois temas, com textos/ícones claros e destaque da rota atual. A estrutura recolhível e o painel mobile continuam usando a mesma navegação. Cadastros mantêm suas funções e chamadas da API; receberam labels associados, ícones de ação e tabelas com rótulos por célula no celular.

Na continuidade de 03/10/2026, o cadastro de serviços também recebeu o padrão compartilhado e os dois temas. A topbar agrupa os controles de tema/avisos, com adaptação para celular; o texto **Oficina > página** foi removido por decisão mais recente de Guilherme. Seus painéis usam o mesmo estilo, abrem um de cada vez e fecham por botão, Escape, clique fora ou mudança de rota. Fechamento pelo botão/Escape retorna o foco ao controle de origem. Consultas, leitura de notificações, navegação para ticket/OS e permissões foram preservadas.

## Verificação realizada

Em `frontend/`:

```powershell
npm run build
npm run test:os
```

O build passou. Os 20 testes conferem campos de itens novos disponíveis sem expansão, inclusão no grupo escolhido, totais com desconto por item, grupos vinculados/independentes, catálogo/estoque separados, fornecedor bloqueado para estoque, busca e seleção de veículo, criação por POST, edição por PUT, consultas, erros que preservam o formulário, controles em somente leitura, labels/IDs e preferência de tema. Os testes usam API simulada e renderização React; não acessam PostgreSQL nem criam OS reais.

O lint dos componentes, hook, utilitário e testes passou sem erros. Permanece o aviso anterior sobre a dependência do efeito de inicialização da OS. O build também mantém o aviso anterior de tamanho do bundle. Uma comparação estrutural com a versão anterior confirmou a preservação das 85 funções operacionais.

## Conferência manual pendente

O navegador estava indisponível na sessão. No ambiente local:

1. Abra a OS, busque um cliente/veículo e confira o resumo e os dados completos.
2. Use **Adicionar diagnóstico**, depois **Adicionar serviço** dentro dele e **Adicionar peça** dentro do serviço. Confira que a seleção e os campos aparecem diretamente. Adicione um segundo diagnóstico e confirme os vínculos; experimente também as áreas de serviço sem diagnóstico e peça avulsa. Edite quantidades, custos e descontos e confira o total.
3. Escolha uma peça física e confirme que o fornecedor fica bloqueado e a baixa ocorre ao salvar, pelo fluxo existente.
4. Troque claro/escuro durante o preenchimento e confira que dados e áreas expansíveis continuam intactos. Abra catálogo, busca de OS, cotação e painéis de avisos nos dois temas.
5. Salve, busque a OS salva, entre em edição e salve novamente. Confira atribuição e geração do documento em **Imprimir OS**.
6. Confira teclado, foco, Escape, menu mobile e larguras de desktop, tablet e celular, sem cortes ou sobreposições.
