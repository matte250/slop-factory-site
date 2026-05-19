// Game: Shift Escape
// Controls a square with arrow keys to dodge rotating laser beams.
// Canvas element must have id="game".

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, ms) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.01);
      osc.stop(audioCtx.currentTime + 0.02);
    }, ms);
  }

  const W = (canvas.width = canvas.clientWidth || 400);
  const H = (canvas.height = canvas.clientHeight || 600);
  const center = { x: W / 2, y: H / 2 };

  const player = { x: W / 2, y: H - 40, size: 20, speed: 200 };
  const keys = {};
  let audioStarted = false;
  document.addEventListener('keydown', e => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
    keys[e.key] = true;
    // movement beep (optional)
    // beep(800, 20);
  });
  document.addEventListener('keyup', e => (keys[e.key] = false));

  // Laser definition: rotating line across canvas centre.
  class Laser {
    constructor(angle, angularSpeed) {
      this.angle = angle; // radians
      this.angularSpeed = angularSpeed; // radians per second
    }
    update(dt) {
      this.angle += this.angularSpeed * dt;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(this.angle);
      // glowing laser beam
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 12;
      const gradient = ctx.createLinearGradient(-W/2, 0, W/2, 0);
      gradient.addColorStop(0, 'rgba(255,0,0,0)');
      gradient.addColorStop(0.5, 'rgba(255,0,0,0.9)');
      gradient.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-W / 2, -4, W, 8); // thicker for glow
      ctx.restore();
    }
    // Simple point‑line distance test in rotated space.
    collides(px, py) {
      const dx = px - center.x;
      const dy = py - center.y;
      const cos = Math.cos(-this.angle);
      const sin = Math.sin(-this.angle);
      const xr = dx * cos - dy * sin;
      const yr = dx * sin + dy * cos;
      return Math.abs(yr) < 6; // tolerance (half beam thickness + half player)
    }
  }

  const lasers = [];
  let spawnTimer = 0;
  let laserCount = 2;
  let angularBase = Math.PI / 2; // initial speed

  let lastTime = 0;
  let gameOver = false;

  function spawnLaser() {
    const angle = Math.random() * Math.PI * 2;
    const speed = angularBase + Math.random() * 0.5;
    lasers.push(new Laser(angle, speed));
  }

  function update(dt) {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed * dt;
    if (keys.ArrowRight) player.x += player.speed * dt;
    if (keys.ArrowUp) player.y -= player.speed * dt;
    if (keys.ArrowDown) player.y += player.speed * dt;

    // bounds check
    if (player.x < 0 || player.x > W || player.y < 0 || player.y > H) {
      gameOver = true;
    }

    // lasers update & collision
    for (const l of lasers) {
      l.update(dt);
      if (l.collides(player.x, player.y)) {
        // collision sound
        beep(200, 150);
        gameOver = true;
        break;
      }
    }

    // increase difficulty over time
    spawnTimer += dt;
    if (spawnTimer > 2) {
      spawnTimer = 0;
      // add a new laser up to a reasonable limit
      if (lasers.length < laserCount) spawnLaser();
      // gradually increase count and speed
      laserCount = Math.min(8, laserCount + 0.2);
      angularBase += 0.05;
    }
  }

  function draw() {
    // semi‑transparent overlay for motion blur
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, W, H);
    // draw background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#001');
    bg.addColorStop(1, '#003');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // player as glowing circle
    ctx.save();
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // lasers with gradient and glow
    for (const l of lasers) l.draw(ctx);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  // initial lasers
  for (let i = 0; i < laserCount; i++) spawnLaser();
  requestAnimationFrame(loop);
})();
