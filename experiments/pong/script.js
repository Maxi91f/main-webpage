const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 10;
const playerSpeed = 6; // Speed of player 1 paddle
const aiSpeed = 4;   // Speed of AI paddle

let player1Y = canvas.height / 2 - paddleHeight / 2;
let player2Y = canvas.height / 2 - paddleHeight / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX; // Initialized in newGame()
let ballSpeedY; // Initialized in newGame()

let player1Score = 0;
let player2Score = 0;

const INITIAL_BALL_SPEED = 5;
const WINNING_SCORE = 7;
let gameRunning = true; // Controls if game logic runs

// Drawing functions
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.fill();
}

function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = '30px monospace';
    ctx.fillText(text, x, y);
}

// Game logic
function moveAll() {
    if (!gameRunning) return;

    // Ball movement
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // AI for Player 2
    if (ballY > player2Y + paddleHeight / 2) {
        player2Y += aiSpeed;
    } else if (ballY < player2Y + paddleHeight / 2) {
        player2Y -= aiSpeed;
    }
    // Keep AI paddle within bounds
    if (player2Y < 0) player2Y = 0;
    if (player2Y > canvas.height - paddleHeight) player2Y = canvas.height - paddleHeight;

    // Ball collision with top/bottom walls
    if (ballY + ballSize > canvas.height || ballY - ballSize < 0) {
        ballSpeedY = -ballSpeedY;
    }

    // Ball collision with paddles
    if (ballX - ballSize < paddleWidth) { // Player 1 side
        if (ballY > player1Y && ballY < player1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            // Increase ball speed slightly after hit
            ballSpeedX *= 1.05;
            ballSpeedY *= 1.05;
        } else if (ballX - ballSize < 0) { // Ball out of bounds on player 1 side
            player2Score++;
            if (player2Score >= WINNING_SCORE) {
                gameRunning = false;
            }
            if (gameRunning) { // Only reset ball if game is still running
                resetBall();
            }
        }
    }

    if (ballX + ballSize > canvas.width - paddleWidth) { // Player 2 side
        if (ballY > player2Y && ballY < player2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            // Increase ball speed slightly after hit
            ballSpeedX *= 1.05;
            ballSpeedY *= 1.05;
        } else if (ballX + ballSize > canvas.width) { // Ball out of bounds on player 2 side
            player1Score++;
            if (player1Score >= WINNING_SCORE) {
                gameRunning = false;
            }
            if (gameRunning) { // Only reset ball if game is still running
                resetBall();
            }
        }
    }
}

function resetBall() {
    // Only reset position, speed is set in newGame() or on paddle hit
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
}

function drawAll() {
    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, 'black');

    // Draw paddles
    drawRect(0, player1Y, paddleWidth, paddleHeight, 'white');
    drawRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight, 'white');

    // Draw ball
    drawCircle(ballX, ballY, ballSize / 2, 'white');

    // Draw scores
    drawText(player1Score, canvas.width / 4, 50, 'white');
    drawText(player2Score, canvas.width * 3 / 4, 50, 'white');

    if (!gameRunning) {
        let winnerText = "";
        if (player1Score >= WINNING_SCORE) {
            winnerText = "Player 1 Wins!";
        } else if (player2Score >= WINNING_SCORE) {
            winnerText = "AI Wins!";
        }
        ctx.fillStyle = 'white';
        ctx.font = '50px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '20px monospace';
        ctx.fillText("Click to Play Again", canvas.width / 2, canvas.height / 2 + 20);
    }
}

// Player 1 movement (keyboard controls for desktop, touch for mobile)
// For desktop: W and S keys
document.addEventListener('keydown', (evt) => {
    if (!gameRunning) return; // Only allow movement if game is running
    switch (evt.key) {
        case 'w':
            player1Y -= playerSpeed;
            break;
        case 's':
            player1Y += playerSpeed;
            break;
    }
    // Keep player 1 paddle within bounds
    if (player1Y < 0) player1Y = 0;
    if (player1Y > canvas.height - paddleHeight) player1Y = canvas.height - paddleHeight;
});

// For mobile: touch controls
canvas.addEventListener('touchmove', (evt) => {
    if (!gameRunning) return; // Only allow movement if game is running
    evt.preventDefault(); // Prevent scrolling
    const touchY = evt.touches[0].clientY - canvas.getBoundingClientRect().top;
    player1Y = touchY - paddleHeight / 2;
    // Keep player 1 paddle within bounds
    if (player1Y < 0) player1Y = 0;
    if (player1Y > canvas.height - paddleHeight) player1Y = canvas.height - paddleHeight;
});

// Game loop
function newGame() {
    player1Score = 0;
    player2Score = 0;
    ballX = canvas.width / 2; // Reset ball position
    ballY = canvas.height / 2; // Reset ball position
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED; // Initial serve direction
    ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED; // Initial serve direction
    gameRunning = true;
}

canvas.addEventListener('mousedown', () => {
    if (!gameRunning) {
        newGame();
    }
});

canvas.addEventListener('touchstart', (evt) => {
    if (!gameRunning) {
        newGame();
    }
});

function gameLoop() {
    moveAll();
    drawAll();
    requestAnimationFrame(gameLoop);
}

newGame(); // Initialize game state on load
gameLoop();