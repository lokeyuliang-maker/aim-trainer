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
let gunGroup, gunBarrel, muzzleFlash;
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
    scene.background = new THREE.Color(0x0a0a0f);

    camera = new THREE.PerspectiveCamera(60, gameArea.clientWidth / gameArea.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    gameArea.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00ffcc, 0.9);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Target Sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.3, metalness: 0.2 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.visible = false; 
    scene.add(targetMesh);

    // BUILD THE 3D HANDGUN STRUCTURE
    createHandgun();

    raycaster = new THREE.Raycaster();
    mouse3D = new THREE.Vector2();

    gameArea.addEventListener('mousemove', onMouseMove);
    gameArea.addEventListener('mousedown', onMouseDown);
    startBtn.addEventListener('click', startGame);

    animate();
}

function createHandgun() {
    gunGroup = new THREE.Group();

    // Weapon Barrel Frame
    const barrelGeo = new THREE.BoxGeometry(0.4, 0.4, 2.2);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x24252a, roughness: 0.5, metalness: 0.8 });
    gunBarrel = new THREE.Mesh(barrelGeo, gunMat);
    gunBarrel.position.set(0, 0, -1.1);
    gunGroup.add(gunBarrel);

    // Weapon Grip Handle
    const gripGeo = new THREE.BoxGeometry(0.35, 1.0, 0.5);
    const grip = new THREE.Mesh(gripGeo, gunMat);
    grip.position.set(0, -0.6, -0.2);
    grip.rotation.x = -0.2; // Angle the handle nicely
    gunGroup.add(grip);

    // Muzzle Flash Particle
    const flashGeo = new THREE.CylinderGeometry(0.0, 0.4, 0.8, 16);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    muzzleFlash.position.set(0, 0, -2.6);
    muzzleFlash.rotation.x = Math.PI / 2;
    gunGroup.add(muzzleFlash);

    // Lock weapon system positioning into bottom-right of viewport space
    gunGroup.position.set(2.2, -1.8, 7);
    scene.add(gunGroup);
    gunGroup.visible = false; // Hide until play starts
}

function animate() {
    requestAnimationFrame(animate);
    
    if (targetMesh && targetMesh.visible) {
        targetMesh.rotation.x += 0.01;
        targetMesh.rotation.y += 0.01;
    }

    // Aim-Tracking Weapon Follow Engine
    if (isPlaying && gunGroup) {
        // Point weapon subtly toward the 3D target vectors map
        const targetX = mouse3D.x * 4;
        const targetY = mouse3D.y * 2.5;
        
        gunGroup.rotation.y = THREE.MathUtils.lerp(gunGroup.rotation.y, (targetX - gunGroup.position.x) * 0.12, 0.1);
        gunGroup.rotation.x = THREE.MathUtils.lerp(gunGroup.rotation.x, -(targetY - gunGroup.position.y) * 0.12, 0.1);

        // Recoil Kickback Mechanics Animation Loop
        if (recoilActive) {
            recoilTimer += 0.2;
            gunGroup.position.z = 7 + Math.sin(recoilTimer) * 0.6; // Quick pop backwards
            muzzleFlash.material.opacity = Math.max(0, 1 - recoilTimer);
            if (recoilTimer >= Math.PI) {
                recoilActive = false;
                gunGroup.position.z = 7;
                muzzleFlash.material.opacity = 0;
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

    // Dynamic Weapon Skin Color Modifiers
    if (currentSkin === 'aqua') {
        targetMesh.material.color.setHex(0x00ffff);
        gunBarrel.material.color.setHex(0x005577); // Metallic Aqua Gun
    } else if (currentSkin === 'diamond') {
        targetMesh.material.color.setHex(0xaae8ff);
        gunBarrel.material.color.setHex(0xd0f5ff); // Diamond wrap chrome steel
    } else {
        targetMesh.material.color.setHex(0xff3366);
        gunBarrel.material.color.setHex(0x24252a); // Carbon default steel
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
    
    // Trigger Weapon Recoil Kick and Flash
    recoilActive = true;
    recoilTimer = 0;
    muzzleFlash.material.opacity = 1;

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
                alert("Skin unlocked! Weapon skin updated! 💎");
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