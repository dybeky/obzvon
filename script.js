// ===== OBZVON Game =====

// Game Settings
const settings = {
    targetSize: 70,
    spawnInterval: 500,
    targetLifetime: 1100
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
    elapsedTime: 0,
    targets: [],
    spawnIntervalId: null,
    timerInterval: null
};

// Preview State
let previewInterval = null;

// DOM Elements
const elements = {
    hero: document.getElementById('hero'),
    settingsScreen: document.getElementById('settingsScreen'),
    gameScreen: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOver'),
    gameArea: document.getElementById('gameArea'),
    gamePaused: document.getElementById('gamePaused'),
    previewArea: document.getElementById('previewArea'),
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
    finalTime: document.getElementById('finalTime'),
    finalHits: document.getElementById('finalHits'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalMaxCombo: document.getElementById('finalMaxCombo'),
    footer: document.querySelector('.footer'),
    // Settings inputs
    targetSizeInput: document.getElementById('targetSize'),
    spawnSpeedInput: document.getElementById('spawnSpeed'),
    targetLifeInput: document.getElementById('targetLife'),
    targetSizeValue: document.getElementById('targetSizeValue'),
    spawnSpeedValue: document.getElementById('spawnSpeedValue'),
    targetLifeValue: document.getElementById('targetLifeValue')
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
    elements.quitBtn.addEventListener('click', endGame);

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

    // Touch support for game area misses
    elements.gameArea.addEventListener('touchstart', (e) => {
        if (!game.isRunning || game.isPaused) return;
        if (e.target === elements.gameArea) {
            const touch = e.touches[0];
            handleMiss(touch.clientX, touch.clientY);
        }
    }, { passive: true });

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
        const seconds = (settings.spawnInterval / 1000).toFixed(1);
        elements.spawnSpeedValue.textContent = seconds + ' сек';
        // Restart preview with new settings
        restartPreview();
    });

    elements.targetLifeInput.addEventListener('input', (e) => {
        settings.targetLifetime = parseInt(e.target.value);
        const seconds = (settings.targetLifetime / 1000).toFixed(1);
        elements.targetLifeValue.textContent = seconds + ' сек';
    });
}

// Show Settings
function showSettings() {
    elements.hero.classList.add('hidden');
    elements.footer.classList.add('hidden');
    elements.settingsScreen.classList.add('active');
    startPreview();
}

// Show Menu
function showMenu() {
    stopPreview();
    elements.hero.classList.remove('hidden');
    elements.footer.classList.remove('hidden');
    elements.settingsScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.gameOver.classList.remove('active');
}

// Start Preview
function startPreview() {
    stopPreview();
    spawnPreviewTarget();
    previewInterval = setInterval(spawnPreviewTarget, settings.spawnInterval);
}

// Stop Preview
function stopPreview() {
    if (previewInterval) {
        clearInterval(previewInterval);
        previewInterval = null;
    }
    if (elements.previewArea) {
        elements.previewArea.innerHTML = '';
    }
}

// Restart Preview
function restartPreview() {
    if (elements.settingsScreen.classList.contains('active')) {
        startPreview();
    }
}

// Spawn Preview Target
function spawnPreviewTarget() {
    if (!elements.previewArea) return;

    const rect = elements.previewArea.getBoundingClientRect();
    const padding = settings.targetSize;
    const maxX = rect.width - padding * 2;
    const maxY = rect.height - padding * 2;

    if (maxX <= 0 || maxY <= 0) return;

    const x = Math.random() * maxX + padding;
    const y = Math.random() * maxY + padding;

    const target = document.createElement('div');
    target.classList.add('preview-target');

    const colors = ['purple', 'yellow', 'green'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    target.classList.add(color);

    target.style.width = settings.targetSize + 'px';
    target.style.height = settings.targetSize + 'px';
    target.style.left = x + 'px';
    target.style.top = y + 'px';

    elements.previewArea.appendChild(target);

    // Fade out after lifetime
    setTimeout(() => {
        if (target.parentNode) {
            target.classList.add('fade-out');
            setTimeout(() => {
                if (target.parentNode) {
                    target.remove();
                }
            }, 300);
        }
    }, settings.targetLifetime);
}

// Keyboard Handler
function handleKeyboard(e) {
    // Space to start
    if (e.code === 'Space') {
        e.preventDefault();
        if (!elements.hero.classList.contains('hidden')) {
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
            endGame();
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
    stopPreview();

    // Reset game state
    game.score = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.hits = 0;
    game.misses = 0;
    game.elapsedTime = 0;
    game.targets = [];
    game.isRunning = true;
    game.isPaused = false;

    // Clear game area
    elements.gameArea.innerHTML = '<div class="game-paused" id="gamePaused"><h2>PAUSED</h2><p>Нажми <kbd>P</kbd> чтобы продолжить</p><p>Нажми <kbd>ESC</kbd> чтобы выйти</p></div>';

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

    // Start timer (counting up)
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

    // Touch handler for faster mobile response
    target.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleHit(target, spawnTime);
    }, { passive: false });

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

// Format time
function formatTimeDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// Update HUD
function updateHUD() {
    elements.score.textContent = game.score;
    elements.combo.textContent = 'x' + game.combo;
    elements.timer.textContent = formatTimeDisplay(game.elapsedTime);

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

// Update Timer (counting up)
function updateTimer() {
    if (!game.isRunning || game.isPaused) return;

    game.elapsedTime++;
    elements.timer.textContent = formatTimeDisplay(game.elapsedTime);
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

// End Game
function endGame() {
    game.isRunning = false;
    game.isPaused = false;

    clearInterval(game.spawnIntervalId);
    clearInterval(game.timerInterval);

    // Calculate final accuracy
    const total = game.hits + game.misses;
    const accuracy = total > 0 ? Math.round((game.hits / total) * 100) : 0;

    // Update game over screen
    elements.finalScore.textContent = game.score;
    elements.finalTime.textContent = formatTimeDisplay(game.elapsedTime);
    elements.finalHits.textContent = game.hits;
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
