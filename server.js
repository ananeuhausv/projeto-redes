// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const TEMPO_RODADA = 15; // 15 segundos por rodada

// ---- FUNÇÃO PARA OBTER IP LOCAL ----
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIp();
console.log(`IP detectado: ${LOCAL_IP}`);

// ---- CHARADAS ----
const charadas = [
  { pergunta: "O que é, o que é: Uma corda que toca, mas não tem braço?", resposta: "O violão", opcoes: ["O piano", "O violão", "O microfone", "O tambor"] },
  { pergunta: "O que é, o que é: Tem orelhas, mas só escuta o silêncio?", resposta: "O fone de ouvido", opcoes: ["O rádio", "O maestro", "O fone de ouvido", "O amplificador"] },
  { pergunta: "O que é, o que é: Um som que tem clave, mas não abre porta?", resposta: "A nota musical", opcoes: ["A partitura", "A letra da música", "O baixo", "A nota musical"] },
  { pergunta: "O que é, o que é: Serve para marcar o tempo, mas não é relógio?", resposta: "O metrônomo", opcoes: ["O tímpano", "O relógio de pulso", "O metrônomo", "O compasso"] }
];

const salas = {};

function gerarPin() {
  let pin;
  do {
    pin = Math.floor(10000 + Math.random() * 90000).toString();
  } while (salas[pin]);
  return pin;
}

app.use(express.static('public'));

function emitirLobbyAtualizado(pin) {
  const sala = salas[pin];
  if (!sala) return;

  const jogadoresArray = Object.keys(sala.jogadores).map(id => ({
    id, nome: sala.jogadores[id].nome, pontos: sala.jogadores[id].pontos
  }));

  io.to(pin).emit('atualizar_lobby', jogadoresArray);
}

// --- TIMER E FINALIZAÇÃO DA RODADA ---
function iniciarTimer(pin) {
    const sala = salas[pin];
    if (!sala) return;

    let tempoRestante = TEMPO_RODADA;
    
    // Limpa qualquer timer anterior
    if (sala.timerInterval) {
        clearInterval(sala.timerInterval);
    }
    
    sala.timerInterval = setInterval(() => {
        io.to(pin).emit('timer_tick', tempoRestante);
        
        if (tempoRestante <= 0) {
            clearInterval(sala.timerInterval);
            delete sala.timerInterval;
            
            // Rodada finalizada sem vencedor
            if (!sala.charadaAtual.vencedor) {
                 io.to(pin).emit('vencedor_rodada', {
                    vencedorId: null,
                    mensagem: `O tempo acabou! A resposta era: ${sala.charadaAtual.resposta}`,
                    placar: Object.keys(sala.jogadores).map(id => sala.jogadores[id])
                });
            }
            
            // Inicia a próxima rodada após o delay de visualização
            setTimeout(() => iniciarNovaRodada(pin), 5000);
            
        }
        tempoRestante--;
    }, 1000);
}


function iniciarNovaRodada(pin) {
  const sala = salas[pin];
  if (!sala) return;

  const charada = charadas[Math.floor(Math.random() * charadas.length)];

  sala.charadaAtual = {
    pergunta: charada.pergunta,
    resposta: charada.resposta,
    vencedor: null
  };

  io.to(pin).emit('nova_charada', {
    pergunta: charada.pergunta,
    opcoes: charada.opcoes
  });
    
    // Inicia o timer para a nova rodada
    iniciarTimer(pin);
}

// ---- SOCKETS ----
io.on('connection', (socket) => {
  console.log("Usuário conectado:", socket.id);
  let usuarioPin = null;

  socket.on('definir_nome_jogador', (nome) => {
    socket.data.nome = nome.trim() || `Jogador ${socket.id.substring(0, 4)}`;
    socket.emit('nome_definido', socket.data.nome);
  });

  // Criar sala
  socket.on('criar_sala', () => {
    const pin = gerarPin();
    const nomeHost = socket.data.nome || `Host ${socket.id.substring(0, 4)}`;

    salas[pin] = {
      hostId: socket.id,
      jogadores: { [socket.id]: { nome: nomeHost, pontos: 0 } },
      charadaAtual: null,
            timerInterval: null, // Novo: Referência ao Timer
      status: 'LOBBY'
    };

    socket.join(pin);
    usuarioPin = pin;

    socket.emit('sala_criada', { pin, hostId: socket.id, ip: LOCAL_IP });
    emitirLobbyAtualizado(pin);
  });

  // Jogador entrando na sala
  socket.on('entrar_sala', (pin) => {
    const sala = salas[pin];
    if (!sala || sala.status !== 'LOBBY')
      return socket.emit('erro_sala', 'PIN inválido ou sala já iniciou.');

    const nomeJogador = socket.data.nome || `Jogador ${socket.id.substring(0, 4)}`;

    socket.join(pin);
    usuarioPin = pin;

    sala.jogadores[socket.id] = { nome: nomeJogador, pontos: 0 };

    socket.emit('entrou_sala', { pin });
    emitirLobbyAtualizado(pin);
  });

  // Iniciar jogo
  socket.on('iniciar_jogo', (pin) => {
    const sala = salas[pin];
    if (sala && sala.hostId === socket.id) {
      sala.status = 'IN_GAME';
      io.to(pin).emit('jogo_iniciado');
      iniciarNovaRodada(pin);
    }
  });

  // Tentativa de resposta
  socket.on('tentativa_resposta', ({ pin, resposta }) => {
    const sala = salas[pin];
    if (!sala || !sala.charadaAtual) return;

    const jogador = sala.jogadores[socket.id];
    if (!jogador) return;

    if (resposta.trim().toLowerCase() === sala.charadaAtual.resposta.toLowerCase()) {
      if (sala.charadaAtual.vencedor) return;
            
            // Parar o timer ao acertar!
            if (sala.timerInterval) {
                clearInterval(sala.timerInterval);
                delete sala.timerInterval;
            }

      sala.charadaAtual.vencedor = socket.id;
      jogador.pontos++;

      const jogadoresArray = Object.keys(sala.jogadores).map(id => ({
        id, nome: sala.jogadores[id].nome, pontos: sala.jogadores[id].pontos
      }));

      io.to(pin).emit('vencedor_rodada', {
        vencedorId: socket.id,
        mensagem: `🎉 ${jogador.nome} acertou! Resposta: ${sala.charadaAtual.resposta}`,
        placar: jogadoresArray
      });

      setTimeout(() => iniciarNovaRodada(pin), 5000);

    } else {
      socket.emit('feedback_resposta', "Resposta incorreta! Tente outra.");
    }
  });

  socket.on('disconnect', () => {
    if (!usuarioPin) return;

    const sala = salas[usuarioPin];
    if (!sala) return;

        // Limpa o timer se o host cair
        if (sala.hostId === socket.id && sala.timerInterval) {
            clearInterval(sala.timerInterval);
        }

    delete sala.jogadores[socket.id];

    if (sala.hostId === socket.id) {
      delete salas[usuarioPin];
      io.to(usuarioPin).emit("jogo_encerrado", "Host desconectou. Jogo encerrado.");
    } else {
      emitirLobbyAtualizado(usuarioPin);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://${LOCAL_IP}:${PORT}`);
});