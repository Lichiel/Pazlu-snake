// --- Strict mode ---
"use strict";

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const scoreElement = document.getElementById('score');
const scoreMultiplierElement = document.getElementById('scoreMultiplier');
const highScoreElement = document.getElementById('highScore');
const speedDisplayElement = document.getElementById('speedDisplay'); // Added for speed display
const gameOverElement = document.getElementById('gameOver');
const finalScoreValueElement = document.getElementById('finalScoreValue');
const titleContainerElement = document.getElementById('titleContainer');
const startPauseButton = document.getElementById('startPauseButton');
const restartButton = document.getElementById('restartButton');
const volumeSlider = document.getElementById('volumeSlider');
const musicVolumeSlider = document.getElementById('musicVolumeSlider');
const gameContainer = document.querySelector('.game-container');
const debugInfoElement = document.getElementById('debugInfo');
const stagePopupElement = document.getElementById('stagePopup'); // Added for stage pop-up

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
const NOSTRIL_COLOR = 'rgba(0, 0, 0, 0.4)'; // Define nostril color globally
const MIN_SWIPE_DISTANCE = 30;

// Speed Mapping Constants
const MAX_SPEED_INPUT = 300; // Corresponds to fastest game (shortest delay)
const MIN_SPEED_INPUT = 50;  // Corresponds to slowest game (longest delay)
const MAX_GAME_DELAY = 350;  // Longest delay (ms) for MIN_SPEED_INPUT
// MIN_GAME_DELAY is defined in config as MIN_GAME_SPEED (default 60)

// --- Game Configuration (Defaults) ---
let config = {
    GRID_SIZE: 30, INITIAL_GAME_SPEED: 180,
    // REMOVED old snake appearance config: SNAKE_COLOR, SNAKE_BORDER_COLOR, SNAKE_GLOW_COLOR, EYE_APPEAR_LENGTH, TEEN_LENGTH, ADULT_LENGTH, TEEN_PATTERN_COLOR, TEEN_BORDER_COLOR, NOSTRIL_COLOR
    FOOD_COLOR: '#90EE90', FOOD_BORDER_COLOR: '#7CCD7C', FOOD_GLOW_COLOR: 'rgba(173, 255, 47, 0.6)',
    // REMOVED SPECIAL_FOOD_COLOR, SPECIAL_FOOD_BORDER_COLOR, SPECIAL_FOOD_GLOW_COLOR
    BACKGROUND_COLOR: '#005000', OBSTACLE_COLOR: '#555555', OBSTACLE_BORDER_COLOR: '#333333',
    POWERUP_COLOR: '#ffd700', POWERUP_BORDER_COLOR: '#e6c200', POWERUP_GLOW_COLOR: 'rgba(255, 215, 0, 0.7)', // Note: Powerup is separate from special food
    SPECIAL_FOOD_SPAWN_CHANCE: 0.15, // Increased chance slightly
    // REMOVED SPECIAL_FOOD_SPEED_EFFECT
    SPECIAL_FOOD_TIMER_COLOR: 'rgba(255, 255, 255, 0.6)', // Color for the countdown timer
    WALL_HIT_PENALTY: 5, MIN_GAME_SPEED: 60, SPEED_INCREMENT: 3, MIN_SNAKE_LENGTH: 1,
    FOOD_PULSE_SPEED: 300, MIN_SNAKE_OPACITY: 0.3, GAME_OVER_HEAD_SCALE: 2.0,
    BACKGROUND_PARTICLE_COUNT: 40, EAT_PARTICLE_COUNT: 20,

    // --- Special Food Types ---
    specialFoodTypes: [
        {
            name: "Slowdown",
            color: '#87CEEB', // Sky Blue
            borderColor: '#6495ED',
            glowColor: 'rgba(135, 206, 235, 0.7)',
            shape: 'diamond', // 'diamond', 'square', 'triangle' etc.
            durationMs: 8000, // 8 seconds
            effect: { type: 'speed', value: 30 }, // Adds 30ms to gameSpeed (slows down)
            spawnWeight: 5 // Higher weight = more common
        },
        {
            name: "Bonus Points",
            color: '#FFD700', // Gold
            borderColor: '#B8860B',
            glowColor: 'rgba(255, 215, 0, 0.8)',
            shape: 'star', // Custom shape needed in drawFood
            durationMs: 6000, // 6 seconds
            effect: { type: 'score', value: 50 }, // Adds 50 points directly
            spawnWeight: 3
        },
        {
            name: "Shrink", // New type: temporarily shrinks snake
            color: '#9370DB', // Medium Purple
            borderColor: '#7A5BC8',
            glowColor: 'rgba(147, 112, 219, 0.7)',
            shape: 'triangle',
            durationMs: 10000, // 10 seconds
            effect: { type: 'shrink', value: 3 }, // Removes up to 3 segments (min length respected)
            spawnWeight: 2
        }
        // Add more types here later if desired
    ],
    SHAKE_BASE_INTENSITY: 3, SHAKE_DURATION_FRAMES: 6, // For wall hit shake
    OBSTACLE_COUNT: 5, POWERUP_SPAWN_CHANCE: 0.05, POWERUP_DURATION_FRAMES: 300,
    ENABLE_OBSTACLES: true,

    // --- Snake Stages ---
    stages: [
        { minLength: 0,  name: "Hatchling", baseColor: '#FFC0CB', borderColor: '#FF99AA', glowColor: 'rgba(255, 192, 203, 0.4)', patternColor: null, hasEyes: false, hasNostrils: false }, // Light Pink
        { minLength: 5,  name: "Juvenile",  baseColor: '#FF69B4', borderColor: '#d147a3', glowColor: 'rgba(255, 105, 180, 0.5)', patternColor: null, hasEyes: true,  hasNostrils: false }, // Original Pink (Eyes added)
        { minLength: 10, name: "Python",    baseColor: '#DA70D6', borderColor: '#b82e8a', glowColor: 'rgba(218, 112, 214, 0.5)', patternColor: 'rgba(0, 0, 0, 0.1)', hasEyes: true,  hasNostrils: false }, // Orchid (Pattern added)
        { minLength: 15, name: "Anaconda",  baseColor: '#9370DB', borderColor: '#7a5abc', glowColor: 'rgba(147, 112, 219, 0.6)', patternColor: 'rgba(0, 0, 0, 0.15)', hasEyes: true,  hasNostrils: true }, // Medium Purple (Nostrils added)
        { minLength: 20, name: "Constrictor", baseColor: '#483D8B', borderColor: '#3a316e', glowColor: 'rgba(72, 61, 139, 0.6)', patternColor: 'rgba(255, 255, 255, 0.1)', hasEyes: true,  hasNostrils: true }, // Dark Slate Blue
        { minLength: 30, name: "Viper",     baseColor: '#2E8B57', borderColor: '#256e45', glowColor: 'rgba(46, 139, 87, 0.6)', patternColor: 'rgba(0, 0, 0, 0.2)', hasEyes: true,  hasNostrils: true }, // Sea Green
        { minLength: 40, name: "Cobra",     baseColor: '#CD853F', borderColor: '#a86d34', glowColor: 'rgba(205, 133, 63, 0.6)', patternColor: 'rgba(0, 0, 0, 0.25)', hasEyes: true,  hasNostrils: true }, // Peru (Brownish)
        { minLength: 50, name: "Titanoboa", baseColor: '#8B0000', borderColor: '#6e0000', glowColor: 'rgba(139, 0, 0, 0.7)', patternColor: 'rgba(255, 215, 0, 0.15)', hasEyes: true,  hasNostrils: true }, // Dark Red + Gold pattern
        { minLength: 75, name: "Super Snake", baseColor: '#00BFFF', borderColor: '#009acd', glowColor: 'rgba(0, 191, 255, 0.8)', patternColor: 'rgba(255, 255, 255, 0.2)', hasEyes: true,  hasNostrils: true }, // Deep Sky Blue
        { minLength: 100, name: "LEGENDARY", baseColor: '#FFD700', borderColor: '#b39700', glowColor: 'rgba(255, 255, 255, 0.9)', patternColor: 'rgba(255, 255, 255, 0.3)', hasEyes: true,  hasNostrils: true }, // Gold + White glow/pattern
    ]
};

// --- Game Constants (Derived) ---
let CANVAS_WIDTH = 450; let CANVAS_HEIGHT = 450; let GRID_WIDTH = 15; let GRID_HEIGHT = 15;

// --- Game State Variables ---
let snake, food = null, dx, dy, changingDirection, score, highScore = 0;
let gameSpeed, gameLoopTimeout, isGameOver, isPaused = true, currentHue = 0, highScoreBrokenThisGame = false;
let rainbowInterval, gameStarted = false;
let backgroundParticles = []; let eatParticles = [];
let shakeDuration = 0; let currentShakeIntensity = 0;
let obstacles = []; let powerUp = null;
let isMultiplierActive = false; let multiplierTimer = 0;
let touchStartX = 0; let touchStartY = 0; let touchEndX = 0; let touchEndY = 0; let isSwiping = false;
let currentStageIndex = 0; // Added to track current snake stage

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
            console.log("Saved config found in localStorage. Merging...");
            const parsedConfig = JSON.parse(savedConfig);

            if (typeof parsedConfig.ENABLE_OBSTACLES === 'boolean') { config.ENABLE_OBSTACLES = parsedConfig.ENABLE_OBSTACLES; }
            for (const key in config) {
                 if (parsedConfig.hasOwnProperty(key) && typeof parsedConfig[key] === typeof config[key] && typeof config[key] !== 'boolean') { config[key] = parsedConfig[key]; }
            }
            console.log("Saved config merged.");
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
        currentStageIndex = 0; // Reset stage index
        highScoreBrokenThisGame = false; // Reset high score flag for the new game
        updateMultiplierDisplay();
        updateSpeedDisplay(); // Add call here

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
function spawnEatParticles(x, y, color) {
    const count = config.EAT_PARTICLE_COUNT * 2; // Double the particles
    const baseColor = color || config.FOOD_COLOR;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.2; // Faster particles
        const life = Math.random() * 50 + 30; // Longer lifespan
        const size = Math.random() * 3 + 1.5; // Larger particles
        
        // Add some color variation
        const hueVariation = Math.random() * 30 - 15;
        const satVariation = Math.random() * 20 + 80;
        const lightVariation = Math.random() * 20 + 60;
        const particleColor = `hsl(${getHue(baseColor) + hueVariation}, ${satVariation}%, ${lightVariation}%)`;
        
        eatParticles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            life,
            particleColor,
            size
        ));
    }
}

// Helper function to extract hue from color
function getHue(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0,2), 16) / 255;
    const g = parseInt(hex.substring(2,4), 16) / 255;
    const b = parseInt(hex.substring(4,6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h;
    
    if (max === min) h = 0;
    else if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    
    h = Math.round(h * 60);
    return h < 0 ? h + 360 : h;
}
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

// --- Speed Display Function ---
function updateSpeedDisplay() {
    if (!speedDisplayElement) return;
    try {
        // Map internal gameSpeed (delay in ms) to the user-facing config speed range (higher value = faster)
        const minDelay = config.MIN_GAME_SPEED; // Fastest internal speed (shortest delay)
        const maxDelay = MAX_GAME_DELAY;        // Slowest internal speed (longest delay)
        const minInput = MIN_SPEED_INPUT;       // Slowest user input
        const maxInput = MAX_SPEED_INPUT;       // Fastest user input

        let displaySpeed;
        if (maxDelay === minDelay) { // Avoid division by zero
            displaySpeed = maxInput; // If range is zero, assume max speed
        } else {
            // Inverse linear interpolation
            const speedRatio = (maxDelay - gameSpeed) / (maxDelay - minDelay);
            displaySpeed = minInput + (maxInput - minInput) * speedRatio;
        }

        // Clamp and round the value
        displaySpeed = Math.round(Math.max(minInput, Math.min(maxInput, displaySpeed)));

        speedDisplayElement.textContent = displaySpeed;
    } catch(e) {
        handleError(e, "updateSpeedDisplay");
        speedDisplayElement.textContent = "ERR"; // Show error on display
    }
}

// --- Drawing Functions ---
function clearCanvas() { if (!ctx) return; try { const bgColor = config.BACKGROUND_COLOR || '#000000'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); } catch (e) { handleError(e, "clearCanvas"); } }
function drawSnakePart(segment, index, totalLength, expression = 'normal') {
    if (!ctx || !segment || typeof segment.x !== 'number' || typeof segment.y !== 'number') { console.error(`drawSnakePart ABORTED index ${index}: Invalid ctx or segment:`, segment); return; }
    try {
        const currentStage = config.stages[currentStageIndex]; // Get current stage properties
        if (!currentStage) { throw new Error(`Invalid currentStageIndex: ${currentStageIndex}`); }

        const isHead = index === 0;
        let currentGridSize = config.GRID_SIZE;
        let drawX = segment.x * config.GRID_SIZE;
        let drawY = segment.y * config.GRID_SIZE;
        let segmentOpacity = 1.0;

        // Use stage colors
        let segmentFillColor = currentStage.baseColor;
        let segmentBorderColor = currentStage.borderColor;
        let segmentGlowColor = currentStage.glowColor;

        // Handle game over head scaling and appearance
        if (isGameOver && isHead) {
            currentGridSize = config.GRID_SIZE * config.GAME_OVER_HEAD_SCALE;
            const offset = (config.GRID_SIZE - currentGridSize) / 2;
            drawX = (segment.x * config.GRID_SIZE) + offset;
            drawY = (segment.y * config.GRID_SIZE) + offset;
            segmentOpacity = 1.0; // Keep head fully opaque on game over
            segmentGlowColor = 'transparent'; // No glow on game over
        } else {
            // Apply opacity gradient to tail
            if (totalLength > 1) {
                segmentOpacity = config.MIN_SNAKE_OPACITY + (1.0 - config.MIN_SNAKE_OPACITY) * ((totalLength - 1 - index) / (totalLength - 1));
            }
        }

        // Apply glow effect if not game over head
        if (!(isGameOver && isHead)) {
            ctx.shadowBlur = config.GRID_SIZE / 2.5;
            ctx.shadowColor = segmentGlowColor;
        }

        // --- REMOVED DEBUG LOGGING ---

        // Draw segment body
        ctx.globalAlpha = segmentOpacity;
        ctx.fillStyle = segmentFillColor;
        ctx.strokeStyle = segmentBorderColor;
        ctx.fillRect(drawX, drawY, currentGridSize, currentGridSize);

        // Draw pattern on body segments if applicable for the stage
        if (!isGameOver && !isHead && currentStage.patternColor) {
            ctx.fillStyle = currentStage.patternColor;
            const patternSize = currentGridSize / 6; // Example pattern size
            // Simple pattern - adjust as desired
            ctx.fillRect(drawX + patternSize, drawY + patternSize, patternSize, patternSize);
            ctx.fillRect(drawX + currentGridSize - patternSize * 2, drawY + currentGridSize - patternSize * 2, patternSize, patternSize);
        }

        // Draw segment border
        ctx.strokeRect(drawX, drawY, currentGridSize, currentGridSize);

        // Reset alpha and shadow
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Draw Head Features based on stage flags
        if (isHead && totalLength >= 1) {
            // Eyes
            if (currentStage.hasEyes) {
                try {
                    const eyeSizeRatio = 0.2, eyeOffsetRatio = 0.25;
                    const eyeSize = currentGridSize * eyeSizeRatio;
                    const offset = currentGridSize * eyeOffsetRatio;
                    if (isGameOver) { // Dead Eyes (X marks)
                        const centerX = drawX + currentGridSize / 2, centerY = drawY + currentGridSize / 2;
                        const crossSize = currentGridSize * 0.4;
                        ctx.lineWidth = Math.max(1, currentGridSize * 0.08);
                        ctx.strokeStyle = DEAD_EYE_COLOR;
                        ctx.beginPath();
                        ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2); ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2);
                        ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2); ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2);
                        ctx.stroke();
                        ctx.lineWidth = 1;
                    } else if (expression === 'happy') { // Happy eyes (sparkling) + blush
                        const eyeRadius = currentGridSize * 0.15;
                        const sparkleRadius = eyeRadius * 0.4;
                        const eyeOffsetY = currentGridSize * 0.3; // Vertical position
                        const eyeOffsetX = currentGridSize * 0.28; // Horizontal separation

                        const eye1X = drawX + currentGridSize / 2 - eyeOffsetX;
                        const eye1Y = drawY + eyeOffsetY;
                        const eye2X = drawX + currentGridSize / 2 + eyeOffsetX;
                        const eye2Y = drawY + eyeOffsetY;

                        // Draw eyes
                        ctx.fillStyle = EYE_COLOR;
                        ctx.beginPath();
                        ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
                        ctx.fill();

                        // Draw sparkles (top-leftish)
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(eye1X - eyeRadius * 0.3, eye1Y - eyeRadius * 0.3, sparkleRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(eye2X - eyeRadius * 0.3, eye2Y - eyeRadius * 0.3, sparkleRadius, 0, Math.PI * 2);
                        ctx.fill();

                        // Draw blush marks
                        const blushRadius = currentGridSize * 0.1;
                        const blushOffsetY = currentGridSize * 0.55;
                        const blushOffsetX = currentGridSize * 0.35;
                        ctx.fillStyle = 'rgba(255, 105, 180, 0.7)'; // Pink blush
                        ctx.beginPath();
                        ctx.arc(drawX + currentGridSize / 2 - blushOffsetX, drawY + blushOffsetY, blushRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(drawX + currentGridSize / 2 + blushOffsetX, drawY + blushOffsetY, blushRadius, 0, Math.PI * 2);
                        ctx.fill();

                    } else if (expression === 'hurt') { // Hurt eyes ('X' marks)
                        const crossSize = currentGridSize * 0.18; // Size of the X
                        const eyeOffsetY = currentGridSize * 0.3; // Vertical position
                        const eyeOffsetX = currentGridSize * 0.28; // Horizontal separation

                        const eye1X = drawX + currentGridSize / 2 - eyeOffsetX;
                        const eye1Y = drawY + eyeOffsetY;
                        const eye2X = drawX + currentGridSize / 2 + eyeOffsetX;
                        const eye2Y = drawY + eyeOffsetY;

                        ctx.strokeStyle = '#A00000'; // Dark Red color for X
                        ctx.lineWidth = Math.max(1.5, currentGridSize * 0.06); // Slightly thicker line

                        // Draw X for eye 1
                        ctx.beginPath();
                        ctx.moveTo(eye1X - crossSize, eye1Y - crossSize);
                        ctx.lineTo(eye1X + crossSize, eye1Y + crossSize);
                        ctx.moveTo(eye1X + crossSize, eye1Y - crossSize);
                        ctx.lineTo(eye1X - crossSize, eye1Y + crossSize);
                        ctx.stroke();

                        // Draw X for eye 2
                        ctx.beginPath();
                        ctx.moveTo(eye2X - crossSize, eye2Y - crossSize);
                        ctx.lineTo(eye2X + crossSize, eye2Y + crossSize);
                        ctx.moveTo(eye2X + crossSize, eye2Y - crossSize);
                        ctx.lineTo(eye2X - crossSize, eye2Y + crossSize);
                        ctx.stroke();

                        ctx.lineWidth = 1; // Reset line width

                    } else { // Normal Eyes
                        const eyeRadius = currentGridSize * 0.12; // Slightly smaller normal eyes
                        const eyeOffsetY = currentGridSize * 0.3;
                        const eyeOffsetX = currentGridSize * 0.28;

                        const eye1X = drawX + currentGridSize / 2 - eyeOffsetX;
                        const eye1Y = drawY + eyeOffsetY;
                        const eye2X = drawX + currentGridSize / 2 + eyeOffsetX;
                        const eye2Y = drawY + eyeOffsetY;

                        ctx.fillStyle = EYE_COLOR;
                        ctx.beginPath();
                        ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } catch (eyeError) { handleError(eyeError, "drawSnakePart - Eyes"); }
            }
            // Nostrils (Simplified Centered Positioning)
            if (!isGameOver && currentStage.hasNostrils) {
                try {
                    ctx.fillStyle = NOSTRIL_COLOR;
                    const nostrilSize = currentGridSize * 0.08;
                    const nostrilOffsetY = currentGridSize * 0.45; // Position below eyes
                    const nostrilOffsetX = currentGridSize * 0.15; // Separation

                    const n1X = drawX + currentGridSize / 2 - nostrilOffsetX;
                    const n1Y = drawY + nostrilOffsetY;
                    const n2X = drawX + currentGridSize / 2 + nostrilOffsetX;
                    const n2Y = drawY + nostrilOffsetY;

                    ctx.fillRect(n1X - nostrilSize / 2, n1Y - nostrilSize / 2, nostrilSize, nostrilSize);
                    ctx.fillRect(n2X - nostrilSize / 2, n2Y - nostrilSize / 2, nostrilSize, nostrilSize);

                } catch (nostrilError) { handleError(nostrilError, "drawSnakePart - Nostrils"); }
            }

            // Draw mouth based on expression (Centered)
            if (!isGameOver && currentStage.hasEyes) {
                try {
                    let mouthX, mouthY, mouthWidth, mouthHeight;
                    const mouthBaseY = drawY + currentGridSize * 0.7; // Base vertical position for mouth
                    ctx.lineWidth = Math.max(1, currentGridSize * 0.08); // Scale line width

                    if (expression === 'happy') {
                        // Wider Smile
                        mouthWidth = currentGridSize * 0.6;
                        mouthHeight = currentGridSize * 0.2; // Curve height
                        mouthX = drawX + (currentGridSize - mouthWidth) / 2;
                        mouthY = mouthBaseY - mouthHeight * 0.5; // Adjust Y based on base
                        ctx.beginPath();
                        ctx.arc(mouthX + mouthWidth / 2, mouthY, mouthWidth / 2, 0, Math.PI);
                        ctx.strokeStyle = 'black';
                        ctx.stroke();
                    }
                    else if (expression === 'hurt') {
                        // More pronounced Frown
                        mouthWidth = currentGridSize * 0.5;
                        mouthHeight = currentGridSize * 0.15;
                        mouthX = drawX + (currentGridSize - mouthWidth) / 2;
                        mouthY = mouthBaseY; // Position frown lower
                        ctx.beginPath();
                        // Draw arc upside down for frown
                        ctx.arc(mouthX + mouthWidth / 2, mouthY, mouthWidth / 2, Math.PI, Math.PI * 2);
                        ctx.strokeStyle = '#A00000'; // Darker red
                        ctx.stroke();
                    }
                    // No mouth for normal expression
                    ctx.lineWidth = 1; // Reset line width
                } catch (mouthError) { handleError(mouthError, "drawSnakePart - Mouth"); }
            }
        }
    } catch (partError) { handleError(partError, `drawSnakePart index ${index}`); }
}

// --- Stage Pop-up Function ---
function showStagePopup(stageName) {
    if (!stagePopupElement) return;
    try {
        stagePopupElement.textContent = stageName;
        stagePopupElement.classList.remove('show'); // Remove class first to reset animation if it was already showing
        void stagePopupElement.offsetWidth; // Trigger reflow to allow animation restart
        stagePopupElement.classList.add('show');

        // Optional: Remove class after animation duration (1.5s in CSS) + a small buffer
        // This prevents the element from lingering with opacity 0 but still potentially blocking clicks
        setTimeout(() => {
            if (stagePopupElement.classList.contains('show')) {
                 stagePopupElement.classList.remove('show');
            }
        }, 1600); // Slightly longer than animation

    } catch (e) {
        handleError(e, "showStagePopup");
    }
}

let currentExpression = 'normal';

function drawSnake() {
    if (!snake || snake.length === 0) {
        console.warn("DrawSnake call: Snake invalid.");
        return;
    }
    try {
        // Draw body with normal expression
        for (let i = snake.length - 1; i > 0; i--) {
            const fadeFactor = 0.2 + (0.8 * (i / snake.length)); // More opaque towards head
            ctx.globalAlpha = fadeFactor;
            drawSnakePart(snake[i], i, snake.length, 'normal');
        }
        // Draw head with current expression
        if (snake.length > 0) {
            ctx.globalAlpha = 1.0;
            drawSnakePart(snake[0], 0, snake.length, currentExpression);
        }
        ctx.globalAlpha = 1.0; // Reset alpha
    } catch(e) {
        handleError(e, "drawSnake loop");
    }
}
function drawFood() {
    if (!ctx || !food) return;
    try {
        const pulseFactor = (Math.sin(Date.now() / config.FOOD_PULSE_SPEED * Math.PI * 2) + 1) / 2;
        const baseScale = 0.85; // Base size before pulse
        const scale = baseScale + pulseFactor * (1.0 - baseScale); // Pulse from baseScale to 1.0
        const pulsatingSize = config.GRID_SIZE * scale;
        const offset = (config.GRID_SIZE - pulsatingSize) / 2;
        const foodDrawX = food.x * config.GRID_SIZE + offset; // Renamed to avoid conflict
        const foodDrawY = food.y * config.GRID_SIZE + offset; // Renamed to avoid conflict
        const centerX = food.x * config.GRID_SIZE + config.GRID_SIZE / 2; // Center for timer arc
        const centerY = food.y * config.GRID_SIZE + config.GRID_SIZE / 2; // Center for timer arc

        let foodColor = config.FOOD_COLOR;
        let borderColor = config.FOOD_BORDER_COLOR;
        let glowColor = config.FOOD_GLOW_COLOR;
        let shape = 'square'; // Default shape
        let specialType = null;

        if (food.isSpecial && food.typeIndex !== null && config.specialFoodTypes[food.typeIndex]) {
            specialType = config.specialFoodTypes[food.typeIndex];
            foodColor = specialType.color;
            borderColor = specialType.borderColor;
            glowColor = specialType.glowColor;
            shape = specialType.shape || 'square';
            ctx.shadowBlur = config.GRID_SIZE * 1.1; // Slightly smaller glow for special
        } else {
            // Normal food glow
            ctx.shadowBlur = config.GRID_SIZE * 0.8;
        }
        ctx.shadowColor = glowColor;
        ctx.fillStyle = foodColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5; // Slightly thicker border

        // --- Draw Shape ---
        ctx.beginPath();
        const halfSize = pulsatingSize / 2;
        const drawCenterX = foodDrawX + halfSize;
        const drawCenterY = foodDrawY + halfSize;

        if (shape === 'diamond') {
            ctx.moveTo(drawCenterX, foodDrawY); // Top point
            ctx.lineTo(foodDrawX + pulsatingSize, drawCenterY); // Right point
            ctx.lineTo(drawCenterX, foodDrawY + pulsatingSize); // Bottom point
            ctx.lineTo(foodDrawX, drawCenterY); // Left point
        } else if (shape === 'star') {
            const spikes = 5;
            const outerRadius = halfSize;
            const innerRadius = halfSize * 0.5;
            let rot = Math.PI / 2 * 3; // Start at top
            let step = Math.PI / spikes;
            ctx.moveTo(drawCenterX, drawCenterY - outerRadius);
            for (let i = 0; i < spikes; i++) {
                let x = drawCenterX + Math.cos(rot) * outerRadius;
                let y = drawCenterY + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;
                x = drawCenterX + Math.cos(rot) * innerRadius;
                y = drawCenterY + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(drawCenterX, drawCenterY - outerRadius); // Close path
        } else if (shape === 'triangle') {
            const height = pulsatingSize * (Math.sqrt(3)/2); // Equilateral triangle height
            ctx.moveTo(drawCenterX, foodDrawY + (pulsatingSize - height) / 2); // Top point
            ctx.lineTo(foodDrawX + pulsatingSize, foodDrawY + (pulsatingSize - height) / 2 + height); // Bottom right
            ctx.lineTo(foodDrawX, foodDrawY + (pulsatingSize - height) / 2 + height); // Bottom left
        } else { // Default: square
            // fillRect/strokeRect handle the square shape
        }

        if (shape !== 'square') {
             ctx.closePath();
             ctx.fill();
             ctx.stroke();
        } else {
             ctx.fillRect(foodDrawX, foodDrawY, pulsatingSize, pulsatingSize);
             ctx.strokeRect(foodDrawX, foodDrawY, pulsatingSize, pulsatingSize);
        }
        // --- End Draw Shape ---


        // --- Draw Timer ---
        if (food.isSpecial && food.durationMs > 0) {
            const elapsedTime = Date.now() - food.spawnTime;
            const remainingFraction = Math.max(0, 1 - (elapsedTime / food.durationMs));

            if (remainingFraction > 0) {
                ctx.fillStyle = config.SPECIAL_FOOD_TIMER_COLOR;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Slight border for timer
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY); // Move to center for pie chart
                // Arc parameters: x, y, radius, startAngle, endAngle, anticlockwise
                const startAngle = -Math.PI / 2; // Start at the top
                const endAngle = startAngle + (remainingFraction * Math.PI * 2);
                const timerRadius = config.GRID_SIZE * 0.4; // Slightly smaller than food
                ctx.arc(centerX, centerY, timerRadius, startAngle, endAngle, false);
                ctx.lineTo(centerX, centerY); // Line back to center
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
        // --- End Draw Timer ---

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1; // Reset line width
    } catch (e) {
        handleError(e, "drawFood");
    }
}
function drawBackgroundEffects() { if (!ctx) return; try { updateBackgroundParticles(); drawBackgroundParticles(ctx); } catch (e) { handleError(e, "drawBackgroundEffects"); } }
function drawForegroundEffects() { if (!ctx) return; try { updateEatParticles(); drawEatParticles(ctx); } catch (e) { handleError(e, "drawForegroundEffects"); } }
function applyScreenShake() {
    // Now applies shake via CSS transform to the canvas element
    if (!canvas) return; // Need the canvas element
    try {
        const shakeX = (Math.random() - 0.5) * currentShakeIntensity * 2;
        const shakeY = (Math.random() - 0.5) * currentShakeIntensity * 2;
        // Apply CSS transform
        canvas.style.transform = `translate(${shakeX.toFixed(1)}px, ${shakeY.toFixed(1)}px)`;
        // --- REMOVED DEBUG LOG ---
    } catch(e){
        handleError(e, "applyScreenShake");
        canvas.style.transform = 'translate(0, 0)'; // Reset on error
    }
}
function animateScore() { if (!scoreElement) return; try { scoreElement.classList.remove('score-pop-animation'); void scoreElement.offsetWidth; scoreElement.classList.add('score-pop-animation'); } catch(e){ handleError(e, "animateScore"); } }

// --- Game Logic ---
function moveSnake() {
    if (isGameOver || isPaused || !snake || snake.length === 0) return;
    if (gameStarted && !changingDirection) playSound(walkSound, "Walk"); // Specify context
    try {
        if (!snake[0]) throw new Error("Snake head is missing");
        const currentHead = snake[0]; const potentialHeadX = currentHead.x + dx; const potentialHeadY = currentHead.y + dy;

        if (config.ENABLE_OBSTACLES && obstacles.some(obs => obs && obs.x === potentialHeadX && obs.y === potentialHeadY)) { handleGameOver(); return; }
        if (potentialHeadX < 0 || potentialHeadX >= GRID_WIDTH || potentialHeadY < 0 || potentialHeadY >= GRID_HEIGHT) {
            if (snake.length > 0) snake.pop(); else throw new Error("Wall hit pop empty snake");
            if (snake.length < config.MIN_SNAKE_LENGTH) {
                handleGameOver();
            } else {
                // Non-fatal wall hit: Apply penalty, shake, and check for stage regression
                score = Math.max(0, score - config.WALL_HIT_PENALTY);
                if (scoreElement) scoreElement.textContent = score;
                shakeDuration = config.SHAKE_DURATION_FRAMES;
                currentShakeIntensity = config.SHAKE_BASE_INTENSITY;
                // Set hurt expression for 0.5 seconds
                currentExpression = 'hurt';
                setTimeout(() => {
                    if (currentExpression === 'hurt') {
                        currentExpression = 'normal';
                    }
                }, 500);

                // --- Check for Stage Regression ---
                const currentMinLength = config.stages[currentStageIndex].minLength;
                if (currentStageIndex > 0 && snake.length < currentMinLength) {
                    // Find the new correct stage by checking downwards
                    for (let i = currentStageIndex - 1; i >= 0; i--) {
                        if (snake.length >= config.stages[i].minLength) {
                            console.log(`Stage Down! New stage: ${config.stages[i].name} (Index: ${i}) due to length ${snake.length}`);
                            currentStageIndex = i;
                            // No pop-up for regression to avoid annoyance
                            break; // Found the correct lower stage
                        }
                    }
                }
                // --- End Stage Regression Check ---
            }
            return;
        }
        const newHead = { x: potentialHeadX, y: potentialHeadY };
        for (let i = 1; i < snake.length; i++) { if (snake[i] && newHead.x === snake[i].x && newHead.y === snake[i].y) { handleGameOver(); return; } }

        snake.unshift(newHead);

        if (powerUp && newHead.x === powerUp.x && newHead.y === powerUp.y) {
            // Power-up collision
            playPowerupSound();
            activateMultiplier();
            
            // Enhanced power-up particles
            const centerX = powerUp.x * config.GRID_SIZE + config.GRID_SIZE / 2;
            const centerY = powerUp.y * config.GRID_SIZE + config.GRID_SIZE / 2;
            
            // Main burst
            spawnEatParticles(centerX, centerY, config.POWERUP_COLOR);
            
            // Additional sparkle effect
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;
                const life = Math.random() * 60 + 40;
                const size = Math.random() * 2 + 1;
                const whiteSpark = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
                
                eatParticles.push(new Particle(
                    centerX, centerY,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    life,
                    whiteSpark,
                    size
                ));
            }
            powerUp = null;
        } else if (food && newHead.x === food.x && newHead.y === food.y) {
            // Food collision
            const scoreToAdd = isMultiplierActive ? 20 : 10;
            score += scoreToAdd;
            if (scoreElement) scoreElement.textContent = score;
            animateScore();
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                if (highScoreElement) highScoreElement.textContent = highScore;

                if (!highScoreBrokenThisGame) {
                    highScoreBrokenThisGame = true; // Set flag
                    console.log("New High Score achieved this game!");

                    // In-game celebration (particles + sound + popup)
                    spawnEatParticles(
                        snake[0].x * config.GRID_SIZE + config.GRID_SIZE/2,
                        snake[0].y * config.GRID_SIZE + config.GRID_SIZE/2,
                        '#FFD700' // Gold color for celebration
                    );
                    playSound(powerupSound); // Use powerup sound for now
                    if (stagePopupElement) {
                        // stagePopupElement.textContent = 'NEW HIGH SCORE!'; // Set by showStagePopup
                        stagePopupElement.style.color = '#FFD700'; // Gold color
                        stagePopupElement.style.textShadow = '0 0 10px #FFD700'; // Gold glow
                        showStagePopup('NEW HIGH SCORE!'); // Use the popup function
                    }
                }
            }
            playSound(eatSound, "Eat");

            let effectApplied = false; // Flag to prevent normal speed increase if special food was eaten

            // --- Apply Food Effect ---
            if (food.isSpecial && food.typeIndex !== null && config.specialFoodTypes[food.typeIndex]) {
                const specialType = config.specialFoodTypes[food.typeIndex];
                const effect = specialType.effect;
                let popupMessage = specialType.name.toUpperCase() + '!'; // Default popup message

                console.log(`Applying effect: ${specialType.name}`);
                effectApplied = true; // Mark that a special effect happened

                // Apply effect based on type
                if (effect.type === 'speed') {
                    gameSpeed += effect.value; // Note: Positive value slows down (increases delay)
                    popupMessage = effect.value > 0 ? 'SLOW DOWN!' : 'SPEED UP!';
                    updateSpeedDisplay();
                } else if (effect.type === 'score') {
                    score += effect.value;
                    if (scoreElement) scoreElement.textContent = score;
                    animateScore(); // Animate the score update
                    popupMessage = `+${effect.value} POINTS!`;
                } else if (effect.type === 'shrink') {
                    const segmentsToRemove = Math.min(effect.value, snake.length - config.MIN_SNAKE_LENGTH);
                    if (segmentsToRemove > 0) {
                        for (let i = 0; i < segmentsToRemove; i++) {
                            if (snake.length > config.MIN_SNAKE_LENGTH) {
                                snake.pop();
                            } else {
                                break; // Stop if min length reached
                            }
                        }
                        popupMessage = 'SHRUNK!';
                        // Check for stage regression after shrinking
                        const currentMinLength = config.stages[currentStageIndex].minLength;
                        if (currentStageIndex > 0 && snake.length < currentMinLength) {
                            for (let i = currentStageIndex - 1; i >= 0; i--) {
                                if (snake.length >= config.stages[i].minLength) {
                                    console.log(`Stage Down! New stage: ${config.stages[i].name} (Index: ${i}) due to shrink`);
                                    currentStageIndex = i;
                                    break;
                                }
                            }
                        }
                    } else {
                         popupMessage = 'TOO SHORT TO SHRINK!'; // Or no popup?
                    }
                }
                // Add other effect types here...

                // Spawn particles with special color
                spawnEatParticles(
                    food.x * config.GRID_SIZE + config.GRID_SIZE / 2,
                    food.y * config.GRID_SIZE + config.GRID_SIZE / 2,
                    specialType.color
                );

                // Show effect popup
                if (stagePopupElement) {
                    stagePopupElement.style.color = specialType.color; // Use food color for popup
                    stagePopupElement.style.textShadow = `0 0 8px ${specialType.glowColor || specialType.color}`; // Add glow
                    showStagePopup(popupMessage);
                }

            } else {
                // Normal food: Spawn normal particles
                spawnEatParticles(
                    food.x * config.GRID_SIZE + config.GRID_SIZE / 2,
                    food.y * config.GRID_SIZE + config.GRID_SIZE / 2,
                    config.FOOD_COLOR
                );
            }
            // --- End Apply Food Effect ---

            // Set happy expression regardless of food type
            currentExpression = 'happy';
            setTimeout(() => {
                if (currentExpression === 'happy') {
                    currentExpression = 'normal';
                }
            }, 500);

            placeFood(); // Place new food
            maybeSpawnPowerup(); // Chance to spawn powerup

            // Only increase speed (decrease delay) for NORMAL food
            if (!effectApplied) {
                gameSpeed = Math.max(config.MIN_GAME_SPEED, gameSpeed - config.SPEED_INCREMENT);
                updateSpeedDisplay();
            }

            // --- Check for Stage Up (applies after eating any food) ---
            const nextStageIndex = currentStageIndex + 1;
            if (nextStageIndex < config.stages.length && snake.length >= config.stages[nextStageIndex].minLength) {
                currentStageIndex = nextStageIndex;
                console.log(`Stage Up! New stage: ${config.stages[currentStageIndex].name} (Index: ${currentStageIndex})`);
                showStagePopup(config.stages[currentStageIndex].name);
                // Optionally add a unique sound effect for stage up here
            }
            // --- End Stage Up Check ---

        } else {
            // No collision - remove tail segment
            if (snake.length > 0) snake.pop(); else throw new Error("No collision pop empty snake");
        }

        updateMultiplier();
        if (!isGameOver && snake.length < config.MIN_SNAKE_LENGTH) { handleGameOver(); }
    } catch (moveError) { handleError(moveError, "moveSnake"); }
}
function placeFood() {
    let newFoodData = {}, attempts = 0;
    const maxAttempts = GRID_WIDTH * GRID_HEIGHT * 3;
    console.log("Attempting to place food...");
    food = null; // Clear existing food first

    try {
        // --- Determine Food Type ---
        let isSpecial = Math.random() < config.SPECIAL_FOOD_SPAWN_CHANCE;
        let typeIndex = null;
        let durationMs = 0;
        let foodTypeName = "Normal";

        if (isSpecial && config.specialFoodTypes && config.specialFoodTypes.length > 0) {
            // Weighted random selection for special food type
            const totalWeight = config.specialFoodTypes.reduce((sum, type) => sum + (type.spawnWeight || 1), 0);
            let randomWeight = Math.random() * totalWeight;
            for (let i = 0; i < config.specialFoodTypes.length; i++) {
                randomWeight -= (config.specialFoodTypes[i].spawnWeight || 1);
                if (randomWeight <= 0) {
                    typeIndex = i;
                    durationMs = config.specialFoodTypes[i].durationMs || 0;
                    foodTypeName = config.specialFoodTypes[i].name;
                    break;
                }
            }
            // Fallback if something went wrong with weights
            if (typeIndex === null) {
                 console.warn("Special food type selection failed, defaulting to normal food.");
                 isSpecial = false;
            }
        } else {
            isSpecial = false; // Ensure it's false if no special types or chance failed
        }
        // --- End Determine Food Type ---

        // --- Find Valid Position ---
        let newPos;
        do {
            newPos = {
                x: Math.floor(Math.random() * GRID_WIDTH),
                y: Math.floor(Math.random() * GRID_HEIGHT)
            };
            attempts++;
            if (attempts > maxAttempts) {
                console.error(`CRITICAL: Could not place food after ${maxAttempts} attempts.`);
                return; // Exit if no valid spot found
            }
        } while (isPositionOccupied(newPos, true, config.ENABLE_OBSTACLES, true));
        // --- End Find Valid Position ---

        // --- Assign Food Object ---
        food = {
            x: newPos.x,
            y: newPos.y,
            isSpecial: isSpecial,
            typeIndex: typeIndex, // Index in config.specialFoodTypes or null
            spawnTime: isSpecial ? Date.now() : 0,
            durationMs: durationMs
        };
        // --- End Assign Food Object ---

        console.log(`Placed ${isSpecial ? foodTypeName : 'Normal'} food at: (${food.x}, ${food.y}) after ${attempts} attempts.`);

    } catch(e) {
        handleError(e, "placeFood");
        food = null; // Ensure food is null on error
    }
}
function isFoodOnSnake(position) { if (!snake || !position) return false; return snake.some(segment => segment && segment.x === position.x && segment.y === position.y); }
function handleGameOver() {
    console.log("GAME OVER triggered.");
    if (isGameOver) return;
    try {
        isGameOver = true;
        isPaused = true;
        clearTimeout(gameLoopTimeout);
        if(startPauseButton) { startPauseButton.textContent = "Start"; startPauseButton.disabled = true; }
        if(bgMusic) bgMusic.pause();
        playOopsSound();

        // --- Apply Game Over Shake ---
        if (canvas) {
            const intensity = 15; // Intensity for game over shake
            const durationMs = 500; // Duration in milliseconds
            let startTime = performance.now();
            function gameOverShake(currentTime) {
                const elapsedTime = currentTime - startTime;
                if (elapsedTime < durationMs) {
                    const progress = elapsedTime / durationMs;
                    const currentIntensity = intensity * (1 - progress); // Fade out intensity
                    const shakeX = (Math.random() - 0.5) * currentIntensity * 2;
                    const shakeY = (Math.random() - 0.5) * currentIntensity * 2;
                    canvas.style.transform = `translate(${shakeX.toFixed(1)}px, ${shakeY.toFixed(1)}px)`;
                    requestAnimationFrame(gameOverShake);
                } else {
                    canvas.style.transform = 'translate(0, 0)'; // Reset at the end
                }
            }
            requestAnimationFrame(gameOverShake);
        }
        // --- End Game Over Shake ---

        if (ctx) {
            console.log("Performing final game over draw...");
            // Note: Final draw might happen before or during shake animation finishes
            clearCanvas();
            drawBackgroundEffects();
            if (config.ENABLE_OBSTACLES) drawObstacles();
            if (food) drawFood();
            if (powerUp) drawPowerup();
            if (snake && snake.length > 0) drawSnake(); else console.warn("Snake invalid/empty on game over draw.");
        } else { console.error("Cannot perform final draw - ctx missing."); }

        if (gameOverElement && finalScoreValueElement) {
            let gameOverText = `Score: ${score}`;
            if (highScoreBrokenThisGame) {
                gameOverText += "<br>🎉 New High Score! 🎉";
                // TODO: Add fireworks particle effect here later?
            }
            // finalScoreValueElement.textContent = score; // Keep this if needed elsewhere, but update the main display
            const finalScoreDisplay = gameOverElement.querySelector('.final-score');
            if (finalScoreDisplay) {
                 finalScoreDisplay.innerHTML = gameOverText; // Update the score display part
            } else {
                 // Fallback if .final-score isn't found (though it should be based on HTML)
                 finalScoreValueElement.textContent = score + (highScoreBrokenThisGame ? " (New High Score!)" : "");
            }
            gameOverElement.style.display = 'block';
            gameOverElement.style.animation = 'none';
            void gameOverElement.offsetWidth; // Trigger reflow
            gameOverElement.style.animation = 'fadeInGameOver 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.1s';
        } else { console.warn("Game over UI elements missing."); }

        isMultiplierActive = false;
        multiplierTimer = 0;
        updateMultiplierDisplay();
    } catch(e) {
        handleError(e, "handleGameOver");
        if (canvas) canvas.style.transform = 'translate(0, 0)'; // Ensure reset on error
    }
}

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
function openConfigModal() {
    try {
        console.log("Opening config modal...");
        if (!isPaused && !isGameOver) togglePause();
        if (!configModal || !configSpeedInput /* REMOVED: || !configSnakeColorInput */ || !configFoodColorInput || !configBgColorInput || !configObstacleColorInput || !configPowerupColorInput || !configEnableObstaclesInput || !configObstacleCountInput ) throw new Error("Config modal elements missing.");

        // --- Apply Inverse Speed Mapping for Display ---
        const currentDelay = config.INITIAL_GAME_SPEED;
        const delayRatio = (MAX_GAME_DELAY - currentDelay) / (MAX_GAME_DELAY - config.MIN_GAME_SPEED);
        const displaySpeedValue = Math.round(MIN_SPEED_INPUT + delayRatio * (MAX_SPEED_INPUT - MIN_SPEED_INPUT));
        configSpeedInput.value = displaySpeedValue;
        console.log(`Current Initial Delay: ${currentDelay}, Calculated Display Speed: ${displaySpeedValue}`);
        // --- End Inverse Speed Mapping ---

        /* REMOVED: configSnakeColorInput.value = config.SNAKE_COLOR; */
        configFoodColorInput.value = config.FOOD_COLOR;
        configBgColorInput.value = config.BACKGROUND_COLOR;
        configObstacleColorInput.value = config.OBSTACLE_COLOR;
        configPowerupColorInput.value = config.POWERUP_COLOR;
        configEnableObstaclesInput.checked = config.ENABLE_OBSTACLES;
        configObstacleCountInput.value = config.OBSTACLE_COUNT;
        configObstacleCountInput.disabled = !config.ENABLE_OBSTACLES;

        configModal.style.display = 'block';
        setTimeout(() => configModal.classList.add('open'), 10);
    } catch(e){ handleError(e, "openConfigModal");}
}
function closeConfigModal() { try { if (!configModal) return; console.log("Closing config modal..."); configModal.classList.remove('open'); setTimeout(() => { if (!configModal.classList.contains('open')) configModal.style.display = 'none'; }, 300); } catch(e){ handleError(e, "closeConfigModal");} }
function applyConfiguration() {
    try {
        if (!configSpeedInput /* REMOVED: || !configSnakeColorInput */ || !configFoodColorInput || !configBgColorInput || !configObstacleColorInput || !configPowerupColorInput || !configEnableObstaclesInput || !configObstacleCountInput) throw new Error("Cannot apply config - input elements missing.");
        console.log("Applying configuration...");

        // --- Apply Speed Mapping ---
        const speedInputValue = parseInt(configSpeedInput.value);
        if (!isNaN(speedInputValue) && speedInputValue >= MIN_SPEED_INPUT && speedInputValue <= MAX_SPEED_INPUT) {
            // Linear interpolation: Map input range [MIN_SPEED_INPUT, MAX_SPEED_INPUT] to delay range [MAX_GAME_DELAY, config.MIN_GAME_SPEED]
            const speedRatio = (speedInputValue - MIN_SPEED_INPUT) / (MAX_SPEED_INPUT - MIN_SPEED_INPUT);
            config.INITIAL_GAME_SPEED = Math.round(MAX_GAME_DELAY - speedRatio * (MAX_GAME_DELAY - config.MIN_GAME_SPEED));
            console.log(`Speed Input: ${speedInputValue}, Calculated Initial Delay: ${config.INITIAL_GAME_SPEED}`);
            // Note: We don't call updateSpeedDisplay() here because applyConfiguration forces a restart via initializeGame(),
            // which already calls updateSpeedDisplay() with the correct initial gameSpeed.
        } else {
            console.warn(`Invalid speed input value: ${configSpeedInput.value}. Using previous initial speed: ${config.INITIAL_GAME_SPEED}`);
        }
        // --- End Speed Mapping ---

        /* REMOVED: config.SNAKE_COLOR = configSnakeColorInput.value || config.SNAKE_COLOR; */
        config.FOOD_COLOR = configFoodColorInput.value || config.FOOD_COLOR;
        config.BACKGROUND_COLOR = configBgColorInput.value || config.BACKGROUND_COLOR;
        config.OBSTACLE_COLOR = configObstacleColorInput.value || config.OBSTACLE_COLOR;
        config.POWERUP_COLOR = configPowerupColorInput.value || config.POWERUP_COLOR;
        config.ENABLE_OBSTACLES = configEnableObstaclesInput.checked;
        config.OBSTACLE_COUNT = parseInt(configObstacleCountInput.value) >= 0 ? parseInt(configObstacleCountInput.value) : config.OBSTACLE_COUNT;

        saveConfig();
        closeConfigModal();
        initializeGame();
    } catch(e){ handleError(e, "applyConfiguration");}
}

// --- Game Loop ---
function gameLoop() {
    if (isPaused || isGameOver) { clearTimeout(gameLoopTimeout); return; }
    changingDirection = false;
    gameLoopTimeout = setTimeout(() => {
        if (isPaused || isGameOver) return;
        if (!ctx || !canvas) { handleError(new Error("Ctx or Canvas missing in loop timeout"), "gameLoop Timeout"); return; } // Added canvas check
        try {
            // REMOVED: ctx.save(); // No longer needed for shake

            // Apply or reset CSS shake
            if (shakeDuration > 0) {
                applyScreenShake(); // Applies CSS transform
                shakeDuration--;
                if (shakeDuration <= 0) {
                    currentShakeIntensity = 0;
                    canvas.style.transform = 'translate(0, 0)'; // Reset CSS transform when shake ends
                }
            } else {
                 // Ensure transform is reset if shakeDuration was already 0
                 if (canvas.style.transform !== 'translate(0px, 0px)' && canvas.style.transform !== '') { // Avoid unnecessary resets
                    canvas.style.transform = 'translate(0, 0)';
                 }
            }

            clearCanvas();
            drawBackgroundEffects();
            if (config.ENABLE_OBSTACLES) drawObstacles();

            // --- Check for expired special food ---
            if (food && food.isSpecial && food.durationMs > 0 && (Date.now() - food.spawnTime > food.durationMs)) {
                console.log(`Special food (${config.specialFoodTypes[food.typeIndex]?.name || 'Unknown'}) expired. Replacing.`);
                placeFood(); // Replace expired food
            }
            // --- End check ---

            if (food) drawFood(); else { console.warn("Loop: Food missing."); placeFood(); if(food) drawFood(); else { handleError(new Error("Food missing & cannot be placed."), "gameLoop - Food Check"); return; } } // Place or fail
            if (powerUp) drawPowerup();

            moveSnake();

            if (!isGameOver) {
                if (snake && snake.length > 0) { drawSnake(); }
                else { handleError(new Error("Snake disappeared unexpectedly after move."), "gameLoop - Draw Check"); /* REMOVED: ctx.restore(); */ return; }
                drawForegroundEffects();
                // REMOVED: ctx.restore(); // No longer needed for shake
                gameLoop();
            } else {
                // Ensure transform is reset on game over
                if (canvas.style.transform !== 'translate(0px, 0px)' && canvas.style.transform !== '') {
                    canvas.style.transform = 'translate(0, 0)';
                }
                // REMOVED: ctx.restore(); // No longer needed for shake
            }
        } catch (error) {
             handleError(error, "gameLoop Tick Execution");
             // Ensure transform is reset on error
             try { if (canvas) canvas.style.transform = 'translate(0, 0)'; } catch(resetError){ console.error("Error resetting canvas transform after loop error:", resetError); }
             // REMOVED: try { ctx.restore(); } catch(restoreError){ console.error("Error restoring context after loop error:", restoreError); }
        }
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