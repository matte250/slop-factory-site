// Simple top‑down endless runner based on IDEA.md
// Canvas element must exist with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // create background gradient once
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001020');
  bgGradient.addColorStop(1, '#000');

  // Game state
  const ship = { x: width / 2, y: height - 80, angle: -Math.PI / 2, vx: 0, vy: -2, health: 3 };
  const asteroids = [];
  const asteroidFreq = 90; // frames between new asteroids
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));
  const particles = [];
  let frame = 0;
  let running = true;

  // Input – left click/tap rotates ship and adds thrust
  function handleInput() {
    ship.angle += 0.15; // rotate clockwise each tap
    const thrust = 0.2;
    ship.vx += Math.cos(ship.angle) * thrust;
    ship.vy += Math.sin(ship.angle) * thrust;
    // thrust sound
    playTone(300, 0.08);
  }
  canvas.addEventListener('click', handleInput);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(); }, { passive: false });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const x = Math.random() * width;
    const y = -radius;
    const speed = 1 + Math.random() * 2;
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4; // mostly downwards
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 30%, 50%)`;
    asteroids.push({ x, y, radius, speed, angle, color });
  }

  function update() {
    // move ship forward (auto drift)
    ship.x += ship.vx;
    ship.y += ship.vy;

    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // spawn asteroids
    if (frame % asteroidFreq === 0) spawnAsteroid();

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += Math.cos(a.angle) * a.speed;
      a.y += Math.sin(a.angle) * a.speed;
      // remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + 10) { // ship radius ~10
        // create explosion particles
        const particleCount = 12;
        for (let j = 0; j < particleCount; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 1,
            life: Math.random() * 30 + 20,
            maxLife: Math.random() * 30 + 20,
          });
        }
        asteroids.splice(i, 1);
        ship.health--;
        // collision sound
        playTone(120, 0.15);
        if (ship.health <= 0) running = false;
      }
    }

    frame++;
  }

  function draw() {
    // background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    // stars (twinkling)
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // simple drift downwards, wrap
      s.y += 0.3;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }
    // draw ship with slight glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(200,200,255,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw asteroids with shadow
    for (const a of asteroids) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = a.color || '#888';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // draw particles (collision sparks)
    ctx.fillStyle = 'orange';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // health display
    ctx.fillStyle = 'red';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + ship.health, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
