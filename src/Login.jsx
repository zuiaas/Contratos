import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import { useTheme } from "./useTheme";
import ThemeToggle from "./ThemeToggle";

export default function Login() {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.username.trim() || !formData.password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos obrigatórios",
        text: "Por favor, preencha todos os campos.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: theme === 'dark' ? "#1e293b" : "#fff3cd",
        color: theme === 'dark' ? "#fbbf24" : "#856404",
        iconColor: "#ffc107"
      });
      return;
    }

    setIsLoading(true);

    // Mostrar loading
    Swal.fire({
      title: "Fazendo login...",
      text: "Aguarde um momento",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: theme === 'dark' ? "#1e293b" : "#d1ecf1",
      color: theme === 'dark' ? "#60a5fa" : "#0c5460",
      iconColor: "#17a2b8",
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    console.log("Tentativa de login:", formData);

    // Validação das credenciais
    if (formData.username === "Cleiton" && formData.password === "12345") {
      console.log("Login bem-sucedido!");

      // Simular delay para melhor UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fechar loading e mostrar sucesso
      Swal.fire({
        icon: "success",
        title: "Login realizado com sucesso!",
        text: "Redirecionando...",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: theme === 'dark' ? "#1e293b" : "#d4edda",
        color: theme === 'dark' ? "#4ade80" : "#155724",
        iconColor: "#28a745"
      });

      // Login bem-sucedido
      localStorage.setItem("isLoggedIn", "true");
      if (rememberMe) {
        localStorage.setItem("rememberedUser", formData.username);
      }
      // Forçar atualização da página para garantir que o App.jsx detecte a mudança
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } else {
      console.log("Credenciais inválidas");

      // Fechar loading e mostrar erro
      Swal.fire({
        icon: "error",
        title: "Erro no login",
        text: "Usuário ou senha incorretos. Tente novamente.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: theme === 'dark' ? "#1e293b" : "#f8d7da",
        color: theme === 'dark' ? "#f87171" : "#721c24",
        iconColor: "#dc3545"
      });
    }

    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans p-4 transition-colors duration-200">
      {/* Theme Toggle - Posição fixa no canto superior direito */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      {/* Glass Card */}
      <div className="glass-strong rounded-xl shadow-lg w-full max-w-md p-8 md:p-10 transform transition-all hover:scale-[1.01] duration-300 border border-white/40 dark:border-white/10">

        {/* Logo Area */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative w-20 h-20 mb-5 group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-full h-full bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <FaUser className="text-primary text-3xl" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo
          </h2>
          <p className="text-muted-foreground text-sm text-center">
            Entre com suas credenciais para acessar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground ml-1">Usuário</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FaUser className="text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                className="input pl-10"
                placeholder="Seu nome de usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FaLock className="text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="input pl-10 pr-10"
                placeholder="Sua senha secreta"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary dark:bg-card cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Lembrar
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Esqueceu a senha?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`btn-primary w-full py-3 shadow-md
              ${isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : "Entrar no Sistema"}
          </button>
        </form>

        {/* Footer hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/80">
            Sistema de Gestão de Contratos VSTec
          </p>
        </div>
      </div>
    </div>
  );
} 