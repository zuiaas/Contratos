import React, { useState, useEffect, useRef } from "react";
import Swal from 'sweetalert2';

/*
 * FLUXO DE CONEXÃO WHATSAPP:
 * 1. Ao entrar no formulário: verifica se já está conectado
 * 2. Ao gerar QR Code: inicia timer 20s + verificação a cada 3s
 * 3. Ao conectar: configura webhook imediatamente + verificação estendida por 9s
 * 4. Se conectar em qualquer instante: configura webhook automaticamente
 * 5. Formulário só aparece quando isConnected = true
 */

export default function WhatsApp() {
  const [qrCodeData, setQrCodeData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageText, setMessageText] = useState("");
  const timerRef = useRef(null);
  const connectionCheckRef = useRef(null);

  // Função para verificar o status da conexão WhatsApp
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch("https://apiwpp.vstec.net/health", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-QUEPASA-USER': 'cleitinhojt@gmail.com',
          'X-QUEPASA-PASSWORD': '159753*VsWPP'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.items && data.items.length > 0) {
          const item = data.items[0];
          if (item.status === "Ready") {
            // Se conectou, parar timer e remover QR Code
            clearTimerAndQRCode();
            
            // Configurar webhook imediatamente
            console.log("✅ WhatsApp conectou, configurando webhook...");
            setupWebhook();
            
            // Iniciar verificação adicional por mais 9 segundos
            startExtendedConnectionCheck();
            return true;
          } else {
            // Não mostrar status durante as tentativas, apenas em caso de erro real
            return false;
          }
        } else {
          // Não mostrar status durante as tentativas, apenas em caso de erro real
          return false;
        }
      } else {
        // Só mostrar erro se for um erro real (não durante tentativas normais)
        if (!isTimerRunning) {
          setConnectionStatus(`❌ Erro na verificação: ${response.status}`);
        }
        return false;
      }
    } catch (error) {
      // Só mostrar erro se for um erro real (não durante tentativas normais)
      if (!isTimerRunning) {
        setConnectionStatus(`❌ Erro de conexão: ${error.message}`);
      }
      return false;
    }
  };

  // Função para verificação estendida após QR Code sumir
  const startExtendedConnectionCheck = () => {
    let checkCount = 0;
    const maxChecks = 3; // 9 segundos / 3 segundos = 3 verificações
    
    setConnectionStatus("🔍 Verificando conexão...");
    
    const extendedCheck = setInterval(async () => {
      checkCount++;
      console.log(`🔍 Verificação estendida ${checkCount}/${maxChecks}`);
      
      try {
        const response = await fetch("https://apiwpp.vstec.net/health", {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-QUEPASA-USER': 'cleitinhojt@gmail.com',
            'X-QUEPASA-PASSWORD': '159753*VsWPP'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.items && data.items.length > 0) {
            const item = data.items[0];
            if (item.status === "Ready") {
              console.log("✅ Conexão confirmada, configurando webhook...");
              clearInterval(extendedCheck);
              setupWebhook();
              return;
            }
          }
        }
        
        // Se chegou ao limite de verificações
        if (checkCount >= maxChecks) {
          clearInterval(extendedCheck);
          setConnectionStatus("✅ WhatsApp conectado!");
          setIsConnected(true);
          console.log("✅ Verificação estendida concluída");
        }
        
      } catch (error) {
        console.log("❌ Erro na verificação estendida:", error.message);
        if (checkCount >= maxChecks) {
          clearInterval(extendedCheck);
          setConnectionStatus("✅ WhatsApp conectado!");
          setIsConnected(true);
        }
      }
    }, 3000); // Verificar a cada 3 segundos
  };

  // Função para limpar timer e QR Code
  const clearTimerAndQRCode = () => {
    setIsTimerRunning(false);
    setQrCodeData("");
    setTimeLeft(20);
    
    // Limpar o timer de verificação de conexão
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
      connectionCheckRef.current = null;
    }
  };

  // Função para verificar conexão manualmente
  const handleCheckConnection = async () => {
    try {
      setConnectionStatus("🔍 Verificando conexão...");
      console.log("🔍 Verificação manual de conexão...");
      
      const response = await fetch("https://apiwpp.vstec.net/health", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-QUEPASA-USER': 'cleitinhojt@gmail.com',
          'X-QUEPASA-PASSWORD': '159753*VsWPP'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.items && data.items.length > 0) {
          const item = data.items[0];
          if (item.status === "Ready") {
            console.log("✅ WhatsApp conectado e funcionando!");
            setConnectionStatus("✅ WhatsApp conectado e funcionando!");
            setIsConnected(true);
            
            // SweetAlert de sucesso
            Swal.fire({
              title: 'Conectado!',
              text: 'WhatsApp está conectado e funcionando',
              icon: 'success',
              confirmButtonText: 'OK'
            });
          } else {
            console.log("⚠️ WhatsApp não está pronto:", item.status);
            setConnectionStatus(`⚠️ WhatsApp não está pronto: ${item.status}`);
            setIsConnected(false);
            
            // SweetAlert de aviso
            Swal.fire({
              title: 'Não Conectado',
              text: `WhatsApp não está pronto: ${item.status}`,
              icon: 'warning',
              confirmButtonText: 'OK'
            });
          }
        } else {
          console.log("⚠️ Nenhum item encontrado na API");
          setConnectionStatus("⚠️ Nenhum item encontrado na API");
          setIsConnected(false);
          
          // SweetAlert de aviso
          Swal.fire({
            title: 'Não Conectado',
            text: 'Nenhum item encontrado na API',
            icon: 'warning',
            confirmButtonText: 'OK'
          });
        }
      } else {
        console.log("❌ Erro na verificação:", response.status);
        setConnectionStatus(`❌ Erro na verificação: ${response.status}`);
        setIsConnected(false);
        
        // SweetAlert de erro
        Swal.fire({
          title: 'Erro na Verificação',
          text: `Erro HTTP: ${response.status}`,
          icon: 'error',
          confirmButtonText: 'OK'
          });
      }
    } catch (error) {
      console.log("❌ Erro de conexão:", error.message);
      setConnectionStatus(`❌ Erro de conexão: ${error.message}`);
      setIsConnected(false);
      
      // SweetAlert de erro
      Swal.fire({
        title: 'Erro de Conexão',
        text: `Erro: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Função para configurar webhook após conexão
  const setupWebhook = async () => {
    try {
      console.log("🔗 Configurando webhook...");
      console.log("📡 URL da API:", "https://apiwpp.vstec.net/v3/bot/CONTRATOS_K/webhook");
      console.log("📋 Body do webhook:", {
        url: "http://financeiro.vstec.net/webhooks/webhook",
        forwardinternal: true
      });
      
      const webhookBody = {
        url: "http://financeiro.vstec.net/webhooks/webhook",
        forwardinternal: true
      };
      
      const response = await fetch("https://apiwpp.vstec.net/v3/bot/CONTRATOS_K/webhook", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookBody)
      });

      console.log("📊 Resposta do webhook:", response.status, response.statusText);
      console.log("📋 Headers da resposta:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Webhook configurado com sucesso:", data);
        setConnectionStatus("✅ WhatsApp conectado e webhook configurado!");
        setIsConnected(true);
        
        // SweetAlert de sucesso
        Swal.fire({
          title: 'Webhook Configurado!',
          text: 'Webhook configurado com sucesso!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        const errorText = await response.text();
        console.log("❌ Falha ao configurar webhook:", response.status, errorText);
        setConnectionStatus("✅ WhatsApp conectado, mas falha ao configurar webhook");
        setIsConnected(true);
        
        // SweetAlert de erro
        Swal.fire({
          title: 'Erro no Webhook',
          text: `Falha ao configurar webhook: ${response.status} - ${errorText}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.log("❌ Erro ao configurar webhook:", error.message);
      setConnectionStatus("✅ WhatsApp conectado, mas erro ao configurar webhook");
      
      // SweetAlert de erro
      Swal.fire({
        title: 'Erro de Conexão',
        text: `Erro ao configurar webhook: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Timer decrescente
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      clearTimerAndQRCode();
      
      // Verificação final após o timer acabar
      setTimeout(() => {
        checkConnectionStatus();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timeLeft]);

  // Verificação de conexão a cada 3 segundos
  useEffect(() => {
    if (isTimerRunning && qrCodeData) {
      // Primeira verificação após 3 segundos
      connectionCheckRef.current = setInterval(() => {
        checkConnectionStatus();
      }, 3000);
    }

    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
        connectionCheckRef.current = null;
      }
    };
  }, [isTimerRunning, qrCodeData]);

  // Verificação inicial de conexão ao entrar no formulário
  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        console.log("🔍 Verificando conexão inicial...");
        const response = await fetch("http://localhost:3001/api/whatsapp/verificaconexao", {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Resposta da verificação inicial:", data);
          
          // Se retornou status: 1 e data.success: true e server.verified: true, está conectado
          if (data && data.status === 1 && data.data && data.data.success === true && data.data.server && data.data.server.verified === true) {
            console.log("✅ WhatsApp já está conectado!");
            setIsConnected(true);
            setConnectionStatus("✅ WhatsApp conectado e funcionando!");
          } else if (data && data.status === 0) {
            console.log("❌ WhatsApp desconectado - status 0");
            setIsConnected(false);
          } else {
            console.log("⚠️ WhatsApp não está pronto");
            setIsConnected(false);
          }
        } else {
          console.log("❌ Erro na verificação inicial:", response.status);
          setIsConnected(false);
        }
      } catch (error) {
        console.log("❌ Erro na verificação inicial:", error.message);
        setIsConnected(false);
      }
    };

    // Verificar conexão ao montar o componente
    checkInitialConnection();
  }, []);

  // Função para verificar se já está conectado
  const checkIfAlreadyConnected = async () => {
    try {
      console.log("🔍 Verificando se já está conectado...");
      
      const response = await fetch("http://localhost:3001/api/whatsapp/verificaconexao", {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Resposta da verificação:", data);
        
        // Se retornou 1, não está conectado
        if (data === 1) {
          console.log("❌ Não está conectado (retorno: 1)");
          return false;
        }
        
        // Se retornou status: 0, está desconectado
        if (data && data.status === 0) {
          console.log("❌ Desconectado - status 0:", data.message);
          return false;
        }
        
        // Se retornou status: 1 e data.success: true e server.verified: true, está conectado
        if (data && data.status === 1 && data.data && data.data.success === true && data.data.server && data.data.server.verified === true) {
          console.log("✅ Já está conectado! (status: 1, verified: true)");
          console.log("📱 WID:", data.data.server.wid);
          console.log("👤 User:", data.data.server.user);
          console.log("🔗 Webhooks:", data.data.server.webhooks);
          
          // Verificar se webhook já está configurado
          const webhookExists = data.data.server.webhooks && data.data.server.webhooks.some(
            webhook => webhook.url === "http://financeiro.vstec.net/webhooks/webhook"
          );
          
          if (webhookExists) {
            console.log("✅ Webhook já está configurado");
            setConnectionStatus("✅ WhatsApp conectado e webhook configurado!");
          } else {
            console.log("⚠️ Webhook não configurado, configurando...");
            setConnectionStatus("✅ WhatsApp conectado! Configurando webhook...");
            await setupWebhook();
          }
          
          setIsConnected(true);
          return true;
        }
        
        // Se retornou JSON com success: true e server.verified: true (formato antigo)
        if (data && data.success === true && data.server && data.server.verified === true) {
          console.log("✅ Já está conectado! (verified: true - formato antigo)");
          console.log("📱 WID:", data.server.wid);
          console.log("👤 User:", data.server.user);
          console.log("🔗 Webhooks:", data.server.webhooks);
          
          // Verificar se webhook já está configurado
          const webhookExists = data.server.webhooks && data.server.webhooks.some(
            webhook => webhook.url === "http://financeiro.vstec.net/webhooks/webhook"
          );
          
          if (webhookExists) {
            console.log("✅ Webhook já está configurado");
            setConnectionStatus("✅ WhatsApp conectado e webhook configurado!");
          } else {
            console.log("⚠️ Webhook não configurado, configurando...");
            setConnectionStatus("✅ WhatsApp conectado! Configurando webhook...");
            await setupWebhook();
          }
          
          setIsConnected(true);
          return true;
        }
        
        // Se retornou JSON mas verified: false, não está conectado
        if ((data && data.data && data.data.server && data.data.server.verified === false) || 
            (data && data.server && data.server.verified === false)) {
          console.log("❌ Não está conectado (verified: false)");
          return false;
        }
        
        console.log("⚠️ Resposta inesperada:", data);
        return false;
      } else {
        console.log("❌ Erro na verificação:", response.status);
        return false;
      }
    } catch (error) {
      console.log("❌ Erro ao verificar conexão:", error.message);
      return false;
    }
  };

  const handleGenerateQRCode = async () => {
    setIsLoading(true);
    setError("");
    setQrCodeData("");
    setConnectionStatus("");
    setTimeLeft(20);
    setIsTimerRunning(false);
    setIsConnected(false);
    
    // Limpar qualquer verificação de conexão anterior
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
      connectionCheckRef.current = null;
    }
    
    // PRIMEIRO: Verificar se já está conectado
    const alreadyConnected = await checkIfAlreadyConnected();
    if (alreadyConnected) {
      setIsLoading(false);
      return; // Se já está conectado, não precisa gerar QR code
    }
    
    try {
      console.log("🔍 Solicitando QR Code via proxy local...");
      
      const response = await fetch("http://localhost:3001/api/whatsapp/conecta", {
        method: 'GET',
        headers: {
          'Accept': 'application/json, image/png, */*'
        }
      });
      
      console.log("📊 Resposta do middleware:", response.status, response.statusText);
      
      if (response.ok) {
        console.log("✅ Requisição bem-sucedida!");
        
        // Processar resposta bem-sucedida
        const contentType = response.headers.get('content-type');
        console.log("📋 Content-Type:", contentType);
        console.log("📋 Todos os headers da resposta:", Object.fromEntries(response.headers.entries()));
        
        if (contentType && contentType.includes('image/png')) {
          console.log("🖼️ API retornou uma imagem PNG");
          
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onload = () => {
            const base64data = reader.result;
            setQrCodeData(`🖼️ Imagem PNG recebida da API\n\n${base64data}`);
            setError("");
            setIsTimerRunning(true);
          };
          
          reader.readAsDataURL(blob);
          
        } else if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log("✅ API respondeu com JSON:", data);
          
          if (data && data.qrcode) {
            setQrCodeData(data.qrcode);
            setError("");
            setIsTimerRunning(true);
          } else {
            setError("⚠️ API respondeu com JSON, mas sem QR Code na resposta");
          }
        } else {
          const text = await response.text();
          console.log("📝 Resposta em texto:", text.substring(0, 100));
          
          if (text.includes('qrcode') || text.includes('QR') || text.includes('PNG')) {
            setQrCodeData(`📝 Resposta da API:\n\n${text.substring(0, 500)}...`);
            setError("");
            setIsTimerRunning(true);
          } else {
            setError(`⚠️ API respondeu com tipo não reconhecido: ${contentType}\n\nConteúdo: ${text.substring(0, 200)}...`);
          }
        }
        
      } else {
        const errorText = await response.text();
        console.log("❌ Erro na requisição:", response.status, errorText);
        setError(`❌ Erro na API: ${response.status} - ${errorText}`);
        
        // SweetAlert de erro
        Swal.fire({
          title: 'Erro na API',
          text: `Erro: ${response.status} - ${errorText}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
      
    } catch (error) {
      console.log("❌ Erro de conexão:", error.message);
      setError(`❌ Erro de conexão: ${error.message}`);
      
      // SweetAlert de erro
      Swal.fire({
        title: 'Erro de Conexão',
        text: `Erro: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
    
    setIsLoading(false);
  };

  // Função para enviar mensagem de teste
  const handleSendTestMessage = async () => {
    try {
      // Validar campos obrigatórios
      if (!phoneNumber.trim()) {
        Swal.fire({
          title: 'Atenção!',
          text: 'Digite o número do telefone',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }

      if (!messageText.trim()) {
        Swal.fire({
          title: 'Atenção!',
          text: 'Digite a mensagem',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }

      console.log("📤 Enviando mensagem via middleware...");
      
      // Compor o chatid concatenando 55 + número + @s.whatsapp.net
      const chatid = `55${phoneNumber.trim()}@s.whatsapp.net`;
      console.log("📱 ChatID composto:", chatid);
      
      // Usar o novo endpoint via proxy
      const response = await fetch("http://localhost:3001/api/whatsapp/enviarmsg", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatid: chatid,
          text: messageText.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Resposta do middleware:", data);
        
        if (data.success) {
          console.log("✅ Mensagem enviada com sucesso:", data);
          // SweetAlert de sucesso
          Swal.fire({
            title: 'Sucesso!',
            text: 'Mensagem enviada com sucesso!',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          console.log("❌ Falha na API:", data);
          // SweetAlert de erro
          Swal.fire({
            title: 'Erro!',
            text: data.message || 'Falha ao enviar mensagem',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } else {
        const errorData = await response.json();
        console.log("❌ Erro HTTP:", response.status, errorData);
        // SweetAlert de erro
        Swal.fire({
          title: 'Erro!',
          text: errorData.error || `Erro HTTP: ${response.status}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
      
    } catch (error) {
      console.log("❌ Erro de conexão:", error.message);
      // SweetAlert de erro
      Swal.fire({
        title: 'Erro!',
        text: `Erro de conexão: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Formatar tempo para exibição
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>WhatsApp QR Code</h1>
      
      <button
        onClick={handleGenerateQRCode}
        disabled={isLoading}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: isLoading ? "#ccc" : "#25d366",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isLoading ? "not-allowed" : "pointer",
          marginBottom: "20px",
          marginRight: "10px"
        }}
      >
        {isLoading ? "Gerando..." : "Gerar QR Code"}
      </button>

      <button
        onClick={handleCheckConnection}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#17a2b8",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px",
          marginRight: "10px"
        }}
      >
        🔍 Verificar Conexão
      </button>

      <button
        onClick={setupWebhook}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#6f42c1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        🔗 Configurar Webhook
      </button>



      {/* Formulário de envio de mensagem - Só mostra quando conectado */}
      {isConnected ? (
        <div style={{
          margin: "20px auto",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
          maxWidth: "500px",
          textAlign: "left"
        }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#495057", textAlign: "center" }}>
            📱 Enviar Mensagem WhatsApp
          </h4>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "5px", 
              fontWeight: "bold",
              color: "#495057"
            }}>
              📞 Número do Telefone:
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 6792858638 (apenas números)"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
            <small style={{ color: "#6c757d", fontSize: "12px" }}>
              Digite apenas os números (será adicionado 55 + @s.whatsapp.net automaticamente)
            </small>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "5px", 
              fontWeight: "bold",
              color: "#495057"
            }}>
              💬 Mensagem:
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleSendTestMessage}
              style={{
                padding: "12px 25px",
                fontSize: "16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              🚀 Enviar Mensagem
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          margin: "20px auto",
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          border: "2px solid #ffc107",
          maxWidth: "500px",
          textAlign: "center"
        }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#856404" }}>
            ⚠️ WhatsApp não conectado
          </h4>
          <p style={{ margin: "0", color: "#856404" }}>
            Conecte o WhatsApp via QR Code para poder enviar mensagens
          </p>
        </div>
      )}

      {/* Timer simples em linha */}
      {isTimerRunning && (
        <div style={{
          margin: "10px 0",
          fontSize: "16px",
          color: timeLeft <= 5 ? "#f44336" : "#ff9800",
          fontWeight: "bold"
        }}>
          ⏰ Tempo restante: {formatTime(timeLeft)}
        </div>
      )}

      {/* Status da conexão */}
      {connectionStatus && (
        <div style={{
          margin: "20px auto",
          padding: "15px",
          backgroundColor: connectionStatus.includes("✅") ? "#d4edda" : "#f8d7da",
          borderRadius: "8px",
          border: `2px solid ${connectionStatus.includes("✅") ? "#28a745" : "#dc3545"}`,
          maxWidth: "600px",
          textAlign: "center"
        }}>
          <h4 style={{ 
            margin: "0 0 10px 0", 
            color: connectionStatus.includes("✅") ? "#155724" : "#721c24" 
          }}>
            📡 Status da Conexão
          </h4>
          <p style={{ 
            margin: "0", 
            fontSize: "16px", 
            fontWeight: "bold",
            color: connectionStatus.includes("✅") ? "#155724" : "#721c24" 
          }}>
            {connectionStatus}
          </p>
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          backgroundColor: "#f8d7da", 
          color: "#721c24", 
          borderRadius: "8px", 
          border: "1px solid #f5c6cb",
          textAlign: "left",
          maxWidth: "600px",
          margin: "20px auto"
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>❌ Erro</h4>
          <pre style={{ 
            margin: 0, 
            whiteSpace: "pre-wrap", 
            fontFamily: "inherit",
            fontSize: "14px"
          }}>
            {error}
          </pre>
        </div>
      )}

      {qrCodeData && (
        <div style={{ marginTop: "20px" }}>
          <h3>QR Code Gerado:</h3>
          
          {/* Verificar se é uma imagem base64 */}
          {qrCodeData.startsWith('🖼️ Imagem PNG') && qrCodeData.includes('data:image') ? (
            <div style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
              textAlign: "center"
            }}>
              <img 
                src={qrCodeData.split('\n\n')[1]} 
                alt="QR Code WhatsApp" 
                style={{
                  maxWidth: "300px",
                  height: "auto",
                  border: "2px solid #25d366",
                  borderRadius: "8px"
                }}
              />
              <p style={{ 
                marginTop: "10px", 
                fontSize: "14px", 
                color: "#666",
                fontStyle: "italic"
              }}>
                ✅ Imagem PNG recebida diretamente da API
              </p>
            </div>
          ) : (
            <div style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
              fontFamily: "monospace",
              fontSize: "14px",
              wordBreak: "break-all",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              {qrCodeData}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 