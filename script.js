// ===== OBZVON Game =====

// Game State
const game = {
    isRunning: false,
    isPaused: false,
    difficulty: 'easy',
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    timeLeft: 60,
    targets: [],
    spawnInterval: null,
    timerInterval: null,
    highScores: {
        easy: 0,
        medium: 0,
        hard: 0
    },
    bestCombos: {
        easy: 0,
        medium: 0,
        hard: 0
    }
};

// Difficulty Settings
const difficultySettings = {
    easy: {
        targetSize: 85,
        spawnInterval: 650,
        targetLifetime: 1400
    },
    medium: {
        targetSize: 70,
        spawnInterval: 480,
        targetLifetime: 1100
    },
    hard: {
        targetSize: 55,
        spawnInterval: 350,
        targetLifetime: 800
    }
};

// DOM Elements
const elements = {
    hero: document.getElementById('hero'),
    gameScreen: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOver'),
    gameArea: document.getElementById('gameArea'),
    gamePaused: document.getElementById('gamePaused'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    quitBtn: document.getElementById('quitBtn'),
    restartBtn: document.getElementById('restartBtn'),
    menuBtn: document.getElementById('menuBtn'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    score: document.getElementById('score'),
    combo: document.getElementById('combo'),
    timer: document.getElementById('timer'),
    accuracy: document.getElementById('accuracy'),
    multiplier: document.getElementById('multiplier'),
    highScore: document.getElementById('highScore'),
    bestCombo: document.getElementById('bestCombo'),
    finalScore: document.getElementById('finalScore'),
    finalHits: document.getElementById('finalHits'),
    finalMisses: document.getElementById('finalMisses'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalMaxCombo: document.getElementById('finalMaxCombo'),
    newRecord: document.getElementById('newRecord'),
    footer: document.querySelector('.footer')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHighScores();
    initParticles();
    initEventListeners();
    updateHighScoreDisplay();
});

// Load High Scores from localStorage
function loadHighScores() {
    const saved = localStorage.getItem('obzvon_scores');
    if (saved) {
        const data = JSON.parse(saved);
        game.highScores = data.highScores || game.highScores;
        game.bestCombos = data.bestCombos || game.bestCombos;
    }
}

// Save High Scores to localStorage
function saveHighScores() {
    localStorage.setItem('obzvon_scores', JSON.stringify({
        highScores: game.highScores,
        bestCombos: game.bestCombos
    }));
}

// Update High Score Display
function updateHighScoreDisplay() {
    elements.highScore.textContent = game.highScores[game.difficulty];
    elements.bestCombo.textContent = game.bestCombos[game.difficulty];
}

// Initialize Event Listeners
function initEventListeners() {
    // Start Button
    elements.startBtn.addEventListener('click', startGame);

    // Difficulty Buttons
    elements.diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.difficulty = btn.dataset.diff;
            updateHighScoreDisplay();
        });
    });

    // Pause Button
    elements.pauseBtn.addEventListener('click', togglePause);

    // Quit Button
    elements.quitBtn.addEventListener('click', quitGame);

    // Restart Button
    elements.restartBtn.addEventListener('click', () => {
        elements.gameOver.classList.remove('active');
        startGame();
    });

    // Menu Button
    elements.menuBtn.addEventListener('click', () => {
        elements.gameOver.classList.remove('active');
        showMenu();
    });

    // Game Area Click (for misses)
    elements.gameArea.addEventListener('click', (e) => {
        if (!game.isRunning || game.isPaused) return;
        if (e.target === elements.gameArea) {
            handleMiss(e.clientX, e.clientY);
        }
    });

    // Keyboard Controls
    document.addEventListener('keydown', handleKeyboard);
}

// Keyboard Handler
function handleKeyboard(e) {
    // Space to start/restart
    if (e.code === 'Space') {
        e.preventDefault();
        if (!game.isRunning && !elements.gameScreen.classList.contains('active') && !elements.gameOver.classList.contains('active')) {
            startGame();
        } else if (elements.gameOver.classList.contains('active')) {
            elements.gameOver.classList.remove('active');
            startGame();
        }
    }

    // P to pause
    if (e.code === 'KeyP' && game.isRunning) {
        togglePause();
    }

    // ESC to quit
    if (e.code === 'Escape') {
        if (game.isRunning) {
            quitGame();
        } else if (elements.gameOver.classList.contains('active')) {
            elements.gameOver.classList.remove('active');
            showMenu();
        }
    }
}

// Start Game
function startGame() {
    // Reset game state
    game.score = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.hits = 0;
    game.misses = 0;
    game.timeLeft = 60;
    game.targets = [];
    game.isRunning = true;
    game.isPaused = false;

    // Clear game area
    elements.gameArea.innerHTML = '<div class="game-paused" id="gamePaused"><h2>PAUSED</h2><p>Нажми <kbd>P</kbd> чтобы продолжить</p></div>';

    // Update UI
    updateHUD();

    // Show game screen
    elements.hero.classList.add('hidden');
    elements.footer.classList.add('hidden');
    elements.gameScreen.classList.add('active');
    elements.gameOver.classList.remove('active');
    elements.gamePaused.classList.remove('active');

    // Start spawning targets
    const settings = difficultySettings[game.difficulty];
    game.spawnInterval = setInterval(spawnTarget, settings.spawnInterval);

    // Start timer
    game.timerInterval = setInterval(updateTimer, 1000);

    // Spawn first target immediately
    spawnTarget();
}

// Spawn Target
function spawnTarget() {
    if (!game.isRunning || game.isPaused) return;

    const settings = difficultySettings[game.difficulty];
    const gameRect = elements.gameArea.getBoundingClientRect();

    // Calculate safe spawn area
    const padding = settings.targetSize;
    const maxX = gameRect.width - padding * 2;
    const maxY = gameRect.height - padding * 2;

    // Random position
    const x = Math.random() * maxX + padding;
    const y = Math.random() * maxY + padding;

    // Create target element
    const target = document.createElement('div');
    target.classList.add('target');

    // Random color
    const colors = ['purple', 'yellow', 'green'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    target.classList.add(color);

    // Set size and position
    target.style.width = settings.targetSize + 'px';
    target.style.height = settings.targetSize + 'px';
    target.style.left = x + 'px';
    target.style.top = y + 'px';

    // Store spawn time
    const spawnTime = Date.now();
    target.dataset.spawnTime = spawnTime;

    // Click handler
    target.addEventListener('click', (e) => {
        e.stopPropagation();
        handleHit(target, spawnTime);
    });

    // Add to game area
    elements.gameArea.appendChild(target);
    game.targets.push(target);

    // Remove after lifetime
    setTimeout(() => {
        if (target.parentNode && !target.classList.contains('hit')) {
            target.classList.add('expired');
            handleExpired(target);
            setTimeout(() => {
                if (target.parentNode) {
                    target.remove();
                }
            }, 200);
        }
    }, settings.targetLifetime);
}

// Handle Hit
function handleHit(target, spawnTime) {
    if (!game.isRunning || game.isPaused) return;

    target.classList.add('hit');

    // Calculate reaction time
    const reactionTime = Date.now() - spawnTime;

    // Calculate points based on speed
    let points;
    let rating;

    if (reactionTime < 200) {
        points = 50;
        rating = 'perfect';
    } else if (reactionTime < 400) {
        points = 35;
        rating = 'great';
    } else if (reactionTime < 700) {
        points = 22;
        rating = 'good';
    } else {
        points = 12;
        rating = 'good';
    }

    // Update combo
    game.combo++;
    if (game.combo > game.maxCombo) {
        game.maxCombo = game.combo;
    }

    // Apply multiplier
    const multiplier = getMultiplier();
    const finalPoints = Math.floor(points * multiplier);

    // Update score
    game.score += finalPoints;
    game.hits++;

    // Show score popup
    const rect = target.getBoundingClientRect();
    const gameRect = elements.gameArea.getBoundingClientRect();
    showScorePopup(
        rect.left - gameRect.left + rect.width / 2,
        rect.top - gameRect.top,
        '+' + finalPoints,
        rating
    );

    // Update HUD
    updateHUD();

    // Remove target
    setTimeout(() => {
        if (target.parentNode) {
            target.remove();
        }
        const index = game.targets.indexOf(target);
        if (index > -1) {
            game.targets.splice(index, 1);
        }
    }, 300);
}

// Handle Miss
function handleMiss(clientX, clientY) {
    game.combo = 0;
    game.misses++;

    // Show miss popup
    const gameRect = elements.gameArea.getBoundingClientRect();
    showScorePopup(
        clientX - gameRect.left,
        clientY - gameRect.top,
        'MISS',
        'miss'
    );

    updateHUD();
}

// Handle Expired Target
function handleExpired(target) {
    game.combo = 0;
    game.misses++;

    // Show miss popup at target position
    const rect = target.getBoundingClientRect();
    const gameRect = elements.gameArea.getBoundingClientRect();
    showScorePopup(
        rect.left - gameRect.left + rect.width / 2,
        rect.top - gameRect.top,
        'MISS',
        'miss'
    );

    updateHUD();
}

// Get Multiplier
function getMultiplier() {
    if (game.combo >= 10) return 1.9;
    if (game.combo >= 5) return 1.4;
    return 1.0;
}

// Show Score Popup
function showScorePopup(x, y, text, type) {
    const popup = document.createElement('div');
    popup.classList.add('score-popup', type);
    popup.textContent = text;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';

    elements.gameArea.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 800);
}

// Update HUD
function updateHUD() {
    elements.score.textContent = game.score;
    elements.combo.textContent = 'x' + game.combo;
    elements.timer.textContent = game.timeLeft;

    // Calculate accuracy
    const total = game.hits + game.misses;
    const accuracy = total > 0 ? Math.round((game.hits / total) * 100) : 100;
    elements.accuracy.textContent = accuracy + '%';

    // Update multiplier
    const mult = getMultiplier();
    elements.multiplier.textContent = 'x' + mult.toFixed(1);

    // Add boost effect
    if (mult > 1) {
        elements.multiplier.classList.add('boosted');
    } else {
        elements.multiplier.classList.remove('boosted');
    }
}

// Update Timer
function updateTimer() {
    if (!game.isRunning || game.isPaused) return;

    game.timeLeft--;
    elements.timer.textContent = game.timeLeft;

    if (game.timeLeft <= 0) {
        endGame();
    }
}

// Toggle Pause
function togglePause() {
    if (!game.isRunning) return;

    game.isPaused = !game.isPaused;

    const pausedEl = document.getElementById('gamePaused');
    if (game.isPaused) {
        pausedEl.classList.add('active');
    } else {
        pausedEl.classList.remove('active');
    }
}

// Quit Game
function quitGame() {
    game.isRunning = false;
    game.isPaused = false;

    clearInterval(game.spawnInterval);
    clearInterval(game.timerInterval);

    elements.gameScreen.classList.remove('active');
    showMenu();
}

// End Game
function endGame() {
    game.isRunning = false;

    clearInterval(game.spawnInterval);
    clearInterval(game.timerInterval);

    // Check for new high score
    let isNewRecord = false;
    if (game.score > game.highScores[game.difficulty]) {
        game.highScores[game.difficulty] = game.score;
        isNewRecord = true;
    }

    if (game.maxCombo > game.bestCombos[game.difficulty]) {
        game.bestCombos[game.difficulty] = game.maxCombo;
    }

    saveHighScores();

    // Calculate final accuracy
    const total = game.hits + game.misses;
    const accuracy = total > 0 ? Math.round((game.hits / total) * 100) : 0;

    // Update game over screen
    elements.finalScore.textContent = game.score;
    elements.finalHits.textContent = game.hits;
    elements.finalMisses.textContent = game.misses;
    elements.finalAccuracy.textContent = accuracy + '%';
    elements.finalMaxCombo.textContent = game.maxCombo;

    if (isNewRecord) {
        elements.newRecord.classList.add('active');
    } else {
        elements.newRecord.classList.remove('active');
    }

    // Show game over screen
    elements.gameScreen.classList.remove('active');
    elements.gameOver.classList.add('active');
}

// Show Menu
function showMenu() {
    elements.hero.classList.remove('hidden');
    elements.footer.classList.remove('hidden');
    elements.gameScreen.classList.remove('active');
    elements.gameOver.classList.remove('active');
    updateHighScoreDisplay();
}

// Particles
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 3 + 1;
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = Math.random() * 4 + 6;

    particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
    `;

    container.appendChild(particle);
}
