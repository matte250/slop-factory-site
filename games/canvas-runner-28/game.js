// Simple endless runner targeting <canvas id="game"></canvas>
// Player: square, auto‑runs, jump on click/tap.
// Obstacles: random spikes (rectangles). Collision ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const SPEED = 4; // world scroll speed

  const player = { x: 50, y: H - PLAYER_SIZE, vy: 0, width: PLAYER_SIZE, height: PLAYER_SIZE };
  let obstacles = [];
  let frame = 0;
  let score = 0;
  let running = true;

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, width: size, height: size });
    beep(660, 0.05); // obstacle spawn sound
  }

  function update() {
    if (!running) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > H - PLAYER_SIZE) {
      player.y = H - PLAYER_SIZE;
      player.vy = 0;
    }
    // obstacles movement
    obstacles.forEach(o => o.x -= SPEED);
    // remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.x + o.width > 0);
    // spawn new obstacles
    if (frame % 120 === 0) spawnObstacle(); // approx every 2 seconds at 60fps
    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.width && player.x + player.width > o.x &&
          player.y < o.y + o.height && player.y + player.height > o.y) {
        beep(220, 0.3); // collision sound
        running = false;
        break;
      }
    }
    score = Math.floor(frame / 60);
    frame++;
    draw();
    if (running) requestAnimationFrame(update);
    else gameOver();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // ground line
    ctx.fillStyle = '#555';
    ctx.fillRect(0, H - 5, W, 5);
    // player – draw as a simple pixel‑art character (green square with eyes)
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 7, player.y + 7, 4, 4);
    ctx.fillRect(player.x + 19, player.y + 7, 4, 4);
    // obstacles – draw spikes (red triangles)
    ctx.fillStyle = '#d00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width / 2, o.y);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function gameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', W / 2 - 60, H / 2);
    ctx.fillText('Score: ' + score, W / 2 - 50, H / 2 + 30);
  }

  // input handling – click or tap anywhere
  let audioStarted = false;
  function startAudio(){
    if (!audioStarted){
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('mousedown', () => {
    startAudio();
    if (running && player.y >= H - PLAYER_SIZE) {
      player.vy = JUMP_VELOCITY;
      beep(440, 0.08); // jump sound
    }
  });
  window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startAudio();
    if (running && player.y >= H - PLAYER_SIZE) {
      player.vy = JUMP_VELOCITY;
      beep(440, 0.08);
    }
  }, { passive: false });

  // start loop
  requestAnimationFrame(update);
})();
