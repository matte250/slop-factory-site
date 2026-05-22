// Simple Asteroid Dodge game targeting canvas with id='game'
// Player: blue rectangle, moves left/right via ArrowLeft/ArrowRight or mouse move.
// Asteroids: red circles falling down, random speed/size.
// Score based on survived time.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgOscillator = null;
  function startBackgroundMusic() {
    if (bgOscillator) return;
    bgOscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOscillator.frequency.value = 30; // low rumble
    gain.gain.value = 0.02;
    bgOscillator.connect(gain).connect(audioCtx.destination);
    bgOscillator.start();
  }
  function stopBackgroundMusic() {
    if (bgOscillator) {
      bgOscillator.stop();
      bgOscillator.disconnect();
      bgOscillator = null;
    }
  }
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  // Ensure audio context resumes on first interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startBackgroundMusic();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  }
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });
  // Starfield setup
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  // Player setup
  const player = { width: 40, height: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    player.x = Math.min(Math.max(mouseX - player.width / 2, 0), width - player.width);
  });

  // Asteroid pool
  const asteroids = [];
  const spawnInterval = 800; // ms
  let lastSpawn = 0;

  // Game state
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed });
  }

  function update(dt) {
    // player movement via keyboard
    if (keys['ArrowLeft']) player.x = Math.max(player.x - player.speed, 0);
    if (keys['ArrowRight']) player.x = Math.min(player.x + player.speed, width - player.width);

    // spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off-screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // collision detection
    for (const a of asteroids) {
      const distX = Math.abs((a.x + a.size / 2) - (player.x + player.width / 2));
      const distY = Math.abs((a.y + a.size / 2) - (player.y + player.height / 2));
      if (distX <= (player.width / 2 + a.size / 2) && distY <= (player.height / 2 + a.size / 2)) {
        gameOver = true;
        playBeep(200, 200); // collision sound
        stopBackgroundMusic();
      }
    }

    // score based on time survived
    score = Math.floor((performance.now() - startTime) / 100);
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#000022');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    // player as triangle ship
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    // asteroids as rugged circles
    ctx.fillStyle = '#ff5555';
    for (const a of asteroids) {
      ctx.beginPath();
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const radius = a.size / 2 * (0.7 + Math.random() * 0.6);
        const x = a.x + a.size / 2 + Math.cos(angle) * radius;
        const y = a.y + a.size / 2 + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastFrame || timestamp);
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
