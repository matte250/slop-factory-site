// Simple canvas game based on IDEA.md – Stellar Drift
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
    }, duration);
  };

  // Adjust canvas size to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // regenerate stars on resize
    generateStars();
  };
  window.addEventListener('resize', resize);
  // Starfield
  const starCount = 100;
  let stars = [];
  const generateStars = () => {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
  };
  generateStars();
  resize();

  // ---------- Game state ----------
  const state = {
    score: 0,
    fuel: 100,           // starts full, depletes over time
    running: true,
    keys: {},            // pressed keys
    player: {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 10,
      speed: 2,
    },
    orbs: [],
    asteroids: [],
    nextOrb: 0,
    nextAsteroid: 0,
  };

  // ---------- Input handling ----------
  const keyMap = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', a: 'left', s: 'down', d: 'right',
  };
  window.addEventListener('keydown', e => {
    const dir = keyMap[e.key];
    if (dir) {
      state.keys[dir] = true;
      // start thrust sound if not already playing
      if (!thrustOsc) {
        thrustOsc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        thrustOsc.frequency.value = 150;
        gain.gain.value = 0.05;
        thrustOsc.connect(gain).connect(audioCtx.destination);
        thrustOsc.start();
      }
    }
  });
  window.addEventListener('keyup', e => {
    const dir = keyMap[e.key];
    if (dir) {
      state.keys[dir] = false;
      // if no direction keys are pressed, stop thrust sound
      if (!state.keys.up && !state.keys.down && !state.keys.left && !state.keys.right && thrustOsc) {
        thrustOsc.stop();
        thrustOsc = null;
      }
    }
  });

  // ---------- Helpers ----------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // ---------- Spawn functions ----------
  const spawnOrb = () => {
    const radius = 5;
    const x = rand(radius, canvas.width - radius);
    const y = rand(radius, canvas.height - radius);
    state.orbs.push({ x, y, radius });
  };

  const spawnAsteroid = () => {
    const radius = rand(12, 25);
    // spawn at random edge
    const edge = Math.floor(rand(0, 4)); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const speed = rand(1, 2.5);
    if (edge === 0) { // top
      x = rand(0, canvas.width);
      y = -radius;
      vx = rand(-1, 1);
      vy = speed;
    } else if (edge === 1) { // right
      x = canvas.width + radius;
      y = rand(0, canvas.height);
      vx = -speed;
      vy = rand(-1, 1);
    } else if (edge === 2) { // bottom
      x = rand(0, canvas.width);
      y = canvas.height + radius;
      vx = rand(-1, 1);
      vy = -speed;
    } else { // left
      x = -radius;
      y = rand(0, canvas.height);
      vx = speed;
      vy = rand(-1, 1);
    }
    state.asteroids.push({ x, y, vx, vy, radius });
  };

  // ---------- Game loop ----------
  const update = (dt) => {
    if (!state.running) return;

    // fuel consumption
    state.fuel -= dt * 0.01; // consumes fuel over time
    if (state.fuel <= 0) {
      state.fuel = 0;
      state.running = false;
    }

    // player movement
    const p = state.player;
    if (state.keys.up) p.y -= p.speed;
    if (state.keys.down) p.y += p.speed;
    if (state.keys.left) p.x -= p.speed;
    if (state.keys.right) p.x += p.speed;
    // keep inside canvas
    p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));

    // spawn orbs and asteroids at intervals
    const now = performance.now();
    if (now > state.nextOrb) {
      spawnOrb();
      state.nextOrb = now + rand(2000, 4000); // 2‑4 s
    }
    if (now > state.nextAsteroid) {
      spawnAsteroid();
      state.nextAsteroid = now + rand(1500, 3000);
    }

    // update asteroids
    state.asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
    });
    // remove off‑screen asteroids
    state.asteroids = state.asteroids.filter(a =>
      a.x > -a.radius && a.x < canvas.width + a.radius &&
      a.y > -a.radius && a.y < canvas.height + a.radius);

    // check collisions with orbs
    state.orbs = state.orbs.filter(orb => {
      if (distance(p.x, p.y, orb.x, orb.y) < p.radius + orb.radius) {
        state.score += 1;
        state.fuel = Math.min(100, state.fuel + 15); // refuel
        // play collection sound
        playTone(440, 100);
        return false; // remove orb
      }
      return true;
    });

    // check collisions with asteroids
    for (const a of state.asteroids) {
      if (distance(p.x, p.y, a.x, a.y) < p.radius + a.radius) {
        state.running = false;
        break;
      }
    }
  };

  const draw = () => {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.brightness;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // draw player (triangle) with thrust
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.atan2(
      (state.keys.down ? 1 : 0) - (state.keys.up ? 1 : 0),
      (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0)
    );
    ctx.rotate(angle);
    // thrust flame
    if (state.keys.up || state.keys.down || state.keys.left || state.keys.right) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, p.radius + 4);
      ctx.lineTo(3, p.radius);
      ctx.lineTo(-3, p.radius);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(0, -p.radius);
    ctx.lineTo(p.radius, p.radius);
    ctx.lineTo(-p.radius, p.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw orbs with glow
    state.orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius * 3);
      orbGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
      orbGrad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw asteroids with rough shape
    ctx.fillStyle = '#777';
    state.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.atan2(a.vy, a.vx));
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const r = a.radius * (0.7 + Math.random() * 0.6);
        ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // UI – score & fuel
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(state.fuel)}`, 10, 40);
    if (!state.running) {
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (state.running) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
