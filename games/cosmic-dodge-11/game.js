// Cosmic Dodge – minimal side‑scroll canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Starfield for background
  const stars = [];
  const starCount = 200;
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  }
  initStars();

  // Audio setup – simple beep synthesis
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context resumes on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });
  // Size canvas to fill window (adjust on resize)
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Re‑initialize starfield for new dimensions
    initStars();
  };
  window.addEventListener('resize', resize);
  resize();

  // Game state
  const ship = {
    x: 80,
    y: canvas.height / 2,
    radius: 15,
    vy: 0,
    thrust: 0.4,
    gravity: 0.2,
    boostPower: 1.6,
    fuel: 100,
    maxFuel: 100,
    boost: false,
  };
  const asteroids = [];
  let lastAsteroid = 0;
  const asteroidInterval = 1500; // ms
  let score = 0;
  let distance = 0;
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x: canvas.width + radius, y, radius, speed });
    // Sound for asteroid appearance
    playBeep(600, 0.08);
  }

let lastThrustSound = 0;
function update(dt) {
    // Ship controls
    if (keys['ArrowUp']) ship.vy -= ship.thrust;
    if (keys['ArrowDown']) ship.vy += ship.thrust;
    ship.boost = keys['Space'];
    if (ship.boost && ship.fuel > 0) {
      ship.vy -= ship.boostPower * ship.thrust;
      ship.fuel -= 0.15 * dt;
      // Play thrust sound, throttled to ~10 per second
      if (performance.now() - lastThrustSound > 100) {
        playBeep(400, 0.05);
        lastThrustSound = performance.now();
      }
    }
    // Gravity / friction
    ship.vy += ship.gravity;
    ship.y += ship.vy;
    ship.vy *= 0.98; // damping
    // Keep ship inside canvas
    if (ship.y < ship.radius) ship.y = ship.radius;
    if (ship.y > canvas.height - ship.radius) ship.y = canvas.height - ship.radius;
    // Fuel consumption (idle)
    if (!ship.boost) ship.fuel -= 0.02 * dt;
    if (ship.fuel < 0) ship.fuel = 0;

    // Asteroids management
    if (performance.now() - lastAsteroid > asteroidInterval) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }

    // Collision detection (circle vs circle approximation)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        // Collision sound
        playBeep(200, 0.4);
        break;
      }
    }

    // Lose condition: fuel out
    if (ship.fuel <= 0 && !gameOver) {
      gameOver = true;
      // Fuel out sound
      playBeep(150, 0.5);
    }

    // Score based on distance travelled
    distance += (2 + (ship.boost ? 2 : 0)) * dt * 0.06; // arbitrary speed factor
    score = Math.floor(distance);
  }


  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background – starfield
    ctx.fillStyle = '#001020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Ship – stylized triangle with gradient and thrust
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // Gradient for ship body
    const shipGrad = ctx.createLinearGradient(-ship.radius, -ship.radius, ship.radius, ship.radius);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#0a0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.radius, -ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.lineTo(ship.radius, 0);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when boosting
    if (ship.boost && ship.fuel > 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.radius, 0);
      ctx.lineTo(-ship.radius - 10, -5);
      ctx.lineTo(-ship.radius - 8, 0);
      ctx.lineTo(-ship.radius - 10, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Asteroids – gradient rocks
    for (const a of asteroids) {
      // Create radial gradient for each asteroid
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD – score & fuel
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 20, 50);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f55';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${score}`,
        canvas.width / 2,
        canvas.height / 2 + 40);
    }
  }

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
