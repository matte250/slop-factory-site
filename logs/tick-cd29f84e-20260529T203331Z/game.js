// Simple Cosmic Courier game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const player = {
    x: 80,
    y: canvas.height / 2,
    w: 30,
    h: 20,
    speed: 3,
    laser: 100, // energy %
    shooting: false,
    cooldown: 0,
  };
  const pods = [];
  const asteroids = [];
  const drones = [];
  let score = 0;
  let gameOver = false;
  let frame = 0;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helpers -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function rectCircleColl(rect, cx, cy, cr) {
    const dx = Math.max(rect.x - cx, 0, cx - (rect.x + rect.w));
    const dy = Math.max(rect.y - cy, 0, cy - (rect.y + rect.h));
    return dx * dx + dy * dy <= cr * cr;
  }

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine', volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaser() { playTone(800, 0.07, 'square', 0.3); }
  function playExplosion() { playTone(200, 0.2, 'triangle', 0.5); }
  function playCollect() { playTone(600, 0.05, 'sawtooth', 0.4); }
  // simple background hum
  function startBgHum() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    // keep running
    return () => { osc.stop(); };
  }
  const stopBgHum = startBgHum();
  // unlock on first user interaction
  window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, {once: true});

  // ----- Main loop -----
  function update() {
    if (gameOver) return;
    frame++;
    // player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // shooting
    if (keys[' '] && player.laser > 0 && player.cooldown <= 0) {
      player.shooting = true;
      player.laser -= 0.5; // drain energy per frame while firing
      player.cooldown = 10; // frames between shots
      playLaser(); // sound effect
    } else {
      player.shooting = false;
    }
    if (player.cooldown > 0) player.cooldown--;

    // spawn objects
    if (frame % 80 === 0) asteroids.push({x: canvas.width, y: rand(0, canvas.height), r: rand(15, 30), speed: rand(2, 4)});
    if (frame % 120 === 0) drones.push({x: canvas.width, y: rand(0, canvas.height), r: 12, speed: 3});
    if (frame % 200 === 0) pods.push({x: canvas.width, y: rand(0, canvas.height), w: 15, h: 15, speed: 2});

    // move objects leftward
    const moveLeft = arr => arr.forEach(o => (o.x -= o.speed));
    moveLeft(asteroids);
    moveLeft(drones);
    moveLeft(pods);

    // remove off‑screen
    const clean = arr => arr.filter(o => o.x + (o.r || o.w) > 0);
    asteroids = clean(asteroids);
    drones = clean(drones);
    pods = clean(pods);

    // collisions with obstacles
    const shipRect = {x: player.x, y: player.y, w: player.w, h: player.h};
    for (const a of asteroids) if (rectCircleColl(shipRect, a.x, a.y, a.r)) gameOver = true;
    for (const d of drones) if (rectCircleColl(shipRect, d.x, d.y, d.r)) gameOver = true;

    // laser hits obstacles with sound
    if (player.shooting) {
      const laserX = player.x + player.w;
      const laserY = player.y + player.h / 2;
      asteroids.forEach((a, i) => {
        if (Math.abs(a.x - laserX) < 10 && Math.abs(a.y - laserY) < a.r) {
          asteroids.splice(i, 1);
          playExplosion();
        }
      });
      drones.forEach((d, i) => {
        if (Math.abs(d.x - laserX) < 10 && Math.abs(d.y - laserY) < d.r) {
          drones.splice(i, 1);
          playExplosion();
        }
      });
    }

    // collect cargo pods with sound
    pods.forEach((p, i) => {
      if (
        p.x < player.x + player.w &&
        p.x + p.w > player.x &&
        p.y < player.y + player.h &&
        p.y + p.h > player.y
      ) {
        score += 10;
        pods.splice(i, 1);
        playCollect();
      }
    });
  }

  function draw() {
    // starfield background with gradient and twinkling stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d'); // dark blue top
    bgGrad.addColorStop(1, '#000'); // black bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw stars with varying brightness
    for (let i = 0; i < 120; i++) {
      const sx = rand(0, canvas.width);
      const sy = rand(0, canvas.height);
      const bright = Math.random() * 255;
      ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // player ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    shipGrad.addColorStop(0, '#00ff80');
    shipGrad.addColorStop(1, '#006630');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h / 2);
    ctx.lineTo(player.x + player.w, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // ship outline
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.stroke();
    // laser beam
    if (player.shooting && player.laser > 0) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x + player.w, player.y + player.h / 2);
      ctx.lineTo(canvas.width, player.y + player.h / 2);
      ctx.stroke();
    }
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    // enemy drones with radial gradient
    drones.forEach(d => {
      const grad = ctx.createRadialGradient(d.x, d.y, d.r * 0.3, d.x, d.y, d.r);
      grad.addColorStop(0, '#ff6b6b');
      grad.addColorStop(1, '#b30000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      // thin outline
      ctx.strokeStyle = '#880000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    // cargo pods (glowing crates) with gradient
    pods.forEach(p => {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0044ff');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // subtle glow outline
      ctx.strokeStyle = 'rgba(0,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Laser: ' + Math.floor(player.laser) + '%', 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
