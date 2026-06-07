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

const app = express();
const PORT = process.env.PORT || 3000

// Middleware global: libera requisições do frontend e permite ler JSON no body.
app.use(cors());
app.use(express.json());

// Rota simples para confirmar que a API está no ar.
app.get('/', (req, res) => {
  res.send('Backend Rodando');
})

// Sobe o servidor HTTP na porta configurada.
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

// Cada rota abaixo conecta uma área do sistema ao controller responsável.
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