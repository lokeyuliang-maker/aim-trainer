// DOM Element Links
const gameArea = document.getElementById('game-area');
const startBtn = document.getElementById('start-btn');
const crosshair = document.getElementById('crosshair');
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

// Three.js 3D Engine Setup Globals
let scene, camera, renderer, targetMesh;
let gunGroup, gunBarrel, gunGrip, handSleeve;
let raycaster, mouse3D;
let isHoveringTarget = false;
let recoilActive = false;
let recoilTimer = 0;

const sizeMap = { 'large': 1.6, 'medium': 1.1, 'small': 0.6 };

window.addEventListener('load', () => {
    if (typeof THREE !== 'undefined') {
        init3DEngine();
    } else {
        console.error("Three.js library failed to load!");
    }
});

function init3DEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c10);

    camera = new THREE.PerspectiveCamera(60, gameArea.clientWidth / gameArea.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    gameArea.appendChild(renderer.domElement);

    // Multi-directional lighting to make gun models look realistic
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x00aaff, 0.4); // Cool side highlight
    dirLight2.position.set(-5, -5, 2);
    scene.add(dirLight2);

    // Target Sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.3, metalness: 0.2 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.visible = false; 
    scene.add(targetMesh);

    // BUILD DETAILED MESH HANDGUN AND ARM EXTENSION
    function createHandgun() {
    gunGroup = new THREE.Group();

    // 1. Sleek, Skinny Pistol Slide (Made it thinner and longer)
    const barrelGeo = new THREE.BoxGeometry(0.18, 0.3, 2.6);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.8 });
    gunBarrel = new THREE.Mesh(barrelGeo, gunMat);
    gunBarrel.position.set(0, 0, -1.0);
    gunGroup.add(gunBarrel);

    // 2. Tactical Under-Barrel Laser Sight (Bright Neon Blue!)
    const laserBoxGeo = new THREE.BoxGeometry(0.14, 0.14, 1.2);
    const laserBoxMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const laserBox = new THREE.Mesh(laserBoxGeo, laserBoxMat);
    laserBox.position.set(0, -0.2, -1.4);
    gunGroup.add(laserBox);

    const laserBeamGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
    const laserBeamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Neon Aqua Glow
    const laserBeam = new THREE.Mesh(laserBeamGeo, laserBeamMat);
    laserBeam.position.set(0, -0.2, -2.0);
    laserBeam.rotation.x = Math.PI / 2;
    gunGroup.add(laserBeam);

    // 3. Slanted Handle Grip
    const gripGeo = new THREE.BoxGeometry(0.16, 0.8, 0.4);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.6 });
    gunGrip = new THREE.Mesh(gripGeo, gripMat);
    gunGrip.position.set(0, -0.5, -0.1);
    gunGrip.rotation.x = -0.35; // Sharper angle for a tactical look
    gunGroup.add(gunGrip);

    // 4. Compact Tactical Glove Guard
    const handGeo = new THREE.BoxGeometry(0.28, 0.35, 0.5);
    const handMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.5 });
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.position.set(0, -0.4, 0.1);
    gunGroup.add(hand);

    // 5. Extended Forearm Player Sleeve (Tucked slightly lower)
    const sleeveGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.8, 16);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x2e3038, roughness: 0.7 });
    handSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    handSleeve.position.set(0.2, -1.4, 1.2);
    handSleeve.rotation.x = -Math.PI / 3.0; 
    handSleeve.rotation.z = -0.1;
    gunGroup.add(handSleeve);

    // Perfect lower-right placement
    gunGroup.position.set(2.4, -2.0, 7.5);
    scene.add(gunGroup);
    gunGroup.visible = false; 
}

    raycaster = new THREE.Raycaster();
    mouse3D = new THREE.Vector2();

    gameArea.addEventListener('mousemove', onMouseMove);
    gameArea.addEventListener('mousedown', onMouseDown);
    startBtn.addEventListener('click', startGame);

    animate();
}

function createHandgun() {
    gunGroup = new THREE.Group();

    // 1. Main Realistic Pistol Slide/Barrel Frame
    const barrelGeo = new THREE.BoxGeometry(0.35, 0.5, 2.4);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1f2026, roughness: 0.4, metalness: 0.8 });
    gunBarrel = new THREE.Mesh(barrelGeo, gunMat);
    gunBarrel.position.set(0, 0, -1.0);
    gunGroup.add(gunBarrel);

    // 2. Pistol Lower Handle Grip
    const gripGeo = new THREE.BoxGeometry(0.3, 0.9, 0.55);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.7 });
    gunGrip = new THREE.Mesh(gripGeo, gripMat);
    gunGrip.position.set(0, -0.6, -0.2);
    gunGrip.rotation.x = -0.25; // Leans the grip backward realistically
    gunGroup.add(gunGrip);

    // 3. Tactical Glove Guard Hand Simulation
    const handGeo = new THREE.BoxGeometry(0.45, 0.5, 0.6);
    const handMat = new THREE.MeshStandardMaterial({ color: 0x2a2b30, roughness: 0.6 }); // Charcoal glove fabric
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.position.set(0, -0.5, 0.15);
    gunGroup.add(hand);

    // 4. Extended Full Forearm Player Sleeve (Angles from off-screen right)
    const sleeveGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.5, 16);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3e414c, roughness: 0.8 }); // Sleeve shirt texture
    handSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    handSleeve.position.set(0.3, -1.3, 1.0);
    handSleeve.rotation.x = -Math.PI / 3.2; // Slants up towards the gun handle
    handSleeve.rotation.z = -0.15;
    gunGroup.add(handSleeve);

    // Set start resting coordinates (lower right corner)
    gunGroup.position.set(2.2, -1.9, 7.5);
    scene.add(gunGroup);
    gunGroup.visible = false; 
}

function animate() {
    requestAnimationFrame(animate);
    
    if (targetMesh && targetMesh.visible) {
        targetMesh.rotation.x += 0.01;
        targetMesh.rotation.y += 0.01;
    }

    // Dynamic Tracking Aim Control
    if (isPlaying && gunGroup) {
        const targetX = mouse3D.x * 4.0;
        const targetY = mouse3D.y * 2.4;
        
        // Weapon sway delay tracking (Makes gun lag behind mouse smoothly like an FPS game)
        gunGroup.rotation.y = THREE.MathUtils.lerp(gunGroup.rotation.y, (targetX - gunGroup.position.x) * 0.14, 0.1);
        gunGroup.rotation.x = THREE.MathUtils.lerp(gunGroup.rotation.x, -(targetY - gunGroup.position.y) * 0.14, 0.1);

        // Active Recoil Animation Loop
        if (recoilActive) {
            recoilTimer += 0.25;
            gunGroup.position.z = 7.5 + Math.sin(recoilTimer) * 0.6; // Slides back
            gunGroup.position.y = -1.9 + Math.sin(recoilTimer) * 0.3; // Snaps upwards
            if (recoilTimer >= Math.PI) {
                recoilActive = false;
                gunGroup.position.set(2.2, -1.9, 7.5); // Snap back to rest position
            }
        }
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
    targetMesh.visible = true;
    gunGroup.visible = true;
    
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

    // Apply shop skins across both target mesh and weapon metals
    if (currentSkin === 'aqua') {
        targetMesh.material.color.setHex(0x00ffff);
        gunBarrel.material.color.setHex(0x005577);
        handSleeve.material.color.setHex(0x003344);
    } else if (currentSkin === 'diamond') {
        targetMesh.material.color.setHex(0xaae8ff);
        gunBarrel.material.color.setHex(0xd0f5ff);
        handSleeve.material.color.setHex(0x7aa6c2);
    } else {
        targetMesh.material.color.setHex(0xff3366);
        gunBarrel.material.color.setHex(0x1f2026);
        handSleeve.material.color.setHex(0x3e414c);
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

    if (isPlaying && modeSelect.value === 'tracking') {
        isHoveringTarget = checkIntersections();
    }
}

function onMouseDown() {
    if (!isPlaying) return;
    
    // Trigger weapon blowback animations
    recoilActive = true;
    recoilTimer = 0;

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
    gunGroup.visible = false;
    crosshair.style.display = 'none';
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
                alert("Skin unlocked! Gear equipped. 💎");
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