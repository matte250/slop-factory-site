// Minimal Astro Dodge game targeting <canvas id="game"></canvas>
// Controls: Arrow keys or WASD to rotate and thrust.
// Simple vector ship, random asteroids, collision detection, score.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  let thrusting = false;
  const startThrustSound = () => {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  };
  const stopThrustSound = () => {
    if (thrustOsc) {
      thrustOsc.osc.stop();
      thrustOsc = null;
    }
  };
  const playCrashSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  };

  // ----- Utility -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ----- Starfield -----
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), r: rand(0.5, 1.5) });
  }
  const drawStars = () => {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
    update() {
      // Apply velocity
      this.x += this.vx;
      this.y += this.vy;
      // Screen wrap
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
      // Apply damping
      this.vx *= 0.99;
      this.vy *= 0.99;
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fillStyle = '#0ff';
      ctx.fill();
      ctx.restore();
    }
  };

  // ----- Particles (engine thrust) -----
  const particles = [];
  const maxParticleLife = 30; // frames
  const createParticle = (x, y, angle) => {
    const speed = rand(1, 3);
    particles.push({
      x,
      y,
      vx: Math.cos(angle + Math.PI) * speed + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(angle + Math.PI) * speed + (Math.random() - 0.5) * 0.5,
      life: maxParticleLife
    });
  };
  const updateParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  };
  const drawParticles = () => {
    particles.forEach(p => {
      const alpha = p.life / maxParticleLife;
      ctx.fillStyle = `rgba(255,200,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  // ----- Asteroids -----
  const asteroids = [];
  const asteroidCount = 8;
  const spawnAsteroid = () => {
    const size = rand(15, 40);
    const a = {
      x: rand(0, width),
      y: rand(0, height),
      radius: size,
      vx: rand(-1, 1),
      vy: rand(-1, 1)
    };
    asteroids.push(a);
  };
  for (let i = 0; i < asteroidCount; i++) spawnAsteroid();

  const updateAsteroids = () => {
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    });
  };

  const drawAsteroids = () => {
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const handleInput = () => {
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight'] || keys['d']) ship.angle += ship.turnSpeed;
    const thrustingNow = keys['ArrowUp'] || keys['w'];
    if (thrustingNow) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // create thrust particle at ship rear
      const exhaustX = ship.x - Math.cos(ship.angle) * ship.radius;
      const exhaustY = ship.y - Math.sin(ship.angle) * ship.radius;
      createParticle(exhaustX, exhaustY, ship.angle);
      if (!thrusting) { startThrustSound(); thrusting = true; }
    } else {
      if (thrusting) { stopThrustSound(); thrusting = false; }
    }
    if (keys['ArrowDown'] || keys['s']) {
      ship.vx *= 0.95;
      ship.vy *= 0.95;
    }
  };

  // ----- Collision -----
  const checkCollision = () => {
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < ship.radius + a.radius) {
        playCrashSound();
        return true;
      }
    }
    return false;
  };

  // ----- Game Loop -----
  let score = 0;
  let gameOver = false;
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 50);
      return;
    }
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    drawStars();
    handleInput();
    ship.update();
    updateAsteroids();
    // draw thruster particles first (behind ship)
    drawParticles();
    ship.draw();
    drawAsteroids();
    // simple score based on time
    score++;
    // display score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (checkCollision()) gameOver = true;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
