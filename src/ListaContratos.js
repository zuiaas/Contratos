import React, { useState, useEffect, useRef } from "react";
import { FaSave, FaPlus, FaPrint, FaTrash, FaTimes, FaCheck, FaMoneyBillWave, FaFileAlt, FaFileSignature, FaCalendarAlt } from "react-icons/fa";

const mockPlanos = [
  { nome: "1.200,00 R$20X72,00", valor: "R$1.440,00", dias: 20, juros: "20,00" },
  { nome: "2.000,00 R$10X200,00", valor: "R$2.000,00", dias: 10, juros: "10,00" },
  { nome: "3.000,00 R$30X100,00", valor: "R$3.000,00", dias: 30, juros: "15,00" }
];
const mockContrato = {
  numero: 431,
  dataLanc: "19/01/2024 08:53",
  dataContrato: "21/01/2024",
  cliente: "",
  obs: "",
  plano: mockPlanos[0].nome,
  valor: mockPlanos[0].valor,
  dias: mockPlanos[0].dias,
  juros: mockPlanos[0].juros,
  valorTotal: "R$1.728,00",
  valorParcela: "R$86,40",
  dataFinal: "16/02/2024",
  diasCobranca: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
};
const mockVencimentos = Array.from({ length: 15 }).map((_, i) => ({
  parcela: i + 1,
  vencimento: `${22 + i}/01/2024`,
  valor: "R$ 86,40",
  diaSemana: ["SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA"][i % 5],
  recebido: i < 7 ? "R$ 86,40" : "R$ 0,00",
  quitado: i < 7,
}));

export default function ListaContratos() {
  // Novo estado para clientes
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [erroClientes, setErroClientes] = useState(null);
  const [token, setToken] = useState(null);
  const [contrato, setContrato] = useState(mockContrato);
  const [vencimentos] = useState(mockVencimentos);
  const [clienteSugest, setClienteSugest] = useState("");
  const [showSugest, setShowSugest] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(false);
  const [planos] = useState(mockPlanos);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const clienteInputRef = useRef(null);

  // Buscar token da API ao montar
  useEffect(() => {
    async function fetchToken() {
      console.log('🔑 Iniciando obtenção do token...');
      try {
        const loginRes = await fetch("http://financeiro.vstec.net/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            username: "user@example.com",
            password: "string"
          })
        });
        console.log('🔑 Resposta do login:', loginRes.status, loginRes.statusText);
        
        if (!loginRes.ok) throw new Error("Falha ao autenticar");
        const loginData = await loginRes.json();
        console.log('🔑 Dados do login:', loginData);
        
        const token = loginData.access || loginData.token || loginData.access_token;
        if (!token) throw new Error("Token não encontrado na resposta");
        
        console.log('✅ Token obtido com sucesso!');
        setToken(token);
      } catch (err) {
        console.error('❌ Erro ao obter token:', err);
        setErroClientes(err.message || "Erro ao obter token");
      }
    }
    fetchToken();
  }, []);

  // Limpar timeout ao desmontar o componente
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Função para buscar clientes usando a API de consulta
  const buscarClientes = async (valor) => {
    console.log('🔍 Iniciando busca de clientes:', { valor, token: token ? 'OK' : 'FALTANDO', length: valor.length });
    
    if (!token || valor.length < 3) {
      console.log('❌ Busca cancelada:', { token: !token, length: valor.length });
      setClientes([]);
      return;
    }

    setCarregandoClientes(true);
    setErroClientes(null);
    
    try {
      const url = `http://financeiro.vstec.net/clientes/consultar/?dado=nome&valor=${encodeURIComponent(valor)}`;
      console.log('🌐 Fazendo requisição para:', url);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      console.log('📊 Resposta da API:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Erro da API:', errorText);
        throw new Error(`Falha ao buscar clientes: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Clientes encontrados:', data);
      console.log('🔍 Primeiro cliente (exemplo):', data[0] || data.results?.[0]);
      setClientes(Array.isArray(data) ? data : (data.results || []));
      
      // Manter foco no campo após carregar clientes
      setTimeout(() => {
        if (clienteInputRef.current) {
          clienteInputRef.current.focus();
        }
      }, 10);
    } catch (err) {
      console.error('💥 Erro na busca:', err);
      setErroClientes(err.message || "Erro ao buscar clientes");
      setClientes([]);
    } finally {
      setCarregandoClientes(false);
    }
  };

  function handleClienteChange(e) {
    const valor = e.target.value;
    console.log('📝 Input alterado:', valor, 'Length:', valor.length);
    
    setClienteSugest(valor);
    setContrato({ ...contrato, cliente: valor });
    setClienteSelecionado(false); // Marcar como não selecionado da lista
    setClienteId(''); // SEMPRE limpar o ID quando digitar
    
    // Limpar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Se tiver menos de 3 caracteres, limpar lista e não mostrar sugestões
    if (valor.length < 3) {
      console.log('🚫 Menos de 3 caracteres, limpando lista');
      setClientes([]);
      setShowSugest(false);
      return;
    }
    
    // Mostrar sugestões
    setShowSugest(true);
    console.log('⏰ Agendando busca em 500ms para:', valor);
    
    // Manter foco no campo após mostrar a lista
    setTimeout(() => {
      if (clienteInputRef.current) {
        clienteInputRef.current.focus();
      }
    }, 10);
    
    // Debounce: aguardar 500ms antes de fazer a busca
    const newTimeoutId = setTimeout(() => {
      console.log('⏰ Timeout executado, iniciando busca para:', valor);
      buscarClientes(valor);
    }, 500);
    
    setTimeoutId(newTimeoutId);
  }

  function handleClienteBlur() {
    console.log('👋 Campo Cliente perdeu foco');
    
    // Se não foi selecionado da lista, limpar tudo
    if (!clienteSelecionado) {
      console.log('🧹 Limpando campos - não foi seleção da lista');
      setClienteSugest('');
      setContrato({ ...contrato, cliente: '' });
      setClienteId('');
      setClientes([]);
      setShowSugest(false);
    }
  }
  function handleClienteSelect(cliente) {
    const nome = cliente.Nome || cliente.nome || '';
    const id = cliente.ClientesID || cliente.clientesid || cliente.ID || cliente.id || '';
    
    console.log('👤 Cliente selecionado:', { nome, id, cliente });
    
    setContrato({ ...contrato, cliente: nome });
    setClienteSugest(nome);
    setClienteId(id);
    setClienteSelecionado(true); // Marcar como selecionado da lista
    setShowSugest(false); // Fechar a lista após seleção
  }

  function handleClienteKeyDown(e) {
    if (e.key === 'Escape') {
      console.log('🚪 Fechando lista com Escape');
      setShowSugest(false);
      setClientes([]);
    }
  }
  function handleObsChange(e) {
    setContrato({ ...contrato, obs: e.target.value });
  }
  function handlePlanoChange(e) {
    const plano = planos.find(p => p.nome === e.target.value);
    if (plano) {
      setContrato({ ...contrato, plano: plano.nome, valor: plano.valor, dias: plano.dias, juros: plano.juros });
    } else {
      setContrato({ ...contrato, plano: e.target.value });
    }
  }
  function handleValorChange(e) {
    setContrato({ ...contrato, valor: e.target.value });
  }
  function handleDiasChange(e) {
    setContrato({ ...contrato, dias: e.target.value });
  }
  function handleJurosChange(e) {
    setContrato({ ...contrato, juros: e.target.value });
  }
  function handleDiaCobrancaChange(dia) {
    setContrato(prev => {
      const dias = prev.diasCobranca.includes(dia)
        ? prev.diasCobranca.filter(d => d !== dia)
        : [...prev.diasCobranca, dia];
      return { ...prev, diasCobranca: dias };
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <nav style={{ marginBottom: 20, fontSize: '1rem' }}>
        <a href="/" style={{ color: '#1976d2', textDecoration: 'none' }}>Home</a>
        <span style={{ margin: '0 8px' }}>{'>'}</span>
        <span>Lista Contratos</span>
      </nav>
      <div style={{ display: 'flex', gap: 32, alignItems: 'stretch', height: 'auto', minHeight: 0 }}>
        {/* Coluna esquerda: Informações Gerais e Plano de Pagamento */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: 480, minWidth: 480, maxWidth: 480, height: 'auto', gap: 0, boxSizing: 'border-box' }}>
          <fieldset style={{ border: '1px solid #bbb', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', padding: 0, margin: 0, width: 480, minWidth: 480, maxWidth: 480, boxSizing: 'border-box' }}>
            <legend style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 12 }}><FaFileAlt style={{ marginRight: 6 }} /> Informações Gerais</legend>
            <div style={{ padding: 8, boxSizing: 'border-box', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>Contrato</label>
                <input value={contrato.numero} style={{ width: 80, color: 'red', fontWeight: 'bold', textAlign: 'center', borderRadius: 3, marginRight: 16 }} readOnly />
                <label style={{ width: 40, textAlign: 'right', marginRight: 8 }}>Inc.</label>
                <input value={contrato.dataLanc} style={{ width: 120, background: '#eee', borderRadius: 3, height: 22, fontSize: 14 }} readOnly />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>ClientesID</label>
                <input value={clienteId} style={{ width: 80, borderRadius: 3, height: 22, fontSize: 14, background: '#eee' }} readOnly />
                <label style={{ width: 40, textAlign: 'right', marginLeft: 16, marginRight: 8 }}>Data</label>
                <input value={contrato.dataContrato} style={{ width: 120, borderRadius: 3, height: 22, fontSize: 14 }} readOnly />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5, position: 'relative' }}>
                <label style={{ width: 90 }}>Cliente</label>
                <input
                  ref={clienteInputRef}
                  value={clienteSugest || contrato.cliente}
                  onChange={handleClienteChange}
                  onFocus={() => setShowSugest((clienteSugest || contrato.cliente || '').length >= 3)}
                  onBlur={handleClienteBlur}
                  onKeyDown={handleClienteKeyDown}
                  style={{ width: 345, borderRadius: 3, height: 22, fontSize: 14 }}
                  autoComplete="off"
                  placeholder={carregandoClientes ? "Carregando clientes..." : "Digite pelo menos 3 letras..."}
                  disabled={carregandoClientes}
                />
                {showSugest && (
                  <ul style={{ position: 'absolute', top: 22, left: 90, width: 345, background: '#fff', border: '1px solid #bbb', borderRadius: '0 0 4px 4px', zIndex: 10, listStyle: 'none', margin: 0, padding: 0, maxHeight: 120, overflowY: 'auto' }}>
                    {erroClientes && (
                      <li style={{ padding: 6, color: '#c40000' }}>{erroClientes}</li>
                    )}
                    {!erroClientes && (clienteSugest || contrato.cliente || '').length < 3 && (
                      <li style={{ padding: 6, color: '#888', fontStyle: 'italic' }}>Digite pelo menos 3 letras para buscar clientes</li>
                    )}
                    {!erroClientes && carregandoClientes && (
                      <li style={{ padding: 6, color: '#1976d2', fontStyle: 'italic' }}>Buscando clientes...</li>
                    )}
                    {!erroClientes && !carregandoClientes && (clienteSugest || contrato.cliente || '').length >= 3 && clientes.map(c => {
                      const nome = c.Nome || c.nome || '';
                      const endereco = c.Endereco || c.endereco || '';
                      const numero = c.Nro || c.nro || '';
                      const bairro = c.BairrosNome || c.bairrosnome || c.Bairros_SRV_BairrosNome || '';
                      const enderecoCompleto = `${endereco}${numero ? ', ' + numero : ''}${bairro ? ' - ' + bairro : ''}`;
                      
                      console.log('🏠 Cliente renderizando:', { nome, endereco, numero, bairro, enderecoCompleto, cliente: c });
                      
                      return (
                        <li 
                          key={c.id || c.ID || nome} 
                          style={{ 
                            padding: 8, 
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0'
                          }} 
                          onMouseDown={(e) => {
                            e.preventDefault(); // Previne que o input perca o foco
                            handleClienteSelect(c);
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{nome}</div>
                          {enderecoCompleto && (
                            <div style={{ fontSize: 10, color: '#1976d2', marginTop: 2 }}>{enderecoCompleto}</div>
                          )}
                        </li>
                      );
                    })}
                    {!erroClientes && !carregandoClientes && (clienteSugest || contrato.cliente || '').length >= 3 && clientes.length === 0 && (
                      <li style={{ padding: 6, color: '#888' }}>Nenhum cliente encontrado</li>
                    )}
                  </ul>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>OBS</label>
                <input value={contrato.obs} onChange={handleObsChange} style={{ width: 345, borderRadius: 3, height: 22, fontSize: 14 }} placeholder="Observações..." />
              </div>
            </div>
          </fieldset>
          <fieldset style={{ border: '1px solid #bbb', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', padding: 0, margin: '16px 0 0 0', width: 480, minWidth: 480, maxWidth: 480, boxSizing: 'border-box', minHeight: 'auto', height: 'auto' }}>
            <legend style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 12 }}><FaFileSignature style={{ marginRight: 6 }} /> Plano de Pagamento</legend>
            <div style={{ padding: 8, boxSizing: 'border-box', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>Plano</label>
                <select value={contrato.plano} onChange={handlePlanoChange} style={{ flex: 1, borderRadius: 3, marginRight: 15, height: 22, fontSize: 14 }}>
                  {planos.map(p => (
                    <option key={p.nome} value={p.nome}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>Valor</label>
                <input value={contrato.valor} onChange={handleValorChange} style={{ width: 100, borderRadius: 3, marginRight: 10, height: 22, fontSize: 14 }} />
                <label style={{ width: 40, textAlign: 'right', marginRight: 8 }}>Dias</label>
                <input value={contrato.dias} onChange={handleDiasChange} style={{ width: 40, borderRadius: 3, marginRight: 10, height: 22, fontSize: 14 }} />
                <label style={{ width: 40, textAlign: 'right', marginRight: 8 }}>Juros</label>
                <input value={contrato.juros} onChange={handleJurosChange} style={{ width: 60, borderRadius: 3, height: 22, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>Total</label>
                <input value={contrato.valorTotal} style={{ width: 100, color: '#1976d2', fontWeight: 'bold', borderRadius: 3, marginRight: 10, height: 22, fontSize: 14 }} readOnly />
                <label style={{ width: 60, textAlign: 'right', marginRight: 8 }}>Dt. Final</label>
                <input value={contrato.dataFinal} style={{ width: 100, borderRadius: 3, height: 22, fontSize: 14 }} readOnly />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ width: 90 }}>V. Parc</label>
                <input value={contrato.valorParcela} style={{ width: 340, color: '#388e3c', fontWeight: 'bold', borderRadius: 3, height: 22, fontSize: 14 }} readOnly />
              </div>
              <div style={{ marginTop: 8, marginBottom: 20 }}>
                <span style={{ fontWeight: 'bold', fontSize: 13 }}>Dias que realiza a cobrança</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {['Sábado', 'Domingo', 'Feriado', 'Mensal', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(dia => (
                    <label key={dia} style={{ fontSize: 13 }}>
                      <input type="checkbox" checked={contrato.diasCobranca.includes(dia)} onChange={() => handleDiaCobrancaChange(dia)} /> {dia}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>
        </div>
        {/* Direita: Vencimentos */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', height: '100%', alignSelf: 'stretch' }}>
          <fieldset style={{ border: '1px solid #bbb', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', padding: 12, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <legend style={{ fontWeight: 'bold', fontSize: 16 }}>Vencimentos</legend>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13, tableLayout: 'fixed', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 8, overflow: 'hidden', background: '#fff', minHeight: 180 }}>
                <thead>
                  <tr style={{ background: '#e3f0fc', color: '#1976d2', fontWeight: 600 }}>
                    <th style={{ width: 38 }}>Parc.</th>
                    <th style={{ width: 70 }}>Vencto</th>
                    <th style={{ width: 60 }}>Valor</th>
                    <th style={{ width: 90 }}>Dia Semana</th>
                    <th style={{ width: 70 }}>Vl.Recebido</th>
                    <th style={{ width: 38 }}>Pgto</th>
                    <th style={{ width: 38 }}>Quitar</th>
                    <th style={{ width: 38 }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {vencimentos.map((v, i) => (
                    <tr
                      key={i}
                      onClick={() => setLinhaSelecionada(i)}
                      style={{
                        background: linhaSelecionada === i
                          ? '#d1e7fd'
                          : v.quitado
                            ? '#c8f7c5'
                            : i % 2 === 0
                              ? '#f0f0f0'
                              : '#e0e0e0',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        borderRadius: i === 0 ? '8px 8px 0 0' : i === vencimentos.length - 1 ? '0 0 8px 8px' : 0,
                        boxShadow: linhaSelecionada === i ? '0 2px 8px rgba(25, 118, 210, 0.08)' : 'none',
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: 2, borderRight: '1px solid #e0e0e0' }}>{v.parcela}</td>
                      <td style={{ textAlign: 'center', padding: 2, borderRight: '1px solid #e0e0e0' }}>{v.vencimento}</td>
                      <td style={{ textAlign: 'right', padding: 2, borderRight: '1px solid #e0e0e0' }}>{v.valor}</td>
                      <td style={{ textAlign: 'center', padding: 2, borderRight: '1px solid #e0e0e0' }}>{v.diaSemana}</td>
                      <td style={{ textAlign: 'right', padding: 2, borderRight: '1px solid #e0e0e0' }}>{v.recebido}</td>
                      <td style={{ textAlign: 'center', padding: 2, borderRight: '1px solid #e0e0e0' }}>
                        <FaMoneyBillWave className="icon-action" color="#388e3c" style={{ cursor: 'pointer' }} title="Pagamento" />
                      </td>
                      <td style={{ textAlign: 'center', padding: 2, borderRight: '1px solid #e0e0e0' }}>
                        <FaCheck className="icon-action" color="#1976d2" style={{ cursor: 'pointer' }} title="Quitar" />
                      </td>
                      <td style={{ textAlign: 'center', padding: 2 }}>
                        <FaTrash className="icon-action" color="#c40000" style={{ cursor: 'pointer' }} title="Excluir" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button className="btn-salvar" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#1976d2', color: '#fff', border: '1px solid #1565c0', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaCalendarAlt /> Calcular dias</button>
              <button className="btn-quitar" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#008000', color: '#fff', border: '1px solid #005700', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaCheck /> Quitar Todas</button>
            </div>
          </fieldset>
        </div>
      </div>
      {/* Botões de ação */}
      <footer style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 9, width: '100%', justifyContent: 'center' }}>
        <button className="btn-novo" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#008000', color: '#fff', border: '1px solid #005700', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaPlus /> Novo</button>
        <button className="btn-salvar" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#1976d2', color: '#fff', border: '1px solid #1565c0', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaSave /> Salvar</button>
        <button className="btn-fechar" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#bbb', color: '#fff', border: '1px solid #888', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaTimes /> Fechar</button>
        <button className="btn-imprimir" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaPrint /> Imprimir</button>
        <button className="btn-excluir" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#c40000', color: '#fff', border: '1px solid #7a0000', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaTrash /> Excluir</button>
        <button className="btn-comodato" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#ffe0b2', color: '#b26a00', border: '1px solid #ffb74d', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaFileAlt /> Comodato</button>
        <button className="btn-confissao" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#ffe0b2', color: '#b26a00', border: '1px solid #ffb74d', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaFileAlt /> Confissão</button>
        <button className="btn-promissoria" style={{ minWidth: 100, justifyContent: 'center', padding: '8px 12px', background: '#ffe0b2', color: '#b26a00', border: '1px solid #ffb74d', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(.4,0,.2,1)' }}><FaFileAlt /> Promissória</button>
        </div>
      </footer>
      <style>{`
        .icon-action {
          transition: transform 0.15s, filter 0.15s;
        }
        .icon-action:hover {
          transform: scale(1.2);
          filter: brightness(1.3);
        }
        tr.selected, tr:active {
          background: #d1e7fd !important;
        }
        table tr:hover td {
          background: #e3f0fc !important;
        }
        .btn-novo:hover, .btn-salvar:hover, .btn-fechar:hover, .btn-imprimir:hover, .btn-excluir:hover, .btn-comodato:hover, .btn-confissao:hover, .btn-promissoria:hover, .btn-quitar:hover {
          transform: scale(1.06);
        }
        button {
          transition: all 0.15s cubic-bezier(.4,0,.2,1);
        }
        input[type="text"], select {
          background: #f8fafc;
          border: 1px solid #b0b8c1;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03) inset;
          outline: none;
          transition: border 0.15s, box-shadow 0.15s;
        }
        input[type="text"]:focus, select:focus {
          border: 1.5px solid #1976d2;
          box-shadow: 0 0 0 2px #e3f0fc;
        }
      `}</style>
    </div>
  );
} 