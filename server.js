const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

// Load car data
const carsData = JSON.parse(fs.readFileSync('./cars.json', 'utf8'));

// Game state storage (in-memory for this prototype)
let gameState = null;

// Utility functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createNewGame() {
    const shuffledCards = shuffleArray(carsData.cards.map(card => card.id));
    
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

function getCardById(cardId) {
    return carsData.cards.find(card => card.id === cardId);
}

function compareCards(cardA, cardB, attribute) {
    const attrConfig = carsData.attributes[attribute];
    const valueA = cardA.attrs[attribute];
    const valueB = cardB.attrs[attribute];
    
    if (attrConfig.direction === 'max') {
        return valueA > valueB ? 'A' : valueA < valueB ? 'B' : null;
    } else { // min
        return valueA < valueB ? 'A' : valueA > valueB ? 'B' : null;
    }
}

// API Routes

// Get game attributes
app.get('/api/attributes', (req, res) => {
    res.json(carsData.attributes);
});

// Create new game
app.post('/api/game/new', (req, res) => {
    gameState = createNewGame();
    res.json({ success: true, gameId: gameState.id });
});

// Get current game state
app.get('/api/game/state', (req, res) => {
    if (!gameState) {
        return res.status(404).json({ error: 'No active game' });
    }
    
    res.json(gameState);
});

// Get current player's top card
app.get('/api/game/player/:playerId/top-card', (req, res) => {
    const { playerId } = req.params;
    
    if (!gameState || !gameState.players[playerId]) {
        return res.status(404).json({ error: 'Game or player not found' });
    }
    
    const player = gameState.players[playerId];
    if (player.deck.length === 0) {
        return res.status(404).json({ error: 'No cards left' });
    }
    
    const topCardId = player.deck[0];
    const card = getCardById(topCardId);
    
    res.json(card);
});

// Advance to next phase
app.post('/api/game/next-phase', (req, res) => {
    if (!gameState) {
        return res.status(404).json({ error: 'No active game' });
    }
    
    const phases = ['SETUP', 'ROTATE_PROMPT', 'PRIVATE_SELECT', 'REVEAL', 'RESOLVE', 'CHECK_END', 'GAME_OVER'];
    const currentIndex = phases.indexOf(gameState.phase);
    
    if (currentIndex < phases.length - 1) {
        gameState.phase = phases[currentIndex + 1];
    }
    
    res.json({ success: true, phase: gameState.phase });
});

// Set game phase
app.post('/api/game/set-phase', (req, res) => {
    const { phase } = req.body;
    
    if (!gameState) {
        return res.status(404).json({ error: 'No active game' });
    }
    
    gameState.phase = phase;
    res.json({ success: true, phase: gameState.phase });
});

// Select attribute for current round
app.post('/api/game/select-attribute', (req, res) => {
    const { attribute } = req.body;
    
    if (!gameState) {
        return res.status(404).json({ error: 'No active game' });
    }
    
    if (!carsData.attributes[attribute]) {
        return res.status(400).json({ error: 'Invalid attribute' });
    }
    
    // Get current cards
    const playerA = gameState.players.A;
    const playerB = gameState.players.B;
    
    if (playerA.deck.length === 0 || playerB.deck.length === 0) {
        gameState.phase = 'GAME_OVER';
        return res.json({ success: true, phase: 'GAME_OVER' });
    }
    
    const cardA = getCardById(playerA.deck[0]);
    const cardB = getCardById(playerB.deck[0]);
    
    // Compare cards
    const winnerId = compareCards(cardA, cardB, attribute);
    
    // Store round result
    gameState.lastRound = {
        chosenAttr: attribute,
        cardsPlayed: { A: cardA.id, B: cardB.id },
        winnerId: winnerId
    };
    
    gameState.phase = 'REVEAL';
    
    res.json({ 
        success: true, 
        result: {
            cardA,
            cardB,
            attribute,
            winnerId,
            values: {
                A: cardA.attrs[attribute],
                B: cardB.attrs[attribute]
            }
        }
    });
});

// Resolve round (move cards)
app.post('/api/game/resolve-round', (req, res) => {
    if (!gameState || !gameState.lastRound) {
        return res.status(400).json({ error: 'No round to resolve' });
    }
    
    const { winnerId } = gameState.lastRound;
    const playerA = gameState.players.A;
    const playerB = gameState.players.B;
    
    // Remove top cards from both players
    const cardA = playerA.deck.shift();
    const cardB = playerB.deck.shift();
    
    if (winnerId) {
        // Someone won - they get all cards
        const winner = gameState.players[winnerId];
        const loser = gameState.players[winnerId === 'A' ? 'B' : 'A'];
        
        // Add cards to end of winner's deck: winner's card, loser's card, then pot
        if (winnerId === 'A') {
            winner.deck.push(cardA, cardB, ...gameState.pot);
        } else {
            winner.deck.push(cardB, cardA, ...gameState.pot);
        }
        
        // Clear pot
        gameState.pot = [];
        
        // Winner becomes next turn player
        gameState.turnPlayerId = winnerId;
    } else {
        // Tie - cards go to pot
        gameState.pot.push(cardA, cardB);
        // Turn player stays the same
    }
    
    // Check if game is over
    if (playerA.deck.length === 0) {
        gameState.phase = 'GAME_OVER';
        gameState.winnerId = 'B';
    } else if (playerB.deck.length === 0) {
        gameState.phase = 'GAME_OVER';
        gameState.winnerId = 'A';
    } else {
        gameState.phase = 'ROTATE_PROMPT';
    }
    
    res.json({ 
        success: true, 
        phase: gameState.phase,
        deckSizes: { A: playerA.deck.length, B: playerB.deck.length },
        potSize: gameState.pot.length
    });
});

// Get game statistics
app.get('/api/game/stats', (req, res) => {
    if (!gameState) {
        return res.status(404).json({ error: 'No active game' });
    }
    
    res.json({
        deckSizes: {
            A: gameState.players.A.deck.length,
            B: gameState.players.B.deck.length
        },
        potSize: gameState.pot.length,
        currentTurn: gameState.turnPlayerId,
        phase: gameState.phase
    });
});

app.listen(PORT, () => {
    console.log(`Super Trunfo server running at http://localhost:${PORT}`);
});