import axios from 'axios'

/**
 * Instância compartilhada do Axios utilizada para realizar
 * requisições HTTP ao backend da aplicação.
 *
 * A URL base é aplicada automaticamente em todas as requisições
 * feitas por meio desta instância.
 *
 * @constant {Object}
 */
const api = axios.create({
  baseURL: 'http://localhost:3000'
})

export default api