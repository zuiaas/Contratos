import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ListaClientes from "./ListaClientes";
import CadastroCliente from "./CadastroCliente";
import ListaContratos from "./ListaContratos";
import ListaPlanosPagamentos from "./ListaPlanosPagamentos";
import WhatsApp from "./WhatsApp";
import Login from "./Login";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

function useWindowWidth() {
	const [width, setWidth] = useState(window.innerWidth);
	useEffect(() => {
		const handleResize = () => setWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
	return width;
}

// Componente para rotas protegidas
function ProtectedRoute({ children }) {
	const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
	return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
	const [collapsed, setCollapsed] = useState(false);
	const width = useWindowWidth();
	const isMobile = width <= 768;
	const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

	return (
		<Router>
			{!isLoggedIn ? (
				// Mostrar apenas o login se não estiver logado
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			) : (
				// Mostrar a aplicação principal se estiver logado
				<div className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
					<Sidebar onCollapse={setCollapsed} />
					<div
						className="main-content"
						style={{
						marginTop: isMobile ? 60 : 0,
						padding: 30,
						transition: "margin-top 0.3s"
						}}
					>
						<Routes>
							<Route path="/" element={
								<ProtectedRoute>
									<>
									<h1>Bem-vindo ao sistema de Contratos</h1>
									<p>Selecione uma opção no menu lateral.</p>
									</>
								</ProtectedRoute>
							} />
							<Route path="/login" element={<Navigate to="/" replace />} />
							<Route path="/clientes" element={
								<ProtectedRoute>
									<ListaClientes collapsed={collapsed} isMobile={isMobile} />
								</ProtectedRoute>
							} />
							<Route path="/clientes/cadastro" element={
								<ProtectedRoute>
									<CadastroCliente />
								</ProtectedRoute>
							} />
							<Route path="/clientes/editar/:id" element={
								<ProtectedRoute>
									<CadastroCliente />
								</ProtectedRoute>
							} />
							<Route path="/contratos" element={
								<ProtectedRoute>
									<ListaContratos />
								</ProtectedRoute>
							} />
							<Route path="/whatsapp" element={
								<ProtectedRoute>
									<WhatsApp />
								</ProtectedRoute>
							} />
							<Route path="/planos-pagamentos" element={
								<ProtectedRoute>
									<ListaPlanosPagamentos />
								</ProtectedRoute>
							} />
							<Route path="/planos-pagamentos/cadastro" element={
								<ProtectedRoute>
									<div style={{ padding: '20px' }}>
										<h2>Cadastro de Plano de Pagamento</h2>
										<p>Formulário de cadastro será implementado aqui.</p>
									</div>
								</ProtectedRoute>
							} />
							<Route path="/planos-pagamentos/editar/:id" element={
								<ProtectedRoute>
									<div style={{ padding: '20px' }}>
										<h2>Edição de Plano de Pagamento</h2>
										<p>Formulário de edição será implementado aqui.</p>
									</div>
								</ProtectedRoute>
							} />
						</Routes>
					</div>
				</div>
			)}
		</Router>
	);
}

export default App;