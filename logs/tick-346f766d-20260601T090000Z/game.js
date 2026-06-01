// Neon Runner – minimal endless runner
// Canvas with id "game" is expected in the HTML.

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas element with id "game" not found');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}


// Resize canvas to fill its container
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resize);
resize();

// Player (neon square)
const player = {
  x: 50, // constant horizontal position
  y: 0,
  size: 20,
  vy: 0,
  color: '#0ff',
  onGround: false,
};
const GRAVITY = 0.6;
const JUMP = -12;

// World segments scrolling leftward
let segments = [];
const SEG_LEN = 100; // width of each segment
let nextSegX = canvas.width; // x coordinate where next segment starts
let speed = 3; // scrolling speed
let score = 0;
let prevScore = 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;
let gameOver = false;

function spawnSegment() {
  const hasGround = Math.random() > 0.2; // 80% ground
  const hasSpike = hasGround && Math.random() < 0.2; // occasional spikes
  segments.push({ x: nextSegX, width: SEG_LEN, hasGround, hasSpike });
  nextSegX += SEG_LEN;
}

// Fill initial segments
while (nextSegX < canvas.width * 2) spawnSegment();

// Input – tap/click or spacebar to jump
// Ensure audio context is resumed on user interaction
function resumeAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
window.addEventListener('keydown', e => { resumeAudio(); if (e.code === 'Space') jump(); });
window.addEventListener('pointerdown', e => { resumeAudio(); jump(); });
function jump() { if (player.onGround) { player.vy = JUMP; player.onGround = false; playSound(700, 0.1); } }

function endGame() { playSound(150, 0.4); gameOver = true; }

function update() {
  if (gameOver) return;

  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;

  const groundY = canvas.height - 30;
  const seg = segments.find(s => player.x >= s.x && player.x < s.x + s.width);
  const onGroundSegment = seg && seg.hasGround;
  const onSpike = seg && seg.hasSpike && player.x > seg.x && player.x < seg.x + seg.width && player.y + player.size > groundY - 20;

  if (onSpike) endGame();

  // Landing logic
  if (player.y + player.size >= groundY) {
    if (onGroundSegment) {
      player.y = groundY - player.size;
      player.vy = 0;
      player.onGround = true;
    } else {
      endGame(); // fell into gap
    }
  }

  // Scroll world
  for (let i = segments.length - 1; i >= 0; i--) {
    segments[i].x -= speed;
    if (segments[i].x + segments[i].width < 0) segments.splice(i, 1);
  }
  if (nextSegX - speed < canvas.width * 2) spawnSegment();
  nextSegX -= speed;

  // Score based on distance travelled
  const newScore = Math.floor((canvas.width - player.x + speed * (segments.length * SEG_LEN)) / 10);
  if (newScore > score) {
    playSound(300, 0.05); // incremental score sound
  }
  score = newScore;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
}

function draw() {
    // Clear background with gradient and stars
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#001');
    bgGradient.addColorStop(1, '#003');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // simple starfield
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.fillRect(sx, sy, 1, 1);
    }


  // Ground and spikes with neon style
  const groundY = canvas.height - 30;
  // Ground gradient
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 30);
  groundGrad.addColorStop(0, '#0f8');
  groundGrad.addColorStop(1, '#070');
  ctx.fillStyle = groundGrad;
  for (const s of segments) {
    if (s.hasGround) {
      // Draw ground segment
      ctx.fillRect(s.x, groundY, s.width, 30);
      // Add neon glow effect
      ctx.shadowColor = '#0f8';
      ctx.shadowBlur = 10;
      ctx.fillRect(s.x, groundY, s.width, 30);
      ctx.shadowBlur = 0;
      if (s.hasSpike) {
        // Spike gradient
        const spikeGrad = ctx.createLinearGradient(0, groundY - 20, 0, groundY);
        spikeGrad.addColorStop(0, '#f44');
        spikeGrad.addColorStop(1, '#800');
        ctx.fillStyle = spikeGrad;
        ctx.beginPath();
        ctx.moveTo(s.x + s.width / 2 - 5, groundY);
        ctx.lineTo(s.x + s.width / 2 + 5, groundY);
        ctx.lineTo(s.x + s.width / 2, groundY - 20);
        ctx.closePath();
        ctx.fill();
        // Reset fill style for ground
        ctx.fillStyle = groundGrad;
      }
    }
  }

  // Player with neon glow
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 15;
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.shadowBlur = 0;

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`High: ${highScore}`, 10, 40);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
