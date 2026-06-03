const gameArea = document.getElementById('game-area');
const target = document.getElementById('target');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

let score = 0;
let timeLeft = 30;
let gameInterval;
let isPlaying = false;

function startGame() {
    score = 0;
    timeLeft = 30;
    isPlaying = true;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    
    startBtn.style.display = 'none'; 
    target.style.display = 'block';   
    
    moveTarget(); 
    
    gameInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function moveTarget() {
    if (!isPlaying) return;

    const maxX = gameArea.clientWidth - 40;
    const maxY = gameArea.clientHeight - 40;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';
}

target.addEventListener('mousedown', (e) => {
    e.stopPropagation(); 
    score++;
    scoreDisplay.textContent = score;
    moveTarget(); 
});

gameArea.addEventListener('mousedown', () => {
    if (isPlaying && score > 0) {
        score--;
        scoreDisplay.textContent = score;
    }
});

// Clears intervals and wraps up stats
function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    target.style.display = 'none';
    startBtn.style.display = 'block';
    startBtn.textContent = 'PLAY AGAIN';
    
    alert(`Game Over! You hit ${score} targets.`);
}

startBtn.addEventListener('click', startGame);