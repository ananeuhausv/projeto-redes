// server.js
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const TEMPO_RODADA = 15; // 15 segundos por rodada
const MAX_SCORE = 1000;
const MIN_SCORE = 200;

// ---- FUNÇÃO PARA OBTER IP LOCAL ----
function getLocalIp() {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const net of interfaces[name]) {
			if (net.family === "IPv4" && !net.internal) {
				return net.address;
			}
		}
	}
	return "localhost";
}

const LOCAL_IP = getLocalIp();
console.log(`IP detectado: ${LOCAL_IP}`);

// ---- CHARADAS (10 PERGUNTAS) ----
const CHARADAS = [
	{
		pergunta: "Qual tag HTML é usada para criar uma lista não ordenada?",
		opcoes: ["<list>", "<li>", "<ul>", "<ol>"],
		resposta: "<ul>",
	},
	{
		pergunta:
			"Qual método JavaScript é usado para adicionar um elemento ao final de um array?",
		opcoes: ["push()", "pop()", "shift()", "unshift()"],
		resposta: "push()",
	},
	{
		pergunta: "Em qual ano foi lançado o primeiro iPhone?",
		opcoes: ["2005", "2007", "2008", "2009"],
		resposta: "2007",
	},
	{
		pergunta: "Qual destes não é um tipo de dado primitivo em JavaScript?",
		opcoes: ["string", "boolean", "object", "number"],
		resposta: "object",
	},
	{
		pergunta: "O que é, o que é: Uma corda que toca, mas não tem braço?",
		resposta: "O violão",
		opcoes: ["O piano", "O violão", "O microfone", "O tambor"],
	},
	{
		pergunta: "O que é, o que é: Tem orelhas, mas só escuta o silêncio?",
		resposta: "O fone de ouvido",
		opcoes: ["O rádio", "O maestro", "O fone de ouvido", "O amplificador"],
	},
	{
		pergunta: "O que é, o que é: Um som que tem clave, mas não abre porta?",
		resposta: "A nota musical",
		opcoes: ["A partitura", "A letra da música", "O baixo", "A nota musical"],
	},
	{
		pergunta: "O que é, o que é: Serve para marcar o tempo, mas não é relógio?",
		resposta: "O metrônomo",
		opcoes: ["O tímpano", "O relógio de pulso", "O metrônomo", "O compasso"],
	},
]; // TOTAL: 10 PERGUNTAS

const salas = {};

// Função auxiliar para calcular pontos baseados no tempo (milissegundos)
function calcularPontos(tempoDecorrido) {
	const tempoRestante = TEMPO_RODADA - tempoDecorrido;
	const tempoNormalizado = Math.max(0, tempoRestante) / TEMPO_RODADA; // Garante que não é negativo

	const bonusPontos = MAX_SCORE - MIN_SCORE; // Pontuação mínima + Bônus Máximo * (Proporção de tempo restante)
	return MIN_SCORE + Math.round(bonusPontos * tempoNormalizado);
}

function gerarPin() {
	let pin;
	do {
		pin = Math.floor(10000 + Math.random() * 90000).toString();
	} while (salas[pin]);
	return pin;
}

app.use(express.static("public"));

function emitirLobbyAtualizado(pin) {
	const sala = salas[pin];
	if (!sala) return;

	const jogadoresArray = Object.keys(sala.jogadores).map((id) => ({
		id,
		nome: sala.jogadores[id].nome,
		pontos: sala.jogadores[id].pontos,
	}));

	io.to(pin).emit("atualizar_lobby", jogadoresArray);
}

// --------------------------------------------------------------------------
// LÓGICA DE FINALIZAÇÃO E TIMER
// --------------------------------------------------------------------------

// NEW: Encapsula encerramento do jogo (emite placar final e limpa)
function encerrarJogo(pin) {
	console.log("\n🚨🚨🚨 ENCERRAR JOGO FOI CHAMADO!!! PIN:", pin, "🚨🚨🚨");
	console.log("Jogadores finais:", salas[pin]?.jogadores);
	console.log("Status antes:", salas[pin]?.status);

	const sala = salas[pin];
	if (!sala) return;

	// Build final scoreboard
	const jogadoresArray = Object.keys(sala.jogadores).map((id) => ({
		id,
		nome: sala.jogadores[id].nome,
		pontos: sala.jogadores[id].pontos,
	}));

	io.to(pin).emit("jogo_finalizado", {
		mensagem: "PARABÉNS! O quiz chegou ao fim.",
		placar: jogadoresArray,
	});

	// marca status e remove timers
	sala.status = "FINALIZADO";
	if (sala.timerInterval) {
		clearInterval(sala.timerInterval);
		delete sala.timerInterval;
	}
	if (sala.timeoutCharada) {
		clearTimeout(sala.timeoutCharada);
		delete sala.timeoutCharada;
	}

	// deixa a sala no servidor por 10s para que clientes vejam o placar antes de remover
	setTimeout(() => {
		delete salas[pin];
	}, 10000);
}

function finalizarRodada(pin) {
	const sala = salas[pin];

	console.log("\n========== DEBUG FINALIZAR RODADA ==========");
	console.log("PIN:", pin);
	console.log("Sala existe?", !!sala);
	console.log("Perguntas usadas:", sala?.perguntasUsadas?.size);
	console.log("Total de charadas:", CHARADAS.length);
	console.log("charadaAtual existe?", !!sala?.charadaAtual);
	console.log("Status da sala:", sala?.status);
	console.log("Timer ativo:", !!sala?.timerInterval);
	console.log("Timeout ativo:", !!sala?.timeoutCharada);
	console.log("Jogadores:", Object.keys(sala?.jogadores || {}));
	console.log("============================================\n");

	if (!sala || !sala.charadaAtual) return; // 1. Processa as pontuações ADIADAS (só acertos)

	for (const resposta of sala.respostasDaRodada) {
		const jogador = sala.jogadores[resposta.id];
		if (jogador) {
			jogador.pontos += resposta.pontos;
			jogador.ultimoAcerto = resposta.pontos;
		}
	} // 2. Monta o placar e envia o evento de finalização de rodada para todos

	const jogadoresArray = Object.keys(sala.jogadores).map((id) => ({
		id,
		nome: sala.jogadores[id].nome,
		pontos: sala.jogadores[id].pontos,
		ultimoAcerto: sala.jogadores[id].ultimoAcerto || 0,
	}));

	io.to(pin).emit("rodada_finalizada", {
		mensagem: `Rodada Finalizada. A resposta correta era: "${sala.charadaAtual.resposta}"`,
		placar: jogadoresArray,
	}); // Limpa os dados da charada atual

	sala.charadaAtual = null; // 3. Verifica se a próxima rodada deve ser a última ou o fim do jogo

	// If all questions used, end the game instead of scheduling a new round
	if (sala.perguntasUsadas.size >= CHARADAS.length) {
		console.log("⚠️ TODAS AS PERGUNTAS FORAM USADAS! Chamando encerrarJogo()");

		// Schedule final scoreboard emission after brief pause for last-round placar view
		sala.timeoutCharada = setTimeout(() => {
			encerrarJogo(pin);
		}, 5000); // 5 segundos para ver o placar da última rodada

		return; // SAÍDA: O jogo para de agendar novas rodadas aqui.
	}

	// SE HOUVER MAIS PERGUNTAS, AGENDA A PRÓXIMA
	sala.timeoutCharada = setTimeout(() => {
		iniciarNovaRodada(pin);
	}, 5000);
}

function iniciarTimer(pin) {
	const sala = salas[pin];
	if (!sala) return; // Limpa qualquer timer anterior

	if (sala.timerInterval) {
		clearInterval(sala.timerInterval);
	}
	if (sala.timeoutCharada) {
		clearTimeout(sala.timeoutCharada);
	}

	sala.tempoAtual = TEMPO_RODADA;

	sala.timerInterval = setInterval(() => {
		if (sala.tempoAtual >= 0) {
			io.to(pin).emit("timer_tick", sala.tempoAtual);
		} // Verifica se o tempo acabou

		if (sala.tempoAtual <= 0) {
			if (sala.timerInterval) {
				clearInterval(sala.timerInterval);
				delete sala.timerInterval;
			}
			finalizarRodada(pin);
		}
		sala.tempoAtual--;
	}, 1000);
}

function iniciarNovaRodada(pin) {
	const sala = salas[pin];
	if (!sala) return;

	if (Object.keys(sala.jogadores).length === 0) return;

	// FIX: se todas as perguntas já foram usadas, encerra o jogo em vez de tentar escolher uma nova
	if (sala.perguntasUsadas.size >= CHARADAS.length) {
		encerrarJogo(pin);
		return;
	}

	let charadaIndex;
	let charada;

	// Safety guard: try a limited number of times to pick a new index
	let attempts = 0;
	do {
		charadaIndex = Math.floor(Math.random() * CHARADAS.length);
		charada = CHARADAS[charadaIndex];
		attempts++;
		// If somehow we tried too many times, break and find deterministic unused index
		if (attempts > 50) {
			// deterministic fallback: pick first unused
			for (let i = 0; i < CHARADAS.length; i++) {
				if (!sala.perguntasUsadas.has(i)) {
					charadaIndex = i;
					charada = CHARADAS[i];
					break;
				}
			}
			break;
		}
	} while (sala.perguntasUsadas.has(charadaIndex));

	// Incrementa a contagem de rodadas (Apenas para informação, o limite é o CHARADAS.length)
	sala.rodada++;
	sala.perguntasUsadas.add(charadaIndex);

	sala.charadaAtual = {
		pergunta: charada.pergunta,
		resposta: charada.resposta,
		tempoInicio: Date.now(),
		respostasRecebidas: new Set(),
	};

	sala.respostasDaRodada = []; // Limpa acertos da rodada anterior

	io.to(pin).emit("nova_charada", {
		pergunta: charada.pergunta,
		opcoes: charada.opcoes,
	});

	iniciarTimer(pin);
}

// --------------------------------------------------------------------------
// SOCKET LISTENERS
// --------------------------------------------------------------------------
io.on("connection", (socket) => {
	console.log("Usuário conectado:", socket.id);
	let usuarioPin = null;

	socket.on("definir_nome_jogador", (nome) => {
		socket.data.nome = nome.trim() || `Jogador ${socket.id.substring(0, 4)}`;
		socket.emit("nome_definido", socket.data.nome);
	});

	socket.on("criar_sala", () => {
		const pin = gerarPin();
		const nomeHost = socket.data.nome || `Host ${socket.id.substring(0, 4)}`;

		salas[pin] = {
			hostId: socket.id,
			jogadores: {}, // Host excluído
			charadaAtual: null,
			timerInterval: null,
			timeoutCharada: null,
			tempoAtual: TEMPO_RODADA,
			perguntasUsadas: new Set(), // Histórico de perguntas
			respostasDaRodada: [], // Armazena acertos para processar no final
			status: "LOBBY",
			rodada: 0,
		};

		socket.join(pin);
		usuarioPin = pin;

		socket.emit("sala_criada", {
			pin,
			hostId: socket.id,
			ip: LOCAL_IP,
			nomeHost,
		});
	});

	socket.on("entrar_sala", (pin) => {
		const sala = salas[pin];
		if (!sala || sala.status !== "LOBBY")
			return socket.emit("erro_sala", "PIN inválido ou sala já iniciou.");

		const nomeJogador =
			socket.data.nome || `Jogador ${socket.id.substring(0, 4)}`;
		if (sala.hostId === socket.id)
			return socket.emit("erro_sala", "Você é o Host, use a tela de controle.");

		socket.join(pin);
		usuarioPin = pin;

		sala.jogadores[socket.id] = {
			nome: nomeJogador,
			pontos: 0,
			ultimoAcerto: 0,
			ultimaResposta: null,
		};

		socket.emit("entrou_sala", { pin });
		emitirLobbyAtualizado(pin);
	});

	socket.on("iniciar_jogo", (pin) => {
		const sala = salas[pin];
		if (sala && sala.hostId === socket.id) {
			sala.status = "IN_GAME";
			io.to(pin).emit("jogo_iniciado");
			iniciarNovaRodada(pin);
		}
	}); // --- FINALIZAR RODADA MANUALMENTE (PARA O HOST) ---

	socket.on("finalizar_rodada_host", (pin) => {
		const sala = salas[pin];
		if (sala && sala.hostId === socket.id && sala.charadaAtual) {
			if (sala.timerInterval) {
				clearInterval(sala.timerInterval);
				delete sala.timerInterval;
			} // Força a finalização imediata
			finalizarRodada(pin);
		}
	}); // Tentativa de resposta (FEEDBACK ADIADO)

	socket.on("tentativa_resposta", ({ pin, resposta }) => {
		const sala = salas[pin];
		if (!sala || !sala.charadaAtual) return;

		const jogador = sala.jogadores[socket.id];
		if (!jogador) return; // Bloqueia múltiplas respostas

		if (sala.charadaAtual.respostasRecebidas.has(socket.id)) {
			return socket.emit(
				"feedback_resposta",
				"Você já respondeu nesta rodada! Aguarde."
			);
		}
		sala.charadaAtual.respostasRecebidas.add(socket.id);

		if (
			resposta.trim().toLowerCase() === sala.charadaAtual.resposta.toLowerCase()
		) {
			// Calcula pontuação, mas ADIA O PROCESSAMENTO
			const tempoDecorrido =
				(Date.now() - sala.charadaAtual.tempoInicio) / 1000;
			const pontuacao = calcularPontos(tempoDecorrido);

			sala.respostasDaRodada.push({
				id: socket.id,
				pontos: pontuacao,
			}); // Feedback PENDENTE (sem pontuação)

			socket.emit(
				"feedback_resposta",
				"Resposta enviada. Aguardando o resultado final..."
			);
		} else {
			// Feedback Incorreto
			socket.emit(
				"feedback_resposta",
				"Resposta Incorreta. Aguarde o resultado final."
			);
		} // Verifica se todos já responderam para finalizar a rodada

		if (
			Object.keys(sala.jogadores).length > 0 &&
			sala.charadaAtual.respostasRecebidas.size ===
				Object.keys(sala.jogadores).length
		) {
			if (sala.timerInterval) {
				clearInterval(sala.timerInterval);
				delete sala.timerInterval;
			}
			finalizarRodada(pin);
		}
	});

	socket.on("disconnect", () => {
		if (!usuarioPin) return;

		const sala = salas[usuarioPin];
		if (!sala) return; // Limpa timers se o host cair

		if (sala.hostId === socket.id) {
			if (sala.timerInterval) clearInterval(sala.timerInterval);
			if (sala.timeoutCharada) clearTimeout(sala.timeoutCharada);
			delete salas[usuarioPin];
			io.to(usuarioPin).emit(
				"jogo_encerrado",
				"Host desconectou. Jogo encerrado."
			);
		} else {
			delete sala.jogadores[socket.id];
			emitirLobbyAtualizado(usuarioPin);
		}
	});
});

server.listen(PORT, () => {
	console.log(`Servidor rodando em http://${LOCAL_IP}:${PORT}`);
});
