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
    <div className="p-6 md:p-10 max-w-4xl mx-auto font-sans">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
          </div>
          WhatsApp Web
        </h1>
        <p className="text-slate-500 text-lg">Gerencie a conexão e envie mensagens</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Actions Toolbar */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 md:p-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={handleGenerateQRCode}
            disabled={isLoading}
            className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95
                        ${isLoading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"}
                    `}
          >
            {isLoading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Gerando...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Gerar QR Code</>
            )}
          </button>

          <button
            onClick={handleCheckConnection}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition-all transform active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Verificar Conexão
          </button>

          <button
            onClick={setupWebhook}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 transition-all transform active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            Configurar Webhook
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-8 md:p-10 space-y-8">

          {/* 1. Timer */}
          {isTimerRunning && (
            <div className="flex justify-center">
              <div className={`px-6 py-2 rounded-full font-mono font-bold text-lg flex items-center gap-2 border ${timeLeft <= 5 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-orange-50 text-orange-600 border-orange-200"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Tempo restante: {formatTime(timeLeft)}
              </div>
            </div>
          )}

          {/* 2. Status Alert */}
          {connectionStatus && (
            <div className={`w-full max-w-2xl mx-auto p-4 rounded-xl border flex items-center gap-4 shadow-sm ${connectionStatus.includes("✅") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <div className={`p-2 rounded-full shrink-0 ${connectionStatus.includes("✅") ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {connectionStatus.includes("✅") ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide opacity-80 mb-0.5">Status da Conexão</h4>
                <p className="font-semibold text-lg">{connectionStatus}</p>
              </div>
            </div>
          )}

          {/* 3. Error Alert */}
          {error && (
            <div className="w-full max-w-2xl mx-auto p-5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <div>
                  <h4 className="font-bold text-lg mb-1">Erro Encontrado</h4>
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-red-100/50 p-2 rounded border border-red-200">{error}</pre>
                </div>
              </div>
            </div>
          )}

          {/* 4. QR Code Display */}
          {qrCodeData && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-slate-100 text-center max-w-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Escaneie o QR Code</h3>

                {qrCodeData.startsWith('🖼️ Imagem PNG') && qrCodeData.includes('data:image') ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <img
                      src={qrCodeData.split('\n\n')[1]}
                      alt="QR Code WhatsApp"
                      className="relative block w-full rounded-lg border-2 border-slate-100"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs break-all border border-slate-200 text-slate-600 overflow-y-auto max-h-64">
                    {qrCodeData}
                  </div>
                )}

                <p className="mt-4 text-sm text-slate-500 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Aguardando leitura...
                </p>
              </div>
            </div>
          )}


          {/* 5. Message Form (Only if connected) */}
          {isConnected ? (
            <div className="max-w-xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.506-.669-.514-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.084 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                  Enviar Mensagem Direta
                </h4>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Número do Telefone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">55</span>
                    </div>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ex: 6792858638 (apenas números)"
                      className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-shadow bg-white font-mono text-lg"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    * Não precisa adicionar 55 ou código de país.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    rows="4"
                    className="block w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-shadow bg-white resize-y"
                  />
                </div>

                <button
                  onClick={handleSendTestMessage}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  Enviar Mensagem
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-amber-800 mb-2">WhatsApp Desconectado</h4>
              <p className="text-amber-700">
                Por favor, clique em <span className="font-bold">Gerar QR Code</span> acima e escaneie com seu celular para conectar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 