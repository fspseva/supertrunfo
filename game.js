class SuperTrunfoGameStatic {
    constructor() {
        this.carsData = null;
        this.gameState = null;
        this.currentPhase = 'WELCOME';
        this.selectedAttribute = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadCarsData().then(success => {
            if (!success) {
                this.startGameBtn.disabled = true;
                this.startGameBtn.textContent = 'Erro ao carregar dados';
            }
        });
    }

    async loadCarsData() {
        try {
            const response = await fetch('./cars.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.carsData = await response.json();
            
            if (!this.carsData?.cards || !this.carsData?.attributes) {
                throw new Error('Invalid data format');
            }
            return true;
        } catch (error) {
            console.error('Error loading cars data:', error);
            this.showErrorMessage('Failed to load game data. Please refresh the page.');
            return false;
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
        
        // Remove one random card if total is odd to ensure equal distribution
        let gameCards = shuffledCards;
        if (shuffledCards.length % 2 === 1) {
            gameCards = shuffledCards.slice(0, -1); // Remove last card after shuffle
        }
        
        // Split equally between players
        const midPoint = gameCards.length / 2;
        const playerADeck = gameCards.slice(0, midPoint);
        const playerBDeck = gameCards.slice(midPoint);
        
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
            history: [],
            excludedCard: shuffledCards.length % 2 === 1 ? shuffledCards[shuffledCards.length - 1] : null
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
        
        // Deck visualization elements
        this.deckStack = document.getElementById('deck-stack');
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
        
        // Initialize 3D card effects
        this.init3DCardEffects();
    }
    
    init3DCardEffects() {
        // Get all cards and set up 3D effects for both single and comparison cards
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            this.setup3DCardEvents(card);
        });
    }
    
    setup3DCardEvents(card) {
        // Find shine overlay in card-front if it exists, otherwise use direct child
        const shineOverlay = card.querySelector('.card-front .shine-overlay') || card.querySelector('.shine-overlay');
        let isThrottled = false;
        
        const handleMouseMove = (e) => {
            // Throttle mouse movement for performance
            if (isThrottled) return;
            isThrottled = true;
            requestAnimationFrame(() => {
                isThrottled = false;
            });
            
            const rect = card.getBoundingClientRect();
            const cardWidth = rect.width;
            const cardHeight = rect.height;
            
            // Get mouse position relative to card center
            const mouseX = e.clientX - rect.left - cardWidth / 2;
            const mouseY = e.clientY - rect.top - cardHeight / 2;
            
            // Calculate rotation angles (limit to ±15 degrees max for natural movement)
            const rotateX = -(mouseY / cardHeight) * 15;
            const rotateY = (mouseX / cardWidth) * 15;
            
            // Calculate shine effect positions
            const pointerX = ((e.clientX - rect.left) / cardWidth) * 100;
            const pointerY = ((e.clientY - rect.top) / cardHeight) * 100;
            const angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
            
            // Apply 3D rotation using CSS custom properties
            const isComparisonCard = card.closest('.cards-comparison');
            let baseScale = isComparisonCard ? 'var(--comparison-card-scale)' : 'var(--single-card-scale)';
            
            // Update CSS custom properties for 3D rotation
            card.style.setProperty('--rotate-x', `${rotateX}deg`);
            card.style.setProperty('--rotate-y', `${rotateY}deg`);
            card.style.setProperty('--scale', baseScale);
            
            // Update CSS custom properties for subtle shine effects
            card.style.setProperty('--shine-x', `${pointerX}%`);
            card.style.setProperty('--shine-y', `${pointerY}%`);
            card.style.setProperty('--shine-angle', `${angle}`);
            
            // Calculate shine opacity based on mouse distance from center (subtle effect)
            const distanceFromCenter = Math.sqrt(Math.pow(mouseX / cardWidth, 2) + Math.pow(mouseY / cardHeight, 2));
            const maxShineOpacity = 0.3; // Much more subtle than the original holographic effect
            const shineOpacity = Math.min(distanceFromCenter * maxShineOpacity, maxShineOpacity);
            card.style.setProperty('--shine-opacity', shineOpacity);
            
            // Enhanced dynamic shadow for depth perception
            const shadowOffsetX = (mouseX / cardWidth) * 8;
            const shadowOffsetY = (mouseY / cardHeight) * 8;
            const shadowBlur = 30 + Math.abs(rotateX) + Math.abs(rotateY);
            card.style.boxShadow = `
                ${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, 0.3),
                0 15px 35px rgba(0, 0, 0, 0.15)
            `;
            
            // The shine overlay background is now handled by CSS variables
            // No need to manually update the background property
        };
        
        const handleMouseEnter = (e) => {
            card.classList.add('card-3d-hover');
            card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
            
            // Enable subtle shine effects
            card.style.setProperty('--shine-opacity', '0.1');
        };
        
        const handleMouseLeave = (e) => {
            card.classList.remove('card-3d-hover');
            
            // Reset to neutral position with smooth transition
            const isComparisonCard = card.closest('.cards-comparison');
            let baseScale = isComparisonCard ? 'var(--comparison-card-scale)' : 'var(--single-card-scale)';
            
            // Reset CSS custom properties for 3D rotation
            card.style.setProperty('--rotate-x', '0deg');
            card.style.setProperty('--rotate-y', '0deg');
            card.style.setProperty('--scale', baseScale);
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            
            // Reset CSS custom properties for shine effects
            card.style.setProperty('--shine-x', '50%');
            card.style.setProperty('--shine-y', '50%');
            card.style.setProperty('--shine-angle', '0deg');
            card.style.setProperty('--shine-opacity', '0');
            
            // Reset box shadow
            card.style.boxShadow = '';
            
            // Shine overlay resets automatically via CSS variables
        };
        
        // Touch events for mobile
        const handleTouchStart = (e) => {
            card.classList.add('card-3d-hover');
            
            // Simulate mouse position from touch
            const touch = e.touches[0];
            const mockMouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            handleMouseMove(mockMouseEvent);
        };
        
        const handleTouchMove = (e) => {
            // Don't prevent default to maintain touch scrolling and attribute clicking
            const touch = e.touches[0];
            const mockMouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            handleMouseMove(mockMouseEvent);
        };
        
        const handleTouchEnd = (e) => {
            setTimeout(() => {
                handleMouseLeave(e);
            }, 200);
        };
        
        // Add event listeners
        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    triggerCardFlipAnimation(cardElement) {
        if (!cardElement) return;
        
        // Reset any existing animations
        cardElement.classList.remove('card-flip-animation', 'card-flip-complete');
        
        // Force reflow to ensure clean state
        cardElement.offsetHeight;
        
        // Add flip animation class (only for turn start)
        cardElement.classList.add('card-flip-animation');
        cardElement.style.pointerEvents = 'none';
        
        // Clean up animation classes after animation completes
        setTimeout(() => {
            cardElement.classList.remove('card-flip-animation');
            cardElement.classList.add('card-flip-complete');
            cardElement.style.pointerEvents = '';
        }, 1200); // 1.2s animation duration
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
        
        // Show pot and excluded card info
        let potText = `Pot: ${this.gameState.pot.length} cartas`;
        if (this.gameState.excludedCard) {
            const excludedCardData = this.getCardById(this.gameState.excludedCard);
            potText += ` | Excluída: ${excludedCardData?.name || 'Carta'}`;
        }
        this.potInfo.textContent = potText;
        
        const currentPlayerName = this.gameState.players[this.gameState.turnPlayerId].name;
        this.turnIndicator.textContent = `Turno: ${currentPlayerName}`;
        
        // Update deck visualization
        this.updateDeckDisplay();
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
            
            // Trigger card flip animation after a brief delay to ensure card is displayed
            setTimeout(() => {
                // Animate card leaving deck first
                this.animateCardLeavingDeck();
                // Then trigger card flip animation
                setTimeout(() => {
                    this.triggerCardFlipAnimation(this.currentCard);
                }, 200); // Small delay to coordinate animations
            }, 100);
        }, 500);
    }

    displayCard(card) {
        this.cardName.textContent = card.name;
        this.cardImg.src = card.imageUrl;
        this.cardImg.alt = card.name;
        
        // Query attribute rows from the card-front element
        const attributeRows = this.currentCard.querySelectorAll('.card-front .attribute-row');
        attributeRows.forEach(row => {
            const attr = row.dataset.attr;
            const value = card.attrs[attr];
            const valueSpan = row.querySelector('.attr-value');
            
            const formattedValue = this.formatAttributeValue(attr, value);
            valueSpan.textContent = formattedValue;
            
            if (this.carsData.attributes[attr]) {
                const nameSpan = row.querySelector('.attr-name');
                nameSpan.textContent = this.carsData.attributes[attr].name;
            }
        });
        
        attributeRows.forEach(row => {
            row.classList.remove('selected');
        });
        
        // Reinitialize 3D effects for newly displayed card
        this.setup3DCardEvents(this.currentCard);
    }

    selectAttribute(attribute) {
        if (this.currentPhase !== 'PRIVATE_SELECT') return;
        
        this.showLoading();
        
        setTimeout(() => {
            const attributeRows = this.currentCard.querySelectorAll('.card-front .attribute-row');
            attributeRows.forEach(row => {
                row.classList.remove('selected');
            });
            
            const selectedRow = this.currentCard.querySelector(`.card-front [data-attr="${attribute}"]`);
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
        
        // Get comparison cards reference
        const comparisonCards = document.querySelectorAll('.cards-comparison .card');
        
        // Reinitialize 3D effects for comparison cards (no animation on comparison screen)
        setTimeout(() => {
            comparisonCards.forEach(card => {
                this.setup3DCardEvents(card);
            });
        }, 100);
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
                
                const formattedValue = this.formatAttributeValue(attr, value);
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
            // In a tie, the current player continues to choose the attribute
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
            Jogador 1: ${playerA.deck.length} cartas<br>
            Jogador 2: ${playerB.deck.length} cartas<br>
            Cartas no pot: ${this.gameState.pot.length}
        `;
        
        this.hideDeckDisplay();
        this.showScreen('game-over');
    }

    showErrorMessage(message) {
        alert(message);
    }

    formatAttributeValue(attr, value) {
        switch(attr) {
            case 'maxSpeed': return `${value} km/h`;
            case 'power': return `${value} HP`;
            case 'acceleration': return `${value} s`;
            case 'displacement': return value === 0 ? 'Elétrico' : `${value} cc`;
            case 'weight': return `${value} kg`;
            default: return value;
        }
    }

    resetToWelcome() {
        this.gameState = null;
        this.currentPhase = 'WELCOME';
        this.selectedAttribute = null;
        this.hideDeckDisplay();
        this.showScreen('welcome');
    }

    // ===========================
    // DECK VISUALIZATION METHODS
    // ===========================
    
    updateDeckDisplay() {
        if (!this.gameState || !this.deckStack) return;
        
        const currentPlayer = this.gameState.players[this.gameState.turnPlayerId];
        const remainingCards = currentPlayer.deck.length;
        
        // Clear existing deck cards
        this.deckStack.innerHTML = '';
        
        // Calculate how many cards to show (max 5)
        const cardsToShow = Math.min(remainingCards, 5);
        
        // Create deck cards
        for (let i = 0; i < cardsToShow; i++) {
            const deckCard = document.createElement('div');
            deckCard.className = 'deck-card';
            deckCard.setAttribute('data-index', i);
            
            // Add entering animation for new cards
            if (i === 0) {
                deckCard.classList.add('entering');
            }
            
            this.deckStack.appendChild(deckCard);
        }
        
        // Update deck label with current player
        const deckLabel = document.querySelector('.deck-label');
        if (deckLabel) {
            const playerName = currentPlayer.name;
            deckLabel.textContent = `${playerName}: ${remainingCards}`;
        }
    }
    
    animateCardLeavingDeck() {
        if (!this.deckStack) return;
        
        const topCard = this.deckStack.querySelector('.deck-card:first-child');
        if (topCard) {
            topCard.classList.add('leaving');
            
            // Don't remove or update here - let the natural game flow handle it
            // The animation will just make the top card fly away visually
        }
    }
    
    hideDeckDisplay() {
        if (this.deckStack) {
            this.deckStack.innerHTML = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SuperTrunfoGameStatic();
});