// Simple Orbit Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // ------- Helpers -------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ------- Audio -------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1, type = 'sine') => {
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
  };
  const playCollect = () => playTone(800, 0.07);
  const playCrash = () => playTone(150, 0.3, 'triangle');
  // Ensure AudioContext is resumed after a user gesture
  const resumeAudio = () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // ------- Player -------
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 8,
    speed: 2.5,
    dx: 0,
    dy: 0,
  };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ------- Stars (background) -------
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      r: rand(0.5, 1.5),
    });
  }

  // ------- Asteroids (orbiting) -------
  const asteroids = [];
  const asteroidCount = 6;
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  for (let i = 0; i < asteroidCount; i++) {
    const radius = rand(30, Math.min(canvas.width, canvas.height) / 2 - 30);
    const angle = (i / asteroidCount) * Math.PI * 2;
    const speed = rand(0.001, 0.003);
    const size = rand(12, 20);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    asteroids.push({ radius, angle, speed, size, grad });
  }

  // ------- Fuel cells -------
  let fuel = null;
  const spawnFuel = () => {
    fuel = {
      x: rand(20, canvas.width - 20),
      y: rand(20, canvas.height - 20),
      r: 6,
    };
  };
  spawnFuel();

  // ------- Game state -------
  let score = 0;
  let gameOver = false;

  // ------- Update -------
  function update() {
    if (gameOver) return;
    // player movement
    player.dx = (keys['ArrowLeft'] || keys['a'] ? -1 : 0) + (keys['ArrowRight'] || keys['d'] ? 1 : 0);
    player.dy = (keys['ArrowUp'] || keys['w'] ? -1 : 0) + (keys['ArrowDown'] || keys['s'] ? 1 : 0);
    if (player.dx || player.dy) {
      const len = Math.hypot(player.dx, player.dy);
      player.x += (player.dx / len) * player.speed;
      player.y += (player.dy / len) * player.speed;
      // keep inside canvas
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
    }
    // asteroids orbit
    asteroids.forEach(a => {
      a.angle += a.speed;
      a.x = center.x + Math.cos(a.angle) * a.radius;
      a.y = center.y + Math.sin(a.angle) * a.radius;
    });
    // check collisions with asteroids
    for (const a of asteroids) {
        if (dist(player, a) < player.r + a.size / 2) {
          playCrash();
          gameOver = true;
          break;
        }
    }
    // fuel collection
    if (fuel && dist(player, fuel) < player.r + fuel.r) {
      score++;
      spawnFuel();
      playCollect();
    }
  }

  // ------- Render -------
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw central planet with radial gradient
    const planetGrad = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y, 20);
    planetGrad.addColorStop(0, '#444');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 20, 0, Math.PI * 2);
    ctx.fill();
    // draw asteroids with gradients
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw fuel
    if (fuel) {
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.arc(fuel.x, fuel.y, fuel.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw player
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  // ------- Loop -------
  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
