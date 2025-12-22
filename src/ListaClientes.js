import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import Swal from 'sweetalert2';

const buttonStyle = {
  padding: '8px 20px',
  fontSize: '1rem',
  background: '#fff',
  color: '#222',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 'bold',
  margin: 4,
  minWidth: 100,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
};

const btnNovo = {
  ...buttonStyle,
  background: '#008000',
  color: '#fff',
  border: '1px solid #005700',
};

const btnAlterar = {
  ...buttonStyle,
  background: '#0056b3',
  color: '#fff',
  border: '1px solid #003974',
};

const btnExcluir = {
  ...buttonStyle,
  background: '#c40000',
  color: '#fff',
  border: '1px solid #7a0000',
};

export default function ListaClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [pagina, setPagina] = useState(1);
  const CLIENTES_POR_PAGINA = 9;
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMaisDados, setTemMaisDados] = useState(true);
  const [offset, setOffset] = useState(0);
  const [token, setToken] = useState(null);
  const [todosClientes, setTodosClientes] = useState([]); // Para armazenar todos os clientes carregados
  const [buscando, setBuscando] = useState(false);
  const [clientesIdsCarregados, setClientesIdsCarregados] = useState(new Set()); // Para controlar IDs únicos

  useEffect(() => {
    async function fetchClientesComToken() {
      setCarregando(true);
      setErro(null);
      try {
        // 1. Buscar o token
        const loginRes = await fetch("http://financeiro.vstec.net/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            username: "user@example.com",
            password: "string"
          })
        });
        if (!loginRes.ok) throw new Error("Falha ao autenticar");
        const loginData = await loginRes.json();
        const authToken = loginData.access || loginData.token || loginData.access_token;
        if (!authToken) throw new Error("Token não encontrado na resposta");
        setToken(authToken);
        // 2. Buscar clientes usando o token
        const clientesRes = await fetch("http://financeiro.vstec.net/clientes/?limit=100&skip=0", {
          headers: {
            "Authorization": `Bearer ${authToken}`
          }
        });
        if (!clientesRes.ok) throw new Error("Falha ao buscar clientes");
        const data = await clientesRes.json();
        const clientesIniciais = Array.isArray(data) ? data : (data.results || []);
        setClientes(clientesIniciais);
        setTodosClientes(clientesIniciais);
        
        // Popular o Set com os IDs dos clientes iniciais
        const idsIniciais = new Set(clientesIniciais.map(c => c.ClientesID || c.ID || c.id).filter(Boolean));
        setClientesIdsCarregados(idsIniciais);
        
        setOffset(100);
      } catch (err) {
        setErro(err.message || "Erro ao buscar clientes");
      } finally {
        setCarregando(false);
      }
    }
    fetchClientesComToken();
  }, []);

  // Função para carregar mais clientes
  const carregarMaisClientes = async () => {
    if (!token || carregandoMais || !temMaisDados) return;
    
    setCarregandoMais(true);
    try {
      const clientesRes = await fetch(`http://financeiro.vstec.net/clientes/?limit=100&skip=${offset}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!clientesRes.ok) throw new Error("Falha ao buscar mais clientes");
      const data = await clientesRes.json();
      const novosClientes = Array.isArray(data) ? data : (data.results || []);
      
      // Verificar se há clientes duplicados usando Set de IDs
      if (novosClientes.length > 0) {
        const novosIds = novosClientes.map(c => c.ClientesID || c.ID || c.id).filter(Boolean);
        const idsDuplicados = novosIds.filter(id => clientesIdsCarregados.has(id));
        
        // Se há IDs duplicados, filtrar apenas os novos
        const clientesNovos = novosClientes.filter(c => {
          const id = c.ClientesID || c.ID || c.id;
          return id && !clientesIdsCarregados.has(id);
        });
        
        if (clientesNovos.length > 0) {
          // Atualizar o Set com os novos IDs
          const novosIdsUnicos = new Set(clientesNovos.map(c => c.ClientesID || c.ID || c.id).filter(Boolean));
          setClientesIdsCarregados(prev => new Set([...prev, ...novosIdsUnicos]));
          
          setClientes(prev => [...prev, ...clientesNovos]);
          setTodosClientes(prev => [...prev, ...clientesNovos]);
          setOffset(prev => prev + 100);
          
          // Se retornou menos de 100 clientes, não há mais dados
          if (novosClientes.length < 100) {
            setTemMaisDados(false);
          }
        } else {
          // Se todos os clientes são duplicados, mas ainda não chegamos aos 512, tentar continuar
          if (clientes.length < 512) {
            // Não definir temMaisDados como false ainda, deixar continuar tentando
          } else {
            setTemMaisDados(false);
          }
        }
      } else {
        // Se não retornou nenhum cliente, não há mais dados
        setTemMaisDados(false);
      }
    } catch (err) {
      console.error("Erro ao carregar mais clientes:", err);
      setTemMaisDados(false); // Em caso de erro, para de tentar carregar
    } finally {
      setCarregandoMais(false);
    }
  };

  // Função para buscar no banco de dados
  const buscarNoBanco = async () => {
    if (!token || !busca.trim()) return;
    
    setBuscando(true);
    setPagina(1);
    try {
      // Separar nome e CPF da busca
      const termo = busca.trim();
      const isCPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(termo) || /^\d{11}$/.test(termo);
      
      let url = "http://financeiro.vstec.net/clientes/?limit=100";
      if (isCPF) {
        url += `&cpf=${encodeURIComponent(termo)}`;
      } else {
        url += `&nome=${encodeURIComponent(termo)}`;
      }
      
      const clientesRes = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!clientesRes.ok) throw new Error("Falha ao buscar clientes");
      const data = await clientesRes.json();
      const clientesEncontrados = Array.isArray(data) ? data : (data.results || []);
      setClientes(clientesEncontrados);
    } catch (err) {
      console.error("Erro na busca:", err);
      setErro("Erro ao buscar clientes");
    } finally {
      setBuscando(false);
    }
  };

  // Função para limpar busca e voltar aos clientes originais
  const limparBusca = () => {
    setBusca("");
    setClientes(todosClientes);
    setPagina(1);
  };

  // Paginação
  const totalPaginas = Math.ceil(clientes.length / CLIENTES_POR_PAGINA);
  const clientesPagina = clientes.slice(
    (pagina - 1) * CLIENTES_POR_PAGINA, 
    pagina * CLIENTES_POR_PAGINA
  );

  // Resetar página quando buscar
  const handleBuscar = () => {
    if (busca.trim()) {
      buscarNoBanco();
    } else {
      limparBusca();
    }
  };

  // Carregar mais dados quando chegar na penúltima página
  useEffect(() => {
    if (pagina === totalPaginas - 1 && totalPaginas > 1 && !carregandoMais && !busca.trim() && temMaisDados) {
      carregarMaisClientes();
    }
  }, [pagina, totalPaginas, carregandoMais, busca, temMaisDados]);

  // Função para novo cliente
  const handleNovoCliente = () => {
    navigate("/clientes/cadastro");
  };

  // Função para editar cliente
  const handleEditarCliente = () => {
    if (linhaSelecionada === null) return;
    
    const clienteSelecionado = clientes[linhaSelecionada];
    const clienteId = clienteSelecionado.ClientesID || clienteSelecionado.id || clienteSelecionado.ID;
    
    if (clienteId) {
      navigate(`/clientes/editar/${clienteId}`);
    } else {
      console.error("ID do cliente não encontrado");
    }
  };

  return (
    <div style={{ padding: '0px 24px', marginTop: '-12px', fontFamily: 'Segoe UI, Arial, sans-serif', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <nav style={{ marginBottom: 12, fontSize: '1rem' }}>
        <a href="/" style={{ color: '#1976d2', textDecoration: 'none' }}>Home</a>
        <span style={{ margin: '0 8px' }}>{'>'}</span>
        <span>Lista de Clientes</span>
      </nav>
      <h1 style={{ fontSize: '27px', marginTop: '14px', marginBottom: '14px' }}>Lista de Clientes</h1>
      
      {/* Campo de busca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, maxWidth: 400 }}>
        <input
          type="text"
          placeholder="Buscar por nome ou CPF"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem' }}
          onKeyDown={e => { if (e.key === 'Enter') handleBuscar(); }}
          disabled={buscando}
        />
        <button
          onClick={handleBuscar}
          style={{ ...buttonStyle, background: '#e9ecef', color: '#222', minWidth: 40, padding: '8px 12px' }}
          disabled={buscando}
        >
          {buscando ? '...' : <FaSearch />}
        </button>
        {busca && (
          <button
            onClick={limparBusca}
            style={{ ...buttonStyle, background: '#f8f9fa', color: '#666', minWidth: 60, padding: '8px 12px' }}
            disabled={buscando}
          >
            Limpar
          </button>
        )}
      </div>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      
      <div className="grid-container" style={{ overflowX: 'auto', marginBottom: 16, width: '100%', maxWidth: '100%', position: 'relative' }}>
        {carregando && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10
          }}>
            <div className="loading-spinner" style={{
              width: '50px',
              height: '50px',
              border: '10px solid #f3f3f3',
              borderTop: '10px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}>
            </div>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '6px 8px', border: '1px solid #eee', width: '30%' }}>Nome</th>
              <th style={{ padding: '6px 8px', border: '1px solid #eee', width: '15%' }}>CPF</th>
              <th style={{ padding: '6px 8px', border: '1px solid #eee', width: '15%' }}>Telefone</th>
              <th style={{ padding: '6px 8px', border: '1px solid #eee', width: '20%' }}>Endereço</th>
              <th style={{ padding: '6px 8px', border: '1px solid #eee', width: '10%' }}>Bairro</th>
              <th style={{ padding: '6px 8px', border: '1px solid #eee', width: '10%' }}>Cidade</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 9 }, (_, i) => {
              const cliente = clientesPagina[i];
              const indiceGlobal = (pagina - 1) * CLIENTES_POR_PAGINA + i;
              
              if (carregando) {
                // Linhas de loading
                return (
                  <tr key={`loading-${i}`} style={{ 
                    background: i % 2 === 0 ? '#fff' : '#f9f9f9',
                    height: '32px'
                  }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                  </tr>
                );
              } else if (cliente) {
                // Linhas com dados
                return (
                  <tr
                    key={cliente.id || cliente.ID || indiceGlobal}
                    onClick={() => setLinhaSelecionada(indiceGlobal)}
                    style={{
                      background: linhaSelecionada === indiceGlobal ? '#d1e7fd' : (i % 2 === 0 ? '#fff' : '#f9f9f9'),
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      height: '32px'
                    }}
                  >
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{cliente.Nome || ''}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{cliente.CPF || ''}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{cliente.Telefone || ''}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{cliente.Endereco || ''}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{cliente.BairrosNome || ''}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{cliente.Cidade || ''}</td>
                  </tr>
                );
              } else {
                // Linhas vazias quando não há dados suficientes
                return (
                  <tr key={`empty-${i}`} style={{ 
                    background: i % 2 === 0 ? '#fff' : '#f9f9f9',
                    height: '32px'
                  }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                    <td style={{ padding: '6px 8px', border: '1px solid #eee' }}></td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>


      {/* Paginador */}
      {!carregando && !erro && totalPaginas > 1 && !buscando && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => {
              setPagina(pagina - 1);
              setLinhaSelecionada(null);
            }}
            disabled={pagina === 1}
            style={{ ...buttonStyle, minWidth: 40, padding: '6px 12px', background: '#e9ecef' }}
          >
            &lt;
          </button>
          <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => {
              setPagina(pagina + 1);
              setLinhaSelecionada(null);
            }}
            disabled={carregandoMais || (!temMaisDados && pagina === totalPaginas)}
            style={{ ...buttonStyle, minWidth: 40, padding: '6px 12px', background: '#e9ecef' }}
          >
            &gt;
          </button>
          {carregandoMais && (
            <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: 8 }}>
              Carregando mais clientes...
            </span>
          )}
          {!temMaisDados && pagina === totalPaginas && (
            <span style={{ fontSize: '0.9rem', color: '#888', marginLeft: 8 }}>
              Todos os clientes foram carregados
            </span>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button style={btnNovo} className="btn-novo" onClick={handleNovoCliente}>
          <FaPlus /> Novo
        </button>
        <button
          style={btnAlterar}
          className="btn-alterar"
          disabled={linhaSelecionada === null}
          onClick={handleEditarCliente}
        >
          <FaEdit /> Alterar
        </button>
        <button
          style={btnExcluir}
          className="btn-excluir"
          disabled={linhaSelecionada === null}
        >
          <FaTrash /> Excluir
        </button>
      </div>

      <style>{`
        tr:hover { background: #e3f2fd !important; }
        tr.selected { background: #d1e7fd !important; }
        .btn-novo, .btn-alterar, .btn-excluir {
          transition: all 0.15s cubic-bezier(.4,0,.2,1);
        }
        .btn-novo:hover {
          background: #00b300 !important;
          color: #fff !important;
          transform: scale(1.06);
        }
        .btn-alterar:hover {
          background: #1976ff !important;
          color: #fff !important;
          transform: scale(1.06);
        }
        .btn-excluir:hover {
          background: #ff3333 !important;
          color: #fff !important;
          transform: scale(1.06);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
          transform: none !important;
        }
        
        /* Responsividade para o grid */
        table {
          width: 100%;
          table-layout: auto;
        }
        
        /* Garantir que o container use toda a largura */
        .grid-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          box-sizing: border-box;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        /* Responsividade para telas menores */
        @media (max-width: 768px) {
          .grid-container {
            font-size: 0.9rem;
          }
          th, td {
            padding: 6px !important;
          }
        }
        
        @media (max-width: 480px) {
          .grid-container {
            font-size: 0.8rem;
          }
          th, td {
            padding: 4px !important;
          }
        }
        
        /* Scrollbar personalizada */
        .grid-container::-webkit-scrollbar {
          height: 8px;
        }
        .grid-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .grid-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .grid-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Melhorar a aparência das células */
        td, th {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          padding: 6px 8px;
          line-height: 1.2;
        }
        
        /* Permitir quebra de linha apenas no nome */
        td:first-child {
          white-space: normal;
          word-wrap: break-word;
        }
        
        /* Animação do spinner circular */
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}