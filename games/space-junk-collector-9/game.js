// Simple Space Junk Collector game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio context and simple beep function
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Ship definition
  const ship = {
    w: 60,
    h: 20,
    x: width / 2 - 30,
    y: height - 30,
    speed: 5,
    draw() {
      // Ship as a triangle with gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#66ffff');
      grad.addColorStop(1, '#0099ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h); // bottom left
      ctx.lineTo(this.x + this.w / 2, this.y); // top center
      ctx.lineTo(this.x + this.w, this.y + this.h); // bottom right
      ctx.closePath();
      ctx.fill();
    },
    move(dir) {
      this.x += dir * this.speed;
      this.x = Math.max(0, Math.min(this.x, width - this.w));
    },
  };

  // Falling objects
  const objects = [];
  const spawnInterval = 1000; // ms
  const lastSpawn = { time: 0 };
  const gravity = 0.3;

  function spawn() {
    const isHazard = Math.random() < 0.2; // 20% hazardous
    const size = 20 + Math.random() * 20;
    objects.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      vy: 0,
      hazardous: isHazard,
    });
  }

  // Score & timer
  let score = 0;
  const gameTime = 30 * 1000; // 30 seconds
  const start = performance.now();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // Ship movement
    if (keys.ArrowLeft) ship.move(-1);
    if (keys.ArrowRight) ship.move(1);

    // Spawn objects
    if (performance.now() - lastSpawn.time > spawnInterval) {
      spawn();
      lastSpawn.time = performance.now();
    }

    // Update objects
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      o.vy += gravity;
      o.y += o.vy;
      // Collision with ship
      if (
        o.x < ship.x + ship.w &&
        o.x + o.w > ship.x &&
        o.y < ship.y + ship.h &&
        o.y + o.h > ship.y
      ) {
        if (o.hazardous) {
          // Play hazard sound and end game
          playBeep(150, 0.5);
          endGame(false);
          return;
        } else {
          // Play collect sound
          playBeep(440, 0.1);
          score++;
          objects.splice(i, 1);
        }
      } else if (o.y > height) {
        // Remove off‑screen objects
        objects.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#001155');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw ship
    ship.draw();

    // Draw objects with radial gradients
    objects.forEach(o => {
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      const radGrad = ctx.createRadialGradient(cx, cy, o.w * 0.1, cx, cy, o.w / 2);
      if (o.hazardous) {
        radGrad.addColorStop(0, '#ff6666');
        radGrad.addColorStop(1, '#990000');
      } else {
        radGrad.addColorStop(0, '#ffff66');
        radGrad.addColorStop(1, '#999900');
      }
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    const remaining = Math.max(0, Math.ceil((gameTime - (performance.now() - start)) / 1000));
    ctx.fillText(`Time: ${remaining}s`, width - 100, 20);
    ctx.shadowColor = 'transparent';
  }

  let animationId;
  function loop() {
    const now = performance.now();
    const dt = now - (loop.last || now);
    loop.last = now;
    update(dt);
    draw();
    if (performance.now() - start < gameTime) {
      animationId = requestAnimationFrame(loop);
    } else {
      endGame(true);
    }
  }

  function endGame(victory) {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    const msg = victory ? `Time's up! Final score: ${score}` : `Game over! Final score: ${score}`;
    ctx.fillText(msg, width / 2 - ctx.measureText(msg).width / 2, height / 2);
  }

  // Start the game loop
  loop();
})();
