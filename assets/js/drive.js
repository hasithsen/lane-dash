const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas for portrait orientation
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Audio files
const switchSound = new Audio('./assets/audio/tone1.mp3');
const coinSound = new Audio('./assets/audio/powerUp8.mp3');
const gameOverSound = new Audio('./assets/audio/powerUp11.mp3');

// Load background music
const backgroundMusic = new Audio('./assets/audio/8-bit-loop.mp3');
backgroundMusic.loop = true; // Loop the background music
backgroundMusic.volume = 0.5; // Adjust volume (0.0 to 1.0)

// Game variables
let laneWidth = canvas.width / 2;
let vehicleWidth = 100;
let vehicleHeight = 40;
let vehicleX = laneWidth / 2 - vehicleWidth / 2; // Start in left lane
let vehicleY = canvas.height - vehicleHeight - 30; // Bottom of screen
let currentLane = 0; // 0 for left lane, 1 for right lane

let obstacles = [];
let obstacleSpeed = 5;
let gameOver = false;
let lastObstacleTime = 0; // Time of last obstacle spawn
const minObstacleGap = 500; // Minimum distance between obstacles

let coins = [];
let coinSize = 30;
let coinSpeed = 5;
let lastCoinTime = 0;
const minCoinGap = 1000; // Minimum distance between coins

// Load vehicle and truck images
const vehicleImg = new Image();
vehicleImg.src = './assets/img/sedan.png'; // Car icon

const truckImg = new Image();
truckImg.src = './assets/img/truck.png'; // Truck icon

const coinImg = new Image();
coinImg.src = './assets/img/coin.png'; // Coin icon

// Retrieve score from localStorage or initialize to 0
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
document.getElementById('score').textContent = 'Score: ' + score;

// Road line variables
let lineHeight = 20;
let lineSpacing = 30;
let lineY = 0; // For scrolling effect

// Particles array for dopamine animation
let particles = [];

let musicStarted = false; // Track if music has started
let soundsAllowed = false; // Track if sound effects are allowed

// Preload sounds to avoid delays
backgroundMusic.load();
switchSound.load();
coinSound.load();
gameOverSound.load();

// Unlock sound on first interaction (touch or click)
function unlockSound() {
  if (!musicStarted) {
    backgroundMusic.play();
    musicStarted = true;
  }

  if (!soundsAllowed) {
    // Play and pause each sound effect to unlock it in Safari
    switchSound.play();
    switchSound.pause();
    switchSound.currentTime = 0;

    coinSound.play();
    coinSound.pause();
    coinSound.currentTime = 0;

    gameOverSound.play();
    gameOverSound.pause();
    gameOverSound.currentTime = 0;

    soundsAllowed = true;
  }
}

// Function to handle lane switching
function switchLane() {
  if (gameOver) return; // No switching if game is over

  currentLane = currentLane === 0 ? 1 : 0;
  vehicleX = currentLane === 0 ? laneWidth / 2 - vehicleWidth / 2 : laneWidth + laneWidth / 2 - vehicleWidth / 2;

  if (soundsAllowed) {
    switchSound.currentTime = 0; // Reset sound position
    switchSound.play(); // Play switch sound
  }
}

// Add both touchstart and click listeners to unlock sound on mobile and desktop
canvas.addEventListener('click', unlockSound);

// Call switchLane on click or touchstart
canvas.addEventListener('click', switchLane);

// Add event listener for space key (keydown event)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.keyCode === 32) { // Space key detection
    unlockSound();
    switchLane();
  }
});

// Function to create new obstacles (only one lane at a time with a gap)
function createObstacle() {
  const currentTime = Date.now();
  if (currentTime - lastObstacleTime < minObstacleGap) return; // Ensure a gap between obstacles

  const lane = Math.floor(Math.random() * 2); // Randomly select a lane (0 or 1)
  const obstacleX = lane === 0 ? laneWidth / 2 - vehicleWidth / 2 : laneWidth + laneWidth / 2 - vehicleWidth / 2;

  obstacles.push({
    x: obstacleX,
    y: -vehicleHeight, // Start just above screen
    width: vehicleWidth,
    height: vehicleHeight
  });

  lastObstacleTime = currentTime; // Update the last obstacle spawn time
}

// Function to create coins with a gap, not overlapping with obstacles
function createCoin() {
  const currentTime = Date.now();
  if (currentTime - lastCoinTime < minCoinGap) return; // Ensure a gap between coins

  const lane = Math.floor(Math.random() * 2); // Randomly select a lane (0 or 1)
  const coinX = lane === 0 ? laneWidth / 2 - coinSize / 2 : laneWidth + laneWidth / 2 - coinSize / 2;

  coins.push({
    x: coinX,
    y: -coinSize, // Start just above the screen
    size: coinSize
  });

  lastCoinTime = currentTime;
}

// Function to check for collisions
function checkCollision() {
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (
      vehicleX < obs.x + obs.width &&
      vehicleX + vehicleWidth > obs.x &&
      vehicleY < obs.y + obs.height &&
      vehicleY + vehicleHeight > obs.y
    ) {
      // Play game over sound
      gameOverSound.play();
      gameOver = true;
    }
  }
}

// Function to check for coin collection
function checkCoinCollection() {
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    if (
      vehicleX < coin.x + coin.size &&
      vehicleX + vehicleWidth > coin.x &&
      vehicleY < coin.y + coin.size &&
      vehicleY + vehicleHeight > coin.y
    ) {
      // Coin collected
      score += 100;
      document.getElementById('score').textContent = 'Score: ' + score;

      // Save coin count to localStorage
      localStorage.setItem('score', score);

      // Play coin collection sound
      coinSound.play();

      // Create dopamine particles on coin collection
      createParticles(coin.x + coin.size / 2, coin.y + coin.size / 2);

      coins.splice(i, 1); // Remove collected coin
      i--;
    }
  }
}

// Function to create particles for dopamine burst animation
function createParticles(x, y) {
  for (let i = 0; i < 20; i++) { // Create 20 particles
    const angle = Math.random() * Math.PI * 2; // Random angle in radians (0 to 2π)
    const speed = Math.random() * 4 + 1; // Random speed (1 to 5)
    particles.push({
      x: x,
      y: y,
      size: Math.random() * 5 + 2, // Random size
      speedX: Math.cos(angle) * speed, // Random horizontal speed based on angle
      speedY: Math.sin(angle) * speed, // Random vertical speed based on angle
      color: 'yellow', // Color for particles
      opacity: 1, // Initial opacity
      life: 30 // Particle life
    });
  }
}

// Function to update and draw particles with fade-out effect
function updateParticles() {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.opacity -= 0.03; // Gradually reduce opacity
    p.life--;

    // Draw the particle with fading opacity
    ctx.fillStyle = `rgba(255, 255, 0, ${p.opacity})`; // Yellow color with variable opacity
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Remove particles when life ends or fully faded
    if (p.life <= 0 || p.opacity <= 0) {
      particles.splice(i, 1);
      i--;
    }
  }
}

// Function to draw the collision box
function drawCollisionBox(x, y, width, height, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

// Function to determine and display stars based on score
function displayStars(score) {
  const starContainer = document.getElementById('starContainer');
  starContainer.innerHTML = ''; // Clear any previous stars

  // Remove previously added classes
  starContainer.classList.remove('one-star', 'two-stars', 'three-stars');

  let numberOfStars = 1;

  // Determine the number of stars based on score
  if (score > 500 && score <= 1500) {
    numberOfStars = 2;
  } else if (score > 1500) {
    numberOfStars = 3;
  }

  // Apply the correct class based on the number of stars
  if (numberOfStars === 1) {
    starContainer.classList.add('one-star');
  } else if (numberOfStars === 2) {
    starContainer.classList.add('two-stars');
  } else if (numberOfStars === 3) {
    starContainer.classList.add('three-stars');
  }

  // Generate star images dynamically based on score
  for (let i = 0; i < numberOfStars; i++) {
    const starElement = document.createElement('img');
    starElement.src = './assets/img/star.png'; // Path to the star image
    starElement.classList.add(`star-${i + 1}`); // Assign a class based on the star index

    starContainer.appendChild(starElement);
  }
}

const gameUrl = "https://lane-dash.pages.dev";

function shareOnTwitter(score) {
  const twitterBaseUrl = "https://twitter.com/intent/tweet";
  const tweetText = `I scored ${score} points in Lane Dash! Can you beat me? Check it out here: ${gameUrl}`;
  const twitterUrl = `${twitterBaseUrl}?text=${encodeURIComponent(tweetText)}`;
  
  document.getElementById("twitterShare").href = twitterUrl;
}

function shareOnFacebook(score) {
  const facebookBaseUrl = "https://www.facebook.com/sharer/sharer.php";
  const quote = `I scored ${score} points in Lane Dash! Can you beat me? Check it out here: ${gameUrl}`;
  const facebookUrl = `${facebookBaseUrl}?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(quote)}`;
  
  document.getElementById("facebookShare").href = facebookUrl;
}

function shareOnWhatsApp(score) {
  const whatsappBaseUrl = "https://api.whatsapp.com/send";
  const message = `I scored ${score} points in Lane Dash! Can you beat me? Check it out here: ${gameUrl}`;
  const whatsappUrl = `${whatsappBaseUrl}?text=${encodeURIComponent(message)}`;
  
  document.getElementById("whatsappShare").href = whatsappUrl;
}

// Function to show the game over modal
function showGameOverModal() {
  const modal = document.getElementById('gameOverModal');
  const scoreElement = document.getElementById('finalScore');
  const closeModal = document.getElementById('closeModal');

  // Update the score in the modal
  scoreElement.textContent = 'Your Score: ' + score;

  // Display stars based on the score
  displayStars(score);

  // Display the modal
  modal.style.display = 'block';

  // Set up the share links
  shareOnTwitter(score);
  shareOnFacebook(score);
  shareOnWhatsApp(score);

  // Close the modal when the close button is clicked
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.location.reload(); // Reload the game after closing modal
  });

  // Close the modal when clicking outside of the modal content
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.location.reload(); // Reload the game after closing modal
    }
  });
}

// Main game loop
function gameLoop() {
  if (gameOver) {
    showGameOverModal(); // Show Game Over modal
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the road's middle line (scrolling effect)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 5;
  ctx.setLineDash([lineHeight, lineSpacing]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, lineY);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.closePath();
  lineY += obstacleSpeed;
  if (lineY > lineHeight + lineSpacing) {
    lineY = 0;
  }

  // Draw player vehicle
  ctx.drawImage(vehicleImg, vehicleX, vehicleY, vehicleWidth / 1.5, vehicleHeight / 1.5);

  // Draw player vehicle collision box
  // drawCollisionBox(vehicleX, vehicleY, vehicleWidth / 1.5, vehicleHeight / 1.5, 'rgba(255, 0, 0, 0.5)'); // Red box for player

  // Draw obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    ctx.drawImage(truckImg, obs.x, obs.y, obs.width, obs.height);
    obs.y += obstacleSpeed;

    // Draw obstacle collision boxes
    // drawCollisionBox(obs.x, obs.y, obs.width, obs.height, 'rgba(0, 255, 0, 0.5)'); // Green box for obstacles

    // Remove obstacles that go off screen
    if (obs.y > canvas.height) {
      obstacles.splice(i, 1);
      i--;
      score += 10;
    }
  }

  // Draw coins
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);
    coin.y += coinSpeed;

    // Draw coins collision boxes
    // drawCollisionBox(coin.x, coin.y, coin.size, coin.size, 'rgba(0, 0, 255, 0.5)'); // Blue box for coins

    // Remove coins that go off screen
    if (coin.y > canvas.height) {
      coins.splice(i, 1);
      i--;
    }
  }

  // Update particles
  updateParticles();

  // Check for collisions
  checkCollision();

  // Check for coin collection
  checkCoinCollection();

  // Update score
  document.getElementById('score').textContent = 'Score: ' + score;

  // Create new obstacles and coins periodically with a gap
  if (Math.random() < 0.02) {
    createObstacle();
  }
  if (Math.random() < 0.01) {
    createCoin();
  }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Adjust canvas size on window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
