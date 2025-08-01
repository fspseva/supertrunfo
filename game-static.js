class SuperTrunfoGameStatic {
    constructor() {
        this.carsData = null;
        this.gameState = null;
        this.currentPhase = 'WELCOME';
        this.selectedAttribute = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadCarsData();
        this.initializeHolographicCards();
    }

    async loadCarsData() {
        try {
            const response = await fetch('./cars.json');
            this.carsData = await response.json();
        } catch (error) {
            console.error('Error loading cars data:', error);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createNewGame() {
        const shuffledCards = this.shuffleArray(this.carsData.cards.map(card => card.id));
        
        const midPoint = Math.ceil(shuffledCards.length / 2);
        const playerADeck = shuffledCards.slice(0, midPoint);
        const playerBDeck = shuffledCards.slice(midPoint);
        
        return {
            id: Date.now().toString(),
            players: {
                A: { id: 'A', name: 'Jogador 1', deck: playerADeck },
                B: { id: 'B', name: 'Jogador 2', deck: playerBDeck }
            },
            turnPlayerId: 'A',
            phase: 'SETUP',
            pot: [],
            lastRound: null,
            history: []
        };
    }

    getCardById(cardId) {
        return this.carsData.cards.find(card => card.id === cardId);
    }

    compareCards(cardA, cardB, attribute) {
        const attrConfig = this.carsData.attributes[attribute];
        const valueA = cardA.attrs[attribute];
        const valueB = cardB.attrs[attribute];
        
        if (attrConfig.direction === 'max') {
            return valueA > valueB ? 'A' : valueA < valueB ? 'B' : null;
        } else {
            return valueA < valueB ? 'A' : valueA > valueB ? 'B' : null;
        }
    }

    initializeElements() {
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.rotateScreen = document.getElementById('rotate-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.loadingOverlay = document.getElementById('loading');
        
        this.startGameBtn = document.getElementById('start-game');
        this.continueBtn = document.getElementById('continue-btn');
        this.nextRoundBtn = document.getElementById('next-round-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        
        this.currentPlayerName = document.getElementById('current-player-name');
        this.playerACards = document.getElementById('player-a-cards');
        this.playerBCards = document.getElementById('player-b-cards');
        this.potInfo = document.getElementById('pot-info');
        this.turnIndicator = document.getElementById('turn-indicator');
        
        this.currentCard = document.getElementById('current-card');
        this.cardName = document.getElementById('card-name');
        this.cardImg = document.getElementById('card-img');
        
        this.cardSelection = document.getElementById('card-selection');
        this.cardReveal = document.getElementById('card-reveal');
        
        this.cardAName = document.getElementById('card-a-name');
        this.cardAImg = document.getElementById('card-a-img');
        this.cardBName = document.getElementById('card-b-name');
        this.cardBImg = document.getElementById('card-b-img');
        this.resultText = document.getElementById('result-text');
        
        this.winnerText = document.getElementById('winner-text');
        this.finalStatsText = document.getElementById('final-stats-text');
    }

    attachEventListeners() {
        this.startGameBtn.addEventListener('click', () => this.startNewGame());
        this.continueBtn.addEventListener('click', () => this.showCardSelection());
        this.nextRoundBtn.addEventListener('click', () => this.nextRound());
        this.newGameBtn.addEventListener('click', () => this.resetToWelcome());
        
        this.currentCard.addEventListener('click', (e) => {
            const attributeRow = e.target.closest('.attribute-row');
            if (attributeRow && this.currentPhase === 'PRIVATE_SELECT') {
                const attribute = attributeRow.dataset.attr;
                this.selectAttribute(attribute);
            }
        });
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    startNewGame() {
        if (!this.carsData) {
            alert('Carregando dados do jogo...');
            return;
        }
        
        this.showLoading();
        
        setTimeout(() => {
            this.gameState = this.createNewGame();
            this.updateGameDisplay();
            this.showRotatePrompt();
            this.hideLoading();
        }, 500);
    }

    updateGameDisplay() {
        if (!this.gameState) return;
        
        const playerA = this.gameState.players.A;
        const playerB = this.gameState.players.B;
        
        this.playerACards.textContent = `${playerA.name}: ${playerA.deck.length} cartas`;
        this.playerBCards.textContent = `${playerB.name}: ${playerB.deck.length} cartas`;
        this.potInfo.textContent = `Pot: ${this.gameState.pot.length} cartas`;
        
        const currentPlayerName = this.gameState.players[this.gameState.turnPlayerId].name;
        this.turnIndicator.textContent = `Turno: ${currentPlayerName}`;
    }

    showRotatePrompt() {
        this.currentPhase = 'ROTATE_PROMPT';
        
        const currentPlayerName = this.gameState.players[this.gameState.turnPlayerId].name;
        this.currentPlayerName.textContent = currentPlayerName;
        
        this.showScreen('rotate');
    }

    showCardSelection() {
        this.showLoading();
        
        setTimeout(() => {
            const playerId = this.gameState.turnPlayerId;
            const player = this.gameState.players[playerId];
            
            if (player.deck.length === 0) {
                this.endGame();
                return;
            }
            
            const topCardId = player.deck[0];
            const card = this.getCardById(topCardId);
            
            this.displayCard(card);
            this.currentPhase = 'PRIVATE_SELECT';
            
            this.cardSelection.classList.remove('hidden');
            this.cardReveal.classList.add('hidden');
            this.showScreen('game');
            this.hideLoading();
        }, 500);
    }

    displayCard(card) {
        this.cardName.textContent = card.name;
        this.cardImg.src = card.imageUrl;
        this.cardImg.alt = card.name;
        
        const attributeRows = this.currentCard.querySelectorAll('.attribute-row');
        attributeRows.forEach(row => {
            const attr = row.dataset.attr;
            const value = card.attrs[attr];
            const valueSpan = row.querySelector('.attr-value');
            
            let formattedValue = value;
            if (attr === 'maxSpeed') {
                formattedValue = `${value} km/h`;
            } else if (attr === 'power') {
                formattedValue = `${value} HP`;
            } else if (attr === 'acceleration') {
                formattedValue = `${value} s`;
            } else if (attr === 'displacement') {
                formattedValue = value === 0 ? 'Elétrico' : `${value} cc`;
            } else if (attr === 'weight') {
                formattedValue = `${value} kg`;
            }
            
            valueSpan.textContent = formattedValue;
            
            if (this.carsData.attributes[attr]) {
                const nameSpan = row.querySelector('.attr-name');
                nameSpan.textContent = this.carsData.attributes[attr].name;
            }
        });
        
        attributeRows.forEach(row => {
            row.classList.remove('selected');
        });
    }

    selectAttribute(attribute) {
        if (this.currentPhase !== 'PRIVATE_SELECT') return;
        
        this.showLoading();
        
        setTimeout(() => {
            const attributeRows = this.currentCard.querySelectorAll('.attribute-row');
            attributeRows.forEach(row => {
                row.classList.remove('selected');
            });
            
            const selectedRow = this.currentCard.querySelector(`[data-attr="${attribute}"]`);
            if (selectedRow) {
                selectedRow.classList.add('selected');
            }
            
            const playerA = this.gameState.players.A;
            const playerB = this.gameState.players.B;
            
            if (playerA.deck.length === 0 || playerB.deck.length === 0) {
                this.endGame();
                return;
            }
            
            const cardA = this.getCardById(playerA.deck[0]);
            const cardB = this.getCardById(playerB.deck[0]);
            
            const winnerId = this.compareCards(cardA, cardB, attribute);
            
            this.gameState.lastRound = {
                chosenAttr: attribute,
                cardsPlayed: { A: cardA.id, B: cardB.id },
                winnerId: winnerId
            };
            
            const result = {
                cardA,
                cardB,
                attribute,
                winnerId,
                values: {
                    A: cardA.attrs[attribute],
                    B: cardB.attrs[attribute]
                }
            };
            
            this.selectedAttribute = attribute;
            this.updateGameDisplay();
            this.showCardReveal(result);
            this.hideLoading();
        }, 1000);
    }

    showCardReveal(result) {
        this.currentPhase = 'REVEAL';
        
        this.displayRevealCard('A', result.cardA);
        this.displayRevealCard('B', result.cardB);
        
        this.highlightChosenAttribute(result.attribute, result.values, result.winnerId);
        this.showResult(result.winnerId);
        
        this.cardSelection.classList.add('hidden');
        this.cardReveal.classList.remove('hidden');
    }

    displayRevealCard(player, card) {
        const nameElement = document.getElementById(`card-${player.toLowerCase()}-name`);
        const imgElement = document.getElementById(`card-${player.toLowerCase()}-img`);
        
        nameElement.textContent = card.name;
        imgElement.src = card.imageUrl;
        imgElement.alt = card.name;
        
        Object.keys(card.attrs).forEach(attr => {
            const attrElement = document.getElementById(`attr-${player.toLowerCase()}-${attr}`);
            if (attrElement) {
                const value = card.attrs[attr];
                const valueSpan = attrElement.querySelector('.attr-value');
                
                let formattedValue = value;
                if (attr === 'maxSpeed') {
                    formattedValue = `${value} km/h`;
                } else if (attr === 'power') {
                    formattedValue = `${value} HP`;
                } else if (attr === 'acceleration') {
                    formattedValue = `${value} s`;
                } else if (attr === 'displacement') {
                    formattedValue = value === 0 ? 'Elétrico' : `${value} cc`;
                } else if (attr === 'weight') {
                    formattedValue = `${value} kg`;
                }
                
                valueSpan.textContent = formattedValue;
            }
        });
    }

    highlightChosenAttribute(attribute, values, winnerId) {
        document.querySelectorAll('.attribute-row').forEach(row => {
            row.classList.remove('selected', 'winner', 'loser');
        });
        
        const attrAElement = document.getElementById(`attr-a-${attribute}`);
        const attrBElement = document.getElementById(`attr-b-${attribute}`);
        
        if (attrAElement && attrBElement) {
            attrAElement.classList.add('selected');
            attrBElement.classList.add('selected');
            
            if (winnerId === 'A') {
                attrAElement.classList.add('winner');
                attrBElement.classList.add('loser');
            } else if (winnerId === 'B') {
                attrBElement.classList.add('winner');
                attrAElement.classList.add('loser');
            }
        }
    }

    showResult(winnerId) {
        if (winnerId === 'A') {
            this.resultText.textContent = 'Jogador 1 Venceu!';
            this.resultText.className = 'result-text winner';
        } else if (winnerId === 'B') {
            this.resultText.textContent = 'Jogador 2 Venceu!';
            this.resultText.className = 'result-text winner';
        } else {
            this.resultText.textContent = 'Empate!';
            this.resultText.className = 'result-text tie';
        }
    }

    nextRound() {
        this.showLoading();
        
        setTimeout(() => {
            this.resolveRound();
            this.hideLoading();
        }, 500);
    }

    resolveRound() {
        if (!this.gameState.lastRound) return;
        
        const { winnerId } = this.gameState.lastRound;
        const playerA = this.gameState.players.A;
        const playerB = this.gameState.players.B;
        
        const cardA = playerA.deck.shift();
        const cardB = playerB.deck.shift();
        
        if (winnerId) {
            const winner = this.gameState.players[winnerId];
            
            if (winnerId === 'A') {
                winner.deck.push(cardA, cardB, ...this.gameState.pot);
            } else {
                winner.deck.push(cardB, cardA, ...this.gameState.pot);
            }
            
            this.gameState.pot = [];
            this.gameState.turnPlayerId = winnerId;
        } else {
            this.gameState.pot.push(cardA, cardB);
        }
        
        if (playerA.deck.length === 0) {
            this.gameState.phase = 'GAME_OVER';
            this.gameState.winnerId = 'B';
            this.endGame();
        } else if (playerB.deck.length === 0) {
            this.gameState.phase = 'GAME_OVER';
            this.gameState.winnerId = 'A';
            this.endGame();
        } else {
            this.updateGameDisplay();
            this.showRotatePrompt();
        }
    }

    endGame() {
        this.currentPhase = 'GAME_OVER';
        
        const winner = this.gameState.winnerId === 'A' ? 'Jogador 1' : 'Jogador 2';
        this.winnerText.textContent = `${winner} Venceu!`;
        
        const playerA = this.gameState.players.A;
        const playerB = this.gameState.players.B;
        
        this.finalStatsText.innerHTML = `
            <strong>Resultado Final:</strong><br>
            ${playerA.name}: ${playerA.deck.length} cartas<br>
            ${playerB.name}: ${playerB.deck.length} cartas<br>
            Cartas no pot: ${this.gameState.pot.length}
        `;
        
        this.showScreen('game-over');
    }

    resetToWelcome() {
        this.gameState = null;
        this.currentPhase = 'WELCOME';
        this.selectedAttribute = null;
        this.showScreen('welcome');
    }

    // Holographic Card Effect Implementation
    initializeHolographicCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            this.setupHolographicEffect(card);
        });
    }

    setupHolographicEffect(card) {
        let rafId = null;
        let isActive = false;
        
        const clamp = (val, min = 0, max = 100) => Math.min(Math.max(val, min), max);
        const round = (val, precision = 3) => parseFloat(val.toFixed(precision));
        const adjust = (val, fromMin, fromMax, toMin, toMax) => 
            round(toMin + ((toMax - toMin) * (val - fromMin)) / (fromMax - fromMin));
        const easeInOutCubic = (x) => 
            x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

        const updateTransform = (offsetX, offsetY, rect) => {
            if (!rect) return;
            
            const { width, height } = rect;
            const percentX = clamp((100 / width) * offsetX);
            const percentY = clamp((100 / height) * offsetY);
            const centerX = percentX - 50;
            const centerY = percentY - 50;
            const distanceFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);

            // Calculate rotation based on mouse position
            const rotateX = round(adjust(percentY, 0, 100, 20, -20), 2);
            const rotateY = round(adjust(percentX, 0, 100, -20, 20), 2);
            
            // Calculate effect intensities
            const pointerFromCenter = round(clamp(distanceFromCenter, 0, 50) / 50, 2);
            const rainbowOpacity = round(0.4 * pointerFromCenter, 2);
            const foilOpacity = round(0.6 * pointerFromCenter, 2);
            const glareOpacity = round(0.8 * pointerFromCenter, 2);
            const glareAngle = round(Math.atan2(centerY, centerX) * (180 / Math.PI), 2);
            
            // Background positions
            const bgPosX = round(adjust(percentX, 0, 100, 0, 100), 2);
            const bgPosY = round(adjust(percentY, 0, 100, 0, 100), 2);
            
            // Update CSS custom properties
            card.style.setProperty('--holo-pointer-x', `${percentX}%`);
            card.style.setProperty('--holo-pointer-y', `${percentY}%`);
            card.style.setProperty('--holo-pointer-from-center', pointerFromCenter);
            card.style.setProperty('--holo-card-rotation-x', `${rotateX}deg`);
            card.style.setProperty('--holo-card-rotation-y', `${rotateY}deg`);
            card.style.setProperty('--holo-background-position-x', `${bgPosX}%`);
            card.style.setProperty('--holo-background-position-y', `${bgPosY}%`);
            card.style.setProperty('--holo-glare-opacity', glareOpacity);
            card.style.setProperty('--holo-glare-angle', glareAngle);
            card.style.setProperty('--holo-rainbow-opacity', rainbowOpacity);
            card.style.setProperty('--holo-rainbow-saturation', 1 + pointerFromCenter);
            card.style.setProperty('--holo-foil-opacity', foilOpacity);
            card.style.setProperty('--holo-background-animation', 'running');
        };

        const resetTransform = () => {
            const duration = 600;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeInOutCubic(progress);
                
                // Interpolate back to center
                const centerRotateX = 0;
                const centerRotateY = 0;
                const centerOpacity = 0;
                const centerPosition = 50;
                
                card.style.setProperty('--holo-pointer-x', `${centerPosition}%`);
                card.style.setProperty('--holo-pointer-y', `${centerPosition}%`);
                card.style.setProperty('--holo-pointer-from-center', centerOpacity);
                card.style.setProperty('--holo-card-rotation-x', `${centerRotateX * (1 - easedProgress)}deg`);
                card.style.setProperty('--holo-card-rotation-y', `${centerRotateY * (1 - easedProgress)}deg`);
                card.style.setProperty('--holo-background-position-x', `${centerPosition}%`);
                card.style.setProperty('--holo-background-position-y', `${centerPosition}%`);
                card.style.setProperty('--holo-glare-opacity', centerOpacity * (1 - easedProgress));
                card.style.setProperty('--holo-rainbow-opacity', centerOpacity * (1 - easedProgress));
                card.style.setProperty('--holo-foil-opacity', centerOpacity * (1 - easedProgress));
                
                if (progress < 1) {
                    rafId = requestAnimationFrame(animate);
                } else {
                    card.style.setProperty('--holo-background-animation', 'paused');
                    isActive = false;
                }
            };
            
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(animate);
        };

        // Mouse events
        card.addEventListener('mouseenter', () => {
            isActive = true;
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });
        
        card.addEventListener('mousemove', (e) => {
            if (!isActive) return;
            
            const rect = card.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            
            updateTransform(offsetX, offsetY, rect);
        });
        
        card.addEventListener('mouseleave', () => {
            if (isActive) {
                resetTransform();
            }
        });
        
        // Touch events for mobile
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isActive = true;
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        });
        
        card.addEventListener('touchmove', (e) => {
            if (!isActive) return;
            e.preventDefault();
            
            const rect = card.getBoundingClientRect();
            const touch = e.touches[0];
            const offsetX = touch.clientX - rect.left;
            const offsetY = touch.clientY - rect.top;
            
            updateTransform(offsetX, offsetY, rect);
        });
        
        card.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isActive) {
                resetTransform();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SuperTrunfoGameStatic();
});