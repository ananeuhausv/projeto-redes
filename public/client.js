// public/client.js (COMPLETO E CORRIGIDO)
console.log("JS CARREGOU");
alert("JS carregou");

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
		liPlacar.innerHTML = `**${index + 1}.** ${j.nome} | <strong>${
			j.pontos
		}</strong> pts`;
		hostGamePlacarLista.appendChild(liPlacar);
	});
}

// RENDERIZA OPÇÕES (CORRIGIDO PARA HOST/PROJETOR)
function renderizarOpcoes(opcoes) {
	// Cores e Ícones
	const cores = ["#dc3545", "#ffc107", "#007bff", "#4CAF50"]; // Vermelho, Amarelo, Azul, Verde // --- LÓGICA DO JOGADOR (PLAYER - TEXTO DA OPÇÃO) ---

	if (!isHost) {
		opcoesContainer.innerHTML = "";
		opcoesContainer.style.display = "grid";
		opcoesContainer
			.querySelectorAll("button")
			.forEach((b) => (b.disabled = false));

		opcoes.forEach((opcao, i) => {
			const btn = document.createElement("button"); // CORREÇÃO FINAL: Ícone + Texto no botão do jogador
			btn.innerHTML = `<span class="icone-opcao">${
				icones[i % 4]
			}</span><span class="texto-opcao-player">${opcao}</span>`;
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
	else {
		// Remove qualquer grade anterior do placar antes de renderizar a nova
		const oldGrid = hostPlacarDiv.querySelector(".host-opcoes-grid");
		if (oldGrid) hostPlacarDiv.removeChild(oldGrid);

		// Renderiza a nova grade de opções com texto e cor
		let tempGrid = document.createElement("div");
		tempGrid.className = "host-opcoes-grid";

		opcoes.forEach((jogador, i) => {
			// Aqui 'opcoes' na verdade é o array de jogadores do placar para o host
			const bloco = document.createElement("div");
			bloco.className = "host-opcao-bloco"; // Aqui o bloco é colorido para mostrar a opção correta (se tivéssemos o índice) // Como estamos reutilizando para mostrar o ranking final, usamos a cor primária
			bloco.style.backgroundColor = cores[i % 4];

			bloco.style.color = "white";

			bloco.innerHTML = `
                <span class="icone-opcao-host">${icones[i % 4]}</span>
                <span class="texto-opcao-host">Opção ${i + 1}</span> 
            `;
			tempGrid.appendChild(bloco);
		});

		// Adiciona o bloco de opções ANTES do controle de strip
		const controlStrip = document.querySelector(".host-control-strip-bottom");
		if (controlStrip) hostPlacarDiv.insertBefore(tempGrid, controlStrip);
	}
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
function showFinalRanking(placar) {
	// Esconde todas as outras views
	showView("ranking"); // Usa o hostGameViewDiv ou um novo container, adaptando para o ranking final

	const finalRankingDiv = hostGameViewDiv; // Substitui o conteúdo da view do host para mostrar o ranking final

	finalRankingDiv.innerHTML = `
        <div class="ranking-final-box">
            <h2 class="final-header">QUIZ FINALIZADO! 🥇</h2>
            <h3 class="final-subheader">CLASSIFICAÇÃO FINAL</h3>
            <ul id="final-placar-lista" class="player-list"></ul>
            <button onclick="window.location.reload()" class="btn-start-arena" style="width: 250px; margin-top: 30px;">
                NOVA PARTIDA
            </button>
        </div>
    `;

	const finalPlacarLista = document.getElementById("final-placar-lista"); // Sortear e renderizar o placar final

	const sorted = placar.sort((a, b) => b.pontos - a.pontos);

	sorted.forEach((j, index) => {
		const li = document.createElement("li");
		li.innerHTML = `
            <span class="rank-position">#${index + 1}</span> 
            ${j.nome} 
            <strong class="final-score">${j.pontos} pts</strong>
        `;
		finalPlacarLista.appendChild(li);
	}); // Para jogadores, apenas mostra uma mensagem

	if (!isHost) {
		playerGameViewDiv.innerHTML = `
            <div class="ranking-final-box">
                <h2 class="final-header">QUIZ FINALIZADO!</h2>
                <p class="feedback-msg">Aguarde o Host para ver o ranking final.</p>
                <p class="final-subheader">Seus Pontos: <strong>${
			(placar.find((j) => j.id === socket.id) || { pontos: 0 }).pontos
		}</strong></p>
            </div>
            <button onclick="window.location.reload()" class="btn-start-arena" style="width: 250px; margin-top: 30px;">
                VOLTAR
            </button>
        `;
		playerGameViewDiv.style.display = "block";
		hostGameViewDiv.style.display = "none";
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
		const p = document.createElement("p");
		p.textContent = url;
		qrcodeDisplay.appendChild(p);

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
				feedbackJogo.textContent = `❌ ERROU/Não Respondeu. ${dados.mensagem}`;
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
		// Usa a mesma função de ranking, mas com a mensagem de fim de jogo
		showFinalRanking(dados.placar);
	}); // Erro

	socket.on("erro_sala", (msg) => alert(msg)); // Host desconectou

	socket.on("jogo_encerrado", (msg) => {
		alert(msg);
		showView("lobby");
	});
});
