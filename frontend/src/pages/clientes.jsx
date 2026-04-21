import { useEffect, useState } from 'react';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  // 🔄 carregar clientes
  async function carregarClientes() {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  // 💾 criar ou atualizar
  async function salvarCliente(e) {
    e.preventDefault();

    if (!nome || !telefone) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, {
          nome,
          telefone
        });
      } else {
        await api.post('/clientes', {
          nome,
          telefone
        });
      }

      setNome('');
      setTelefone('');
      setEditandoId(null);

      carregarClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  }

  // ✏️ editar
  function editarCliente(cliente) {
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setEditandoId(cliente.id);
  }

  // ❌ deletar
  async function deletarCliente(id) {
    const confirm = window.confirm('Tem certeza que deseja deletar?');
    if (!confirm) return;

    try {
      await api.delete(`/clientes/${id}`);
      carregarClientes();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Cadastro de Clientes</h1>

      {/* FORMULÁRIO */}
      <form onSubmit={salvarCliente} style={{ marginBottom: '20px' }}>
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />

        <button
          type="submit"
          style={{
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          {editandoId ? 'Atualizar' : 'Cadastrar'}
        </button>
      </form>

      <hr />

      {/* LISTA */}
      <h2>Lista de Clientes</h2>

      {clientes.length === 0 && <p>Nenhum cliente cadastrado</p>}

      {clientes.map((cliente) => (
        <div key={cliente.id} style={{ marginBottom: '10px' }}>
          <strong>{cliente.nome}</strong> - {cliente.telefone}

          <div style={{ marginTop: '5px' }}>
            <button
              onClick={() => editarCliente(cliente)}
              style={{
                marginRight: '10px',
                padding: '5px',
                cursor: 'pointer'
              }}
            >
              Editar
            </button>

            <button
              onClick={() => deletarCliente(cliente.id)}
              style={{
                padding: '5px',
                cursor: 'pointer'
              }}
            >
              Deletar
            </button>
          </div>

          <hr />
        </div>
      ))}
    </div>
  );
}

export default Clientes;