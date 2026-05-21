// Cosmic Collector – minimal implementation
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  }
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  }

  function playCollect() {
    // bright short high-pitched tone
    playTone(800, 0.15);
  }

  function playCrash() {
    // low rumble
    playTone(200, 0.6);
  }
  const height = canvas.height = canvas.offsetHeight || 600;

  // ----- Game state -----
  const particles = []; // collection sparkle particles
  const ship = { x: width / 2, y: height / 2, size: 15 };
  const mouse = { x: ship.x, y: ship.y };
  const artifacts = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnArtifact() {
    artifacts.push({ x: rand(0, width), y: -20, r: 8, speed: rand(1, 2) });
  }
  function spawnAsteroid() {
    const w = rand(30, 80);
    asteroids.push({ x: rand(0, width - w), y: -w, w, h: w, speed: rand(2, 4) });
  }

  // initial spawns
  for (let i = 0; i < 5; i++) spawnArtifact();
  for (let i = 0; i < 2; i++) spawnAsteroid();

  // ----- Input -----
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  // ----- Game loop -----
  function update() {
    // Move ship towards mouse (simple easing)
    const dx = mouse.x - ship.x;
    const dy = mouse.y - ship.y;
    ship.x += dx * 0.07;
    ship.y += dy * 0.07;

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 0.96;
      if (p.life <= 0 || p.size < 0.5) {
        particles.splice(i, 1);
      }
    }

    // Update artifacts
    for (let i = artifacts.length - 1; i >= 0; i--) {
      const a = artifacts[i];
      a.y += a.speed;
      // collect
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (dist < a.r + ship.size) {
        score++;
        playCollect();
        // create sparkle particles
        for (let p = 0; p < 8; p++) {
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 30,
            size: rand(2, 4)
          });
        }
        artifacts.splice(i, 1);
        spawnArtifact();
        continue;
      }
      // out of view
      if (a.y - a.r > height) {
        artifacts.splice(i, 1);
        spawnArtifact();
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision
if (ship.x + ship.size > a.x && ship.x - ship.size < a.x + a.w &&
            ship.y + ship.size > a.y && ship.y - ship.size < a.y + a.h) {
          playCrash();
          gameOver = true;
        }
      // recycle
      if (a.y - a.h > height) {
        asteroids.splice(i, 1);
        spawnAsteroid();
      }
    }
  }

function drawStarfield() {
   // dark space gradient background
   const grad = ctx.createLinearGradient(0, 0, 0, height);
   grad.addColorStop(0, '#001030');
   grad.addColorStop(1, '#000');
   ctx.fillStyle = grad;
   ctx.fillRect(0, 0, width, height);
   // twinkling stars
   for (let i = 0; i < 150; i++) {
     const sx = rand(0, width);
     const sy = rand(0, height);
     const bright = Math.random() < 0.015 ? 255 : 80; // mostly dim stars
     ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
     ctx.fillRect(sx, sy, 1, 1);
   }
 }

  function draw() {
    drawStarfield();
// artifacts (glowing orbs)
        artifacts.forEach(a => {
          const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
          grad.addColorStop(0, 'rgba(0,255,0,0.8)');
          grad.addColorStop(1, 'rgba(0,255,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          ctx.fill();
        });
      // particles (sparkles)
      particles.forEach(p => {
        ctx.fillStyle = `rgba(255,215,0,${p.life / 30})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      // asteroids
    ctx.fillStyle = '#a52a2a';
    asteroids.forEach(a => {
      ctx.fillRect(a.x, a.y, a.w, a.h);
    });
    // ship (triangle with glow)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const angle = Math.atan2(mouse.y - ship.y, mouse.x - ship.x);
    ctx.rotate(angle);
    // glow effect
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size, ship.size / 2);
    ctx.lineTo(-ship.size, -ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
