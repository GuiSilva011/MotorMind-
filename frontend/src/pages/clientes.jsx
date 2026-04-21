import { useEffect, useState } from 'react';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    async function carregarClientes() {
      try {
        const response = await api.get('/clientes');
        setClientes(response.data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    }

    carregarClientes();
  }, []);

  return (
    <div>
      <h1>Clientes</h1>

      {clientes.map((cliente) => (
        <div key={cliente.id}>
          <p>{cliente.nome}</p>
          <p>{cliente.telefone}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default Clientes;