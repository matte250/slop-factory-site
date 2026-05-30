// Simple asteroid escape game targeting canvas with id="game"
// Ship: triangle, rotates with left/right arrows, thrust with up arrow.
// Asteroids: moving circles, wrap around edges.
// Game over on collision or when fuel runs out.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ---------- Game state ----------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
  };

  const asteroids = [];
  const maxAsteroids = 5;
  const asteroidMinRadius = 15;
  const asteroidMaxRadius = 30;

  let gameOver = false;

// ---------- Utility functions ----------
function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Pre‑generated starfield for background
const stars = [];
const starCount = 80;
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
  });
}

// ---------- Sound manager ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustOsc = null;
function startThrustSound() {
  if (thrustOsc) return; // already playing
  thrustOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  thrustOsc.connect(gain).connect(audioCtx.destination);
  thrustOsc.start();
}
function stopThrustSound() {
  if (!thrustOsc) return;
  thrustOsc.stop();
  thrustOsc.disconnect();
  thrustOsc = null;
}
function playCrashSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}


  function createAsteroid() {
    const radius = randRange(asteroidMinRadius, asteroidMaxRadius);
    const x = randRange(0, width);
    const y = randRange(0, height);
    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(0.5, 2);
    asteroids.push({ x, y, radius, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }

  // Populate initial asteroids
  for (let i = 0; i < maxAsteroids; i++) createAsteroid();

  // ---------- Input handling ----------
  const keys = {};
  window.addEventListener('keydown', e => {
    // required to unlock audio on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ---------- Game logic ----------
  function update(dt) {
    const wasGameOver = gameOver;
    if (gameOver) return;

    // Ship controls
    if (keys.ArrowLeft) ship.angle -= 3 * dt; // rotate left
    if (keys.ArrowRight) ship.angle += 3 * dt; // rotate right
    const thrusting = keys.ArrowUp && ship.fuel > 0;
    if (thrusting) {
      const thrust = 100; // pixels per second^2
      ship.vx += Math.cos(ship.angle) * thrust * dt;
      ship.vy += Math.sin(ship.angle) * thrust * dt;
      ship.fuel -= 20 * dt; // fuel consumption
      startThrustSound();
    } else {
      stopThrustSound();
    }

    // Update ship position
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Screen wrap for ship
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // screen wrap
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    }

    // Collision detection (simple distance check)
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        if (!gameOver) playCrashSound();
        gameOver = true;
        break;
      }
    }

    if (ship.fuel <= 0) {
      if (!gameOver) playCrashSound();
      gameOver = true;
    }
  }

  // ---------- Rendering ----------
  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#00f'; // blue ship
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // thrust flame
    if (keys.ArrowUp && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const gradient = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.3,
        a.x, a.y, a.radius
      );
      gradient.addColorStop(0, '#aaa');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function drawStars() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

function render() {
    drawStars();
    drawShip();
    drawAsteroids();
    drawHUD();
  }

  // ---------- Main loop ----------
  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
