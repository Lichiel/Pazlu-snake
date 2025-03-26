// --- Strict mode ---
"use strict";

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const scoreElement = document.getElementById('score');
const scoreMultiplierElement = document.getElementById('scoreMultiplier');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const finalScoreValueElement = document.getElementById('finalScoreValue');
const titleContainerElement = document.getElementById('titleContainer');
const startPauseButton = document.getElementById('startPauseButton');
const restartButton = document.getElementById('restartButton');
const volumeSlider = document.getElementById('volumeSlider');
const musicVolumeSlider = document.getElementById('musicVolumeSlider');
const gameContainer = document.querySelector('.game-container');
const debugInfoElement = document.getElementById('debugInfo');

// Config Modal Elements
const configButton = document.getElementById('configButton');
const configModal = document.getElementById('configModal');
const closeConfigModalButton = document.getElementById('closeConfigModalButton');
const applyConfigButton = document.getElementById('applyConfigButton');
const configSpeedInput = document.getElementById('configSpeed');
const configSnakeColorInput = document.getElementById('configSnakeColor');
const configFoodColorInput = document.getElementById('configFoodColor');
const configBgColorInput = document.getElementById('configBgColor');
const configObstacleColorInput = document.getElementById('configObstacleColor');
const configPowerupColorInput = document.getElementById('configPowerupColor');
const configEnableObstaclesInput = document.getElementById('configEnableObstacles');
const configObstacleCountInput = document.getElementById('configObstacleCount');

// --- Audio Elements ---
const bgMusic = document.getElementById('bgMusic');
const walkSound = document.getElementById('walkSound');
const eatSound = document.getElementById('eatSound');
const oopsSound = document.getElementById('oopsSound');
const powerupSound = document.getElementById('powerupSound');
const allSounds = [walkSound, eatSound, oopsSound, powerupSound];

// --- Fixed Global Constants ---
const EYE_COLOR = '#000000';
const DEAD_EYE_COLOR = '#333333';
const MIN_SWIPE_DISTANCE = 30;

// --- Game Configuration (Defaults) ---
let config = {
    GRID_SIZE: 30, INITIAL_GAME_SPEED: 180,
    SNAKE_COLOR: '#FF69B4', SNAKE_BORDER_COLOR: '#d147a3', SNAKE_GLOW_COLOR: 'rgba(255, 105, 180, 0.5)',
    FOOD_COLOR: '#90EE90', FOOD_BORDER_COLOR: '#7CCD7C', FOOD_GLOW_COLOR: 'rgba(173, 255, 47, 0.6)',
    BACKGROUND_COLOR: '#005000', OBSTACLE_COLOR: '#555555', OBSTACLE_BORDER_COLOR: '#333333',
    POWERUP_COLOR: '#ffd700', POWERUP_BORDER_COLOR: '#e6c200', POWERUP_GLOW_COLOR: 'rgba(255, 215, 0, 0.7)',
    WALL_HIT_PENALTY: 5, MIN_GAME_SPEED: 60, SPEED_INCREMENT: 3, MIN_SNAKE_LENGTH: 1,
    EYE_APPEAR_LENGTH: 5, TEEN_LENGTH: 10, ADULT_LENGTH: 15,
    TEEN_PATTERN_COLOR: 'rgba(0, 0, 0, 0.15)', TEEN_BORDER_COLOR: '#b82e8a', NOSTRIL_COLOR: 'rgba(0, 0, 0, 0.4)',
    FOOD_PULSE_SPEED: 300, MIN_SNAKE_OPACITY: 0.3, GAME_OVER_HEAD_SCALE: 2.0,
    BACKGROUND_PARTICLE_COUNT: 40, EAT_PARTICLE_COUNT: 20,
    SHAKE_BASE_INTENSITY: 3, SHAKE_DURATION_FRAMES: 6,
    OBSTACLE_COUNT: 5, POWERUP_SPAWN_CHANCE: 0.05, POWERUP_DURATION_FRAMES: 300,
    ENABLE_OBSTACLES: true,
};

// --- Game Constants (Derived) ---
let CANVAS_WIDTH = 450; let CANVAS_HEIGHT = 450; let GRID_WIDTH = 15; let GRID_HEIGHT = 15;

// --- Game State Variables ---
let snake, food = null, dx, dy, changingDirection, score, highScore = 0;
let gameSpeed, gameLoopTimeout, isGameOver, isPaused = true, currentHue = 0;
let rainbowInterval, gameStarted = false;
let backgroundParticles = []; let eatParticles = [];
let shakeDuration = 0; let currentShakeIntensity = 0;
let obstacles = []; let powerUp = null;
let isMultiplierActive = false; let multiplierTimer = 0;
let touchStartX = 0; let touchStartY = 0; let touchEndX = 0; let touchEndY = 0; let isSwiping = false;

// --- Centralized Error Handling ---
function handleError(error, context = "General") {
    console.error(`ERROR in ${context}:`, error.stack || error);
    isGameOver = true; isPaused = true; if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
    if (gameOverElement) {
        const scoreText = typeof score !== 'undefined' ? `Score: ${score}` : 'Score: N/A';
        gameOverElement.innerHTML = `<div class="game-over-title">ERROR!</div><div class="final-score" style="font-size: 0.8em;">${error.message || 'An unknown error occurred.'} (Check Console)<br>${scoreText}</div>`;
        gameOverElement.style.display = 'block'; gameOverElement.style.animation = 'none'; gameOverElement.style.opacity = '1';
    }
    if (startPauseButton) startPauseButton.disabled = true;
    console.log("State at error: ", { isPaused, isGameOver, snakeLen: snake ? snake.length : 'N/A', food, dx, dy, gameSpeed });
}

// --- Basic Checks ---
if (!canvas) { handleError(new Error("Canvas element not found"), "Initial Check"); }
else if (!ctx) { handleError(new Error("Could not get 2D context"), "Initial Check"); }
else { console.log("Canvas and Context OK."); CANVAS_WIDTH = canvas.width; CANVAS_HEIGHT = canvas.height; GRID_WIDTH = Math.floor(CANVAS_WIDTH / config.GRID_SIZE); GRID_HEIGHT = Math.floor(CANVAS_HEIGHT / config.GRID_SIZE); }

// --- Load/Save/Apply Configuration ---
function loadConfig() {
    console.log("Loading config...");
    try {
        const savedConfig = localStorage.getItem('snakeConfigV4');
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            if (typeof parsedConfig.ENABLE_OBSTACLES === 'boolean') { config.ENABLE_OBSTACLES = parsedConfig.ENABLE_OBSTACLES; }
            for (const key in config) {
                 if (parsedConfig.hasOwnProperty(key) && typeof parsedConfig[key] === typeof config[key] && typeof config[key] !== 'boolean') { config[key] = parsedConfig[key]; }
            }
            console.log("Saved config found and merged.");
        } else { console.log("No saved config found, using defaults."); }
        console.log("Current config:", JSON.stringify(config));
        applyColorConfigToCSS();
    } catch (e) { handleError(e, "loadConfig"); localStorage.removeItem('snakeConfigV4'); }
}
function saveConfig() { console.log("Saving config..."); try { localStorage.setItem('snakeConfigV4', JSON.stringify(config)); } catch (e) { handleError(e, "saveConfig"); } }
function applyColorConfigToCSS() {
    console.log("Applying colors to CSS/Canvas:", config.BACKGROUND_COLOR);
    try {
        const root = document.documentElement; if (!root) { throw new Error("Root element not found"); }
        root.style.setProperty('--snake-color', config.SNAKE_COLOR); root.style.setProperty('--snake-border', config.SNAKE_BORDER_COLOR); root.style.setProperty('--snake-glow', config.SNAKE_GLOW_COLOR);
        root.style.setProperty('--food-color', config.FOOD_COLOR); root.style.setProperty('--food-border', config.FOOD_BORDER_COLOR); root.style.setProperty('--food-glow', config.FOOD_GLOW_COLOR || 'rgba(173, 255, 47, 0.6)');
        root.style.setProperty('--game-bg-color', config.BACKGROUND_COLOR); root.style.setProperty('--obstacle-color', config.OBSTACLE_COLOR); root.style.setProperty('--obstacle-border', config.OBSTACLE_BORDER_COLOR);
        root.style.setProperty('--powerup-color', config.POWERUP_COLOR); root.style.setProperty('--powerup-border', config.POWERUP_BORDER_COLOR); root.style.setProperty('--powerup-glow', config.POWERUP_GLOW_COLOR);
        if(canvas) canvas.style.backgroundColor = config.BACKGROUND_COLOR;
    } catch (e) { handleError(e, "applyColorConfigToCSS"); }
}

// --- Initialization ---
function initializeGame() {
    console.log("--- INITIALIZING GAME ---");
    let initErrorOccurred = false;
    if (!ctx) { handleError(new Error("Canvas context missing"), "initializeGame Start"); return; }
    try {
        loadConfig();
        GRID_WIDTH = Math.floor(CANVAS_WIDTH / config.GRID_SIZE); GRID_HEIGHT = Math.floor(CANVAS_HEIGHT / config.GRID_SIZE);
        if (GRID_WIDTH <= 0 || GRID_HEIGHT <= 0) throw new Error(`Invalid grid dimensions: ${GRID_WIDTH}x${GRID_HEIGHT}`);
        console.log(`Grid Dimensions: ${GRID_WIDTH}x${GRID_HEIGHT}`);

        clearTimeout(gameLoopTimeout); clearInterval(rainbowInterval); if(bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }

        const startX = Math.floor(GRID_WIDTH / 2); const startY = Math.floor(GRID_HEIGHT / 2);
        if (startX < 2 || startY < 0 || startX >= GRID_WIDTH || startY >= GRID_HEIGHT) { throw new Error(`Invalid starting position: (${startX}, ${startY})`); }
        snake = [ { x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY } ];
        console.log("Initial snake state:", JSON.stringify(snake));

        obstacles = []; if (config.ENABLE_OBSTACLES) generateObstacles(); else console.log("Obstacles disabled.");

        dx = 1; dy = 0; score = 0; gameSpeed = config.INITIAL_GAME_SPEED;
        changingDirection = false; isGameOver = false; isPaused = true; gameStarted = false;
        shakeDuration = 0; eatParticles = []; powerUp = null; isMultiplierActive = false; multiplierTimer = 0;
        updateMultiplierDisplay();

        highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        if (scoreElement) scoreElement.textContent = score;
        if (highScoreElement) highScoreElement.textContent = highScore;
        if (gameOverElement) gameOverElement.style.display = 'none';
        if (startPauseButton) { startPauseButton.textContent = 'Start'; startPauseButton.disabled = false; }

        initializeBackgroundParticles();

        console.log("Performing initial draw...");
        applyColorConfigToCSS();
        clearCanvas();
        console.log("Canvas cleared for initial draw.");
        drawBackgroundEffects();
        if (config.ENABLE_OBSTACLES) drawObstacles();
        placeFood();
        if (food) { console.log("Drawing initial food."); drawFood(); }
        else { console.error("CRITICAL: Initial food placement failed."); }

        console.log("Attempting to draw initial snake...");
        if (snake && snake.length > 0) { drawSnake(); }
        else { console.error("Initial snake draw skipped - snake array invalid."); }
        console.log("Initial draw sequence complete.");

        startRainbowBackground(); updateVolume(); updateMusicVolume();

    } catch (initError) { handleError(initError, "initializeGame Main"); initErrorOccurred = true; }

    if (startPauseButton) startPauseButton.disabled = initErrorOccurred;
    console.log("--- INITIALIZATION COMPLETE ---");
}

// --- Sound Helpers ---
function playSound(soundElement, context = "SFX") {
    if (!soundElement || typeof soundElement.play !== 'function') { console.warn(`Cannot play sound - Invalid element for ${context}`); return; }
    if (!gameStarted && context !== "UI" && context !== "Oops") return; // Allow Oops sound even if gameStarted is false (for immediate death)
    try {
        const currentVolume = parseFloat(volumeSlider.value); if (isNaN(currentVolume)) throw new Error("Invalid volume");
        soundElement.volume = currentVolume; soundElement.currentTime = 0;
        const playPromise = soundElement.play();
        if (playPromise !== undefined) { playPromise.catch(error => { if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') { console.error(`Audio play failed for ${soundElement.id || context}:`, error); } }); }
    } catch (e) { handleError(e, `playSound ${soundElement.id || context}`); }
}
function playOopsSound() { playSound(oopsSound, "Oops"); } // This will now play on game over
function playPowerupSound() { playSound(powerupSound, "Powerup"); }

// --- Particle Class & Functions ---
class Particle {
    constructor(x, y, dx, dy, life, color, size) { this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.life = life; this.initialLife = life; this.color = color; this.size = size; }
    update() { this.x += this.dx; this.y += this.dy; this.life--; this.dx *= 0.98; this.dy *= 0.98; }
    draw(ctx) { if (this.life <= 0 || !ctx) return; const alpha = Math.max(0, this.life / this.initialLife) * 0.7; ctx.globalAlpha = alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(0.1, this.size * (this.life / this.initialLife)), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; }
}
function initializeBackgroundParticles() { backgroundParticles = []; const count = config.BACKGROUND_PARTICLE_COUNT; console.log(`Initializing ${count} background particles.`); for (let i = 0; i < count; i++) { backgroundParticles.push(new Particle( Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3, Infinity, 'rgba(255, 255, 255, 0.15)', Math.random() * 1.8 + 0.5 )); } }
function updateBackgroundParticles() { backgroundParticles.forEach(p => { p.update(); if (p.x < 0) p.x = CANVAS_WIDTH; if (p.x > CANVAS_WIDTH) p.x = 0; if (p.y < 0) p.y = CANVAS_HEIGHT; if (p.y > CANVAS_HEIGHT) p.y = 0; }); }
function drawBackgroundParticles(ctx) { if (!ctx) return; backgroundParticles.forEach(p => p.draw(ctx)); }
function spawnEatParticles(x, y, color) { const count = config.EAT_PARTICLE_COUNT; const baseColor = color || config.FOOD_COLOR; for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 2.5 + 0.8; eatParticles.push(new Particle( x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, Math.random() * 40 + 25, baseColor, Math.random() * 2.5 + 1 )); } }
function updateEatParticles() { eatParticles = eatParticles.filter(p => p.life > 0); eatParticles.forEach(p => p.update()); }
function drawEatParticles(ctx) { if (!ctx) return; eatParticles.forEach(p => p.draw(ctx)); }

// --- Obstacle Functions ---
function generateObstacles() { obstacles = []; const obstacleCount = config.OBSTACLE_COUNT; const padding = 2; const startAreaX = Math.floor(GRID_WIDTH / 2) - padding; const startAreaY = Math.floor(GRID_HEIGHT / 2) - padding; const startAreaWidth = padding * 2 + 3; const startAreaHeight = padding * 2 + 1; console.log(`Generating ${obstacleCount} obstacles.`); for (let i = 0; i < obstacleCount; i++) { let newObstaclePos, attempts = 0; const maxAttempts = GRID_WIDTH * GRID_HEIGHT; let isValidPosition = false; while (!isValidPosition && attempts < maxAttempts) { attempts++; newObstaclePos = { x: Math.floor(Math.random() * GRID_WIDTH), y: Math.floor(Math.random() * GRID_HEIGHT) }; const tooCloseToEdge = newObstaclePos.x < padding || newObstaclePos.x >= GRID_WIDTH - padding || newObstaclePos.y < padding || newObstaclePos.y >= GRID_HEIGHT - padding; const inStartArea = newObstaclePos.x >= startAreaX && newObstaclePos.x < startAreaX + startAreaWidth && newObstaclePos.y >= startAreaY && newObstaclePos.y < startAreaY + startAreaHeight; const collidesWithObstacle = obstacles.some(obs => obs.x === newObstaclePos.x && obs.y === newObstaclePos.y); isValidPosition = !(tooCloseToEdge || inStartArea || collidesWithObstacle); } if (isValidPosition) obstacles.push(newObstaclePos); else console.warn(`Could not place obstacle ${i + 1} after ${maxAttempts} attempts.`); } console.log("Obstacles generation complete:", JSON.stringify(obstacles)); }
function drawObstacles() { if (!ctx || !obstacles || obstacles.length === 0) return; try { ctx.fillStyle = config.OBSTACLE_COLOR; ctx.strokeStyle = config.OBSTACLE_BORDER_COLOR; obstacles.forEach(obs => { if(obs) { ctx.fillRect(obs.x * config.GRID_SIZE, obs.y * config.GRID_SIZE, config.GRID_SIZE, config.GRID_SIZE); ctx.strokeRect(obs.x * config.GRID_SIZE, obs.y * config.GRID_SIZE, config.GRID_SIZE, config.GRID_SIZE); }}); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; } catch (e) { handleError(e, "drawObstacles"); } }
function isPositionOccupied(position, checkSnake = true, checkObstacles = true, checkPowerup = true) { if (!position) return false; if (checkObstacles && config.ENABLE_OBSTACLES && obstacles.some(obs => obs && obs.x === position.x && obs.y === position.y)) return true; if (checkSnake && isFoodOnSnake(position)) return true; if (checkPowerup && powerUp && powerUp.x === position.x && powerUp.y === position.y) return true; return false; }

// --- Powerup Functions ---
function maybeSpawnPowerup() { if (powerUp || isMultiplierActive || Math.random() >= config.POWERUP_SPAWN_CHANCE) return; placePowerup(); }
function placePowerup() { let newPos, attempts = 0; const maxAttempts = GRID_WIDTH * GRID_HEIGHT * 2; console.log("Attempting to place powerup..."); try { do { newPos = { x: Math.floor(Math.random() * GRID_WIDTH), y: Math.floor(Math.random() * GRID_HEIGHT) }; attempts++; if (attempts > maxAttempts) { console.warn("Could not place powerup - Max attempts exceeded."); powerUp = null; return; } } while (isPositionOccupied(newPos, true, config.ENABLE_OBSTACLES, false) || (food && food.x === newPos.x && food.y === newPos.y)); powerUp = { ...newPos, type: 'MULTIPLIER', spawntime: Date.now() }; console.log("Powerup spawned:", JSON.stringify(powerUp)); } catch(e) { handleError(e, "placePowerup"); } }
function drawPowerup() { if (!ctx || !powerUp) return; try { const pulseSpeed = 400; const pulseFactor = (Math.sin(Date.now() / pulseSpeed * Math.PI * 2) + 1) / 2; const scale = 0.7 + pulseFactor * 0.3; const size = config.GRID_SIZE * scale; const offset = (config.GRID_SIZE - size) / 2; const drawX = powerUp.x * config.GRID_SIZE + offset; const drawY = powerUp.y * config.GRID_SIZE + offset; ctx.shadowBlur = config.GRID_SIZE * 0.9; ctx.shadowColor = config.POWERUP_GLOW_COLOR; ctx.fillStyle = config.POWERUP_COLOR; ctx.strokeStyle = config.POWERUP_BORDER_COLOR; const spikes = 5, outerRadius = size / 2, innerRadius = outerRadius / 2; let rot = Math.PI / 2 * 3; let step = Math.PI / spikes; const centerX = drawX + size / 2, centerY = drawY + size / 2; ctx.beginPath(); ctx.moveTo(centerX, centerY - outerRadius); for (let i = 0; i < spikes; i++) { let x = centerX + Math.cos(rot) * outerRadius, y = centerY + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step; x = centerX + Math.cos(rot) * innerRadius; y = centerY + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step; } ctx.lineTo(centerX, centerY - outerRadius); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; } catch (e) { handleError(e, "drawPowerup"); } }
function activateMultiplier() { if (isMultiplierActive) return; isMultiplierActive = true; multiplierTimer = config.POWERUP_DURATION_FRAMES; console.log("Score Multiplier Activated!"); updateMultiplierDisplay(); }
function updateMultiplier() { if (isMultiplierActive) { multiplierTimer--; if (multiplierTimer <= 0) { isMultiplierActive = false; multiplierTimer = 0; console.log("Score Multiplier Deactivated."); updateMultiplierDisplay(); } } }
function updateMultiplierDisplay() { if (!scoreMultiplierElement) return; try { if (isMultiplierActive) { scoreMultiplierElement.textContent = '(x2)'; scoreMultiplierElement.classList.remove('multiplier-inactive'); scoreMultiplierElement.classList.add('multiplier-active'); } else { scoreMultiplierElement.textContent = '(x1)'; scoreMultiplierElement.classList.remove('multiplier-active'); scoreMultiplierElement.classList.add('multiplier-inactive'); } } catch(e){ handleError(e, "updateMultiplierDisplay"); } }


// --- Drawing Functions ---
function clearCanvas() { if (!ctx) return; try { const bgColor = config.BACKGROUND_COLOR || '#000000'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); } catch (e) { handleError(e, "clearCanvas"); } }
function drawSnakePart(segment, index, totalLength) {
    // Restored original logic with added logging and safety
    if (!ctx || !segment || typeof segment.x !== 'number' || typeof segment.y !== 'number') { console.error(`drawSnakePart ABORTED index ${index}: Invalid ctx or segment:`, segment); return; }
    try {
        const isHead = index === 0; let currentGridSize = config.GRID_SIZE; let drawX = segment.x * config.GRID_SIZE; let drawY = segment.y * config.GRID_SIZE;
        let segmentOpacity = 1.0; let segmentFillColor = config.SNAKE_COLOR; let segmentBorderColor = config.SNAKE_BORDER_COLOR;

        if (isGameOver && isHead) { currentGridSize = config.GRID_SIZE * config.GAME_OVER_HEAD_SCALE; const offset = (config.GRID_SIZE - currentGridSize) / 2; drawX = (segment.x * config.GRID_SIZE) + offset; drawY = (segment.y * config.GRID_SIZE) + offset; segmentOpacity = 1.0; }
        else { if (totalLength > 1) segmentOpacity = config.MIN_SNAKE_OPACITY + (1.0 - config.MIN_SNAKE_OPACITY) * ((totalLength - 1 - index) / (totalLength - 1)); if (totalLength >= config.TEEN_LENGTH) segmentBorderColor = config.TEEN_BORDER_COLOR; }

        if (!(isGameOver && isHead)) { ctx.shadowBlur = config.GRID_SIZE / 2.5; ctx.shadowColor = config.SNAKE_GLOW_COLOR; }

        // --- LOGGING BEFORE DRAW ---
        const logColor = segmentFillColor;
        console.log(`>>> Drawing segment index ${index} at canvas coords (${drawX.toFixed(1)}, ${drawY.toFixed(1)}) size ${currentGridSize.toFixed(1)} color ${logColor} opacity ${segmentOpacity.toFixed(2)}`);
        if (drawX < -currentGridSize || drawX > CANVAS_WIDTH || drawY < -currentGridSize || drawY > CANVAS_HEIGHT) { console.warn(`   ^ Segment ${index} appears off-canvas!`); }
        // --- END LOGGING ---

        ctx.globalAlpha = segmentOpacity; ctx.fillStyle = segmentFillColor; ctx.strokeStyle = segmentBorderColor;
        ctx.fillRect(drawX, drawY, currentGridSize, currentGridSize);

        if (!isGameOver && totalLength >= config.TEEN_LENGTH && !isHead) { ctx.fillStyle = config.TEEN_PATTERN_COLOR; const patternSize = currentGridSize / 6; ctx.fillRect(drawX + patternSize, drawY + patternSize, patternSize, patternSize); ctx.fillRect(drawX + currentGridSize - patternSize*2, drawY + currentGridSize - patternSize*2, patternSize, patternSize); }
        ctx.strokeRect(drawX, drawY, currentGridSize, currentGridSize);
        ctx.globalAlpha = 1.0; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

        if (isHead && totalLength >= 1) { // Draw Head Features
            if (totalLength >= config.EYE_APPEAR_LENGTH) { // Draw Eyes
                 try {
                     const eyeSizeRatio = 0.2, eyeOffsetRatio = 0.25; const eyeSize = currentGridSize * eyeSizeRatio; const offset = currentGridSize * eyeOffsetRatio;
                     if (isGameOver) { /* Dead Eyes */ const centerX = drawX + currentGridSize / 2, centerY = drawY + currentGridSize / 2; const crossSize = currentGridSize * 0.4; ctx.lineWidth = Math.max(1, currentGridSize * 0.08); ctx.strokeStyle = DEAD_EYE_COLOR; ctx.beginPath(); ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2); ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2); ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2); ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2); ctx.stroke(); ctx.lineWidth = 1; }
                     else { /* Normal Eyes */ ctx.fillStyle = EYE_COLOR; let eye1X, eye1Y, eye2X, eye2Y; if (typeof dx !== 'number' || typeof dy !== 'number') throw new Error("Invalid dx/dy for eyes"); if (dx !== 0) { eye1X = drawX + (dx > 0 ? currentGridSize - eyeSize - offset : offset); eye2X = eye1X; eye1Y = drawY + offset; eye2Y = drawY + currentGridSize - offset - eyeSize; } else { eye1Y = drawY + (dy > 0 ? currentGridSize - eyeSize - offset : offset); eye2Y = eye1Y; eye1X = drawX + offset; eye2X = drawX + currentGridSize - offset - eyeSize; } if (typeof eye1X !== 'number' || typeof eye1Y !== 'number' || typeof eye2X !== 'number' || typeof eye2Y !== 'number' || typeof eyeSize !== 'number' || eyeSize <= 0) throw new Error("Invalid eye coords/size calculated"); ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize); ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize); }
                 } catch (eyeError) { handleError(eyeError, "drawSnakePart - Eyes"); }
            }
            if (!isGameOver && totalLength >= config.ADULT_LENGTH) { // Draw Nostrils
                 try { ctx.fillStyle = config.NOSTRIL_COLOR; const nostrilSize = currentGridSize / 10; const nostrilOffset = currentGridSize / 5; let n1X, n1Y, n2X, n2Y; /* Position logic... */ if (dx === 1) { n1X = drawX + currentGridSize - nostrilOffset - nostrilSize; n2X = n1X; n1Y = drawY + nostrilOffset; n2Y = drawY + currentGridSize - nostrilOffset - nostrilSize; } else if (dx === -1) { n1X = drawX + nostrilOffset; n2X = n1X; n1Y = drawY + nostrilOffset; n2Y = drawY + currentGridSize - nostrilOffset - nostrilSize; } else if (dy === 1) { n1Y = drawY + currentGridSize - nostrilOffset - nostrilSize; n2Y = n1Y; n1X = drawX + nostrilOffset; n2X = drawX + currentGridSize - nostrilOffset - nostrilSize; } else { n1Y = drawY + nostrilOffset; n2Y = n1Y; n1X = drawX + nostrilOffset; n2X = drawX + currentGridSize - nostrilOffset - nostrilSize; } if (typeof n1X === 'number' && typeof n1Y === 'number' && typeof n2X === 'number' && typeof n2Y === 'number' && typeof nostrilSize === 'number' && nostrilSize > 0){ ctx.fillRect(n1X, n1Y, nostrilSize, nostrilSize); ctx.fillRect(n2X, n2Y, nostrilSize, nostrilSize); } else { console.warn("Invalid nostril coords/size."); } }
                 catch (nostrilError) { handleError(nostrilError, "drawSnakePart - Nostrils"); }
            }
        }
    } catch (partError) { handleError(partError, `drawSnakePart index ${index}`); }
}
function drawSnake() { if (!snake || snake.length === 0) { console.warn("DrawSnake call: Snake invalid."); return; } try { for (let i = snake.length - 1; i >= 0; i--) { drawSnakePart(snake[i], i, snake.length); } } catch(e) { handleError(e, "drawSnake loop"); } }
function drawFood() { if (!ctx || !food) return; try { const pulseFactor=(Math.sin(Date.now()/config.FOOD_PULSE_SPEED*Math.PI*2)+1)/2; const scale=0.85+pulseFactor*0.15; const pulsatingSize=config.GRID_SIZE*scale; const offset=(config.GRID_SIZE-pulsatingSize)/2; const foodX=food.x*config.GRID_SIZE+offset; const foodY=food.y*config.GRID_SIZE+offset; ctx.shadowBlur=config.GRID_SIZE*0.8; ctx.shadowColor=config.FOOD_GLOW_COLOR; ctx.fillStyle=config.FOOD_COLOR; ctx.strokeStyle=config.FOOD_BORDER_COLOR; ctx.fillRect(foodX,foodY,pulsatingSize,pulsatingSize); ctx.strokeRect(foodX,foodY,pulsatingSize,pulsatingSize); ctx.shadowBlur=0; ctx.shadowColor='transparent'; } catch (e) { handleError(e, "drawFood"); } }
function drawBackgroundEffects() { if (!ctx) return; try { updateBackgroundParticles(); drawBackgroundParticles(ctx); } catch (e) { handleError(e, "drawBackgroundEffects"); } }
function drawForegroundEffects() { if (!ctx) return; try { updateEatParticles(); drawEatParticles(ctx); } catch (e) { handleError(e, "drawForegroundEffects"); } }
function applyScreenShake() { if (!ctx) return; try { const shakeX = (Math.random() - 0.5) * currentShakeIntensity * 2; const shakeY = (Math.random() - 0.5) * currentShakeIntensity * 2; ctx.translate(shakeX, shakeY); } catch(e){ handleError(e, "applyScreenShake"); } }
function animateScore() { if (!scoreElement) return; try { scoreElement.classList.remove('score-pop-animation'); void scoreElement.offsetWidth; scoreElement.classList.add('score-pop-animation'); } catch(e){ handleError(e, "animateScore"); } }

// --- Game Logic ---
function moveSnake() {
    if (isGameOver || isPaused || !snake || snake.length === 0) return;
    if (gameStarted && !changingDirection) playSound(walkSound, "Walk"); // Specify context
    try {
        if (!snake[0]) throw new Error("Snake head is missing");
        const currentHead = snake[0]; const potentialHeadX = currentHead.x + dx; const potentialHeadY = currentHead.y + dy;

        if (config.ENABLE_OBSTACLES && obstacles.some(obs => obs && obs.x === potentialHeadX && obs.y === potentialHeadY)) { handleGameOver(); return; }
        if (potentialHeadX < 0 || potentialHeadX >= GRID_WIDTH || potentialHeadY < 0 || potentialHeadY >= GRID_HEIGHT) { if (snake.length > 0) snake.pop(); else throw new Error("Wall hit pop empty snake"); if (snake.length < config.MIN_SNAKE_LENGTH) { handleGameOver(); } else { score = Math.max(0, score - config.WALL_HIT_PENALTY); if (scoreElement) scoreElement.textContent = score; shakeDuration = config.SHAKE_DURATION_FRAMES; currentShakeIntensity = config.SHAKE_BASE_INTENSITY; } return; }
        const newHead = { x: potentialHeadX, y: potentialHeadY };
        for (let i = 1; i < snake.length; i++) { if (snake[i] && newHead.x === snake[i].x && newHead.y === snake[i].y) { handleGameOver(); return; } }

        snake.unshift(newHead);

        if (powerUp && newHead.x === powerUp.x && newHead.y === powerUp.y) { playPowerupSound(); activateMultiplier(); spawnEatParticles(powerUp.x * config.GRID_SIZE + config.GRID_SIZE / 2, powerUp.y * config.GRID_SIZE + config.GRID_SIZE / 2, config.POWERUP_COLOR); powerUp = null; }
        else if (food && newHead.x === food.x && newHead.y === food.y) { const scoreToAdd = isMultiplierActive ? 20 : 10; score += scoreToAdd; if (scoreElement) scoreElement.textContent = score; animateScore(); if (score > highScore) { highScore = score; localStorage.setItem('snakeHighScore', highScore); if (highScoreElement) highScoreElement.textContent = highScore; } playSound(eatSound, "Eat"); spawnEatParticles(food.x * config.GRID_SIZE + config.GRID_SIZE / 2, food.y * config.GRID_SIZE + config.GRID_SIZE / 2, config.FOOD_COLOR); placeFood(); maybeSpawnPowerup(); gameSpeed = Math.max(config.MIN_GAME_SPEED, gameSpeed - config.SPEED_INCREMENT); }
        else { if (snake.length > 0) snake.pop(); else throw new Error("No collision pop empty snake"); }

        updateMultiplier();
        if (!isGameOver && snake.length < config.MIN_SNAKE_LENGTH) { handleGameOver(); }
    } catch (moveError) { handleError(moveError, "moveSnake"); }
}
function placeFood() { let newPos, attempts = 0; const maxAttempts = GRID_WIDTH * GRID_HEIGHT * 3; console.log("Attempting to place food..."); food = null; try { do { newPos = { x: Math.floor(Math.random() * GRID_WIDTH), y: Math.floor(Math.random() * GRID_HEIGHT) }; attempts++; if (attempts > maxAttempts) { console.error(`CRITICAL: Could not place food after ${maxAttempts} attempts.`); return; } } while (isPositionOccupied(newPos, true, config.ENABLE_OBSTACLES, true)); food = newPos; console.log(`Placed food at: (${food.x}, ${food.y}) after ${attempts} attempts.`); } catch(e) { handleError(e, "placeFood"); food = null; } }
function isFoodOnSnake(position) { if (!snake || !position) return false; return snake.some(segment => segment && segment.x === position.x && segment.y === position.y); }
function handleGameOver() { console.log("GAME OVER triggered."); if (isGameOver) return; try { isGameOver = true; isPaused = true; clearTimeout(gameLoopTimeout); if(startPauseButton) { startPauseButton.textContent = "Start"; startPauseButton.disabled = true; } if(bgMusic) bgMusic.pause(); playOopsSound(); if (ctx) { console.log("Performing final game over draw..."); clearCanvas(); drawBackgroundEffects(); if (config.ENABLE_OBSTACLES) drawObstacles(); if (food) drawFood(); if (powerUp) drawPowerup(); if (snake && snake.length > 0) drawSnake(); else console.warn("Snake invalid/empty on game over draw."); } else { console.error("Cannot perform final draw - ctx missing."); } if (gameOverElement && finalScoreValueElement) { finalScoreValueElement.textContent = score; gameOverElement.style.display = 'block'; gameOverElement.style.animation = 'none'; void gameOverElement.offsetWidth; gameOverElement.style.animation = 'fadeInGameOver 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.1s'; } else { console.warn("Game over UI elements missing."); } isMultiplierActive = false; multiplierTimer = 0; updateMultiplierDisplay(); } catch(e) { handleError(e, "handleGameOver"); } }

// --- Input & Control Handling ---
function updateDirection(newDx, newDy) { if (changingDirection || isGameOver || isPaused) return false; const goingUp = dy === -1, goingDown = dy === 1, goingLeft = dx === -1, goingRight = dx === 1; if ((newDy === -1 && goingDown) || (newDy === 1 && goingUp) || (newDx === -1 && goingRight) || (newDx === 1 && goingLeft)) { return false; } if (newDx !== dx || newDy !== dy) { dx = newDx; dy = newDy; changingDirection = true; console.log(`Direction changed: dx=${dx}, dy=${dy}`); return true; } return false; }
function handleKeyPress(event) { const relevantKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'r']; if (relevantKeys.includes(event.key.toLowerCase())) { console.log("Preventing default for key:", event.key); event.preventDefault(); } if (event.key.toLowerCase() === 'r') { console.log("Restart key"); closeConfigModal(); initializeGame(); return; } if (event.key === ' ' && !isGameOver) { console.log("Spacebar"); if (!gameStarted) startGame(); else togglePause(); return; } if (configModal && (configModal.style.display === 'block' || configModal.classList.contains('open'))) return; const directionKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']; if (!gameStarted && !isGameOver && directionKeys.includes(event.key.toLowerCase())) { console.log("First direction key"); startGame(); } let requestedDx = dx; let requestedDy = dy; switch (event.key.toLowerCase()) { case 'arrowup': case 'w': requestedDy = -1; requestedDx = 0; break; case 'arrowdown': case 's': requestedDy = 1; requestedDx = 0; break; case 'arrowleft': case 'a': requestedDx = -1; requestedDy = 0; break; case 'arrowright': case 'd': requestedDx = 1; requestedDy = 0; break; default: return; } updateDirection(requestedDx, requestedDy); }
function handleTouchStart(event) { event.preventDefault(); if (isGameOver) { console.log("Tap on Game Over - Restarting"); initializeGame(); return; } if (!gameStarted) { console.log("First touch - starting game."); startGame(); } if (event.touches.length === 1) { const touch = event.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY; touchEndX = touch.clientX; touchEndY = touch.clientY; isSwiping = true; } }
function handleTouchMove(event) { event.preventDefault(); if (!isSwiping || event.touches.length !== 1) return; const touch = event.touches[0]; touchEndX = touch.clientX; touchEndY = touch.clientY; }
function handleTouchEnd(event) { if (!isSwiping) return; const dxSwipe = touchEndX - touchStartX; const dySwipe = touchEndY - touchStartY; const absDx = Math.abs(dxSwipe); const absDy = Math.abs(dySwipe); if (Math.max(absDx, absDy) > MIN_SWIPE_DISTANCE) { let requestedDx = dx; let requestedDy = dy; if (absDx > absDy) { requestedDx = dxSwipe > 0 ? 1 : -1; requestedDy = 0; } else { requestedDy = dySwipe > 0 ? 1 : -1; requestedDx = 0; } console.log(`Swipe detected. Requesting direction: dx=${requestedDx}, dy=${requestedDy}`); updateDirection(requestedDx, requestedDy); } isSwiping = false; touchStartX = 0; touchStartY = 0; touchEndX = 0; touchEndY = 0; }
function togglePause() { if (isGameOver || !startPauseButton) return; try { isPaused = !isPaused; console.log("Toggle Pause: New state =", isPaused ? "Paused" : "Running"); if (isPaused) { clearTimeout(gameLoopTimeout); startPauseButton.textContent = "Resume"; if(bgMusic) bgMusic.pause(); } else { gameStarted = true; startPauseButton.textContent = "Pause"; if(bgMusic) { bgMusic.volume = parseFloat(musicVolumeSlider.value); bgMusic.play().catch(e => console.warn("BG Music resume failed:", e)); } gameLoop(); } } catch(e){ handleError(e, "togglePause"); } }
function startGame() { if (!gameStarted && !isGameOver && startPauseButton) { if (!food) { handleError(new Error("Cannot start: initial food placement failed."), "startGame"); return; } try { console.log("Starting game..."); isPaused = false; gameStarted = true; startPauseButton.textContent = 'Pause'; startPauseButton.disabled = false; if(gameOverElement) gameOverElement.style.display = 'none'; if (bgMusic) { bgMusic.volume = parseFloat(musicVolumeSlider.value); bgMusic.play().catch(e => console.warn("Initial BG Music play failed:", e)); } console.log("Calling gameLoop for the first time."); gameLoop(); } catch(e) { handleError(e, "startGame"); } } else if (isPaused && !isGameOver) { console.log("Resuming game..."); togglePause(); } }
function updateVolume() { /* Volume applied before playing */ }
function updateMusicVolume() { try { if(bgMusic) { bgMusic.volume = parseFloat(musicVolumeSlider.value); } } catch(e){ handleError(e, "updateMusicVolume");} }

// --- Config Modal Logic ---
function openConfigModal() { try { console.log("Opening config modal..."); if (!isPaused && !isGameOver) togglePause(); if (!configModal || !configSpeedInput || !configSnakeColorInput || !configFoodColorInput || !configBgColorInput || !configObstacleColorInput || !configPowerupColorInput || !configEnableObstaclesInput || !configObstacleCountInput ) throw new Error("Config modal elements missing."); configSpeedInput.value = config.INITIAL_GAME_SPEED; configSnakeColorInput.value = config.SNAKE_COLOR; configFoodColorInput.value = config.FOOD_COLOR; configBgColorInput.value = config.BACKGROUND_COLOR; configObstacleColorInput.value = config.OBSTACLE_COLOR; configPowerupColorInput.value = config.POWERUP_COLOR; configEnableObstaclesInput.checked = config.ENABLE_OBSTACLES; configObstacleCountInput.value = config.OBSTACLE_COUNT; configObstacleCountInput.disabled = !config.ENABLE_OBSTACLES; configModal.style.display = 'block'; setTimeout(() => configModal.classList.add('open'), 10); } catch(e){ handleError(e, "openConfigModal");} }
function closeConfigModal() { try { if (!configModal) return; console.log("Closing config modal..."); configModal.classList.remove('open'); setTimeout(() => { if (!configModal.classList.contains('open')) configModal.style.display = 'none'; }, 300); } catch(e){ handleError(e, "closeConfigModal");} }
function applyConfiguration() { try { if (!configSpeedInput || !configSnakeColorInput || !configFoodColorInput || !configBgColorInput || !configObstacleColorInput || !configPowerupColorInput || !configEnableObstaclesInput || !configObstacleCountInput) throw new Error("Cannot apply config - input elements missing."); console.log("Applying configuration..."); config.INITIAL_GAME_SPEED = parseInt(configSpeedInput.value) || config.INITIAL_GAME_SPEED; config.SNAKE_COLOR = configSnakeColorInput.value || config.SNAKE_COLOR; config.FOOD_COLOR = configFoodColorInput.value || config.FOOD_COLOR; config.BACKGROUND_COLOR = configBgColorInput.value || config.BACKGROUND_COLOR; config.OBSTACLE_COLOR = configObstacleColorInput.value || config.OBSTACLE_COLOR; config.POWERUP_COLOR = configPowerupColorInput.value || config.POWERUP_COLOR; config.ENABLE_OBSTACLES = configEnableObstaclesInput.checked; config.OBSTACLE_COUNT = parseInt(configObstacleCountInput.value) >= 0 ? parseInt(configObstacleCountInput.value) : config.OBSTACLE_COUNT; saveConfig(); closeConfigModal(); initializeGame(); } catch(e){ handleError(e, "applyConfiguration");} }

// --- Game Loop ---
function gameLoop() {
    if (isPaused || isGameOver) { clearTimeout(gameLoopTimeout); return; }
    changingDirection = false;
    gameLoopTimeout = setTimeout(() => {
        if (isPaused || isGameOver) return;
        if (!ctx) { handleError(new Error("Ctx missing in loop timeout"), "gameLoop Timeout"); return; }
        try {
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
            if (shakeDuration > 0) { applyScreenShake(); shakeDuration--; if (shakeDuration <= 0) currentShakeIntensity = 0; }

            clearCanvas();
            drawBackgroundEffects();
            if (config.ENABLE_OBSTACLES) drawObstacles();
            if (food) drawFood(); else { console.warn("Loop: Food missing."); placeFood(); if(food) drawFood(); else { handleError(new Error("Food missing & cannot be placed."), "gameLoop - Food Check"); ctx.restore(); return; } } // Place or fail
            if (powerUp) drawPowerup();

            moveSnake();

            if (!isGameOver) {
                if (snake && snake.length > 0) { drawSnake(); }
                else { handleError(new Error("Snake disappeared unexpectedly after move."), "gameLoop - Draw Check"); ctx.restore(); return; }
                drawForegroundEffects();
                ctx.restore();
                gameLoop();
            } else { ctx.restore(); } // Restore if game over happened in moveSnake
        } catch (error) { handleError(error, "gameLoop Tick Execution"); try { ctx.restore(); } catch(restoreError){ console.error("Error restoring context after loop error:", restoreError); } }
    }, gameSpeed);
}

// --- Rainbow Background Effect ---
function updateTitleBackground() { try { currentHue = (currentHue + 1) % 360; if (titleContainerElement) { titleContainerElement.style.backgroundColor = `hsl(${currentHue}, 85%, 65%)`; } } catch(e){ console.warn("Rainbow error:", e); clearInterval(rainbowInterval);} }
function startRainbowBackground() { try { if (rainbowInterval) clearInterval(rainbowInterval); rainbowInterval = setInterval(updateTitleBackground, 60); } catch(e){ console.warn("Failed to start rainbow:", e);} }

// --- Event Listeners Setup ---
function setupEventListeners() {
    console.log("Setting up event listeners...");
    try {
        if (startPauseButton) startPauseButton.addEventListener('click', () => { try { if(!gameStarted || isPaused) startGame(); else togglePause(); } catch(e){ handleError(e, "startPauseButton Click"); } }); else console.warn("Start/Pause button not found.");
        if (restartButton) restartButton.addEventListener('click', initializeGame); else console.warn("Restart button not found.");
        if (volumeSlider) volumeSlider.addEventListener('input', updateVolume); else console.warn("Volume slider not found.");
        if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', updateMusicVolume); else console.warn("Music volume slider not found.");
        if (configButton) configButton.addEventListener('click', openConfigModal); else console.warn("Config button not found.");
        if (closeConfigModalButton) closeConfigModalButton.addEventListener('click', closeConfigModal); else console.warn("Close Config button (#closeConfigModalButton) not found.");
        if (applyConfigButton) applyConfigButton.addEventListener('click', applyConfiguration); else console.warn("Apply Config button not found.");
        if (configEnableObstaclesInput && configObstacleCountInput) { configEnableObstaclesInput.addEventListener('change', (event) => { try { configObstacleCountInput.disabled = !event.target.checked; } catch(e){ handleError(e, "Obstacle Toggle Change");} }); } else { console.warn("Obstacle toggle/count inputs not found."); }

        document.addEventListener('keydown', handleKeyPress);
        if (canvas) { console.log("Attaching touch listeners."); canvas.addEventListener('touchstart', handleTouchStart, { passive: false }); canvas.addEventListener('touchmove', handleTouchMove, { passive: false }); canvas.addEventListener('touchend', handleTouchEnd, { passive: true }); canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true }); }
        else { console.warn("Canvas not found for touch listeners."); }
        window.addEventListener('click', (event) => { if (configModal && event.target == configModal) closeConfigModal(); });

        console.log("Event listeners setup complete.");
    } catch (e) { handleError(e, "setupEventListeners"); }
}

// --- Initial Call ---
document.addEventListener('DOMContentLoaded', () => {
     console.log("DOM Ready.");
     setupEventListeners();
     if (canvas && ctx) { console.log("Canvas and Context OK. Initializing game..."); initializeGame(); }
     else { handleError(new Error("Canvas or Context not available on DOMContentLoaded"), "Initial Setup"); if(gameContainer && (!canvas || !ctx)) { gameContainer.innerHTML = `<p style='color: red; text-align: center; padding: 20px; font-weight: bold;'>Error: Failed to initialize game graphics.<br>Please ensure the canvas element exists and your browser supports it.</p>`; } }
});

console.log("--- Script loaded. Waiting for DOM ready. ---");