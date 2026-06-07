import axios from 'axios'

// Instância única do Axios usada por toda a aplicação para chamar o backend.
const api = axios.create({
  baseURL: 'http://localhost:3000'
})

export default api