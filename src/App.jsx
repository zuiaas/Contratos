import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ListaClientes from "./ListaClientes";
import CadastroCliente from "./CadastroCliente";
import ListaContratos from "./ListaContratos";
import ListaPlanosPagamentos from "./ListaPlanosPagamentos";
import WhatsApp from "./WhatsApp";
import Login from "./Login";
import { useTheme } from "./useTheme";
// import "./App.css"; // Removed as we are using Tailwind now
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
	const [theme, toggleTheme] = useTheme(); // Hook de tema
	const width = useWindowWidth();
	const isMobile = width <= 768;
	const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

	return (
		<Router>
			{!isLoggedIn ? (
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			) : (
				<div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-200">
					{/* Sidebar is fixed, so we don't need it in the flex flow necessarily, but Sidebar component handles its positioning */}
					<Sidebar onCollapse={setCollapsed} theme={theme} toggleTheme={toggleTheme} />

					{/* Main Content Area */}
					<div
						className={`flex-1 transition-all duration-300 ease-in-out px-4 py-6 md:px-8 md:py-8 ${isMobile
							? "mt-16 w-full"
							: collapsed ? "ml-20" : "ml-72"
							}`}
					>
						<Routes>
							<Route path="/" element={
								<ProtectedRoute>
									<div className="max-w-4xl">
										<div className="card p-8">
											<h1 className="text-3xl font-bold text-foreground mb-4 w-fit">
												Bem-vindo ao Sistema VSTec
											</h1>
											<p className="text-muted-foreground text-lg leading-relaxed">
												Selecione uma opção no menu lateral para começar a gerenciar seus contratos, clientes e pagamentos de forma eficiente.
											</p>
										</div>
									</div>
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
									<div className="card p-6">
										<h2 className="text-2xl font-bold text-foreground mb-4">Cadastro de Plano de Pagamento</h2>
										<p className="text-muted-foreground">Formulário de cadastro será implementado aqui.</p>
									</div>
								</ProtectedRoute>
							} />
							<Route path="/planos-pagamentos/editar/:id" element={
								<ProtectedRoute>
									<div className="card p-6">
										<h2 className="text-2xl font-bold text-foreground mb-4">Edição de Plano de Pagamento</h2>
										<p className="text-muted-foreground">Formulário de edição será implementado aqui.</p>
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