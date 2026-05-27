// Simple Cosmic Courier game
// Assumes an existing <canvas id="game"></canvas> in the page.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // generate starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.5
    });
  }

  // Ship on a circular orbit
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let lastThrustTime = 0;
  const thrustCooldown = 100; // ms

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  function playNoise(duration) {
    const bufferSize = audioCtx.sampleRate * duration / 1000;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    noise.buffer = buffer;
    noise.connect(filter).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + duration / 1000);
  }
  const ship = {
    alive: true,
    radius: 150,               // orbit radius
    angle: Math.PI,            // start opposite side
    size: 15,                  // drawing radius
    speed: 0.03,               // rad per frame when moving
    fuel: 100,                 // fuel units
    color: '#0ff'
  };

  const debris = [];
  const cargo = [];
  const particles = [];
  const maxObjects = 5;

  function spawnDebris() {
    const side = Math.random() < 0.5 ? 'top' : 'left';
    const x = side === 'top' ? Math.random() * W : -20;
    const y = side === 'top' ? -20 : Math.random() * H;
    const vx = (Math.random() * 2 + 1) * (side === 'top' ? 0 : 1);
    const vy = (Math.random() * 2 + 1) * (side === 'top' ? 1 : 0);
    debris.push({ x, y, vx, vy, r: 12 });
  }

  function spawnCargo() {
    const angle = Math.random() * Math.PI * 2;
    const x = W / 2 + Math.cos(angle) * (ship.radius + 50 + Math.random() * 100);
    const y = H / 2 + Math.sin(angle) * (ship.radius + 50 + Math.random() * 100);
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    cargo.push({ x, y, vx, vy, r: 8 });
  }

  function update() {
    // ship movement via keys
    if (keys[37]) ship.angle -= ship.speed; // left arrow
    if (keys[39]) ship.angle += ship.speed; // right arrow
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ship.fuel -= 0.02;

    // update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x += d.vx;
      d.y += d.vy;
      // remove off‑screen
      if (d.x < -30 || d.x > W + 30 || d.y < -30 || d.y > H + 30) debris.splice(i, 1);
    }
    // update cargo
    for (let i = cargo.length - 1; i >= 0; i--) {
      const c = cargo[i];
      c.x += c.vx;
      c.y += c.vy;
      if (c.x < -30 || c.x > W + 30 || c.y < -30 || c.y > H + 30) cargo.splice(i, 1);
    }

    // spawn new objects
    if (debris.length < maxObjects && Math.random() < 0.02) spawnDebris();
    if (cargo.length < maxObjects && Math.random() < 0.01) spawnCargo();

    // collision detection
    const shipX = W / 2 + Math.cos(ship.angle) * ship.radius;
    const shipY = H / 2 + Math.sin(ship.angle) * ship.radius;
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      const dx = d.x - shipX, dy = d.y - shipY;
      if (dx * dx + dy * dy < (d.r + ship.size) ** 2) {
        ship.alive = false;
        // generate explosion particles
        playNoise(300);
        for (let p = 0; p < 30; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: shipX,
            y: shipY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 60,
            size: Math.random() * 2 + 1,
            color: '#ffdd55'
          });
        }
        break;
      }
    }
    for (let i = cargo.length - 1; i >= 0; i--) {
      const c = cargo[i];
      const dx = c.x - shipX, dy = c.y - shipY;
        if (dx * dx + dy * dy < (c.r + ship.size) ** 2) {
          ship.fuel = Math.min(100, ship.fuel + 20);
          cargo.splice(i, 1);
          playTone(600, 80); // collection sound
        }
    }
    // update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#0a0a30');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw orbit with glow and slight blur
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, ship.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    // draw ship with thrust glow
    const shipX = W / 2 + Math.cos(ship.angle) * ship.radius;
    const shipY = H / 2 + Math.sin(ship.angle) * ship.radius;
    // ship body gradient
    const shipGrad = ctx.createRadialGradient(shipX, shipY, ship.size * 0.2, shipX, shipY, ship.size);
    shipGrad.addColorStop(0, '#a0ffff');
    shipGrad.addColorStop(1, '#00aaff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.arc(shipX, shipY, ship.size, 0, Math.PI * 2);
    ctx.fill();
    // thrust effect when moving
    if (keys[37] || keys[39]) {
      // play thrust sound (throttle)
      const now = Date.now();
      if (now - lastThrustTime > thrustCooldown) {
        playTone(300, 100);
        lastThrustTime = now;
      }
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(shipX - Math.cos(ship.angle) * ship.size, shipY - Math.sin(ship.angle) * ship.size, ship.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // draw debris with metal gradient
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw cargo pods with reflective gradient
    cargo.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, '#7fff7f');
      grad.addColorStop(1, '#006600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // render particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / 60);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + Math.max(0, ship.fuel).toFixed(0), 10, 20);
    if (!ship.alive || ship.fuel <= 0) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.keyCode] = true));
  window.addEventListener('keyup', e => (keys[e.keyCode] = false));

  function loop() {
    if (ship.alive !== false && ship.fuel > 0) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  loop();
});
