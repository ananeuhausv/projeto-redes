// public/client.js (COMPLETO)
const socket = io();

// ELEMENTOS
const socketIdDisplay = document.getElementById('socket-id');
const playerNameDisplay = document.getElementById('player-name-display');

const nameInputView = document.getElementById('name-input-view');
const lobbyDiv = document.getElementById('lobby');
const hostViewDiv = document.getElementById('host-view');
const gameViewDiv = document.getElementById('game-view');
const container = document.getElementById('container'); 

const formSetName = document.getElementById('form-set-name');
const nameInput = document.getElementById('name-input');

const btnCriarSala = document.getElementById('btn-criar-sala');
const formEntrarSala = document.getElementById('form-entrar-sala');
const pinInput = document.getElementById('pin-input');
const feedbackLobby = document.getElementById('feedback-mensagem-lobby');

const hostPinDisplay = document.getElementById('host-pin-display');
const btnIniciarJogo = document.getElementById('btn-iniciar-jogo');
const hostLobbyLista = document.getElementById('host-lobby-lista');
const qrcodeDisplay = document.getElementById('qrcode-display');

const playerPinDisplay = document.getElementById('player-pin-display');
const charadaTexto = document.getElementById('charada-texto');
const opcoesContainer = document.getElementById('opcoes-container');
const feedbackJogo = document.getElementById('feedback-mensagem-jogo');
const placarLista = document.getElementById('placar-lista');

const timerDisplay = document.getElementById('timer-display'); 

// CONTROLAR VIEWS
function showView(id) {
  nameInputView.style.display = id === "name" ? "block" : "none";
  lobbyDiv.style.display = id === "lobby" ? "block" : "none";
  hostViewDiv.style.display = id === "host" ? "block" : "none";
  gameViewDiv.style.display = id === "game" ? "block" : "none";
}

// PLACAR
function updatePlacar(jogadores) {
  placarLista.innerHTML = "";
  hostLobbyLista.innerHTML = "";

  const sorted = jogadores.sort((a, b) => b.pontos - a.pontos);

  sorted.forEach(j => {
    const li1 = document.createElement('li');
    li1.innerHTML = `${j.nome}: <strong>${j.pontos}</strong>`;
    placarLista.appendChild(li1);

    const li2 = document.createElement('li');
    li2.textContent = `${j.nome} (ID: ${j.id.substring(0, 4)})`;
    hostLobbyLista.appendChild(li2);
  });
}

// OPÇÕES
function renderizarOpcoes(opcoes) {
  opcoesContainer.innerHTML = "";
  opcoesContainer.style.display = "grid";

  const cores = ["#dc3545", "#007bff", "#ffc107", "#28a745"];

  opcoes.forEach((opcao, i) => {
    const btn = document.createElement('button');
    btn.textContent = opcao;
    btn.style.backgroundColor = cores[i % 4];

    btn.onclick = () => {
      opcoesContainer.querySelectorAll('button').forEach(b => b.disabled = true);
      socket.emit('tentativa_resposta', { pin: currentPin, resposta: opcao });
      feedbackJogo.textContent = "Resposta enviada...";
      container.classList.add('response-pending'); // Feedback visual
    };

    opcoesContainer.appendChild(btn);
  });
}

// --- FUNÇÃO DE FEEDBACK VISUAL ---
function flashResult(isWinner) {
    container.classList.remove('response-pending');
    container.classList.add(isWinner ? 'winner-flash' : 'loser-flash');
    
    // Remove as classes após o flash
    setTimeout(() => {
        container.classList.remove('winner-flash', 'loser-flash');
    }, 1000);
}


// AÇÕES DO CLIENTE
formSetName.onsubmit = e => {
  e.preventDefault();
  if (nameInput.value.trim()) {
    socket.emit('definir_nome_jogador', nameInput.value.trim());
  }
};

btnCriarSala.onclick = () => socket.emit('criar_sala');

formEntrarSala.onsubmit = e => {
  e.preventDefault();
  if (pinInput.value.trim()) {
    socket.emit('entrar_sala', pinInput.value.trim());
  }
};

btnIniciarJogo.onclick = () => {
  if (currentPin) socket.emit('iniciar_jogo', currentPin);
};

// SOCKET LISTENERS
socket.on('connect', () => {
  socketIdDisplay.textContent = socket.id;
  showView("name");
});

socket.on('nome_definido', nome => {
  playerNameDisplay.textContent = nome;
  showView("lobby");
});

// SALA CRIADA
socket.on('sala_criada', data => {
  currentPin = data.pin;
  showView("host");
  hostPinDisplay.textContent = data.pin;

  qrcodeDisplay.innerHTML = "";

  const url = `http://${data.ip}:${window.location.port || 3000}/?pin=${data.pin}`;

  new QRCode(qrcodeDisplay, { text: url, width: 180, height: 180 });

//   const p = document.createElement('p');
//   p.textContent = url;
//   qrcodeDisplay.appendChild(p);
});

// Jogador entrou
socket.on('entrou_sala', data => {
  currentPin = data.pin;
  showView("game");
  playerPinDisplay.textContent = currentPin;
  charadaTexto.textContent = "Aguardando o Host...";
});

// Início do jogo
socket.on('jogo_iniciado', () => {
  showView("game");
});

// NOVO: ATUALIZA O TIMER
socket.on('timer_tick', tempo => {
    if (timerDisplay) {
        timerDisplay.textContent = `${tempo}s`;
        
        // Alerta visual quando o tempo está acabando
        if (tempo <= 5) {
            timerDisplay.classList.add('timer-critical');
        } else {
            timerDisplay.classList.remove('timer-critical');
        }
    }
});

// Lobby atualizado
socket.on('atualizar_lobby', jogadores => updatePlacar(jogadores));

// Nova charada
socket.on('nova_charada', dados => {
  charadaTexto.textContent = dados.pergunta;
  feedbackJogo.textContent = "Escolha a opção correta";
    opcoesContainer.style.display = "grid";
  renderizarOpcoes(dados.opcoes);
});

// Feedback resposta (erro)
socket.on('feedback_resposta', msg => {
  feedbackJogo.textContent = msg;
    container.classList.remove('response-pending');
    // Não aplica flash de erro aqui, pois a rodada ainda está em andamento
});

// Resultado da rodada
socket.on('vencedor_rodada', dados => {
    container.classList.remove('response-pending');
  charadaTexto.textContent = dados.mensagem;
  opcoesContainer.style.display = "none";
    
    // Feedback visual de vitória/derrota
    const isWinner = dados.vencedorId === socket.id;
    flashResult(isWinner); 

  updatePlacar(dados.placar);
});

// Erro
socket.on('erro_sala', msg => alert(msg));

// Host desconectou
socket.on('jogo_encerrado', msg => {
  alert(msg);
  showView("lobby");
});