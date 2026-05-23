// Game: Pixel Dodge - Enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const PLAYER_SIZE = 4; // player rendered as a circle
  const PLAYER_COLOR = '#fff'; // bright white player
  const PLAYER_SPEED_X = 2;
  const PLAYER_SPEED_Y = 0.8; // upward speed per frame
  const SQUARE_SIZE = 10;
  const SQUARE_SPEED = 1.5; // downward speed per frame
  const STAR_COUNT = 100;
  const STAR_SPEED = 0.3;
  const STAR_SIZE = 2;
  const SPAWN_INTERVAL = 800; // ms between new rows
  // Audio setup
  const AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = AUDIO_CTX.createOscillator();
    const gain = AUDIO_CTX.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(AUDIO_CTX.destination);
    gain.gain.setValueAtTime(0.001, AUDIO_CTX.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, AUDIO_CTX.currentTime + 0.01);
    osc.start(AUDIO_CTX.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, AUDIO_CTX.currentTime + duration / 1000);
    osc.stop(AUDIO_CTX.currentTime + duration / 1000);
  }
  function playMove() { playTone(400, 80); }
  function playCrash() { playTone(100, 300); }
  const PLAYER_SHADOW_COLOR = 'rgba(255,255,255,0.5)';
  const PLAYER_SHADOW_BLUR = 6;

  let lastSpawn = 0;
  let gameOver = false;

  const stars = [];
  // Initialize star field
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: STAR_SIZE + Math.random() * 2,
      alpha: 0.5 + Math.random() * 0.5,
    });
  }

const player = {
  x: width / 2 - PLAYER_SIZE / 2,
  y: height - PLAYER_SIZE - 5,
  size: PLAYER_SIZE,
  color: PLAYER_COLOR,
};

  const squares = [];

  const keys = { ArrowLeft: false, ArrowRight: false };
  // Ensure audio context is resumed on user interaction
  window.addEventListener('keydown', e => {
    if (AUDIO_CTX && AUDIO_CTX.state === 'suspended') AUDIO_CTX.resume();
    if (e.key in keys) {
      keys[e.key] = true;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playMove();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  function spawnRow() {
    // generate a random number of squares (1-5) across the width
    const count = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < count; i++) {
      const size = SQUARE_SIZE;
      const x = Math.random() * (width - size);
      const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
      squares.push({ x, y: -size, size, color });
    }
  }

  function update(delta) { // Update positions of player, squares, and stars
  // move stars
  for (const star of stars) {
    star.y += STAR_SPEED * delta;
    if (star.y > height) {
      star.y = -star.size;
      star.x = Math.random() * width;
    }
  }
    // move player upward
    player.y -= PLAYER_SPEED_Y * delta;
    // horizontal movement based on keys
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED_X * delta;
    if (keys.ArrowRight) player.x += PLAYER_SPEED_X * delta;

    // keep player within horizontal bounds (lose if out of bounds)
    if (player.x < 0 || player.x + player.size > width) gameOver = true;
    if (player.y < 0) gameOver = true; // moved off top

    // move squares downwards
    for (const s of squares) s.y += SQUARE_SPEED * delta;
    // remove squares that have left the canvas
    while (squares.length && squares[0].y > height) squares.shift();

    // collision detection
    for (const s of squares) {
      if (
        player.x < s.x + s.size &&
        player.x + player.size > s.x &&
        player.y < s.y + s.size &&
        player.y + player.size > s.y
      ) {
        gameOver = true;
        playCrash();
        break;
      }
    }
  }

function draw() { // Render background stars, squares, and player with enhanced visuals
  // Fill background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // draw stars
  ctx.fillStyle = '#fff';
  for (const star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw squares with slight glow
  for (const s of squares) {
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.size, s.size);
    ctx.shadowBlur = 0; // reset
  }

  // draw player as circle with shadow
  ctx.save();
  ctx.shadowColor = PLAYER_SHADOW_COLOR;
  ctx.shadowBlur = PLAYER_SHADOW_BLUR;
  ctx.fillStyle = PLAYER_COLOR;
  ctx.beginPath();
  ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

  let lastTime = performance.now();
  function loop(timestamp) {
    const delta = (timestamp - lastTime) / 16; // normalize to ~60fps steps
    lastTime = timestamp;

    if (!gameOver) {
      if (timestamp - lastSpawn > SPAWN_INTERVAL) {
        spawnRow();
        lastSpawn = timestamp;
      }
      update(delta);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // start the game loop
  requestAnimationFrame(loop);
})();
