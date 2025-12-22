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
    <div style={{ overflow: 'hidden' }}>
      <nav style={{ marginBottom: 20, fontSize: '1rem' }}>
        <Link to="/">Home</Link>
        <span style={{ margin: '0 8px' }}>{'>'}</span>
        <Link to="/clientes">Lista Clientes</Link>
        <span style={{ margin: '0 8px' }}>{'>'}</span>
        <span>{isEdicao ? 'Editar Cliente' : 'Cadastro de Cliente'}</span>
      </nav>
      <h1>{isEdicao ? 'Editar Cliente' : 'Cadastro de Cliente'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'flex-start', margin: '0 auto', maxWidth: 1100 }}>
        {/* Bloco 1: Dados da Empresa */}
        <fieldset style={{ flex: 1, minWidth: 340, maxWidth: 480, border: '1px solid #bbb', borderRadius: 10, padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <legend style={{ fontWeight: 'bold', fontSize: 16, color: '#1976d2' }}>DADOS DA EMPRESA</legend>
          <label>Nome/Razão Social:<input type="text" name="nome" value={form.nome} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>CPF/CNPJ:<input type="text" name="cpf" value={form.cpf} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Telefone:<input type="text" name="tel" value={form.tel} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Endereço:<input type="text" name="endereco" value={form.endereco} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Bairro:<input type="text" name="bairro" value={form.bairro} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Cidade:<input type="text" name="cidade" value={form.cidade} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>UF:<input type="text" name="uf" value={form.uf} onChange={handleChange} maxLength={2} style={{ width: 60, marginBottom: 8 }} /></label>
        </fieldset>
        {/* Bloco 2: Responsável/Localização */}
        <fieldset style={{ flex: 1, minWidth: 340, maxWidth: 480, border: '1px solid #bbb', borderRadius: 10, padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <legend style={{ fontWeight: 'bold', fontSize: 16, color: '#1976d2' }}>RESPONSÁVEL</legend>
          <label>Responsável:<input type="text" name="responsavel" style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>CPF:<input type="text" name="cpfResp" style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Endereço:<input type="text" name="enderecoResp" style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Bairro:<input type="text" name="bairroResp" style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>Cidade:<input type="text" name="cidadeResp" style={{ width: '100%', marginBottom: 8 }} /></label>
          <label>UF:<input type="text" name="ufResp" maxLength={2} style={{ width: 60, marginBottom: 8 }} /></label>
        </fieldset>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" onClick={handleCancel} className="btn-cancelar">
            <FaTimes /> Cancelar
          </button>
          <button type="submit" className="btn-salvar">
            <FaSave /> {isEdicao ? 'Atualizar' : 'Salvar'}
          </button>
          {isEdicao && (
            <button type="button" onClick={handleDelete} className="btn-excluir">
              <FaTrash /> Excluir
            </button>
          )}
        </div>
      </form>
      <style>{`
        .btn-salvar, .btn-cancelar, .btn-excluir {
          padding: 10px 24px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid;
          transition: all 0.15s cubic-bezier(.4,0,.2,1);
        }
        .btn-salvar {
          background: #1976d2;
          color: #fff;
          border-color: #1565c0;
        }
        .btn-salvar:hover {
          background: #1976ff;
          color: #fff;
          transform: scale(1.06);
        }
        .btn-cancelar {
          background: #bbb;
          color: #fff;
          border-color: #888;
        }
        .btn-cancelar:hover {
          background: #e0e0e0;
          color: #333;
          transform: scale(1.06);
        }
        .btn-excluir {
          background: #c40000;
          color: #fff;
          border-color: #7a0000;
        }
        .btn-excluir:hover {
          background: #ff3333;
          color: #fff;
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
} 