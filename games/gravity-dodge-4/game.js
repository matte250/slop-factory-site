// Gravity Dodge game
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or a default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30; // low rumble
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  // Generate static starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const PLAYER_WIDTH = 40;
  const PLAYER_HEIGHT = 20;
  const PLAYER_SPEED = 5;
  const ASTEROID_MIN_SIZE = 20;
  const ASTEROID_MAX_SIZE = 50;
  const ASTEROID_SPEED = 2;
  const SPAWN_INTERVAL = 1500; // ms
  const GAME_TIME = 30; // seconds

  const state = {
    playerX: canvas.width / 2 - PLAYER_WIDTH / 2,
    playerY: canvas.height - PLAYER_HEIGHT - 10,
    leftPressed: false,
    rightPressed: false,
    asteroids: [],
    lastSpawn: 0,
    startTime: null,
    remaining: GAME_TIME,
    gameOver: false,
    endSoundPlayed: false,
    lose: false,
  };

  // Input handling – also resume audio on first interaction
  let audioResumed = false;
  function resumeAudio() {
    if (!audioResumed && audioCtx.state !== 'running') {
      audioCtx.resume();
      audioResumed = true;
    }
  }
  window.addEventListener('keydown', e => {
    resumeAudio();
    if (e.code === 'ArrowLeft') state.leftPressed = true;
    if (e.code === 'ArrowRight') state.rightPressed = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') state.leftPressed = false;
    if (e.code === 'ArrowRight') state.rightPressed = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE) + ASTEROID_MIN_SIZE;
    const x = Math.random() * (canvas.width - size);
    state.asteroids.push({ x, y: -size, size });
    // sound for new asteroid
    playTone(200, 80);
  }

  function update(dt) {
    if (state.gameOver) return;

    // player movement
    if (state.leftPressed) state.playerX -= PLAYER_SPEED;
    if (state.rightPressed) state.playerX += PLAYER_SPEED;
    // clamp
    state.playerX = Math.max(0, Math.min(state.playerX, canvas.width - PLAYER_WIDTH));

    // asteroids
    state.asteroids.forEach(a => (a.y += ASTEROID_SPEED));
    // remove off‑screen
    state.asteroids = state.asteroids.filter(a => a.y < canvas.height);

    // collision detection
    for (const a of state.asteroids) {
      const colliding =
        state.playerX < a.x + a.size &&
        state.playerX + PLAYER_WIDTH > a.x &&
        state.playerY < a.y + a.size &&
        state.playerY + PLAYER_HEIGHT > a.y;
      if (colliding) {
        // collision sound
        playTone(100, 200);
        state.gameOver = true;
        break;
      }
    }

    // timer
    const elapsed = (Date.now() - state.startTime) / 1000;
    state.remaining = Math.max(0, GAME_TIME - elapsed);
    if (state.remaining <= 0) state.gameOver = true;

    // spawn new asteroids
    if (Date.now() - state.lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      state.lastSpawn = Date.now();
    }
  }

  function draw() {
    // clear and background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // player – draw as triangle ship with gradient
    ctx.save();
    const shipGradient = ctx.createLinearGradient(0, state.playerY, 0, state.playerY + PLAYER_HEIGHT);
    shipGradient.addColorStop(0, '#0f0');
    shipGradient.addColorStop(1, '#070');
    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(state.playerX, state.playerY + PLAYER_HEIGHT);
    ctx.lineTo(state.playerX + PLAYER_WIDTH / 2, state.playerY);
    ctx.lineTo(state.playerX + PLAYER_WIDTH, state.playerY + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids – draw with radial gradient for depth
    state.asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2, a.y + a.size / 2, a.size * 0.1,
        a.x + a.size / 2, a.y + a.size / 2, a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // timer text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${state.remaining.toFixed(1)}`, 10, 20);

    // game over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      const msg = state.remaining <= 0 ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
      // play end sound once
      if (!state.endSoundPlayed) {
        if (state.remaining <= 0) {
          // win tone
          playTone(500, 300);
        } else {
          // lose tone (collision already played, optional lower tone)
          playTone(50, 400);
        }
        state.endSoundPlayed = true;
      }
    }
  }

  function loop(timestamp) {
    if (!state.startTime) state.startTime = Date.now();
    const dt = timestamp - (state.lastFrame || timestamp);
    state.lastFrame = timestamp;
    update(dt);
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
