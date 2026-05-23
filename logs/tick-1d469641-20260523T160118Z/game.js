// Simple endless runner ship game on canvas with id "game"
// Ship flies forward; asteroids move toward ship. Arrow keys steer.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let backgroundOsc = null;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function startBackground() {
    if (backgroundOsc) return;
    backgroundOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    backgroundOsc.frequency.value = 30; // low rumble
    backgroundOsc.type = 'sine';
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    backgroundOsc.connect(gain).connect(audioCtx.destination);
    backgroundOsc.start();
  }
  function stopBackground() {
    if (backgroundOsc) {
      backgroundOsc.stop();
      backgroundOsc.disconnect();
      backgroundOsc = null;
    }
  }

  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Ship definition with gradient fill
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT * 0.8,
    w: 30,
    h: 20,
    speed: 4,
    color: '#0f0',
draw() {
        // Gradient fill for ship hull
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, '#0f0');
        grad.addColorStop(1, '#0ff');
        ctx.fillStyle = grad;
        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.w / 2, this.y + this.h);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        ctx.closePath();
        ctx.fill();
        // Reset shadow
        ctx.shadowBlur = 0;
        // Simple thruster flame when moving up
        if (keys['ArrowUp']) {
          ctx.fillStyle = 'orange';
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + this.h);
          ctx.lineTo(this.x - this.w / 4, this.y + this.h + this.h / 2);
          ctx.lineTo(this.x + this.w / 4, this.y + this.h + this.h / 2);
          ctx.closePath();
          ctx.fill();
        }
    }
  };

  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Asteroid pool
  const asteroids = [];
  const ASTEROID_SPAWN_INTERVAL = 1500; // ms
  const ASTEROID_SPEED = 2;
  let lastSpawn = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startBackground();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  let score = 0;
  let startTime = null;
  let gameOver = false;

  function update(dt) {
    // Thruster sound when moving up
    if (keys['ArrowUp']) {
      playTone(400, 0.05);
    }
    // Move ship based on keys
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.w / 2, Math.min(WIDTH - ship.w / 2, ship.x));
    ship.y = Math.max(0, Math.min(HEIGHT - ship.h, ship.y));

    // Update stars (move down to simulate forward motion)
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > HEIGHT) {
        s.x = Math.random() * WIDTH;
        s.y = 0;
        s.size = Math.random() * 2 + 1;
        s.speed = Math.random() * 0.5 + 0.2;
      }
    }

    // Spawn asteroids
    if (Date.now() - lastSpawn > ASTEROID_SPAWN_INTERVAL) {
      lastSpawn = Date.now();
      const size = Math.random() * 30 + 20;
      const x = Math.random() * (WIDTH - size);
      asteroids.push({ x, y: -size, size, speed: ASTEROID_SPEED });
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > HEIGHT) asteroids.splice(i, 1);
    }

    // Collision detection (simple AABB)
    for (const a of asteroids) {
if (
          ship.x - ship.w / 2 < a.x + a.size &&
          ship.x + ship.w / 2 > a.x &&
          ship.y < a.y + a.size &&
          ship.y + ship.h > a.y
        ) {
          gameOver = true;
          playTone(200, 0.3); // collision sound
          stopBackground();
        }
    }

    // Update score (distance traveled = time elapsed)
    if (!startTime) startTime = Date.now();
    score = Math.floor((Date.now() - startTime) / 100);
  }

  function draw() {
    // Clear
    // Draw space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
        const radius = s.size;
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
        ctx.fill();
    }

    // Asteroids
    // Asteroids with radial gradient
    for (const a of asteroids) {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#a52a2a');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship
    ship.draw();

    // Score
    ctx.fillStyle = '#0ff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Final Score: ' + score, WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
