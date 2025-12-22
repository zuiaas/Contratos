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

  if (erro) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Lista de Planos de Pagamentos</h1>
        <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
          Erro: {erro}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
        Home &gt; Lista de Planos de Pagamentos
      </div>

      {/* Título */}
      <h1 style={titleStyle}>Lista de Planos de Pagamentos</h1>

      {/* Campo de busca */}
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Buscar planos de pagamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
          style={inputStyle}
        />
        <button
          onClick={handleBuscar}
          style={{ ...buttonStyle, backgroundColor: '#1976d2', color: 'white' }}
        >
          Buscar
        </button>
        {busca && (
          <button
            onClick={limparBusca}
            style={{ ...buttonStyle, backgroundColor: '#6c757d', color: 'white' }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid-container" style={{ position: 'relative' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: '30%' }}>Nome</th>
              <th style={{ ...headerStyle, width: '15%' }}>Parcelas</th>
              <th style={{ ...headerStyle, width: '15%' }}>Valor</th>
              <th style={{ ...headerStyle, width: '20%' }}>Descrição</th>
              <th style={{ ...headerStyle, width: '10%' }}>Ativo</th>
              <th style={{ ...headerStyle, width: '10%' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              // Mostrar 9 linhas vazias durante carregamento
              Array.from({ length: 9 }, (_, index) => (
                <tr key={index} style={rowStyle(index)}>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                </tr>
              ))
            ) : (
              // Mostrar dados ou linhas vazias para manter 9 linhas
              Array.from({ length: Math.max(9, planosPagina.length) }, (_, index) => {
                const plano = planosPagina[index];
                const isSelected = linhaSelecionada === index;
                
                return (
                  <tr 
                    key={plano ? (plano.ID || plano.id) : `empty-${index}`}
                    style={isSelected ? selectedRowStyle : rowStyle(index)}
                    onClick={() => setLinhaSelecionada(isSelected ? null : index)}
                  >
                    <td style={cellStyle}>
                      {plano ? (plano.Nome || plano.nome || '-') : ''}
                    </td>
                    <td style={cellStyle}>
                      {plano ? (plano.Parcelas || plano.parcelas || '-') : ''}
                    </td>
                    <td style={cellStyle}>
                      {plano ? (plano.Valor ? `R$ ${parseFloat(plano.Valor).toFixed(2)}` : '-') : ''}
                    </td>
                    <td style={cellStyle}>
                      {plano ? (plano.Descricao || plano.descricao || '-') : ''}
                    </td>
                    <td style={cellStyle}>
                      {plano ? (
                        <span style={{ 
                          color: (plano.Ativo || plano.ativo) ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {(plano.Ativo || plano.ativo) ? 'Sim' : 'Não'}
                        </span>
                      ) : ''}
                    </td>
                    <td style={cellStyle}>
                      {plano && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarPlano(plano);
                            }}
                            style={{
                              ...buttonStyle,
                              backgroundColor: '#ffc107',
                              color: 'black',
                              padding: '4px 8px',
                              fontSize: '12px'
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExcluirPlano(plano);
                            }}
                            style={{
                              ...buttonStyle,
                              backgroundColor: '#dc3545',
                              color: 'white',
                              padding: '4px 8px',
                              fontSize: '12px'
                            }}
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

        {/* Loading spinner centralizado */}
        {carregando && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 10
          }}>
            <div className="loading-spinner" style={{
              width: '50px', height: '50px',
              border: '10px solid #f3f3f3', borderTop: '10px solid #1976d2',
              borderRadius: '50%', animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
      </div>

      {/* Paginação */}
      {!carregando && planos.length > 0 && (
        <div style={paginationStyle}>
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
              Carregando mais planos...
            </span>
          )}
          {!temMaisDados && pagina === totalPaginas && (
            <span style={{ fontSize: '0.9rem', color: '#888', marginLeft: 8 }}>
              Todos os planos foram carregados
            </span>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button
          onClick={handleNovoPlano}
          style={{ ...buttonStyle, backgroundColor: '#28a745', color: 'white' }}
        >
          Novo Plano de Pagamento
        </button>
      </div>
    </div>
  );
}





