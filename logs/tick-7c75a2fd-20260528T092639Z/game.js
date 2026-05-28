// Simple top-down asteroid dodge game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById("game");
  if (!canvas) {
    console.error("Canvas with id 'game' not found");
    return;
  }
  const ctx = canvas.getContext("2d");
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  let audioStarted = false;
  const resumeAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  window.addEventListener("keydown", resumeAudio, { once: true });
  window.addEventListener("click", resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size to fill its container or default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Create starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  canvas.height = canvas.clientHeight || 600;

  // Game constants
  const SHIP_SIZE = 30; // side length of triangle ship
  const SHIP_SPEED = 4;
  const ASTEROID_MIN_SPEED = 2;
  const ASTEROID_MAX_SPEED = 5;
  const ASTEROID_SPAWN_INTERVAL = 1500; // ms
  const FUEL_SPAWN_INTERVAL = 5000; // ms
  const FUEL_SIZE = 15;
  const FUEL_AMOUNT = 30; // fuel added per pickup
  const FUEL_DECREASE_RATE = 0.02; // per frame

  // Input handling (turning and thrust)
  const keys = {};
  window.addEventListener("keydown", e => (keys[e.key] = true));
  window.addEventListener("keyup", e => (keys[e.key] = false));

  // Game objects
    const ship = {
  x: canvas.width / 2,
  y: canvas.height - SHIP_SIZE * 2,
  size: SHIP_SIZE,
  fuel: 100,
  alive: true,
  vx: 0,
  vy: 0,
  angle: 0, // direction in radians
  thrusting: false,
  prevThrusting: false,
};

  const asteroids = [];
  const fuels = [];

  let lastAsteroidTime = 0;
  let lastFuelTime = 0;
  let score = 0;

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED;
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function spawnFuel() {
    const x = Math.random() * (canvas.width - FUEL_SIZE) + FUEL_SIZE / 2;
    const y = -FUEL_SIZE;
    const speed = 2;
    fuels.push({ x, y, size: FUEL_SIZE, speed });
  }

  function update(delta) {
    // Update ship rotation and thrust
    const TURN_SPEED = 0.05; // radians per frame
    const THRUST = 0.1; // acceleration per frame
    if (keys["ArrowLeft"] || keys["a"]) ship.angle -= TURN_SPEED;
    if (keys["ArrowRight"] || keys["d"]) ship.angle += TURN_SPEED;
    if (keys["ArrowUp"] || keys["w"]) {
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
      ship.thrusting = true;
    } else {
      ship.thrusting = false;
    }
    // Play thrust sound on start
    if (ship.thrusting && !ship.prevThrusting) {
      playTone(300, 0.05);
    }
    ship.prevThrusting = ship.thrusting;
    // Apply friction
    ship.vx *= 0.98;
    ship.vy *= 0.98;
    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep ship within bounds (wrap around)
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Update starfield movement
    for (const s of stars) {
      s.y += 0.5;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Original input fallback removed – ship now uses angle/thrust only
    // Keep existing section for fuel consumption later

    if (!ship.alive) return;
    // Direct input movement removed – ship now uses angle/thrust only

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        score += 10;
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size / 2) {
        ship.alive = false;
        // Collision sound
        playTone(100, 0.3);
        break;
      }
    }

    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.size > canvas.height) {
        fuels.splice(i, 1);
        continue;
      }
      // Collision with ship
      if (
        Math.abs(f.x - ship.x) < (f.size + ship.size) / 2 &&
        Math.abs(f.y - ship.y) < (f.size + ship.size) / 2
      ) {
        ship.fuel = Math.min(100, ship.fuel + FUEL_AMOUNT);
        // Fuel pickup sound
        playTone(200, 0.1);
        fuels.splice(i, 1);
        score += 20;
      }
    }

    // Fuel consumption
    ship.fuel -= FUEL_DECREASE_RATE * delta;
    if (ship.fuel <= 0) ship.alive = false;

    // Spawn new asteroids / fuels
    const now = Date.now();
    if (now - lastAsteroidTime > ASTEROID_SPAWN_INTERVAL) {
      spawnAsteroid();
      lastAsteroidTime = now;
    }
    if (now - lastFuelTime > FUEL_SPAWN_INTERVAL) {
      spawnFuel();
      lastFuelTime = now;
    }
  }

  function draw() {
    // Clear with starfield background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = "#fff";
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with rotation and thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Thrust flame
    if (ship.thrusting) {
      const flameGrad = ctx.createRadialGradient(0, ship.size / 2, 0, 0, ship.size / 2, ship.size);
      flameGrad.addColorStop(0, "#ff6600");
      flameGrad.addColorStop(1, "rgba(255,0,0,0)");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(0, ship.size / 2);
      ctx.lineTo(-ship.size / 4, ship.size);
      ctx.lineTo(ship.size / 4, ship.size);
      ctx.closePath();
      ctx.fill();
    }
    // Ship body with gradient
    const shipGrad = ctx.createLinearGradient(0, -ship.size / 2, 0, ship.size / 2);
    shipGrad.addColorStop(0, "#66ff66");
    shipGrad.addColorStop(1, "#009900");
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x,
        a.y,
        a.radius * 0.2,
        a.x,
        a.y,
        a.radius
      );
      grad.addColorStop(0, "#bbb");
      grad.addColorStop(1, "#555");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw fuel pickups as glowing circles
    for (const f of fuels) {
      const grad = ctx.createRadialGradient(
        f.x,
        f.y,
        f.size * 0.2,
        f.x,
        f.y,
        f.size
      );
      grad.addColorStop(0, "#ff0");
      grad.addColorStop(1, "#aa0");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI: fuel & score
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);

    if (!ship.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f00";
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
      ctx.font = "24px sans-serif";
      ctx.fillText(`Score: ${score}`,
        canvas.width / 2,
        canvas.height / 2 + 40
      );
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (ship.alive) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
