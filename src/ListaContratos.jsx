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
    <div className="p-6 font-sans max-w-[1600px] mx-auto pb-32">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Home</a>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium">Lista Contratos</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
          <FaFileAlt />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Gestão de Contratos
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* LEFTSIDE: General Info & Payment Plan */}
        <div className="xl:col-span-5 space-y-6">

          {/* General Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <h2 className="font-semibold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-2">
                <FaFileAlt className="text-slate-400" /> Informações Gerais
              </h2>
            </div>

            <div className="p-5 space-y-3 text-sm">
              {/* Row 1 */}
              <div className="flex items-center gap-2">
                <label className="w-20 font-medium text-slate-600 text-right">Contrato</label>
                <input
                  value={contrato.numero}
                  readOnly
                  className="w-24 text-center text-red-600 font-bold bg-red-50 border border-red-100 rounded px-2 py-1.5 focus:outline-none"
                />
                <label className="w-12 font-medium text-slate-600 text-right">Inc.</label>
                <input
                  value={contrato.dataLanc}
                  readOnly
                  className="flex-1 bg-slate-100 border border-slate-200 text-slate-500 rounded px-2 py-1.5 focus:outline-none text-xs"
                />
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-2">
                <label className="w-20 font-medium text-slate-600 text-right">ID</label>
                <input
                  value={clienteId}
                  readOnly
                  className="w-24 bg-slate-100 border border-slate-200 text-slate-500 rounded px-2 py-1.5 focus:outline-none"
                />
                <label className="w-12 font-medium text-slate-600 text-right">Data</label>
                <input
                  value={contrato.dataContrato}
                  readOnly
                  className="flex-1 border border-slate-200 text-slate-700 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Row 3 - Cliente Search */}
              <div className="flex items-start gap-2 relative z-20">
                <label className="w-20 font-medium text-slate-600 text-right mt-2">Cliente</label>
                <div className="flex-1 relative">
                  <div className="relative">
                    <input
                      ref={clienteInputRef}
                      value={clienteSugest || contrato.cliente}
                      onChange={handleClienteChange}
                      onFocus={() => setShowSugest((clienteSugest || contrato.cliente || '').length >= 3)}
                      onBlur={handleClienteBlur}
                      onKeyDown={handleClienteKeyDown}
                      autoComplete="off"
                      placeholder={carregandoClientes ? "Buscando..." : "Digite o nome..."}
                      disabled={carregandoClientes}
                      className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder-slate-400 transition-shadow"
                    />
                    {carregandoClientes && (
                      <div className="absolute right-2 top-2">
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Sugestões */}
                  {showSugest && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-50">
                      {erroClientes && (
                        <li className="px-4 py-3 text-red-500 text-xs">{erroClientes}</li>
                      )}
                      {!erroClientes && (clienteSugest || contrato.cliente || '').length < 3 && (
                        <li className="px-4 py-3 text-slate-400 text-xs italic">Digite mais letras...</li>
                      )}
                      {!erroClientes && !carregandoClientes && (clienteSugest || contrato.cliente || '').length >= 3 && clientes.map(c => {
                        const nome = c.Nome || c.nome || '';
                        const endereco = c.Endereco || c.endereco || '';
                        const numero = c.Nro || c.nro || '';
                        const bairro = c.BairrosNome || c.bairrosnome || c.Bairros_SRV_BairrosNome || '';
                        const enderecoCompleto = `${endereco}${numero ? ', ' + numero : ''}${bairro ? ' - ' + bairro : ''}`;

                        return (
                          <li
                            key={c.id || c.ID || nome}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleClienteSelect(c);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors group"
                          >
                            <div className="font-medium text-slate-700 group-hover:text-blue-700 text-sm">{nome}</div>
                            {enderecoCompleto && (
                              <div className="text-[10px] text-slate-400 group-hover:text-blue-500">{enderecoCompleto}</div>
                            )}
                          </li>
                        );
                      })}
                      {!erroClientes && !carregandoClientes && (clienteSugest || contrato.cliente || '').length >= 3 && clientes.length === 0 && (
                        <li className="px-4 py-3 text-slate-500 text-xs">Nenhum cliente encontrado.</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Row 4 - OBS */}
              <div className="flex items-center gap-2">
                <label className="w-20 font-medium text-slate-600 text-right">OBS</label>
                <input
                  value={contrato.obs}
                  onChange={handleObsChange}
                  placeholder="Observações..."
                  className="flex-1 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Payment Plan Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h2 className="font-semibold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-2">
                <FaFileSignature className="text-slate-400" /> Plano de Pagamento
              </h2>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <label className="w-20 font-medium text-slate-600 text-right">Plano</label>
                <select
                  value={contrato.plano}
                  onChange={handlePlanoChange}
                  className="flex-1 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                >
                  {planos.map(p => (
                    <option key={p.nome} value={p.nome}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="w-20 font-medium text-slate-600 text-right">Valor</label>
                <input
                  value={contrato.valor}
                  onChange={handleValorChange}
                  className="w-24 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700"
                />

                <label className="w-10 font-medium text-slate-600 text-right">Dias</label>
                <input
                  value={contrato.dias}
                  onChange={handleDiasChange}
                  className="w-16 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 text-center"
                />

                <label className="w-10 font-medium text-slate-600 text-right">Juros</label>
                <input
                  value={contrato.juros}
                  onChange={handleJurosChange}
                  className="w-20 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 text-right"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="w-20 font-medium text-slate-600 text-right">Total</label>
                <input
                  value={contrato.valorTotal}
                  readOnly
                  className="w-24 font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1.5 focus:outline-none text-right"
                />

                <label className="w-16 font-medium text-slate-600 text-right">Dt. Final</label>
                <input
                  value={contrato.dataFinal}
                  readOnly
                  className="w-24 bg-slate-50 border border-slate-200 text-slate-600 rounded px-2 py-1.5 focus:outline-none text-center"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 font-medium text-slate-600 text-right">V. Parc</label>
                <input
                  value={contrato.valorParcela}
                  readOnly
                  className="flex-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                <span className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Dias de Cobrança</span>
                <div className="flex flex-wrap gap-2">
                  {['Sábado', 'Domingo', 'Feriado', 'Mensal', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(dia => (
                    <label key={dia} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={contrato.diasCobranca.includes(dia)}
                        onChange={() => handleDiaCobrancaChange(dia)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-slate-600 select-none">{dia}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHTSIDE: Installments (Vencimentos) */}
        <div className="xl:col-span-7 h-full flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <h2 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Vencimentos</h2>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors">
                  <FaCalendarAlt /> Calcular
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors">
                  <FaCheck /> Quitar Todas
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-3 py-3 text-center border-b border-slate-200 w-12">Parc.</th>
                    <th className="px-3 py-3 text-center border-b border-slate-200">Vencto</th>
                    <th className="px-3 py-3 text-right border-b border-slate-200">Valor</th>
                    <th className="px-3 py-3 text-center border-b border-slate-200">Dia Semana</th>
                    <th className="px-3 py-3 text-right border-b border-slate-200">Recebido</th>
                    <th className="px-3 py-3 text-center border-b border-slate-200 w-10">Pgto</th>
                    <th className="px-3 py-3 text-center border-b border-slate-200 w-10">Baixa</th>
                    <th className="px-3 py-3 text-center border-b border-slate-200 w-10">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {vencimentos.map((v, i) => {
                    let rowClass = "hover:bg-slate-50 transition-colors";
                    if (v.quitado) rowClass = "bg-green-50/60 hover:bg-green-100/60 text-green-800";
                    if (linhaSelecionada === i) rowClass = "bg-blue-50 hover:bg-blue-100 text-blue-900";

                    return (
                      <tr
                        key={i}
                        onClick={() => setLinhaSelecionada(i)}
                        className={`cursor-pointer ${rowClass}`}
                      >
                        <td className="px-3 py-2 text-center text-slate-500 font-mono text-xs">{v.parcela}</td>
                        <td className="px-3 py-2 text-center font-medium">{v.vencimento}</td>
                        <td className="px-3 py-2 text-right font-mono">{v.valor}</td>
                        <td className="px-3 py-2 text-center text-xs uppercase opacity-80">{v.diaSemana}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600 font-medium">{v.recebido}</td>

                        <td className="px-3 py-2 text-center">
                          <button className="p-1 rounded hover:bg-emerald-200 text-emerald-600 transition-colors" title="Boleto / Pagamento">
                            <FaMoneyBillWave />
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button className="p-1 rounded hover:bg-blue-200 text-blue-600 transition-colors" title="Quitar">
                            <FaCheck />
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button className="p-1 rounded hover:bg-red-200 text-red-500 transition-colors" title="Excluir">
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-80 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Primary Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap">
              <FaPlus /> Novo
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap">
              <FaSave /> Salvar
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors whitespace-nowrap">
              <FaTimes /> Fechar
            </button>
          </div>

          {/* Secondary / Docs Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 justify-end hide-scrollbar">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm transition-colors whitespace-nowrap">
              <FaPrint /> Imprimir
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 rounded-lg font-medium text-sm transition-colors whitespace-nowrap">
              <FaFileAlt /> Comodato
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 rounded-lg font-medium text-sm transition-colors whitespace-nowrap">
              <FaFileAlt /> Confissão
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 rounded-lg font-medium text-sm transition-colors whitespace-nowrap">
              <FaFileAlt /> Promissória
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-colors whitespace-nowrap">
              <FaTrash /> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 