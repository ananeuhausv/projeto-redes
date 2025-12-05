# 🏆 Pop Culture Quiz

> **Projeto da Disciplina:** Redes de Computadores  
> **Curso:** Sistemas de Informação - UFF (Universidade Federal Fluminense)  
> **Semestre:** 2025

## 📖 Sobre o Projeto

O **Pop Culture Quiz** é um jogo de perguntas e respostas (quiz) multiplayer em tempo real, inspirado na mecânica do *Kahoot!*. 

O sistema utiliza uma arquitetura **Cliente-Servidor** baseada em **WebSockets**, garantindo baixa latência na comunicação entre o **Host** (tela principal do jogo, geralmente um projetor ou PC) e os **Players** (dispositivos móveis funcionando como controles).

## 🚀 Funcionalidades

- **📡 Comunicação em Tempo Real:** Uso de `Socket.io` para sincronização instantânea de perguntas, respostas, timer e placar entre todos os dispositivos conectados.
- **🔒 Mecânica de Sala:** Geração de PIN único para criação de salas privadas, garantindo a segurança e exclusividade.
- **📲 Conexão Simplificada:** Geração automática de **QR Code** com o IP local do servidor, facilitando o acesso dos celulares na mesma rede Wi-Fi.
- **🎲 Lógica de Rodadas:** O jogo seleciona aleatoriamente **10 perguntas** de um banco de dados maior a cada nova partida, garantindo rejogabilidade.
- **⚡ Sistema de Pontuação:** A pontuação é baseada em precisão e velocidade (quanto mais rápido o jogador responder, mais pontos ele ganha).
- **📱 Design Responsivo:** Interface adaptada para telas grandes (Host) e telas pequenas (Jogadores).

## 🛠️ Tecnologias Utilizadas

### Back-end
- **Node.js** (Ambiente de execução)
- **Express** (Framework Web)
- **Socket.io** (Protocolo WebSocket/Real-Time)

### Front-end
- **HTML5**
- **CSS3** (Responsivo e Animado)
- **JavaScript Vanilla** (Sem frameworks pesados)

## 📦 Pré-requisitos

Para rodar este projeto localmente, você precisa ter instalado na sua máquina:

- **[Node.js](https://nodejs.org/)** (Versão 14 ou superior)
- **npm** (Gerenciador de pacotes, já incluso no Node)

## 🔧 Como Rodar o Projeto

Siga os passos abaixo para executar o servidor localmente:

### 1. Clonar ou Baixar o Projeto

Clone ou faça o download do repositório para uma pasta no seu computador.

### 2. Instalar Dependências

Abra o terminal (Prompt de Comando ou PowerShell) na pasta do projeto e execute:

```bash
npm install
```
Isso instalará todas as dependências listadas no package.json, como o express e o socket.io listados no projeto.

### 3. Iniciar o Servidor
No terminal, execute o comando:

```bash
node server.js
```
Isso iniciará o servidor. 

### 4. Acessar o Jogo
O terminal exibirá uma mensagem como:
```bash
Servidor rodando em http://192.168.x.x:3000
```
**Para o HOST (Tela Principal):**
 Abra esse endereço no navegador do seu computador/notebook (preferencialmente Chrome ou Edge).
**Clique em "Criar Nova Partida (Host)"**.

**Para os PLAYERS (Celulares):**
Certifique-se de que o celular está conectado à **mesma rede Wi-Fi** do computador.
Escaneie o **QR Code** exibido na tela do Host **ou** digite o endereço IP e a porta no navegador do celular.
Insira o **PIN** exibido na tela do Host.

## 🎮 Como Jogar

- **Lobby:** O Host cria a sala e aguarda. Os jogadores entram pelo celular, digitam seus nomes e aguardam no Lobby.

- **Início:** Quando todos estiverem conectados, o Host clica em "INICIAR PARTIDA".

- **Perguntas:**
  - As perguntas aparecem na tela do Host (Projetor).
  - No celular, aparecem apenas os botões coloridos e as opções correspondentes.

- **Respostas:** Os jogadores devem selecionar a opção correta antes que o tempo (15s) acabe.

- **Pontuação:** Ao fim de cada rodada, o sistema mostra quem acertou e atualiza o Ranking.

- **Fim de Jogo:** Após 10 rodadas, o pódio final é exibido no Host e o resultado individual aparece no celular de cada jogador.

## 📂 Estrutura de Arquivos

- `server.js`: Código principal do servidor. Gerencia as salas, conexões WebSocket, lógica de pontuação e banco de perguntas.
- `public/`: Pasta com os arquivos estáticos (Front-end).
  - `index.html`: Estrutura única da aplicação (SPA).
  - `style.css`: Estilização visual e animações.
  - `client.js`: Lógica do lado do cliente (manipulação do DOM e eventos de WebSocket).

## 👨‍💻 Autores

- **Ana Laura Neuhaus Vega**
- **Gabriela Bitencourt Freire da Silva**
- **Isabella Vieira da Motta**

Projeto desenvolvido para fins acadêmicos - UFF 2025.
