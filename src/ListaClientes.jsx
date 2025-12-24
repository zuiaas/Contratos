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
    <div className="p-6 w-full max-w-full overflow-hidden font-sans">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Home</a>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium">Lista de Clientes</span>
      </nav>

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lista de Clientes</h1>

        {/* Search Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto md:max-w-md">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou CPF"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-80 border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              onKeyDown={e => { if (e.key === 'Enter') handleBuscar(); }}
              disabled={buscando}
            />
          </div>

          <button
            onClick={handleBuscar}
            disabled={buscando}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200 disabled:opacity-50"
          >
            {buscando ? '...' : 'Buscar'}
          </button>

          {busca && (
            <button
              onClick={limparBusca}
              disabled={buscando}
              className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-100 hover:border-red-200 rounded-lg font-medium transition-all"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center">
          <span className="font-medium mr-2">Erro:</span> {erro}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6 relative min-h-[400px]">
        {carregando && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 font-medium">Carregando clientes...</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4 w-1/3">Nome</th>
                <th className="px-6 py-4 w-[15%]">CPF</th>
                <th className="px-6 py-4 w-[15%]">Telefone</th>
                <th className="px-6 py-4 w-1/5">Endereço</th>
                <th className="px-6 py-4 w-[10%]">Bairro</th>
                <th className="px-6 py-4 w-[10%]">Cidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {Array.from({ length: 9 }, (_, i) => {
                const cliente = clientesPagina[i];
                const indiceGlobal = (pagina - 1) * CLIENTES_POR_PAGINA + i;

                if (carregando) {
                  return (
                    <tr key={`loading-${i}`} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-3/4"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-2/3"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    </tr>
                  );
                } else if (cliente) {
                  const isSelected = linhaSelecionada === indiceGlobal;
                  return (
                    <tr
                      key={cliente.id || cliente.ID || indiceGlobal}
                      onClick={() => setLinhaSelecionada(indiceGlobal)}
                      className={`
                            cursor-pointer transition-colors duration-150
                            ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                        `}
                    >
                      <td className="px-6 py-3 font-medium text-slate-900 truncate max-w-xs" title={cliente.Nome}>
                        {isSelected && <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full mt-[-6px]"></div>}
                        {cliente.Nome || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">{cliente.CPF || '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-600">{cliente.Telefone || '-'}</td>
                      <td className="px-6 py-3 truncate max-w-xs text-slate-600" title={cliente.Endereco}>{cliente.Endereco || '-'}</td>
                      <td className="px-6 py-3 navbar-text text-slate-600">{cliente.BairrosNome || '-'}</td>
                      <td className="px-6 py-3 text-slate-600">{cliente.Cidade || '-'}</td>
                    </tr>
                  );
                } else {
                  // Empty rows to keep height consistent
                  return (
                    <tr key={`empty-${i}`} className="h-[49px]">
                      <td colSpan="6" className="px-6"></td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!carregando && !erro && (totalPaginas > 1 || carregandoMais) && !buscando && (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{clientesPagina.length}</span> resultados nesta página
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPagina(pagina - 1);
                setLinhaSelecionada(null);
              }}
              disabled={pagina === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt; Anterior
            </button>
            <span className="text-sm font-medium text-slate-700 px-2">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => {
                setPagina(pagina + 1);
                setLinhaSelecionada(null);
              }}
              disabled={carregandoMais || (!temMaisDados && pagina === totalPaginas)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima &gt;
            </button>

            {carregandoMais && (
              <span className="text-xs text-blue-600 animate-pulse ml-2 font-medium">Carregando mais...</span>
            )}
            {!temMaisDados && pagina === totalPaginas && (
              <span className="text-xs text-slate-400 ml-2">Fim da lista</span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 fixed bottom-8 left-0 right-0 pointer-events-none md:static md:pointer-events-auto md:mt-2">
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 flex gap-2 pointer-events-auto transform transition-all hover:scale-105">
          <button
            onClick={handleNovoCliente}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95"
          >
            <FaPlus className="text-sm" />
            <span>Novo Cliente</span>
          </button>

          <button
            onClick={handleEditarCliente}
            disabled={linhaSelecionada === null}
            className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all active:scale-95
                ${linhaSelecionada !== null
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
            <FaEdit className="text-sm" />
            <span>Alterar</span>
          </button>

          <button
            disabled={linhaSelecionada === null}
            className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all active:scale-95
                ${linhaSelecionada !== null
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/20 hover:from-red-600 hover:to-red-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
            <FaTrash className="text-sm" />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
}