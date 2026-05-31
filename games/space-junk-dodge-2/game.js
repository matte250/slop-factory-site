// Space Junk Dodge – minimal HTML5 canvas game
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Game state -----
  // stars for background
  const stars = [];
  const starCount = 100;
  const starSpeed = 0.5;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  // ship definition with getters and angle
  const ship = {
    x: width * 0.1,
    y: height / 2,
    size: 20, // triangle height
    speed: 3,
    angle: 0,
    get left() { return this.x - this.size / 2; },
    get right() { return this.x + this.size / 2; },
    get top() { return this.y - this.size / 2; },
    get bottom() { return this.y + this.size / 2; }
  };

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrust() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrust() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosion() {
    const bufferSize = audioCtx.sampleRate * 0.2; // 0.2s
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / bufferSize);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    source.connect(gain).connect(audioCtx.destination);
    source.start();
  }

  const junk = [];
  const junkSpawnInterval = 1500; // ms
  const junkSpeed = 2;
  const powerupDuration = 5000; // ms (not implemented but placeholder)
  let lastSpawn = 0;
  let distance = 0; // score (pixels traveled)
  let lastTime = 0;
  let running = true;
  // particles for explosion effect
  const particles = [];

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // calculate movement deltas
    let dx = 0, dy = 0;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    // normalize diagonal speed
    if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    // move ship
    ship.x += dx * ship.speed;
    ship.y += dy * ship.speed;
    // update angle when moving
    if (dx !== 0 || dy !== 0) ship.angle = Math.atan2(dy, dx);
    // handle thrust sound
    if (dx !== 0 || dy !== 0) {
      startThrust();
    } else {
      stopThrust();
    }
    // keep within bounds
    ship.x = Math.max(ship.size / 2, Math.min(width - ship.size / 2, ship.x));
    ship.y = Math.max(ship.size / 2, Math.min(height - ship.size / 2, ship.y));

    // animate stars (simple downward drift)
    for (const s of stars) {
      s.y += starSpeed * dt;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 16;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // spawn junk
    if (performance.now() - lastSpawn > junkSpawnInterval) {
      lastSpawn = performance.now();
      const size = 15 + Math.random() * 20;
      // spawn from random edge (top, bottom, left, right)
      const edge = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      switch (edge) {
        case 0: // left
          x = -size; y = Math.random() * height; vx = junkSpeed; vy = 0; break;
        case 1: // right
          x = width + size; y = Math.random() * height; vx = -junkSpeed; vy = 0; break;
        case 2: // top
          x = Math.random() * width; y = -size; vx = 0; vy = junkSpeed; break;
        default: // bottom
          x = Math.random() * width; y = height + size; vx = 0; vy = -junkSpeed; break;
      }
      junk.push({ x, y, size, vx, vy,
        color: `hsl(${Math.random()*360},80%,60%)`,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        get left() { return this.x - this.size / 2; },
        get right() { return this.x + this.size / 2; },
        get top() { return this.y - this.size / 2; },
        get bottom() { return this.y + this.size / 2; }
      });
    }

    // move junk
    for (let i = junk.length - 1; i >= 0; i--) {
      const j = junk[i];
      j.x += j.vx;
      j.y += j.vy;
      // remove off‑screen
      if (j.x < -j.size || j.x > width + j.size || j.y < -j.size || j.y > height + j.size) {
        junk.splice(i, 1);
      }
    }

    // collision detection (AABB)
    for (const j of junk) {
      if (ship.right > j.left && ship.left < j.right && ship.bottom > j.top && ship.top < j.bottom) {
        running = false; // game over
        // create explosion particles at ship location
        for (let i = 0; i < 30; i++) {
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 500 + Math.random() * 500
          });
        }
        // play explosion sound
        playExplosion();
        break;
      }
    }

    // update score
    distance += ship.speed * dt; // simple distance based on ship speed and time
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient (space -> deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#001033');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw stars (twinkling)
    ctx.fillStyle = '#aaa';
    for (const s of stars) {
      const size = Math.random() * 2 + 1;
      ctx.fillRect(s.x, s.y, size, size);
    }

    // draw ship with rotation based on movement direction
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle || 0);
    const shipGrad = ctx.createLinearGradient(-ship.size / 2, -ship.size / 2, ship.size / 2, ship.size / 2);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#008');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.size / 2, -ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(ship.size / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw junk (varied shapes & colors)
    for (const j of junk) {
      ctx.fillStyle = j.color;
      if (j.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(j.x - j.size / 2, j.y - j.size / 2, j.size, j.size);
      }
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)}`, 10, 20);

    // game over overlay with particles
    if (!running) {
      // particles (already updated in update())
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(255,165,0,${p.life / 1000})`;
        ctx.fillRect(p.x, p.y, 2, 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Distance traveled: ${Math.floor(distance)}`, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 16.666; // normalize to ~60fps steps
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
