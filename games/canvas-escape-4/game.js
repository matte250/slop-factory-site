// game.js – simple Canvas Escape prototype
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // ----- Audio Setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playKeySound = () => playBeep(800);
  const playHitSound = () => playBeep(200);
  const playWinSound = () => playBeep(600, 0.3);
  const playLoseSound = () => playBeep(100, 0.5);
  const soundFlags = { win: false, lose: false };

  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 600;

  // ----- Game state -----
  const player = { x: 40, y: 40, size: 20, speed: 3, keys: 0 };
  const keys = [];
  const ENEMY_COUNT = 2;
  const enemies = [];
  const TIMER_MAX = 60; // seconds
  let timer = TIMER_MAX;
  let lastTime = performance.now();
  let gameOver = false;
  let win = false;

  // ----- Utility -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectIntersect = (a, b) =>
    a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;

  // ----- Init -----
  function spawnKeys() {
    for (let i = 0; i < 3; i++) {
      keys.push({ x: rand(0, WIDTH - 20), y: rand(0, HEIGHT - 20), size: 15, collected: false });
    }
  }

  function spawnEnemies() {
    for (let i = 0; i < ENEMY_COUNT; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      enemies.push({
        x: rand(0, WIDTH - 30),
        y: rand(0, HEIGHT - 30),
        size: 25,
        speed: 2,
        dx: dir * 2,
        dy: 0,
      });
    }
  }

  spawnKeys();
  spawnEnemies();

  // ----- Input -----
  const keysDown = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keysDown[e.key] = true;
  });
  window.addEventListener('keyup', e => (keysDown[e.key] = false));

  // ----- Game Loop -----
  function update(dt) {
    if (gameOver) return;
    // timer
    timer -= dt / 1000;
    if (timer <= 0) { gameOver = true; if (!soundFlags.lose) { playLoseSound(); soundFlags.lose = true; } }

    // player movement
    if (keysDown['ArrowUp'] || keysDown['w']) player.y -= player.speed;
    if (keysDown['ArrowDown'] || keysDown['s']) player.y += player.speed;
    if (keysDown['ArrowLeft'] || keysDown['a']) player.x -= player.speed;
    if (keysDown['ArrowRight'] || keysDown['d']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(WIDTH - player.size, player.x));
    player.y = Math.max(0, Math.min(HEIGHT - player.size, player.y));

    // enemy movement (simple horizontal bounce)
    enemies.forEach(e => {
      e.x += e.dx;
      if (e.x <= 0 || e.x + e.size >= WIDTH) e.dx *= -1;
    });

    // check collisions with keys
    keys.forEach(k => {
      if (!k.collected && rectIntersect(player, k)) {
        k.collected = true;
        player.keys += 1;
        playKeySound();
      }
    });

    // check win condition
    if (player.keys === 3) { win = true; gameOver = true; if (!soundFlags.win) { playWinSound(); soundFlags.win = true; } }

    // check collisions with enemies
    enemies.forEach(e => {
      if (rectIntersect(player, e)) { gameOver = true; if (!soundFlags.lose) { playHitSound(); soundFlags.lose = true; } }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw player with radial gradient and shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    const playerGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 4,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    playerGrad.addColorStop(0, '#A5D6A7');
    playerGrad.addColorStop(1, '#4CAF50');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    // reset shadow for other items
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // draw keys with simple key shape (circle + stem)
    ctx.fillStyle = '#FFEB3B';
    keys.forEach(k => {
      if (!k.collected) {
        // stem
        ctx.fillRect(k.x + k.size * 0.4, k.y, k.size * 0.2, k.size * 0.6);
        // head
        ctx.beginPath();
        ctx.arc(k.x + k.size / 2, k.y + k.size * 0.75, k.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // draw enemies with radial gradient
    enemies.forEach(e => {
      const enemyGrad = ctx.createRadialGradient(
        e.x + e.size / 2,
        e.y + e.size / 2,
        e.size / 4,
        e.x + e.size / 2,
        e.y + e.size / 2,
        e.size / 2
      );
      enemyGrad.addColorStop(0, '#EF9A9A');
      enemyGrad.addColorStop(1, '#F44336');
      ctx.fillStyle = enemyGrad;
      ctx.beginPath();
      ctx.arc(e.x + e.size / 2, e.y + e.size / 2, e.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Keys: ${player.keys}/3`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, timer).toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = win ? 'green' : 'red';
      ctx.font = '48px sans-serif';
      const msg = win ? 'You Win!' : 'Game Over';
      const txt = ctx.measureText(msg);
      ctx.fillText(msg, (WIDTH - txt.width) / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
