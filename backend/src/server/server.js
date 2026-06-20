import express from 'express';
import cors from 'cors';
import clienteRoutes from '../routes/clienteRoutes.js';
import veiculoRoutes from '../routes/veiculoRoutes.js';
import agendamentoRoutes from '../routes/agendamentoRoutes.js';
import pecasRoutes from '../routes/pecasRoutes.js';
import servicosRoutes from '../routes/servicoRoutes.js';
import diagnosticoRoutes from '../routes/diagnosticoRoutes.js'
import fornecedoresRoutes from '../routes/fornecedoresRoutes.js';
import ordemServicoRoutes from '../routes/ordemServicoRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import checklistRoutes from '../routes/checklistRoutes.js';
import funcionarioRoutes from '../routes/funcionarioRoutes.js';


/**
 * Configuração principal do servidor backend do MotorMind.
 *
 * Inicializa a aplicação Express, configura os middlewares globais,
 * disponibiliza arquivos estáticos e registra as rotas da API.
 *
 * @module server/server
 */

/**
 * Instância principal da aplicação Express.
 *
 * @type {Object}
 */
const app = express();

/**
 * Porta utilizada pelo servidor HTTP.
 *
 * Utiliza a variável de ambiente PORT quando disponível
 * ou a porta 3000 como valor padrão.
 *
 * @type {number|string}
 */
const PORT = process.env.PORT || 3000

/**
 * Configura os middlewares globais da aplicação.
 *
 * O CORS permite requisições originadas pelo frontend e o middleware
 * express.json realiza a leitura de dados JSON enviados no corpo
 * das requisições.
 */
app.use(cors());
app.use(express.json());

/**
 * Rota utilizada para verificar se o backend está em funcionamento.
 *
 * @name GET /
 * @function
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Object} Resposta textual indicando que o servidor está ativo.
 */
app.get('/', (req, res) => {
  res.send('Backend Rodando');
})

/**
 * Inicializa o servidor HTTP na porta configurada.
 *
 * @function
 * @param {number|string} PORT - Porta em que o servidor será executado.
 * @returns {Object} Instância do servidor HTTP.
 */
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

/**
 * Registra as rotas dos módulos disponíveis na API.
 *
 * Cada caminho direciona as requisições para o arquivo de rotas
 * e para o controlador correspondente.
 */
app.use('/clientes', clienteRoutes);
app.use('/veiculos', veiculoRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use('/pecas', pecasRoutes);
app.use('/servicos', servicosRoutes);
app.use('/diagnosticos', diagnosticoRoutes);
app.use('/fornecedores', fornecedoresRoutes);
app.use('/ordens-servico', ordemServicoRoutes);
app.use('/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/checklists', checklistRoutes);
app.use('/funcionarios', funcionarioRoutes);