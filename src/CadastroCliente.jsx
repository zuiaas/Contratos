import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaSave, FaTimes, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function CadastroCliente({ cliente }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [carregando, setCarregando] = useState(false);
  const [token, setToken] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const isEdicao = !!id;

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    tel: "",
    endereco: "",
    bairro: "",
    cidade: "",
    uf: "",
  });

  // Buscar token de autenticação
  useEffect(() => {
    async function getToken() {
      try {
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
      } catch (err) {
        console.error("Erro ao obter token:", err);
      }
    }
    getToken();
  }, []);

  // Buscar dados do cliente se estiver em modo de edição
  useEffect(() => {
    async function buscarCliente() {
      if (!token || !id) return;

      setCarregando(true);
      try {
        const clienteRes = await fetch(`http://financeiro.vstec.net/clientes/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!clienteRes.ok) throw new Error("Falha ao buscar cliente");
        const data = await clienteRes.json();
        setClienteData(data);

        // Preencher o formulário com os dados do cliente
        setForm({
          nome: data.Nome || "",
          cpf: data.CPF || "",
          tel: data.Telefone || "",
          endereco: data.Endereco || "",
          bairro: data.BairrosNome || "",
          cidade: data.Cidade || "",
          uf: data.UF || "",
        });
      } catch (err) {
        console.error("Erro ao buscar cliente:", err);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Falha ao carregar dados do cliente'
        });
      } finally {
        setCarregando(false);
      }
    }
    buscarCliente();
  }, [token, id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    Swal.fire({
      icon: 'success',
      title: 'Sucesso',
      text: isEdicao ? 'Cliente atualizado com sucesso!' : 'Cliente salvo com sucesso!'
    });
    navigate("/clientes");
  }

  function handleCancel() {
    navigate("/clientes");
  }

  async function handleDelete() {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não poderá ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c40000',
      cancelButtonColor: '#bbb',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    if (result.isConfirmed) {
      navigate('/clientes');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Cliente excluído com sucesso!',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }
  }

  if (carregando) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Carregando dados do cliente...</p>
      </div>
    );
  }

  return (
    <div className="p-6 font-sans max-w-5xl mx-auto pb-24">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Home</Link>
        <span className="text-slate-400">/</span>
        <Link to="/clientes" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Lista Clientes</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium">{isEdicao ? 'Editar Cliente' : 'Cadastro de Cliente'}</span>
      </nav>

      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
          {isEdicao ? <FaEdit /> : <FaPlus />}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isEdicao ? 'Editar Cliente' : 'Cadastro de Cliente'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bloco 1: Dados da Empresa */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <h2 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Dados da Empresa</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Nome/Razão Social</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">CPF/CNPJ</label>
                  <input type="text" name="cpf" value={form.cpf} onChange={handleChange} required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Telefone</label>
                  <input type="text" name="tel" value={form.tel} onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Endereço</label>
                <input type="text" name="endereco" value={form.endereco} onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Bairro</label>
                  <input type="text" name="bairro" value={form.bairro} onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Cidade</label>
                  <input type="text" name="cidade" value={form.cidade} onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">UF</label>
                  <input type="text" name="uf" value={form.uf} onChange={handleChange} maxLength={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 2: Responsável */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h2 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Responsável</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Nome do Responsável</label>
                <input type="text" name="responsavel"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">CPF do Responsável</label>
                <input type="text" name="cpfResp"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Endereço</label>
                <input type="text" name="enderecoResp"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Bairro</label>
                  <input type="text" name="bairroResp"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">Cidade</label>
                  <input type="text" name="cidadeResp"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1">UF</label>
                  <input type="text" name="ufResp" maxLength={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-80 z-40 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FaTimes /> Cancelar
          </button>

          {isEdicao && (
            <button type="button" onClick={handleDelete}
              className="px-5 py-2.5 rounded-xl border border-transparent bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <FaTrash /> Excluir
            </button>
          )}

          <button type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
          >
            <FaSave /> {isEdicao ? 'Atualizar Dados' : 'Salvar Cadastro'}
          </button>
        </div>
      </form>

      {/* Footer spacer */}
      <div className="h-16"></div>
    </div>
  );
} 