// Minimal endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  // simple sound engine using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width = canvas.clientWidth || 300;
  const HEIGHT = canvas.height = canvas.clientHeight || 150;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -10;
  const PLAYER_SIZE = 4;

  const player = {x: 20, y: HEIGHT - PLAYER_SIZE, vy: 0, width: PLAYER_SIZE, height: PLAYER_SIZE};
  const obstacles = [];
  let spawnCounter = 0;
  const SPAWN_INTERVAL = 90; // frames
  let gameOver = false;

  function reset() {
    player.y = HEIGHT - PLAYER_SIZE;
    player.vy = 0;
    obstacles.length = 0;
    spawnCounter = 0;
    gameOver = false;
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > HEIGHT - PLAYER_SIZE) {
      player.y = HEIGHT - PLAYER_SIZE;
      player.vy = 0;
    }
    // spawn obstacles
    spawnCounter++;
    if (spawnCounter >= SPAWN_INTERVAL) {
      spawnCounter = 0;
      const h = Math.random() * (HEIGHT/2) + PLAYER_SIZE;
      obstacles.push({x: WIDTH, y: HEIGHT - h, width: 6, height: h});
    }
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
    // collision
    for (const o of obstacles) {
      if (player.x < o.x + o.width && player.x + player.width > o.x &&
          player.y < o.y + o.height && player.y + player.height > o.y) {
        gameOver = true;
        playTone(200, 0.2);
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#e0f7ff');
    grad.addColorStop(1, '#a0c4ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ground line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - 1);
    ctx.lineTo(WIDTH, HEIGHT - 1);
    ctx.stroke();
    // player as circle with radial gradient
    const pGrad = ctx.createRadialGradient(
      player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, 1,
      player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, PLAYER_SIZE
    );
    pGrad.addColorStop(0, '#ff6b6b');
    pGrad.addColorStop(1, '#c72c41');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    // obstacles with varying shades
    for (const o of obstacles) {
      const shade = Math.max(30, Math.min(200, Math.floor((o.height / HEIGHT) * 255)));
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Press Space to Restart', WIDTH/2, HEIGHT/2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      if (gameOver) { reset(); }
else if (player.vy === 0) { // on ground
          playTone(400, 0.1);
          player.vy = JUMP_VELOCITY;
        }
    }
  });

  reset();
  loop();
})();
