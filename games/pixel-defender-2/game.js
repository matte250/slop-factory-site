// Simple Pixel Defender – top‑down shooter on <canvas id="game">
// Enhanced graphics: gradient ship, radial‑gradient asteroids, starfield background.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ----- Starfield background -----
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
  }

  // ----- Sound manager using Web Audio API -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 100) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const Sound = {
    laser() { playTone(800, 80); },
    explosion() { playTone(150, 200); },
    gameOver() { playTone(60, 500); },
  };

  class Ship {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height - 60;
      this.w = 20; this.h = 30;
      this.speed = 3;
      this.shield = 3;
    }
    update() {
      if (keys.ArrowLeft) this.x -= this.speed;
      if (keys.ArrowRight) this.x += this.speed;
      if (keys.ArrowUp) this.y -= this.speed;
      if (keys.ArrowDown) this.y += this.speed;
      this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
      this.y = Math.max(0, Math.min(canvas.height - this.h, this.y));
    }
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = '#0c0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  class Laser {
    constructor(x, y) { this.x = x; this.y = y; this.w = 2; this.h = 12; this.speed = 7; }
    update() { this.y -= this.speed; }
    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.w * 3);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
    }
    offScreen() { return this.y + this.h < 0; }
  }

  class Asteroid {
    constructor() {
      this.radius = Math.random() * 15 + 10;
      this.x = Math.random() * (canvas.width - this.radius * 2);
      this.y = -this.radius * 2;
      this.speed = Math.random() * 1.5 + 0.5;
    }
    update() { this.y += this.speed; }
    draw() {
      const grad = ctx.createRadialGradient(
        this.x + this.radius / 2,
        this.y + this.radius / 2,
        this.radius * 0.2,
        this.x + this.radius / 2,
        this.y + this.radius / 2,
        this.radius
      );
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() { return this.y - this.radius > canvas.height; }
  }

  const ship = new Ship();
  const lasers = [];
  const asteroids = [];
  let spawnTimer = 0;
  let score = 0;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();

    // spawn asteroids
    if (spawnTimer-- <= 0) {
      asteroids.push(new Asteroid());
      spawnTimer = 50; // slightly faster spawn
    }

    ship.update();
    ship.draw();

    // shooting
    if (keys[' '] || keys['Spacebar']) {
      if (lasers.length === 0 || Date.now() - lasers[lasers.length - 1].t > 180) {
        const l = new Laser(ship.x + ship.w / 2, ship.y);
        l.t = Date.now();
        lasers.push(l);
        Sound.laser(); // play laser sound
      }
    }

    // lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.update();
      l.draw();
      if (l.offScreen()) lasers.splice(i, 1);
    }

    // asteroids + collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      a.draw();

      // ship‑asteroid
      const dx = (a.x + a.radius) - (ship.x + ship.w / 2);
      const dy = (a.y + a.radius) - (ship.y + ship.h / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + Math.max(ship.w, ship.h) / 2) {
        ship.shield--;
        asteroids.splice(i, 1);
        if (ship.shield <= 0) return gameOver();
        continue;
      }

      // laser‑asteroid
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        const lx = l.x;
        const ly = l.y;
        const ld = Math.hypot(lx - (a.x + a.radius), ly - (a.y + a.radius));
        if (ld < a.radius) {
          score += 10;
          Sound.explosion(); // play explosion sound
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
      }

      if (a.offScreen()) asteroids.splice(i, 1);
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Shield: ' + ship.shield, 10, 40);

    requestAnimationFrame(loop);
  }

  function gameOver() {
    // Play game‑over sound (ensure audio context is running)
    if (audioCtx.state === 'suspended') audioCtx.resume().then(() => Sound.gameOver());
    else Sound.gameOver();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff5555';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(loop);
})();
