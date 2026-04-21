import express from 'express'
import cors from 'cors'
import clienteRoutes from './routes/clienteRoutes.js'
import veiculoRoutes from './routes/veiculoRoutes.js'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend Rodando')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

app.use('/clientes', clienteRoutes)
app.use('/veiculos', veiculoRoutes)