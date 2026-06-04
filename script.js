const gameArea = document.getElementById('game-area');
const target = document.getElementById('target');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const coinsDisplay = document.getElementById('coins');
const crosshair = document.getElementById('custom-crosshair');
const modeSelect = document.getElementById('game-mode');
const sizeSelect = document.getElementById('target-size');
const bossBar = document.getElementById('boss-hp-bar');
const bossHpInner = document.getElementById('boss-hp-inner');
const shopButtons = document.querySelectorAll('.shop-item');

// Game states
let score = 0;
let timeLeft = 30;
let coins = 0;
let gameInterval;
let trackingInterval;
let bossMoveInterval;
let isPlaying = false;

// Boss Mode Settings
let bossMaxHp = 50;
let bossCurrentHp = 50;

// Shop Management System
let unlockedSkins = ['default'];
let equippedSkin = 'default';

// Map size dropdowns to pixel dimensions
const sizeMap = { small: 20, medium: 35, large: 55 };

// Track custom crosshairs inside the container window
gameArea.addEventListener('mousemove', (e) => {
    const rect = gameArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    crosshair.style.left = x + 'px';
    crosshair.style.top = y + 'px';
});

// Primary game initializing configuration
function startGame() {
    score = 0;
    timeLeft = 30;
    isPlaying = true;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    
    startBtn.style.display = 'none';
    target.style.display = 'block';
    
    clearInterval(gameInterval);
    clearInterval(trackingInterval);
    clearInterval(bossMoveInterval);
    bossBar.style.display = 'none';

    const selectedMode = modeSelect.value;
    
    // Size execution
    let pixelSize = sizeMap[sizeSelect.value];
    if (selectedMode === 'boss') {
        pixelSize = 80; // Boss target size override
        bossBar.style.display = 'block';
        bossCurrentHp = bossMaxHp;
        bossHpInner.style.width = '100%';
        target.style.backgroundColor = '#ffcc00'; // Gold color variant for boss
    } else {
        target.style.backgroundColor = '#ff3366';
    }
    target.style.width = pixelSize + 'px';
    target.style.height = pixelSize + 'px';

    function moveTarget() {
    if (!isPlaying) return;
    
    // Get target size or default to 35 if it reads NaN
    let pixelSize = parseInt(target.style.width) || 35;
    
    const maxX = gameArea.clientWidth - pixelSize;
    const maxY = gameArea.clientHeight - pixelSize;

    // Generate random coordinates inside the box
    const randomX = Math.floor(Math.random() * Math.max(maxX, 1));
    const randomY = Math.floor(Math.random() * Math.max(maxY, 1));

    // Instantly teleport the target to the new spot
    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';
}

    // Game Mode logic branches
    if (selectedMode === 'flick') {
        // Fast-paced cycle tracking
        gameInterval = setInterval(() => {
            if(isPlaying) moveTarget();
        }, 850); 
    } else if (selectedMode === 'tracking') {
        // Register tick tracking score calculations
        setupTrackingLogic();
    } else if (selectedMode === 'boss') {
        // Custom multi-tick update sequence for erratic movement profiles
        bossMoveInterval = setInterval(() => {
            if(isPlaying) moveBossErratic();
        }, 400);
    }

    // Standard core game countdown cycle timer
    gameInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function moveTarget() {
    if (!isPlaying) return;
    const pixelSize = parseInt(target.style.width);
    const maxX = gameArea.clientWidth - pixelSize;
    const maxY = gameArea.clientHeight - pixelSize;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';
}

function moveBossErratic() {
    if (!isPlaying) return;
    const maxX = gameArea.clientWidth - 80;
    const maxY = gameArea.clientHeight - 80;
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    
    target.style.transition = "all 0.3s ease-out"; // Gives boss gliding mechanics
    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';
}

// Tracking Mode Action Engine
function setupTrackingLogic() {
    let insideTarget = false;
    target.addEventListener('mouseenter', () => { insideTarget = true; });
    target.addEventListener('mouseleave', () => { insideTarget = false; });
    
    trackingInterval = setInterval(() => {
        if (isPlaying && insideTarget) {
            score++;
            scoreDisplay.textContent = score;
            if (score % 15 === 0) moveTarget(); // Slide profile coordinates out occasionally
        }
    }, 100);
}

// Click and hit action intercept structures
target.addEventListener('mousedown', (e) => {
    if (!isPlaying) return;
    e.stopPropagation();

    const currentMode = modeSelect.value;

    if (currentMode === 'boss') {
        bossCurrentHp--;
        let hpPct = (bossCurrentHp / bossMaxHp) * 100;
        bossHpInner.style.width = hpPct + '%';
        score += 2; // Extra points per chunk damage
        scoreDisplay.textContent = score;
        
        if (bossCurrentHp <= 0) {
            coins += 50; // Mass coin payout bonus for clear condition
            endGame("VICTORY! Boss Slain. +50 Bonus Coins!");
            return;
        }
    } else if (currentMode !== 'tracking') {
        score++;
        scoreDisplay.textContent = score;
        moveTarget();
    }
});

// Accuracy deduction checker structure
gameArea.addEventListener('mousedown', () => {
    if (isPlaying && score > 0 && modeSelect.value !== 'tracking') {
        score--;
        scoreDisplay.textContent = score;
    }
});

function endGame(customMsg) {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(trackingInterval);
    clearInterval(bossMoveInterval);
    
    target.style.display = 'none';
    target.style.transition = 'none';
    bossBar.style.display = 'none';
    startBtn.style.display = 'block';
    startBtn.textContent = 'PLAY AGAIN';
    
    // Standard payout generation logic scaling
    let earnedCoins = Math.floor(score / 3);
    coins += earnedCoins;
    coinsDisplay.textContent = coins;
    
    alert(customMsg || `Game Over! Score: ${score}. You earned 💰 ${earnedCoins} AimCoins!`);
}

// Store Processing Logic Node
shopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const skin = btn.getAttribute('data-skin');
        const cost = parseInt(btn.getAttribute('data-cost'));

        if (unlockedSkins.includes(skin)) {
            // Equip alternative configuration
            equippedSkin = skin;
            updateShopUI();
        } else {
            // Purchase processing logic
            if (coins >= cost) {
                coins -= cost;
                coinsDisplay.textContent = coins;
                unlockedSkins.push(skin);
                equippedSkin = skin;
                updateShopUI();
                alert("Skin unlocked successfully!");
            } else {
                alert(`Not enough AimCoins! You need ${cost - coins} more coins.`);
            }
        }
    });
});

function updateShopUI() {
    shopButtons.forEach(btn => {
        const skin = btn.getAttribute('data-skin');
        const cost = btn.getAttribute('data-cost');
        
        // Clean class list arrays
        btn.className = 'shop-item';
        
        if (equippedSkin === skin) {
            btn.classList.add('equipped');
            btn.textContent = `Equipped`;
            // Apply class profile style to target crosshair tracker
            crosshair.className = '';
            if (skin !== 'default') crosshair.classList.add(skin);
        } else if (unlockedSkins.includes(skin)) {
            btn.classList.add('unlocked');
            btn.textContent = `Use Skin`;
        } else {
            // Retain original string configurations
            if(skin === 'cross') btn.textContent = `🔒 Plus Crosshair (${cost} 💰)`;
            if(skin === 'circle') btn.textContent = `🔒 Tactical Circle (${cost} 💰)`;
            if(skin === 'diamond') btn.textContent = `🔒 Diamond Wrap (${cost} 💰)`;
        }
    });
}

startBtn.addEventListener('click', startGame);