// Simple Neon Grid Escape game
// Canvas with id="game"
const canvas = document.getElementById('game');
// Initialize AudioContext for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
if (!canvas) throw new Error('Canvas with id "game" not found');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width = 400;
const HEIGHT = canvas.height = 400;
const COLS = 20, ROWS = 20;
const CELL_W = WIDTH / COLS, CELL_H = HEIGHT / ROWS;

let player = { x: Math.floor(COLS/2), y: Math.floor(ROWS/2) };
let score = 0;
let waveOffset = 0; // controls lit rows
let orb = null; // position of glowing orb

function spawnOrb() {
  // place orb on a random lit cell
  const litRows = [];
  for (let r = 0; r < ROWS; r++) {
    if ((r + waveOffset) % 6 < 3) litRows.push(r);
  }
  const y = litRows[Math.floor(Math.random()*litRows.length)];
  const x = Math.floor(Math.random()*COLS);
  orb = {x, y};
}

function update() {
  // move wave
  waveOffset = (waveOffset + 0.1) % ROWS;
  // check player on dark cell
  const dark = ((player.y + waveOffset) % 6) >= 3;
if (dark) {
      // Play game over tone
      playTone(200, 0.4);
      alert('Game Over! Score: ' + score);
      // reset
    player = { x: Math.floor(COLS/2), y: Math.floor(ROWS/2) };
    score = 0;
    waveOffset = 0;
    orb = null;
    return;
  }
  // check orb collection
if (orb && player.x===orb.x && player.y===orb.y) {
      score++;
      // Play collection tone
      playTone(600, 0.1);
      orb = null;
      spawnOrb();
    }
}

function draw() {
  // Clear with dark gradient background for depth
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw neon grid cells with glow on lit cells
  for (let y = 0; y < ROWS; y++) {
    const lit = ((y + waveOffset) % 6) < 3; // 3 lit rows, 3 dark rows
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = lit ? '#00f9ff' : '#001122';
      if (lit) {
        ctx.shadowColor = '#00f9ff';
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x * CELL_W, y * CELL_H, CELL_W - 1, CELL_H - 1);
    }
  }
  // Reset shadow for subsequent drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw glowing orb with radial gradient
  if (orb) {
    const orbGrad = ctx.createRadialGradient(
      (orb.x + 0.5) * CELL_W,
      (orb.y + 0.5) * CELL_H,
      0,
      (orb.x + 0.5) * CELL_W,
      (orb.y + 0.5) * CELL_H,
      CELL_W / 2.5
    );
    orbGrad.addColorStop(0, '#ffff88');
    orbGrad.addColorStop(1, '#ff8800');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc((orb.x + 0.5) * CELL_W, (orb.y + 0.5) * CELL_H, CELL_W / 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player with neon magenta glow
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc((player.x + 0.5) * CELL_W, (player.y + 0.5) * CELL_H, CELL_W / 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw score in bright cyan
  ctx.fillStyle = '#00ffff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 10, HEIGHT - 10);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// handle keyboard
document.addEventListener('keydown', e => {
  const key = e.key;
  let moved = false;
  if (key === 'ArrowLeft' && player.x>0) { player.x--; moved = true; }
  else if (key === 'ArrowRight' && player.x<COLS-1) { player.x++; moved = true; }
  else if (key === 'ArrowUp' && player.y>0) { player.y--; moved = true; }
  else if (key === 'ArrowDown' && player.y<ROWS-1) { player.y++; moved = true; }
  if (moved) playTone(400, 0.05);
});

spawnOrb();
loop();
