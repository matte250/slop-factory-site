// Minimal endless runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size (you can adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // distance between obstacles
  const SPEED = 4;

  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  canvas.addEventListener('mousedown', resumeAudio);
  canvas.addEventListener('touchstart', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game state
  let player = { x: 50, y: canvas.height - PLAYER_SIZE, w: PLAYER_SIZE, h: PLAYER_SIZE, vy: 0, onGround: true };
  let obstacles = [];
  let framesSinceLast = 0;
  let score = 0;
  let running = true;

  // Input handling – click/tap or space/arrow up
  const jump = () => {
    if (player.onGround) {
      player.vy = JUMP_STRENGTH;
      player.onGround = false;
      beep(440, 0.1); // jump sound
    }
  };
  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') jump(); });

  // Helper: axis‑aligned box collision
  const collides = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Main loop
  function update() {
    if (!running) return;
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height) {
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Spawn obstacles
    framesSinceLast++;
    if (framesSinceLast * SPEED > OBSTACLE_GAP) {
      const height = Math.random() * (canvas.height / 2) + 20;
      obstacles.push({ x: canvas.width, y: canvas.height - height, w: OBSTACLE_WIDTH, h: height });
      framesSinceLast = 0;
    }

    // Move obstacles and check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SPEED;
      if (collides(player, o)) {
        beep(200, 0.3); // collision sound
        running = false;
        break;
      }
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update score
    score++;

    // Render
    // Background gradient (sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky blue
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 4, canvas.width, 4);

    // Player with shadow and rounded corners
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(player.x + 2, player.y + 2, player.w, player.h);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();

    // Obstacles as spikes (triangles)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, canvas.height);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, canvas.height);
      ctx.closePath();
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 10), 10, 20);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    } else {
      requestAnimationFrame(update);
    }
  }

  // Start the game
  requestAnimationFrame(update);
})();
