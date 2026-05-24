// Simple endless runner/shooter for canvas with id="game"
// Implements player ship, scrolling obstacles, and collectible energy orbs.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Simple background hum
  let bgOsc;
  function startBackground() {
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.type = 'triangle';
    bgOsc.frequency.value = 30;
    bgOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bgOsc.start();
  }
  startBackground();

  // Starfield setup
  const stars = [];
  const initStars = count => {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  };
  initStars(120);

  // ----- Player -----
  const player = {
    x: canvas.width / 2,
    y: canvas.height * 0.85,
    radius: 15,
    speed: 6,
    trail: [], // positions for motion blur
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x + this.radius, this.y + this.radius);
      ctx.closePath();
      ctx.fill();
    }
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Obstacles -----
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  let lastObstacle = 0;

  function spawnObstacle() {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * canvas.width;
    const y = -size; // start above view
    const speed = 2 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2; // rotation
    obstacles.push({x, y, size, speed, angle});
  }

  // ----- Energy Orbs -----
  const orbs = [];
  const orbFreq = 2000;
  let lastOrb = 0;
  function spawnOrb() {
    const radius = 8;
    const x = Math.random() * canvas.width;
    const y = -radius;
    const speed = 2.5;
    orbs.push({x, y, radius, speed});
  }

  // ----- Game State -----
  let score = 0;
  let energy = 100;
  let lastTime = 0;

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep inside canvas
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    // Record trail for motion blur
    player.trail.unshift({x: player.x, y: player.y});
    if (player.trail.length > 12) player.trail.pop();

    // Move stars for parallax effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5; // slow downward drift
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      o.angle += 0.02;
      // collision (simple circle‑rect approximation)
      const dx = Math.abs(player.x - o.x - o.size / 2);
      const dy = Math.abs(player.y - o.y - o.size / 2);
      if (dx < o.size / 2 + player.radius && dy < o.size / 2 + player.radius) {
        energy = 0; // trigger game over
      }
      if (o.y - o.size > canvas.height) obstacles.splice(i, 1);
    }

    // Orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.y += orb.speed;
      const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
        if (dist < player.radius + orb.radius) {
          energy = Math.min(100, energy + 15);
          score += 10;
          playTone(500, 0.1); // orb collect sound
          orbs.splice(i, 1);
          continue;
        }
      if (orb.y - orb.radius > canvas.height) orbs.splice(i, 1);
    }

    // Score and energy decay
    score += dt * 0.01;
    energy -= dt * 0.005;
    if (energy < 0) energy = 0;

    // Spawning
    if (lastTime - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = lastTime;
    }
    if (lastTime - lastOrb > orbFreq) {
      spawnOrb();
      lastOrb = lastTime;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#555';
    stars.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    // Gradient overlay for depth
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(20,20,30,0.3)');
    grad.addColorStop(1, 'rgba(0,0,5,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Player trail
    player.trail.forEach((p, i) => {
      ctx.fillStyle = `rgba(0,255,255,${(1 - i / player.trail.length) * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, player.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    // Player
    player.draw();
    // Obstacles with gradient
    obstacles.forEach(o => {
      const gradObs = ctx.createRadialGradient(
        o.x + o.size / 2,
        o.y + o.size / 2,
        0,
        o.x + o.size / 2,
        o.y + o.size / 2,
        o.size / 2
      );
      gradObs.addColorStop(0, '#ff7777');
      gradObs.addColorStop(1, '#aa0000');
      ctx.fillStyle = gradObs;
      ctx.save();
      ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
      ctx.rotate(o.angle);
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
      ctx.restore();
    });
    // Orbs with glow
    orbs.forEach(orb => {
      const gradOrb = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      gradOrb.addColorStop(0, '#ffff88');
      gradOrb.addColorStop(1, '#ffaa00');
      ctx.fillStyle = gradOrb;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Energy: ${Math.floor(energy)}`, 10, 40);
    if (energy <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    if (energy > 0) update(timestamp);
    draw();
    lastTime = timestamp;
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
