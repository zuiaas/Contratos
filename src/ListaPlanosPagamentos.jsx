import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CLIENTES_POR_PAGINA = 9;

export default function ListaPlanosPagamentos() {
  const [planos, setPlanos] = useState([]);
  const [todosPlanos, setTodosPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [token, setToken] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [offset, setOffset] = useState(100);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMaisDados, setTemMaisDados] = useState(true);
  const [planosIdsCarregados, setPlanosIdsCarregados] = useState(new Set());

  const navigate = useNavigate();

  // Buscar token de autenticação
  const fetchToken = async () => {
    try {
      const res = await fetch("http://financeiro.vstec.net/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "cleitinhojt@gmail.com",
          password: "123456"
        }),
      });
      if (!res.ok) throw new Error("Falha na autenticação");
      const data = await res.json();
      return data.access_token;
    } catch (err) {
      throw new Error("Erro ao obter token: " + err.message);
    }
  };

  // Buscar planos de pagamento
  const fetchPlanosComToken = async () => {
    try {
      const authToken = await fetchToken();
      setToken(authToken);

      const planosRes = await fetch("http://financeiro.vstec.net/planos-pagamentos/?limit=100&skip=0", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      if (!planosRes.ok) throw new Error("Falha ao buscar planos de pagamento");
      const data = await planosRes.json();
      const planosIniciais = Array.isArray(data) ? data : (data.results || []);
      setPlanos(planosIniciais);
      setTodosPlanos(planosIniciais);

      // Popular o Set com os IDs dos planos iniciais
      const idsIniciais = new Set(planosIniciais.map(p => p.ID || p.id).filter(Boolean));
      setPlanosIdsCarregados(idsIniciais);

      setOffset(100);
    } catch (err) {
      setErro(err.message || "Erro ao buscar planos de pagamento");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchPlanosComToken();
  }, []);

  // Função para carregar mais planos
  const carregarMaisPlanos = async () => {
    if (!token || carregandoMais || !temMaisDados) return;

    setCarregandoMais(true);
    try {
      const planosRes = await fetch(`http://financeiro.vstec.net/planos-pagamentos/?limit=100&skip=${offset}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!planosRes.ok) throw new Error("Falha ao buscar mais planos");
      const data = await planosRes.json();
      const novosPlanos = Array.isArray(data) ? data : (data.results || []);

      // Verificar se há planos duplicados usando Set de IDs
      if (novosPlanos.length > 0) {
        const novosIds = novosPlanos.map(p => p.ID || p.id).filter(Boolean);
        const idsDuplicados = novosIds.filter(id => planosIdsCarregados.has(id));

        // Se há IDs duplicados, filtrar apenas os novos
        const planosNovos = novosPlanos.filter(p => {
          const id = p.ID || p.id;
          return id && !planosIdsCarregados.has(id);
        });

        if (planosNovos.length > 0) {
          // Atualizar o Set com os novos IDs
          const novosIdsUnicos = new Set(planosNovos.map(p => p.ID || p.id).filter(Boolean));
          setPlanosIdsCarregados(prev => new Set([...prev, ...novosIdsUnicos]));

          setPlanos(prev => [...prev, ...planosNovos]);
          setTodosPlanos(prev => [...prev, ...planosNovos]);
          setOffset(prev => prev + 100);

          // Se retornou menos de 100 planos, não há mais dados
          if (novosPlanos.length < 100) {
            setTemMaisDados(false);
          }
        } else {
          // Se todos os planos são duplicados, mas ainda não chegamos ao total, tentar continuar
          if (planos.length < 1000) { // Ajustar conforme necessário
            // Não definir temMaisDados como false ainda, deixar continuar tentando
          } else {
            setTemMaisDados(false);
          }
        }
      } else {
        // Se não retornou nenhum plano, não há mais dados
        setTemMaisDados(false);
      }
    } catch (err) {
      console.error("Erro ao carregar mais planos:", err);
      setTemMaisDados(false); // Em caso de erro, para de tentar carregar
    } finally {
      setCarregandoMais(false);
    }
  };

  // Função para buscar no banco de dados
  const buscarNoBanco = async () => {
    if (!token || !busca.trim()) return;

    setCarregando(true);
    try {
      const res = await fetch(`http://financeiro.vstec.net/planos-pagamentos/consultar/?dado=nome&valor=${encodeURIComponent(busca)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Falha na busca");
      const data = await res.json();
      const resultados = Array.isArray(data) ? data : (data.results || []);
      setPlanos(resultados);
      setPagina(1);
    } catch (err) {
      setErro(err.message || "Erro na busca");
    } finally {
      setCarregando(false);
    }
  };

  // Limpar busca
  const limparBusca = () => {
    setBusca("");
    setPlanos(todosPlanos);
    setPagina(1);
  };

  // Paginação
  const totalPaginas = Math.ceil(planos.length / CLIENTES_POR_PAGINA);
  const planosPagina = planos.slice(
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
      carregarMaisPlanos();
    }
  }, [pagina, totalPaginas, carregandoMais, busca, temMaisDados]);

  // Função para novo plano
  const handleNovoPlano = () => {
    navigate("/planos-pagamentos/cadastro");
  };

  // Função para editar plano
  const handleEditarPlano = (plano) => {
    navigate(`/planos-pagamentos/editar/${plano.ID || plano.id}`);
  };

  // Função para excluir plano
  const handleExcluirPlano = async (plano) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja excluir o plano "${plano.Nome || plano.nome}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://financeiro.vstec.net/planos-pagamentos/${plano.ID || plano.id}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          setPlanos(planos.filter(p => (p.ID || p.id) !== (plano.ID || plano.id)));
          setTodosPlanos(todosPlanos.filter(p => (p.ID || p.id) !== (plano.ID || plano.id)));
          Swal.fire('Excluído!', 'Plano excluído com sucesso.', 'success');
        } else {
          throw new Error('Falha ao excluir plano');
        }
      } catch (err) {
        Swal.fire('Erro!', 'Erro ao excluir plano: ' + err.message, 'error');
      }
    }
  };

  // Estilos
  const containerStyle = {
    padding: '0px 24px',
    marginTop: '-12px',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden'
  };

  const titleStyle = {
    fontSize: '27px',
    marginTop: '14px',
    marginBottom: '14px',
    color: '#333',
    fontWeight: 'bold'
  };

  const searchContainerStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'center'
  };

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '300px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    tableLayout: 'auto'
  };

  const headerStyle = {
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontWeight: 'bold',
    padding: '6px 8px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontSize: '12px'
  };

  const cellStyle = {
    padding: '6px 8px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '12px',
    lineHeight: '1.2'
  };

  const rowStyle = (index) => ({
    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });

  const selectedRowStyle = {
    backgroundColor: '#e3f2fd',
    cursor: 'pointer'
  };

  const paginationStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '20px',
    flexWrap: 'wrap'
  };

  return (
    <div className="p-6 w-full max-w-full overflow-hidden font-sans">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Home</a>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium">Lista de Planos de Pagamentos</span>
      </nav>

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lista de Planos de Pagamentos</h1>

        {/* Search Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto md:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar planos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleBuscar}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
          >
            Buscar
          </button>
          {busca && (
            <button
              onClick={limparBusca}
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
            <p className="text-slate-500 font-medium">Carregando planos...</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4 w-[30%]">Nome</th>
                <th className="px-6 py-4 w-[15%]">Parcelas</th>
                <th className="px-6 py-4 w-[15%]">Valor</th>
                <th className="px-6 py-4 w-[20%]">Descrição</th>
                <th className="px-6 py-4 w-[10%]">Ativo</th>
                <th className="px-6 py-4 w-[10%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {carregando ? (
                Array.from({ length: 9 }, (_, index) => (
                  <tr key={index} className="animate-pulse h-[53px]">
                    <td colSpan="6" className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : (
                Array.from({ length: Math.max(9, planosPagina.length) }, (_, index) => {
                  const plano = planosPagina[index];
                  const isSelected = linhaSelecionada === index;

                  return (
                    <tr
                      key={plano ? (plano.ID || plano.id) : `empty-${index}`}
                      onClick={() => setLinhaSelecionada(isSelected ? null : index)}
                      className={`
                                        cursor-pointer transition-colors duration-150 h-[53px]
                                        ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                    `}
                    >
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {plano ? (plano.Nome || plano.nome || '-') : ''}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {plano ? (plano.Parcelas || plano.parcelas || '-') : ''}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600">
                        {plano ? (plano.Valor ? `R$ ${parseFloat(plano.Valor).toFixed(2)}` : '-') : ''}
                      </td>
                      <td className="px-6 py-3 text-slate-500 truncate max-w-xs">
                        {plano ? (plano.Descricao || plano.descricao || '-') : ''}
                      </td>
                      <td className="px-6 py-3">
                        {plano ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(plano.Ativo || plano.ativo) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {(plano.Ativo || plano.ativo) ? 'Sim' : 'Não'}
                          </span>
                        ) : ''}
                      </td>
                      <td className="px-6 py-3">
                        {plano && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditarPlano(plano);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirPlano(plano);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Excluir"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!carregando && planos.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{planosPagina.length}</span> resultados
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

      {/* Button */}
      <div className="flex justify-center">
        <button
          onClick={handleNovoPlano}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          Novo Plano de Pagamento
        </button>
      </div>
    </div>
  );
}