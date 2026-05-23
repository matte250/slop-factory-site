// Simple Asteroid Dodge game with enhanced graphics
// Targets <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
   if (!canvas) return console.error('Canvas with id "game" not found');
   const ctx = canvas.getContext('2d');
   // Set canvas size
   const width = canvas.width = canvas.clientWidth || 800;
   const height = canvas.height = canvas.clientHeight || 600;
   // Generate simple starfield for background
   const stars = Array.from({length: 100}, () => ({
     x: Math.random() * width,
     y: Math.random() * height,
     radius: Math.random() * 1.5 + 0.5,
   }));
   // Particle array for ship thrust
   const particles = [];
   // Audio setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   function playTone(freq, duration) {
     const oscillator = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     oscillator.type = 'square';
     oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
     gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
     oscillator.connect(gain).connect(audioCtx.destination);
     oscillator.start();
     oscillator.stop(audioCtx.currentTime + duration);
   }
   let thrustCooldown = 0;
   function playThrust() {
     if (audioCtx.state === 'suspended') audioCtx.resume();
     playTone(200, 0.05);
   }
   function playExplosion() {
     if (audioCtx.state === 'suspended') audioCtx.resume();
     playTone(100, 0.4);
   }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
    update() {
      this.x = Math.max(this.size, Math.min(width - this.size, this.x + this.dx));
      this.y = Math.max(this.size, Math.min(height - this.size, this.y + this.dy));
    },
    draw() {
      // Ship with gradient fill and outline for better visibility
      const grad = ctx.createLinearGradient(this.x, this.y - this.size, this.x, this.y + this.size);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#006');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
      // white outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  function handleInput() {
    // Generate thrust particles when moving
    if (keys.ArrowUp || keys.w || keys.ArrowDown || keys.s || keys.ArrowLeft || keys.a || keys.ArrowRight || keys.d) {
       // particle emitted from rear of ship based on direction
       const angle = Math.atan2(ship.dy, ship.dx) + Math.PI; // opposite to movement
       const speed = 1;
       particles.push({
         x: ship.x + Math.cos(angle) * ship.size,
         y: ship.y + Math.sin(angle) * ship.size,
         vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
         vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
         life: 30,
         radius: 2 + Math.random() * 2,
       });
       playThrust();
     }
    asteroids.push({x, y, vx, vy, r: 15 + Math.random() * 10});
  }

  function updateAsteroids(dt) {
    asteroidTimer += dt;
    if (asteroidTimer > spawnInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // Remove if off-screen
      if (a.x < -30 || a.x > width + 30 || a.y < -30 || a.y > height + 30) {
        asteroids.splice(i, 1);
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = '#444';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    particles.forEach(p => {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size) {
        return true;
      }
    }
    return false;
  }

  let lastTime = performance.now();
  let gameOver = false;
  let score = 0;
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      handleInput();
      ship.update();
      updateAsteroids(dt);
      if (checkCollision()) {
        gameOver = true;
        playExplosion();
      }
      score += dt / 1000;
    }
    // Render
    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    updateParticles();
    drawParticles();
    drawAsteroids();
    ship.draw();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
