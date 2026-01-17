// ===== OBZVON Game =====

// Game Settings
const settings = {
    targetSize: 70,
    spawnInterval: 500,
    targetLifetime: 1100,
    gameTime: 60
};

// Game State
const game = {
    isRunning: false,
    isPaused: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    timeLeft: 60,
    targets: [],
    spawnIntervalId: null,
    timerInterval: null
};

// DOM Elements
const elements = {
    hero: document.getElementById('hero'),
    settingsScreen: document.getElementById('settingsScreen'),
    gameScreen: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOver'),
    gameArea: document.getElementById('gameArea'),
    gamePaused: document.getElementById('gamePaused'),
    startBtn: document.getElementById('startBtn'),
    playBtn: document.getElementById('playBtn'),
    backBtn: document.getElementById('backBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    quitBtn: document.getElementById('quitBtn'),
    restartBtn: document.getElementById('restartBtn'),
    menuBtn: document.getElementById('menuBtn'),
    score: document.getElementById('score'),
    combo: document.getElementById('combo'),
    timer: document.getElementById('timer'),
    accuracy: document.getElementById('accuracy'),
    multiplier: document.getElementById('multiplier'),
    finalScore: document.getElementById('finalScore'),
    finalHits: document.getElementById('finalHits'),
    finalMisses: document.getElementById('finalMisses'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalMaxCombo: document.getElementById('finalMaxCombo'),
    footer: document.querySelector('.footer'),
    // Settings inputs
    targetSizeInput: document.getElementById('targetSize'),
    spawnSpeedInput: document.getElementById('spawnSpeed'),
    targetLifeInput: document.getElementById('targetLife'),
    gameTimeInput: document.getElementById('gameTime'),
    targetSizeValue: document.getElementById('targetSizeValue'),
    spawnSpeedValue: document.getElementById('spawnSpeedValue'),
    targetLifeValue: document.getElementById('targetLifeValue'),
    gameTimeValue: document.getElementById('gameTimeValue')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initEventListeners();
    initSettingsListeners();
});

// Initialize Event Listeners
function initEventListeners() {
    // Start Button -> Show Settings
    elements.startBtn.addEventListener('click', showSettings);

    // Play Button -> Start Game
    elements.playBtn.addEventListener('click', startGame);

    // Back Button -> Show Menu
    elements.backBtn.addEventListener('click', showMenu);

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

// Initialize Settings Listeners
function initSettingsListeners() {
    elements.targetSizeInput.addEventListener('input', (e) => {
        settings.targetSize = parseInt(e.target.value);
        elements.targetSizeValue.textContent = settings.targetSize + 'px';
    });

    elements.spawnSpeedInput.addEventListener('input', (e) => {
        settings.spawnInterval = parseInt(e.target.value);
        elements.spawnSpeedValue.textContent = settings.spawnInterval + 'ms';
    });

    elements.targetLifeInput.addEventListener('input', (e) => {
        settings.targetLifetime = parseInt(e.target.value);
        elements.targetLifeValue.textContent = settings.targetLifetime + 'ms';
    });

    elements.gameTimeInput.addEventListener('input', (e) => {
        settings.gameTime = parseInt(e.target.value);
        elements.gameTimeValue.textContent = settings.gameTime + 's';
    });
}

// Show Settings
function showSettings() {
    elements.hero.classList.add('hidden');
    elements.footer.classList.add('hidden');
    elements.settingsScreen.classList.add('active');
}

// Show Menu
function showMenu() {
    elements.hero.classList.remove('hidden');
    elements.footer.classList.remove('hidden');
    elements.settingsScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.gameOver.classList.remove('active');
}

// Keyboard Handler
function handleKeyboard(e) {
    // Space to start
    if (e.code === 'Space') {
        e.preventDefault();
        if (elements.hero.classList.contains('hidden') === false) {
            showSettings();
        } else if (elements.settingsScreen.classList.contains('active')) {
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

    // ESC to quit/back
    if (e.code === 'Escape') {
        if (game.isRunning) {
            quitGame();
        } else if (elements.settingsScreen.classList.contains('active')) {
            showMenu();
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
    game.timeLeft = settings.gameTime;
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
    elements.settingsScreen.classList.remove('active');
    elements.gameScreen.classList.add('active');
    elements.gameOver.classList.remove('active');

    // Start spawning targets
    game.spawnIntervalId = setInterval(spawnTarget, settings.spawnInterval);

    // Start timer
    game.timerInterval = setInterval(updateTimer, 1000);

    // Spawn first target immediately
    spawnTarget();
}

// Spawn Target
function spawnTarget() {
    if (!game.isRunning || game.isPaused) return;

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

    clearInterval(game.spawnIntervalId);
    clearInterval(game.timerInterval);

    elements.gameScreen.classList.remove('active');
    showSettings();
}

// End Game
function endGame() {
    game.isRunning = false;

    clearInterval(game.spawnIntervalId);
    clearInterval(game.timerInterval);

    // Calculate final accuracy
    const total = game.hits + game.misses;
    const accuracy = total > 0 ? Math.round((game.hits / total) * 100) : 0;

    // Update game over screen
    elements.finalScore.textContent = game.score;
    elements.finalHits.textContent = game.hits;
    elements.finalMisses.textContent = game.misses;
    elements.finalAccuracy.textContent = accuracy + '%';
    elements.finalMaxCombo.textContent = game.maxCombo;

    // Show game over screen
    elements.gameScreen.classList.remove('active');
    elements.gameOver.classList.add('active');
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
