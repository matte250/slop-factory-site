// Neon Dash endless runner with neon glow graphics
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 200;

// Game state
let score = 0;
let speed = 3; // pixels per frame
let gravity = 0.6;
let isJumping = false;
let isSliding = false;
let jumpVel = 0;
let obstacles = [];
let frame = 0;

// Player
const player = {
  w: 30,
  h: 30,
  x: 50,
  y: canvas.height - 30,
  color: '#0ff'
};

function resetPlayer() {
  player.y = canvas.height - player.h;
  jumpVel = 0;
  isJumping = false;
  isSliding = false;
}

// Audio context and tone helper
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type='sine', duration=0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function handleInput(e) {
  // Ensure audio context is resumed on user interaction
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (e.type === 'keydown' && e.code === 'Space') {
    if (!isJumping && !isSliding) {
      isJumping = true;
      jumpVel = -12;
      playTone(660, 'sawtooth', 0.1); // jump sound
    }
  }
  if (e.type === 'keydown' && e.key === 'Shift') {
    if (!isJumping) {
      isSliding = true;
      playTone(440, 'square', 0.08); // slide sound
    }
  }
  if (e.type === 'keyup' && e.key === 'Shift') {
    isSliding = false;
  }
}
window.addEventListener('keydown', handleInput);
window.addEventListener('keyup', handleInput);

function spawnObstacle() {
  const type = Math.random() < 0.5 ? 'low' : 'high'; // low: jump over, high: slide under
  const w = 20 + Math.random() * 30;
  const h = type === 'low' ? 30 : 60;
  const y = type === 'low' ? canvas.height - h : canvas.height - 90; // high obstacle above ground
  obstacles.push({x: canvas.width, y, w, h, type, color: '#f0f'});
}

function update() {
  // player physics
  if (isJumping) {
    player.y += jumpVel;
    jumpVel += gravity;
    if (player.y >= canvas.height - player.h) {
      player.y = canvas.height - player.h;
      isJumping = false;
    }
  }
  if (isSliding) {
    player.h = 15;
  } else {
    player.h = 30;
  }

  // obstacles movement
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    // collision detection
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      // Game over – simple reset
      alert('Game Over! Score: ' + Math.floor(score));
      obstacles = [];
      score = 0;
      speed = 3;
      resetPlayer();
      return;
    }
    if (o.x + o.w < 0) {
      obstacles.splice(i, 1);
      score += 1;
      speed += 0.1; // gradually increase difficulty
    }
  }

  // spawn new obstacle every 90 frames
  if (frame % 90 === 0) spawnObstacle();
  frame++;
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#111');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // neon ground line
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 2);
  ctx.lineTo(canvas.width, canvas.height - 2);
  ctx.stroke();
  ctx.shadowBlur = 0; // reset for other draws

  // player with glow
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 12;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;

  // obstacles with glow
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  });

  // score text
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetPlayer();
loop();
