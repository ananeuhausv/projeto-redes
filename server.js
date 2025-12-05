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
const TOTAL_RODADAS = 10;

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
    // --- ORIGINAIS (FILMES E SÉRIES GERAIS) ---
    {
        pergunta: "Qual o nome do vilão principal de Harry Potter?",
        opcoes: [
            "Lucius Malfoy",
            "Sirius Black",
            "Tom Marvolo Riddle",
            "Remo Lupin",
        ],
        resposta: "Tom Marvolo Riddle",
    },
    {
        pergunta: "Qual é o robô icônico de Star Wars que é dourado e sempre preocupado?",
        opcoes: ["R2-D2", "C-3PO", "BB-8", "K-2SO"],
        resposta: "C-3PO",
    },
    {
        pergunta: "Qual o nome da cidade fictícia onde se passa Stranger Things?",
        opcoes: ["Hawkins", "Sunnydale", "Indianapolis", "Riverdale"],
        resposta: "Hawkins",
    },
    {
        pergunta: "Qual série acompanha um cientista e seu neto em aventuras interdimensionais?",
        opcoes: ["Futurama", "Solar Opposites", "Rick and Morty", "Adventure Time"],
        resposta: "Rick and Morty",
    },
    {
        pergunta: "Qual banda liderada por Freddie Mercury é conhecida por “Bohemian Rhapsody”?",
        opcoes: ["The Beatles", "Queen", "The Rolling Stones", "Nirvana"],
        resposta: "Queen",
    },
    {
        pergunta: "Qual é o alter ego do super-herói Homem de Ferro?",
        opcoes: ["Steve Rogers", "Bruce Banner", "Tony Stark", "Peter Parker"],
        resposta: "Tony Stark",
    },
    {
        pergunta: "Em 'Friends', qual é o nome do café onde os personagens se reúnem?",
        opcoes: ["MacLaren's Pub", "Central Perk", "Luke's Diner", "Monk's Café"],
        resposta: "Central Perk",
    },
    {
        pergunta: "Qual o nome do irmão de Mario na franquia de jogos da Nintendo?",
        opcoes: ["Wario", "Luigi", "Yoshi", "Waluigi"],
        resposta: "Luigi",
    },
    {
        pergunta: "Quem foi o hobbit encarregado de levar o 'Um Anel' até a Montanha da Perdição?",
        opcoes: ["Samwise Gamgee", "Bilbo Baggins", "Frodo Baggins", "Peregrin Took"],
        resposta: "Frodo Baggins",
    },
    {
        pergunta: "Qual é a casa de Game of Thrones cujo lema é 'O inverno está chegando'?",
        opcoes: ["Casa Lannister", "Casa Targaryen", "Casa Stark", "Casa Baratheon"],
        resposta: "Casa Stark",
    },
    {
        pergunta: "Qual é o nome do planeta natal dos Kryptonianos, como Superman?",
        opcoes: ["Krypton", "Vulcano", "Gallifrey", "Asgard"],
        resposta: "Krypton",
    },
    {
        pergunta: "Em 'The Matrix', qual pílula Neo toma para descobrir a verdade?",
        opcoes: ["Pílula Azul", "Pílula Vermelha", "Pílula Verde", "Pílula Amarela"],
        resposta: "Pílula Vermelha",
    },
    {
        pergunta: "Qual é o nome do assistente virtual da Apple?",
        opcoes: ["Alexa", "Cortana", "Siri", "Google Assistant"],
        resposta: "Siri",
    },

    // --- STRANGER THINGS ---
    {
        pergunta: "Qual é a comida favorita da Eleven em Stranger Things?",
        opcoes: ["Pizza", "Hambúrguer", "Waffles (Eggos)", "Sorvete"],
        resposta: "Waffles (Eggos)",
    },
    {
        pergunta: "Qual o nome do jogo de RPG que os meninos jogam em Stranger Things?",
        opcoes: ["Vampiro: A Máscara", "Dungeons & Dragons", "Cyberpunk 2020", "GURPS"],
        resposta: "Dungeons & Dragons",
    },
    {
        pergunta: "Como se chama a dimensão sombria e paralela de Stranger Things?",
        opcoes: ["O Submundo", "Mundo Invertido", "Zona Fantasma", "Limbo"],
        resposta: "Mundo Invertido",
    },
    {
        pergunta: "Qual música de Kate Bush salvou a Max do Vecna?",
        opcoes: ["Running Up That Hill", "Wuthering Heights", "Babooshka", "Cloudbusting"],
        resposta: "Running Up That Hill",
    },

    // --- MUNDO POP & DIVAS ---
    {
        pergunta: "Quem é conhecida como a 'Rainha do Pop'?",
        opcoes: ["Britney Spears", "Lady Gaga", "Madonna", "Beyoncé"],
        resposta: "Madonna",
    },
    {
        pergunta: "Qual cantora tem uma legião de fãs chamados 'Swifties'?",
        opcoes: ["Katy Perry", "Taylor Swift", "Ariana Grande", "Selena Gomez"],
        resposta: "Taylor Swift",
    },
    {
        pergunta: "Qual música da Miley Cyrus foi escrita como indireta para Liam Hemsworth?",
        opcoes: ["Wrecking Ball", "Flowers", "Party in the U.S.A.", "Malibu"],
        resposta: "Flowers",
    },
    {
        pergunta: "Rihanna é a fundadora de qual marca bilionária de maquiagem?",
        opcoes: ["Rare Beauty", "Haus Labs", "Fenty Beauty", "Kylie Cosmetics"],
        resposta: "Fenty Beauty",
    },
    {
        pergunta: "Qual artista brasileira atingiu o Top 1 Global do Spotify com 'Envolver'?",
        opcoes: ["Ludmilla", "Anitta", "Luísa Sonza", "Ivete Sangalo"],
        resposta: "Anitta",
    },
    {
        pergunta: "Quem é a artista por trás do álbum 'Renaissance' e da turnê com cavalos prateados?",
        opcoes: ["Beyoncé", "Rihanna", "Doja Cat", "Dua Lipa"],
        resposta: "Beyoncé",
    },

    // --- TRETAS E CULTURA POP ---
    {
        pergunta: "Em 2009, quem interrompeu o discurso de Taylor Swift no VMA?",
        opcoes: ["Jay-Z", "Eminem", "Kanye West", "Justin Timberlake"],
        resposta: "Kanye West",
    },
    {
        pergunta: "Qual hit de Shakira é cheio de indiretas sobre seu ex, Piqué?",
        opcoes: ["Hips Don't Lie", "Waka Waka", "Bzrp Music Sessions, Vol. 53", "La Tortura"],
        resposta: "Bzrp Music Sessions, Vol. 53",
    },
    {
        pergunta: "Qual o nome do filme que gerou o fenômeno 'Barbenheimer' em 2023?",
        opcoes: ["Barbie", "Oppenheimer", "Missão Impossível", "Duna"],
        resposta: "Barbie",
    },
    {
        pergunta: "A música 'Driver's License' de Olivia Rodrigo foi supostamente sobre quem?",
        opcoes: ["Harry Styles", "Joshua Bassett", "Shawn Mendes", "Zac Efron"],
        resposta: "Joshua Bassett",
    },
    {
        pergunta: "No BBB 21, qual participante bateu o recorde de rejeição com 99,17%?",
        opcoes: ["Viih Tube", "Projota", "Nego Di", "Karol Conká"],
        resposta: "Karol Conká",
    },
    {
        pergunta: "Qual rede social era famosa pelos 'scraps', 'depoimentos' e comunidades?",
        opcoes: ["MSN", "Orkut", "MySpace", "Tumblr"],
        resposta: "Orkut",
    },
];

// Shuffle Fisher-Yates — retorna nova cópia embaralhada
function shuffleArray(arr) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

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
	// console.log("\n🚨🚨🚨 ENCERRAR JOGO FOI CHAMADO!!! PIN:", pin, "🚨🚨🚨");
	// console.log("Jogadores finais:", salas[pin]?.jogadores);
	// console.log("Status antes:", salas[pin]?.status);

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

	// console.log("\n========== DEBUG FINALIZAR RODADA ==========");
	// console.log("PIN:", pin);
	// console.log("Sala existe?", !!sala);
	// console.log("Perguntas usadas:", sala?.perguntasUsadas?.size);
	// console.log("Total de charadas:", CHARADAS.length);
	// console.log("charadaAtual existe?", !!sala?.charadaAtual);
	// console.log("Status da sala:", sala?.status);
	// console.log("Timer ativo:", !!sala?.timerInterval);
	// console.log("Timeout ativo:", !!sala?.timeoutCharada);
	// console.log("Jogadores:", Object.keys(sala?.jogadores || {}));
	// console.log("============================================\n");

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
	if (sala.perguntasUsadas.size >= sala.questionOrder.length) {
		// console.log("⚠️ TODAS AS PERGUNTAS FORAM USADAS! Chamando encerrarJogo()");

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

	// Safety: se já percorremos todas as perguntas -> encerra o jogo
	if (
		!Array.isArray(sala.questionOrder) ||
		sala.questionPointer >= sala.questionOrder.length
	) {
		encerrarJogo(pin);
		return;
	}

	// Pega o índice da pergunta a partir da ordem pré-gerada
	const charadaIndex = sala.questionOrder[sala.questionPointer];
	const charada = CHARADAS[charadaIndex];

	// marca como usada e avança ponteiro
	sala.perguntasUsadas.add(charadaIndex);
	sala.questionPointer++;

	// Incrementa a contagem de rodadas
	sala.rodada++;

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
			questionOrder: [],
			questionPointer: 0,
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

			// Gera ordem embaralhada só uma vez ao iniciar o jogo
			let todosIndices = [...Array(CHARADAS.length).keys()];
			todosIndices = shuffleArray(todosIndices);
			sala.questionOrder = todosIndices.slice(0, TOTAL_RODADAS); 
			sala.questionPointer = 0;
			sala.perguntasUsadas = new Set(); // opcional: mantém histórico também

			io.to(pin).emit("jogo_iniciado");
			iniciarNovaRodada(pin);
		}
	});

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
