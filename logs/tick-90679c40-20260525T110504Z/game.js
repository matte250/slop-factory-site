// Simple endless runner based on IDEA.md
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 200;
// Height of the ground strip where player runs
const groundHeight = 20;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJumpSound() { playTone(440, 0.1); }
function playGameOverSound() { playTone(150, 0.5); }

// Game settings
let speed = 2; // base scroll speed (pixels/frame)
const speedIncrement = 0.001; // accelerate over time
const gravity = 0.6;
const jumpStrength = -12;
const groundHeight = 20; // height of ground strip

// Player block
const player = {
  x: 50,
  y: canvas.height - 40,
  width: 30,
  height: 30,
  vy: 0,
  onGround: true,
  draw() {
    // draw player as rounded rectangle
    const radius = 6;
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.moveTo(this.x + radius, this.y);
    ctx.lineTo(this.x + this.width - radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
    ctx.lineTo(this.x + this.width, this.y + this.height - radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
    ctx.lineTo(this.x + radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
    ctx.lineTo(this.x, this.y + radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    ctx.closePath();
    ctx.fill();
  },
  update() {
    this.vy += gravity;
    this.y += this.vy;
    if (this.y + this.height >= canvas.height) {
      this.y = canvas.height - this.height;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  },
  jump() {
    if (this.onGround) {
      this.vy = jumpStrength;
      this.onGround = false;
    }
  }
};

// Spikes
const spikes = [];
const spikeWidth = 20;
const spikeHeight = 30;
let spikeTimer = 0;
const spikeInterval = 90; // frames between spikes (adjusted by speed)

function addSpike() {
  spikes.push({
    x: canvas.width,
    y: canvas.height - spikeHeight,
    width: spikeWidth,
    height: spikeHeight
  });
}

function updateSpikes() {
  for (let i = spikes.length - 1; i >= 0; i--) {
    const s = spikes[i];
    s.x -= speed;
    if (s.x + s.width < 0) spikes.splice(i, 1);
  }
}

function drawSpikes() {
  ctx.fillStyle = '#D0021B';
  spikes.forEach(s => {
    // draw triangle spike
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.height);
    ctx.lineTo(s.x + s.width / 2, s.y);
    ctx.lineTo(s.x + s.width, s.y + s.height);
    ctx.closePath();
    ctx.fill();
  });
}

function checkCollision() {
  for (const s of spikes) {
    if (
      player.x < s.x + s.width &&
      player.x + player.width > s.x &&
      player.y < s.y + s.height &&
      player.y + player.height > s.y
    ) {
      return true;
    }
  }
  return false;
}

let gameOver = false;
function gameLoop() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update speed gradually
  speed += speedIncrement;

  // Player update
  player.update();
  player.draw();

  // Spike handling
  spikeTimer++;
  if (spikeTimer > spikeInterval / speed) { // faster spikes as speed rises
    addSpike();
    spikeTimer = 0;
  }
  updateSpikes();
  drawSpikes();

  // Collision detection
  if (checkCollision()) {
    gameOver = true;
    // Play game over sound
    playGameOverSound();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFF';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Input handling
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    player.jump();
    playJumpSound();
  }
});

// Start
requestAnimationFrame(gameLoop);
