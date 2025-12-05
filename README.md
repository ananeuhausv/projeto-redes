🏆 Quiz Game Arena - Multiplayer Network Project
Este projeto é um jogo de perguntas e respostas (Quiz) multiplayer em tempo real, inspirado no Kahoot!, desenvolvido como parte da disciplina de Redes de Computadores do curso de Sistemas de Informação da UFF.

O sistema utiliza uma arquitetura Cliente-Servidor baseada em WebSockets para garantir baixa latência na comunicação entre o "Host" (tela do jogo) e os "Players" (dispositivos móveis/controles).

🚀 Funcionalidades
Comunicação em Tempo Real: Uso de Socket.io para sincronização instantânea de perguntas, respostas, timer e placar.

Mecânica de Sala: Geração de PIN único para criação de salas privadas.

Conexão Simplificada: Geração automática de QR Code com o IP local do servidor para fácil acesso dos dispositivos móveis na mesma rede Wi-Fi.

Lógica de Rodadas: O jogo seleciona aleatoriamente 10 perguntas de um banco de dados maior a cada nova partida, garantindo rejogabilidade.

Sistema de Pontuação: Pontuação baseada em precisão e velocidade (quanto mais rápido responder, mais pontos).

Design Responsivo: Interface adaptada para Projetores (Host) e Celulares (Jogadores).

🛠️ Tecnologias Utilizadas
Back-end: Node.js

Framework Web: Express

Protocolo Real-Time: Socket.io (WebSockets)

Front-end: HTML5, CSS3 (Responsivo), JavaScript Vanilla

📦 Pré-requisitos
Para rodar este projeto localmente, você precisa ter instalado na sua máquina:

Node.js (Versão 14 ou superior)

Gerenciador de pacotes npm (já vem com o Node)

🔧 Como Rodar o Projeto
Siga os passos abaixo para executar o servidor na sua máquina:

1. Clonar ou Baixar o Projeto
Faça o download dos arquivos para uma pasta em seu computador.

2. Instalar Dependências
Abra o terminal (Prompt de Comando ou PowerShell) na pasta do projeto e execute:

Bash

npm install
Isso instalará o express e o socket.io listados no projeto.

3. Iniciar o Servidor
No terminal, execute:

Bash

node server.js
4. Acessar o Jogo
O terminal exibirá uma mensagem como:

Servidor rodando em http://192.168.x.x:3000

Para o HOST (Tela Principal): Abra esse endereço no navegador do seu computador/notebook (preferencialmente Chrome ou Edge). Clique em "Criar Nova Partida (Host)".

Para os PLAYERS (Celulares):

Certifique-se de que o celular está conectado na mesma rede Wi-Fi do computador.

Escaneie o QR Code exibido na tela do Host ou digite o endereço IP e a porta no navegador do celular.

Insira o PIN exibido na tela do Host.

🎮 Como Jogar
Lobby: O Host cria a sala e aguarda. Os jogadores entram pelo celular, digitam seus nomes e aguardam no Lobby.

Início: Quando todos estiverem conectados, o Host clica em "INICIAR PARTIDA".

Perguntas:

A pergunta e as opções aparecem na tela do Host (Projetor).

No celular, aparecem apenas os botões coloridos/símbolos correspondentes.

Respostas: Os jogadores devem selecionar a opção correta antes que o tempo (15s) acabe.

Pontuação: Ao fim de cada rodada, o sistema mostra quem acertou e atualiza o Ranking.

Fim de Jogo: Após 10 rodadas, o pódio final é exibido no Host e o resultado individual aparece no celular de cada jogador.

📂 Estrutura de Arquivos
server.js: Código principal do servidor. Gerencia as salas, conexões socket, lógica de pontuação e banco de perguntas.

public/: Pasta com os arquivos estáticos (Front-end).

index.html: Estrutura única da aplicação (SPA).

style.css: Estilização visual e animações.

client.js: Lógica do lado do cliente (manipulação do DOM e eventos de socket).

👨‍💻 Autores
João Vicente - Desenvolvimento Full Stack

Projeto desenvolvido para fins acadêmicos - UFF 2025.
