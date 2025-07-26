# Super Trunfo - Carros 🏎️

Um jogo digital de Super Trunfo com carros esportivos, desenvolvido para 2 jogadores locais na mesma tela.

## 🎮 [Jogar Online](https://fspseva.github.io/supertrunfo/)

## 📖 Sobre o Jogo

Super Trunfo é um clássico jogo de cartas onde os jogadores competem usando diferentes atributos dos carros. O objetivo é conquistar todas as cartas do baralho!

### Regras

1. **Objetivo**: Ficar com todas as cartas do adversário
2. **Preparação**: O baralho é embaralhado e dividido igualmente entre os dois jogadores
3. **Rodadas**: 
   - O jogador da vez escolhe um atributo da sua carta
   - Ambas as cartas são reveladas e comparadas
   - Quem tiver o melhor valor no atributo escolhido vence a rodada
   - O vencedor leva todas as cartas da rodada para o final do seu deck
4. **Empate**: Em caso de empate, as cartas vão para um "pot" que será conquistado pelo vencedor da próxima rodada
5. **Vitória**: O primeiro jogador a ficar sem cartas perde

### Atributos dos Carros

- **Velocidade Máxima** (km/h) - *Maior vence*
- **Potência** (HP) - *Maior vence*  
- **Aceleração** (0-100 km/h em segundos) - *Menor vence*
- **Cilindrada** (cc) - *Maior vence*
- **Peso** (kg) - *Menor vence*

## 🚗 Carros Inclusos

O jogo inclui 21 carros esportivos icônicos:

- **Hypercars**: Koenigsegg Jesko Absolut, Bugatti Bolide, McLaren Speedtail
- **Supercars**: Ferrari LaFerrari, Lamborghini Revuelto, Ferrari Daytona SP3
- **Sports Cars**: Porsche 911 GT3 RS, Alpine A110 S, Mazda Furai
- **Muscle Cars**: Chevrolet Camaro ZL1, Dodge Challenger SRT Hellcat
- **Elétricos**: Porsche Taycan Turbo GT, XPeng P7 Performance, Ford Mustang Mach-E GT
- **E muito mais!**

## 🎯 Como Jogar

1. **Iniciar**: Clique em "Iniciar Novo Jogo"
2. **Rotação**: Quando aparecer "Vire o tablet para o Jogador X", passe o dispositivo para o jogador indicado
3. **Seleção**: O jogador da vez vê apenas sua carta e escolhe um atributo clicando nele
4. **Revelação**: Ambas as cartas são mostradas com o resultado da comparação
5. **Próxima Rodada**: Continue até que um jogador fique sem cartas

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura da interface
- **CSS3** - Design responsivo e animações
- **JavaScript ES6+** - Lógica do jogo e interações

### Backend
- **Node.js** - Servidor
- **Express.js** - API REST
- **JSON** - Banco de dados das cartas

### Recursos
- **Design Responsivo** - Funciona em tablets, celulares e desktops
- **Interface Intuitiva** - Experiência otimizada para touchscreen
- **Animações Suaves** - Transições e efeitos visuais
- **Imagens Reais** - Fotos oficiais dos carros

## 🚀 Executar Localmente

### Pré-requisitos
- Node.js (versão 14 ou superior)
- NPM ou Yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/fspseva/supertrunfo.git
cd supertrunfo
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

4. Abra o navegador em:
```
http://localhost:3000
```

### Scripts Disponíveis

- `npm start` - Inicia o servidor de produção
- `npm run dev` - Inicia o servidor de desenvolvimento (com nodemon)

## 📁 Estrutura do Projeto

```
supertrunfo/
├── carros_imgs/          # Imagens dos carros
├── cars.json            # Dados das cartas
├── server.js            # Servidor Express
├── index.html           # Interface principal
├── style.css            # Estilos
├── game.js              # Lógica do frontend
├── package.json         # Dependências
└── README.md           # Este arquivo
```

## 🎨 Features

- ✅ **Jogo Local PvP** - 2 jogadores na mesma tela
- ✅ **Seleção Privada** - Jogador escolhe atributo sem o oponente ver
- ✅ **Mecânica Clássica** - Regras autênticas do Super Trunfo
- ✅ **Sistema de Pot** - Acúmulo de cartas em empates
- ✅ **21 Carros Únicos** - Variedade de veículos esportivos
- ✅ **Interface Responsiva** - Otimizada para diferentes telas
- ✅ **Efeitos Visuais** - Animações e feedback visual

## 🔮 Próximas Features

- 🔄 **Modo Online** - Multiplayer em dispositivos separados
- 🏆 **Sistema de Ranking** - Histórico de vitórias
- 🎲 **Mais Baralhos** - Categorias como motos, aviões, etc.
- 💾 **Persistência** - Salvar jogos em progresso
- 🎵 **Efeitos Sonoros** - Audio feedback

## 📄 Licença

Este projeto é open source e está disponível sob a [MIT License](LICENSE).

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 👨‍💻 Autor

**Fabio Seva** - [@fspseva](https://github.com/fspseva)

## 🙏 Agradecimentos

- Imagens dos carros por cortesia da [Wikimedia Commons](https://commons.wikimedia.org/)
- Inspirado no clássico jogo Super Trunfo da Grow

---

**[🎮 Jogar Agora](https://fspseva.github.io/supertrunfo/)**