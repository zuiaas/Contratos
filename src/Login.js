import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";

export default function Login() {
  const navigate = useNavigate();
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
        background: "#fff3cd",
        color: "#856404",
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
      background: "#d1ecf1",
      color: "#0c5460",
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
        background: "#d4edda",
        color: "#155724",
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
        background: "#f8d7da",
        color: "#721c24",
        iconColor: "#dc3545"
      });
    }
    
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#f5f5f5",
      fontFamily: "'Segoe UI', Arial, sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "40px",
        width: "400px",
        maxWidth: "90vw",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "30px"
        }}>
          <div style={{
            position: "relative",
            width: "50px",
            height: "50px",
            marginRight: "15px"
          }}>
            {/* Círculo externo com gradiente */}
            <div style={{
              width: "100%",
              height: "100%",
              background: "conic-gradient(from 0deg, #e3f2fd, #bbdefb, #90caf9, #64b5f6, #42a5f5, #2196f3, #1e88e5, #1976d2, #1565c0, #0d47a1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              {/* Círculo interno */}
              <div style={{
                width: "35px",
                height: "35px",
                background: "linear-gradient(135deg, #00bcd4, #2196f3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}>
                {/* Silhueta de pessoa */}
                <div style={{
                  width: "20px",
                  height: "20px",
                  position: "relative"
                }}>
                  {/* Cabeça */}
                  <div style={{
                    width: "12px",
                    height: "12px",
                    background: "#fff",
                    borderRadius: "50%",
                    position: "absolute",
                    top: "0px",
                    left: "4px"
                  }} />
                  {/* Corpo */}
                  <div style={{
                    width: "8px",
                    height: "12px",
                    background: "#fff",
                    borderRadius: "4px 4px 0 0",
                    position: "absolute",
                    bottom: "0px",
                    left: "6px"
                  }} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            <span style={{ 
              background: "linear-gradient(135deg, #00bcd4, #2196f3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>Login</span>
          </div>
        </div>

        {/* Subtítulo */}
        <p style={{
          textAlign: "center",
          color: "#666",
          marginBottom: "30px",
          fontSize: "16px"
        }}>
          Entre com sua conta
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Campo Usuário */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#333",
              fontWeight: "500"
            }}>
              Usuário
            </label>
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}>
              <FaUser style={{
                position: "absolute",
                left: "12px",
                color: "#999",
                fontSize: "16px"
              }} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                placeholder="Digite seu usuário"
                onFocus={(e) => e.target.style.borderColor = "#2196f3"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#333",
              fontWeight: "500"
            }}>
              Senha
            </label>
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}>
              <FaLock style={{
                position: "absolute",
                left: "12px",
                color: "#999",
                fontSize: "16px"
              }} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 40px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                placeholder="Digite sua senha"
                onFocus={(e) => e.target.style.borderColor = "#2196f3"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "none",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                  fontSize: "16px"
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Checkbox Lembrar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "25px"
          }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              style={{
                marginRight: "8px",
                transform: "scale(1.2)"
              }}
            />
            <label htmlFor="remember" style={{
              color: "#666",
              fontSize: "14px",
              cursor: "pointer"
            }}>
              Lembrar
            </label>
          </div>

          {/* Botão Login */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              background: isLoading ? "#ccc" : "#333",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.3s"
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.background = "#555")}
            onMouseOut={(e) => !isLoading && (e.target.style.background = "#333")}
          >
            {isLoading ? "Entrando..." : "Login"}
          </button>
        </form>

        {/* Link Esqueci minha senha */}
        <div style={{
          textAlign: "center",
          marginTop: "20px"
        }}>
          <a href="#" style={{
            color: "#2196f3",
            textDecoration: "underline",
            fontSize: "14px"
          }}>
            Esqueci minha senha
          </a>
        </div>

        {/* Ícones Android */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          display: "flex",
          gap: "8px"
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            background: "#000",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "10px",
            fontFamily: "monospace"
          }}>
            <div style={{
              width: "16px",
              height: "16px",
              position: "relative"
            }}>
              {/* Cabeça do Android */}
              <div style={{
                width: "12px",
                height: "8px",
                background: "#fff",
                borderRadius: "6px 6px 0 0",
                position: "absolute",
                top: "0px",
                left: "2px"
              }} />
              {/* Antenas */}
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                top: "-2px",
                left: "3px"
              }} />
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                top: "-2px",
                right: "3px"
              }} />
              {/* Olhos */}
              <div style={{
                width: "2px",
                height: "2px",
                background: "#000",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: "3px"
              }} />
              <div style={{
                width: "2px",
                height: "2px",
                background: "#000",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                right: "3px"
              }} />
              {/* Corpo */}
              <div style={{
                width: "10px",
                height: "8px",
                background: "#fff",
                borderRadius: "0 0 4px 4px",
                position: "absolute",
                bottom: "0px",
                left: "3px"
              }} />
              {/* Braços */}
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                bottom: "2px",
                left: "1px"
              }} />
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                bottom: "2px",
                right: "1px"
              }} />
              {/* Pernas */}
              <div style={{
                width: "2px",
                height: "3px",
                background: "#fff",
                position: "absolute",
                bottom: "-1px",
                left: "4px"
              }} />
              <div style={{
                width: "2px",
                height: "3px",
                background: "#fff",
                position: "absolute",
                bottom: "-1px",
                right: "4px"
              }} />
            </div>
          </div>
          <div style={{
            width: "24px",
            height: "24px",
            background: "#4caf50",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "10px",
            fontFamily: "monospace"
          }}>
            <div style={{
              width: "16px",
              height: "16px",
              position: "relative"
            }}>
              {/* Cabeça do Android */}
              <div style={{
                width: "12px",
                height: "8px",
                background: "#fff",
                borderRadius: "6px 6px 0 0",
                position: "absolute",
                top: "0px",
                left: "2px"
              }} />
              {/* Antenas */}
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                top: "-2px",
                left: "3px"
              }} />
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                top: "-2px",
                right: "3px"
              }} />
              {/* Olhos */}
              <div style={{
                width: "2px",
                height: "2px",
                background: "#000",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: "3px"
              }} />
              <div style={{
                width: "2px",
                height: "2px",
                background: "#000",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                right: "3px"
              }} />
              {/* Corpo */}
              <div style={{
                width: "10px",
                height: "8px",
                background: "#fff",
                borderRadius: "0 0 4px 4px",
                position: "absolute",
                bottom: "0px",
                left: "3px"
              }} />
              {/* Braços */}
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                bottom: "2px",
                left: "1px"
              }} />
              <div style={{
                width: "2px",
                height: "4px",
                background: "#fff",
                position: "absolute",
                bottom: "2px",
                right: "1px"
              }} />
              {/* Pernas */}
              <div style={{
                width: "2px",
                height: "3px",
                background: "#fff",
                position: "absolute",
                bottom: "-1px",
                left: "4px"
              }} />
              <div style={{
                width: "2px",
                height: "3px",
                background: "#fff",
                position: "absolute",
                bottom: "-1px",
                right: "4px"
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 