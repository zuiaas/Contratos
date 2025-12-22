const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3001;

// Habilitar CORS para o React
app.use(cors());

// Middleware para processar JSON
app.use(express.json());

// Rota proxy para o WhatsApp
app.get('/api/whatsapp/conecta', async (req, res) => {
  try {
    console.log('🔍 Recebendo requisição para /api/whatsapp/conecta');
    console.log('📋 Headers recebidos:', req.headers);
    console.log('🌐 Fazendo requisição para: http://middleware.vstec.net/conecta');
    
    const response = await fetch('http://middleware.vstec.net/conecta', {
      method: 'GET',
      headers: {
        'Accept': 'application/json, image/png, */*',
        'X-QUEPASA-USER': 'cleitinhojt@gmail.com',
        'X-QUEPASA-TOKEN': 'CONTRATOS_K'
      }
    });
    
    console.log('📊 Resposta da API externa:', response.status, response.statusText);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type da resposta:', contentType);
      
      if (contentType && contentType.includes('image/png')) {
        console.log('🖼️ API retornou uma imagem PNG');
        const buffer = await response.buffer();
        res.set('Content-Type', 'image/png');
        res.send(buffer);
      } else if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Resposta da API (JSON):', data);
        res.json(data);
      } else {
        const text = await response.text();
        console.log('📝 Resposta da API (texto):', text.substring(0, 200));
        res.set('Content-Type', 'text/plain');
        res.send(text);
      }
    } else {
      console.log('❌ Erro da API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 Conteúdo do erro:', errorText);
      
      // Retornar erro mais detalhado
      res.status(response.status).json({ 
        error: errorText,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    }
  } catch (error) {
    console.error('💥 Erro no proxy:', error);
    console.error('💥 Stack trace:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
  }
});

// Rota proxy para verificação de conexão
app.get('/api/whatsapp/verificaconexao', async (req, res) => {
  try {
    console.log('🔍 Recebendo requisição para /api/whatsapp/verificaconexao');
    console.log('🌐 Fazendo requisição para: http://middleware.vstec.net/verificaconexao');
    
    const response = await fetch('http://middleware.vstec.net/verificaconexao', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-QUEPASA-TOKEN': 'CONTRATOS_K'
      }
    });
    
    console.log('📊 Resposta da API externa:', response.status, response.statusText);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type da resposta:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Resposta da API (JSON):', data);
        res.json(data);
      } else {
        const text = await response.text();
        console.log('📝 Resposta da API (texto):', text);
        res.set('Content-Type', 'text/plain');
        res.send(text);
      }
    } else {
      console.log('❌ Erro da API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 Conteúdo do erro:', errorText);
      
      res.status(response.status).json({ 
        error: errorText,
        status: response.status,
        statusText: response.statusText
      });
    }
  } catch (error) {
    console.error('💥 Erro no proxy:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// Rota proxy para envio de mensagem
app.post('/api/whatsapp/enviarmsg', async (req, res) => {
  try {
    console.log('📤 Recebendo requisição para /api/whatsapp/enviarmsg');
    console.log('📋 Body recebido:', req.body);
    console.log('🌐 Fazendo requisição para: http://middleware.vstec.net/enviarmsg');
    
    const response = await fetch('http://middleware.vstec.net/enviarmsg', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'TOKEN': 'CONTRATOS_K'
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('📊 Resposta da API externa:', response.status, response.statusText);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type da resposta:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Resposta da API (JSON):', data);
        res.json(data);
      } else {
        const text = await response.text();
        console.log('📝 Resposta da API (texto):', text);
        res.set('Content-Type', 'text/plain');
        res.send(text);
      }
    } else {
      console.log('❌ Erro da API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 Conteúdo do erro:', errorText);
      
      res.status(response.status).json({ 
        error: errorText,
        status: response.status,
        statusText: response.statusText
      });
    }
  } catch (error) {
    console.error('💥 Erro no proxy:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Proxy funcionando!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy rodando em http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/whatsapp/scan`);
  console.log(`🧪 Teste: http://localhost:${PORT}/test`);
});

console.log(`
🔧 INSTRUÇÕES:
1. Instale as dependências: npm install express cors node-fetch
2. Execute: node proxy-server.js
3. No React, use: 
   - http://localhost:3001/api/whatsapp/conecta (para QR code)
   - http://localhost:3001/api/whatsapp/verificaconexao (para verificar conexão)
   - http://localhost:3001/api/whatsapp/enviarmsg (para enviar mensagens)
4. O proxy resolve problemas de CORS com o middleware.vstec.net
`);
