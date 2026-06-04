// DOM Element Links
const gameArea = document.getElementById('game-area');
const startBtn = document.getElementById('start-btn');
const crosshair = document.getElementById('crosshair');
const weaponHud = document.getElementById('weapon-hud');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const coinDisplay = document.getElementById('coin-balance');
const modeSelect = document.getElementById('mode-select');
const sizeSelect = document.getElementById('size-select');

// Core Variables
let score = 0;
let timeLeft = 30;
let isPlaying = false;
let coins = 0;

let gameInterval = null;
let timerInterval = null;
let trackingScoreInterval = null;

let currentSkin = 'default';
let ownedSkins = ['default'];

// Three.js Engine Variables
let scene, camera, renderer, targetMesh;
let raycaster, mouse3D;
let isHoveringTarget = false;

const sizeMap = { 'large': 1.6, 'medium': 1.1, 'small': 0.6 };

window.addEventListener('load', () => {
    if (typeof THREE !== 'undefined') {
        init3DEngine();
    } else {
        console.error("Three.js library engine failed to execute!");
    }
});

function init3DEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090d);

    camera = new THREE.PerspectiveCamera(60, gameArea.clientWidth / gameArea.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    gameArea.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Target Sphere Mesh
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.3, metalness: 0.2 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.visible = false; 
    scene.add(targetMesh);

    raycaster = new THREE.Raycaster();
    mouse3D = new THREE.Vector2();

    gameArea.addEventListener('mousemove', onMouseMove);
    gameArea.addEventListener('mousedown', onMouseDown);
    startBtn.addEventListener('click', startGame);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (targetMesh && targetMesh.visible) {
        targetMesh.rotation.x += 0.01;
        targetMesh.rotation.y += 0.01;
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function startGame() {
    score = 0;
    timeLeft = 30;
    isPlaying = true;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    
    startBtn.style.display = 'none';
    crosshair.style.display = 'block';
    if (weaponHud) weaponHud.style.display = 'block'; // Activate HUD weapon graphics
    targetMesh.visible = true;
    
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    clearInterval(trackingScoreInterval);

    applyTarget3DStyle();
    moveTarget3D();

    const mode = modeSelect.value;

    if (mode === 'flick') {
        gameInterval = setInterval(() => {
            if (isPlaying) moveTarget3D();
        }, 850);
    } else if (mode === 'tracking') {
        trackingScoreInterval = setInterval(() => {
            if (isPlaying && isHoveringTarget) {
                score++;
                scoreDisplay.textContent = score;
                if (score % 15 === 0) moveTarget3D();
            }
        }, 100);
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function moveTarget3D() {
    if (!isPlaying) return;
    const boundsX = 4.5; 
    const boundsY = 2.5; 
    const randomX = (Math.random() * 2 - 1) * boundsX;
    const randomY = (Math.random() * 2 - 1) * boundsY;
    targetMesh.position.set(randomX, randomY, 0);
}

function applyTarget3DStyle() {
    const sizeSetting = sizeSelect.value;
    const scaleFactor = sizeMap[sizeSetting] || 1.1;
    targetMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    if (currentSkin === 'aqua') {
        targetMesh.material.color.setHex(0x00ffff);
    } else if (currentSkin === 'diamond') {
        targetMesh.material.color.setHex(0xaae8ff);
    } else {
        targetMesh.material.color.setHex(0xff3366);
    }
}

function checkIntersections() {
    if (!camera || !targetMesh) return false;
    raycaster.setFromCamera(mouse3D, camera);
    const intersects = raycaster.intersectObject(targetMesh);
    return intersects.length > 0;
}

function onMouseMove(event) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse3D.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse3D.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Advanced Input Lag Weapon Sway Simulation
    if (isPlaying && weaponHud) {
        const deltaX = mouse3D.x * 30; 
        const deltaY = -mouse3D.y * 20;
        weaponHud.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    if (isPlaying && modeSelect.value === 'tracking') {
        isHoveringTarget = checkIntersections();
    }
}

function onMouseDown() {
    if (!isPlaying) return;
    
    // Fire weapon recoil animation loop
    if (weaponHud) {
        weaponHud.classList.remove('weapon-recoil');
        void weaponHud.offsetWidth; // Force asset refresh
        weaponHud.classList.add('weapon-recoil');
    }

    const mode = modeSelect.value;
    if (mode === 'classic' || mode === 'flick') {
        if (checkIntersections()) {
            score++;
            scoreDisplay.textContent = score;
            moveTarget3D();
        }
    }
}

function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    clearInterval(trackingScoreInterval);
    
    targetMesh.visible = false;
    crosshair.style.display = 'none';
    if (weaponHud) weaponHud.style.display = 'none'; // Clear weapon graphics
    startBtn.style.display = 'block';
    startBtn.textContent = 'PLAY AGAIN';

    const earnedCoins = Math.floor(score / 2);
    coins += earnedCoins;
    coinDisplay.textContent = coins;
    
    alert(`Game Over! You scored ${score} points and earned ${earnedCoins} AimCoins! 💰`);
}

window.addEventListener('resize', () => {
    if (renderer && camera) {
        renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
        camera.aspect = gameArea.clientWidth / gameArea.clientHeight;
        camera.updateProjectionMatrix();
    }
});

document.querySelectorAll('.equip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const skinName = e.target.getAttribute('data-skin');
        const cost = parseInt(e.target.getAttribute('data-cost')) || 0;

        if (ownedSkins.includes(skinName)) {
            currentSkin = skinName;
            updateShopUI();
            applyTarget3DStyle();
        } else {
            if (coins >= cost) {
                coins -= cost;
                coinDisplay.textContent = coins;
                ownedSkins.push(skinName);
                currentSkin = skinName;
                updateShopUI();
                applyTarget3DStyle();
                alert("Skin successfully loaded!");
            } else {
                alert("Not enough AimCoins!");
            }
        }
    });
});

function updateShopUI() {
    crosshair.className = currentSkin === 'default' ? '' : `crosshair-skin-${currentSkin}`;
    document.querySelectorAll('.shop-item').forEach(item => {
        const btn = item.querySelector('.equip-btn');
        const skinName = btn.getAttribute('data-skin');
        if (ownedSkins.includes(skinName)) {
            item.classList.add('owned');
            btn.textContent = currentSkin === skinName ? "Equipped" : "Equip";
            btn.className = currentSkin === skinName ? "equip-btn active" : "equip-btn";
        }
    });
}