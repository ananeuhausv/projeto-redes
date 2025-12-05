const socket = io();

// ELEMENTOS GERAIS
const socketIdDisplay = document.getElementById("socket-id");
const playerNameDisplay = document.getElementById("player-name-display");
const container = document.getElementById("container");

// VIEWS
const nameInputView = document.getElementById("name-input-view");
const lobbyDiv = document.getElementById("lobby");
const hostViewDiv = document.getElementById("host-view");
const hostGameViewDiv = document.getElementById("host-game-view");
const playerGameViewDiv = document.getElementById("player-game-view");

// HOST ELEMENTS
const hostPinDisplay = document.getElementById("host-pin-display");
const btnIniciarJogo = document.getElementById("btn-iniciar-jogo");
const hostLobbyLista = document.getElementById("host-lobby-lista");
const hostCharadaTexto = document.getElementById("host-charada-texto");
const hostTimerDisplay = document.getElementById("host-timer-display");
const hostGamePlacarLista = document.getElementById("host-game-placar-lista");
const hostOpcoesTexto = document.getElementById("host-opcoes-texto");
const hostPlacarDiv = document.getElementById("host-placar");
const qrcodeDisplay = document.getElementById("qrcode-display");
const btnFinalizarRodada = document.getElementById("btn-finalizar-rodada");

// PLAYER ELEMENTS
const playerPinDisplay = document.getElementById("player-pin-display");
const scoreDisplayPlayer = document.getElementById("score-display-player");
const feedbackScoreAcerto = document.getElementById("feedback-score-acerto");
const opcoesContainer = document.getElementById("opcoes-container");
const feedbackJogo = document.getElementById("feedback-mensagem-jogo");

let currentPin = null;
let isHost = false;

// Ícones para os blocos de opções (simulação de visual)
const icones = ["▲", "◆", "●", "■"];

// CONTROLAR VIEWS
function showView(id) {
	nameInputView.style.display = id === "name" ? "block" : "none";
	lobbyDiv.style.display = id === "lobby" ? "block" : "none";
	hostViewDiv.style.display = id === "host" ? "block" : "none";
	hostGameViewDiv.style.display = id === "host-game" ? "block" : "none";
	playerGameViewDiv.style.display = id === "player-game" ? "block" : "none";

	// Suporte explícito para a view de ranking
	const rankingView = document.getElementById("ranking-view");
	if (rankingView) {
		rankingView.style.display =
			id === "ranking" || id === "ranking-view" ? "block" : "none";
	}

	// Quando mostramos a view de ranking, garantimos esconder a view do host (se estiver visível)
	if (id === "ranking" || id === "ranking-view") {
		if (hostGameViewDiv) hostGameViewDiv.style.display = "none";
		if (hostViewDiv) hostViewDiv.style.display = "none";
		if (playerGameViewDiv) playerGameViewDiv.style.display = "none";
	}
}

// PLACAR GERAL (USADO PELO HOST)
function updateHostPlacar(jogadores) {
	hostGamePlacarLista.innerHTML = "";
	hostLobbyLista.innerHTML = "";

	const sorted = jogadores.sort((a, b) => b.pontos - a.pontos);

	sorted.forEach((j, index) => {
		const liLobby = document.createElement("li");
		liLobby.textContent = `${j.nome} | ${j.pontos} pts`;
		hostLobbyLista.appendChild(liLobby);

		const liPlacar = document.createElement("li");
		liPlacar.innerHTML = `<strong>${index + 1}.</strong> ${j.nome.toUpperCase()} | <strong>${
			j.pontos
		}</strong> pts`;
		hostGamePlacarLista.appendChild(liPlacar);
	});
}

// RENDERIZA OPÇÕES (CORRIGIDO PARA HOST/PROJETOR)
function renderizarOpcoes(opcoes) {
	// Cores e Ícones
	const cores = ["#673ab7",  "#2196f3","#ff9800", "#e91e63"];
	if (!isHost) {
		opcoesContainer.innerHTML = "";
		opcoesContainer.style.display = "grid";
		opcoesContainer
			.querySelectorAll("button")
			.forEach((b) => (b.disabled = false));

		opcoes.forEach((opcao, i) => {
			const btn = document.createElement("button");  
			btn.innerHTML = `<span class="texto-opcao-player">${opcao}</span>`;
			btn.style.backgroundColor = cores[i % 4];

			btn.onclick = () => {
				opcoesContainer
					.querySelectorAll("button")
					.forEach((b) => (b.disabled = true));
				socket.emit("tentativa_resposta", { pin: currentPin, resposta: opcao });
				feedbackJogo.textContent =
					"Resposta enviada. Aguardando o resultado final...";
				container.classList.add("response-pending");
			};
			opcoesContainer.appendChild(btn);
		});
	} // --- LÓGICA DO HOST (PROJETOR - BLOCOS COLORIDOS COM TEXTO) ---
// 	else {
// 		// Remove qualquer grade anterior do placar antes de renderizar a nova
// 		const oldGrid = hostPlacarDiv.querySelector(".host-opcoes-grid");
// 		if (oldGrid) hostPlacarDiv.removeChild(oldGrid);

// 		// Renderiza a nova grade de opções com texto e cor
// 		let tempGrid = document.createElement("div");
// 		tempGrid.className = "host-opcoes-grid";

// 		opcoes.forEach((jogador, i) => {
// 			// Aqui 'opcoes' na verdade é o array de jogadores do placar para o host
// 			const bloco = document.createElement("div");
// 			bloco.className = "host-opcao-bloco"; // Aqui o bloco é colorido para mostrar a opção correta (se tivéssemos o índice) // Como estamos reutilizando para mostrar o ranking final, usamos a cor primária
// 			bloco.style.backgroundColor = cores[i % 4];

// 			bloco.style.color = "white";

// 			bloco.innerHTML = `
//                 <span class="icone-opcao-host">${icones[i % 4]}</span>
//                 <span class="texto-opcao-host">Opção ${i + 1}</span> 
//             `;
// 			tempGrid.appendChild(bloco);
// 		});

// 		// Adiciona o bloco de opções ANTES do controle de strip
// 		const controlStrip = document.querySelector(".host-control-strip-bottom");
// 		if (controlStrip) hostPlacarDiv.insertBefore(tempGrid, controlStrip);
// 	}
}

// --- FUNÇÃO DE FEEDBACK VISUAL ---
function flashResult(isCorrect) {
	container.classList.remove("response-pending");
	container.classList.add(isCorrect ? "winner-flash" : "loser-flash");

	setTimeout(() => {
		container.classList.remove("winner-flash", "loser-flash");
	}, 1000);
}

// --- FUNÇÃO PARA MOSTRAR O RANKING FINAL ---
// --- FUNÇÃO PARA MOSTRAR O RANKING FINAL (CORRIGIDA) ---
function showFinalRanking(placar) {
    
    // 1. LÓGICA DO HOST: Mostra a tabela de classificação (Podium)
    if (isHost) {
        showView("ranking-view"); // Só o Host muda para a view de Ranking

        // Pega o container/ul já presente no HTML
        const finalPlacarLista = document.getElementById("final-ranking-list");
        if (!finalPlacarLista)
            return console.error("Elemento #final-ranking-list não encontrado.");

        // Limpa e preenche
        finalPlacarLista.innerHTML = "";

        const sorted = placar.slice().sort((a, b) => b.pontos - a.pontos);

        sorted.forEach((j, index) => {
            const li = document.createElement("li");
            let medal = "";
            if (index === 0) medal = "🥇";
            else if (index === 1) medal = "🥈";
            else if (index === 2) medal = "🥉";

            li.innerHTML = `
                <div class="ranking-item">
                    <span class="rank-badge ${index < 3 ? "medal" : ""}">
                        ${medal || "#" + (index + 1)}
                    </span>
                    <span class="player-name">${j.nome}</span>
                    <span class="player-points">${j.pontos} pts</span>
                </div>
            `;
            finalPlacarLista.appendChild(li);
        });

        // Garante que as outras views do host sumam
        if (hostGameViewDiv) hostGameViewDiv.style.display = "none";
        if (hostViewDiv) hostViewDiv.style.display = "none";
    } 
    
    // 2. LÓGICA DO JOGADOR: Mostra resultado individual
    else {
        showView("player-game"); // O Jogador permanece na área de jogo (que mudará o conteúdo)

        playerGameViewDiv.innerHTML = `
            <div class="player-final-box">
                <h2 class="player-final-title">🎉 Quiz Finalizado! 🎉</h2>

                <p class="player-final-sub"> Obrigado por jogar! </p>

                <div class="player-score-card">
                    <span class="score-label">Seu total:</span>
                    <span class="score-value">${
                        (placar.find((p) => p.id === socket.id) || { pontos: 0 }).pontos
                    } pontos</span>
                </div>

                <button onclick="window.location.reload()" class="btn-final-return">Jogar Novamente</button>
            </div>
        `;
        playerGameViewDiv.style.display = "block";
    }
}

// AÇÕES DO CLIENTE
document.addEventListener("DOMContentLoaded", () => {
	const formSetName = document.getElementById("form-set-name");
	const nameInput = document.getElementById("name-input");
	const btnCriarSala = document.getElementById("btn-criar-sala");
	const formEntrarSala = document.getElementById("form-entrar-sala");
	const pinInput = document.getElementById("pin-input");
	const btnFinalizarRodada = document.getElementById("btn-finalizar-rodada"); // Este elemento já existe no HTML

	formSetName.onsubmit = (e) => {
		e.preventDefault();
		if (nameInput.value.trim()) {
			socket.emit("definir_nome_jogador", nameInput.value.trim());
		}
	};

	btnCriarSala.onclick = () => socket.emit("criar_sala");

	formEntrarSala.onsubmit = (e) => {
		e.preventDefault();
		if (pinInput.value.trim()) {
			socket.emit("entrar_sala", pinInput.value.trim());
		}
	};

	btnIniciarJogo.onclick = () => {
		if (currentPin) socket.emit("iniciar_jogo", currentPin);
	}; // Host finaliza rodada antes do tempo

	if (btnFinalizarRodada) {
		btnFinalizarRodada.onclick = () => {
			if (currentPin) socket.emit("finalizar_rodada_host", currentPin);
		};
	} // SOCKET LISTENERS

	socket.on("connect", () => {
		socketIdDisplay.textContent = socket.id;
		showView("name");
	});

	socket.on("nome_definido", (nome) => {
		playerNameDisplay.textContent = nome;
		showView("lobby");
	}); // SALA CRIADA (HOST)

	socket.on("sala_criada", (data) => {
		currentPin = data.pin;
		isHost = true;
		showView("host");
		hostPinDisplay.textContent = data.pin; // Lógica do QR Code

		qrcodeDisplay.innerHTML = "";
		const url = `http://${data.ip}:${window.location.port || 3000}/?pin=${
			data.pin
		}`;
		new QRCode(qrcodeDisplay, { text: url, width: 180, height: 180 });

		hostPlacarDiv.style.display = "none";
	}); // Jogador entrou (PLAYER)

	socket.on("entrou_sala", (data) => {
		currentPin = data.pin;
		isHost = false;
		showView("player-game");
		playerPinDisplay.textContent = currentPin;
		feedbackJogo.textContent = "Aguardando o Host iniciar...";
	}); // JOGO INICIADO (Distingue Host e Player)

	socket.on("jogo_iniciado", () => {
		if (hostPlacarDiv) hostPlacarDiv.style.display = "none";

		if (isHost) {
			showView("host-game");
			hostCharadaTexto.textContent = "Preparar...";
		} else {
			showView("player-game");
		}
	}); // ATUALIZA O TIMER

	socket.on("timer_tick", (tempo) => {
		if (isHost && hostTimerDisplay) {
			hostTimerDisplay.textContent = `${tempo}s`;
			if (tempo <= 5) hostTimerDisplay.classList.add("timer-critical");
			else hostTimerDisplay.classList.remove("timer-critical");
		}
	}); // Lobby/Placar atualizado (Usado pelo Host)

	socket.on("atualizar_lobby", (jogadores) => {
		updateHostPlacar(jogadores);
	}); // Nova charada

	socket.on("nova_charada", (dados) => {
		if (isHost) {
			hostCharadaTexto.textContent = dados.pergunta; // As opções do Host são renderizadas no final da rodada
		} // PLAYER renderiza OPÇÕES COM O TEXTO
		renderizarOpcoes(dados.opcoes);
		opcoesContainer.style.display = "grid";
		feedbackJogo.textContent = "Escolha sua opção!";

		if (hostPlacarDiv) hostPlacarDiv.style.display = "none";
	}); // Feedback resposta (ERRO ou PENDENTE do JOGADOR)

	socket.on("feedback_resposta", (msg) => {
		feedbackJogo.textContent = msg;
		container.classList.remove("response-pending"); // Se a resposta foi incorreta, NÃO permite tentar de novo (comportamento padrão de quiz show)
		if (msg.includes("Incorreta")) {
			flashResult(false);
		}
	}); // Rodada finalizada (Tempo esgotado)

	socket.on("rodada_finalizada", (dados) => {
		container.classList.remove("response-pending"); // --- JOGADOR: Recebe feedback de acerto/erro e pontuação ---

		if (!isHost) {
			const meuJogador = dados.placar.find((j) => j.id === socket.id);
			const pontosAtuais = parseFloat(scoreDisplayPlayer.textContent) || 0;
			const pontosGanhos =
				meuJogador && meuJogador.pontos > pontosAtuais
					? meuJogador.pontos - pontosAtuais
					: 0;

			scoreDisplayPlayer.textContent = meuJogador ? meuJogador.pontos : "0";

			if (pontosGanhos > 0) {
				feedbackJogo.textContent = `🎉 ACERTOU! Você ganhou ${pontosGanhos} pts.`;
				feedbackScoreAcerto.textContent = `+${pontosGanhos} pontos!`;
				flashResult(true);
			} else {
				feedbackJogo.textContent = `❌ ERROU! ${dados.mensagem}`;
				flashResult(false);
			}

			opcoesContainer.innerHTML = "";
			opcoesContainer.style.display = "none";
			feedbackScoreAcerto.textContent = "";
		} // --- HOST: Mostra as opções e o placar geral ---

		if (isHost) {
			hostCharadaTexto.textContent = dados.mensagem; // Agora renderiza as opções com texto AQUI
			renderizarOpcoes(dados.placar); // Reutiliza renderizarOpcoes (apenas para o host)
			updateHostPlacar(dados.placar);
			if (hostPlacarDiv) hostPlacarDiv.style.display = "block";
		}
	}); // NOVO: Jogo Finalizado (Ciclo de Perguntas Completo)

	socket.on("jogo_finalizado", (dados) => {
		// console.log("Jogo finalizado recebido:", dados);
		// Usa a mesma função de ranking, mas com a mensagem de fim de jogo
		showFinalRanking(dados.placar);
	}); // Erro

	socket.on("erro_sala", (msg) => alert(msg)); // Host desconectou

	socket.on("jogo_encerrado", (msg) => {
		alert(msg);
		showView("lobby");
	});
});
