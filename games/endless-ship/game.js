// Simple endless‑runner ship game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // ----- audio -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustOsc = null;
  const playThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  };
  const playExplosion = () => {
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    noise.buffer = buffer;
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
  };

  // ----- utilities -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- ship -----
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.08,
    rotateSpeed: 0.07,
    update() {
      // rotation
      if (keys[37]) this.angle -= this.rotateSpeed; // left arrow
      if (keys[39]) this.angle += this.rotateSpeed; // right arrow
      // thrust
      if (keys[38]) { // up arrow
        this.vx += Math.cos(this.angle) * this.thrust;
        this.vy += Math.sin(this.angle) * this.thrust;
        playThrust();
      } else {
        stopThrust();
      }
      // move
      this.x += this.vx;
      this.y += this.vy;
      // simple drag
      this.vx *= 0.99;
      this.vy *= 0.99;
    },
    draw() {
      // ship trail (simple afterimage)
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.translate(this.x - this.vx * 2, this.y - this.vy * 2);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(this.r, 0);
      ctx.lineTo(-this.r, this.r / 2);
      ctx.lineTo(-this.r, -this.r / 2);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();

      // actual ship
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(this.r, 0);
      ctx.lineTo(-this.r, this.r / 2);
      ctx.lineTo(-this.r, -this.r / 2);
      ctx.closePath();
      // gradient fill
      const grad = ctx.createLinearGradient(0, -this.r, 0, this.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#f80');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  };

  // ----- asteroids -----
  const asteroids = [];
  const spawnInterval = 120; // frames
  let frameCount = 0;
  const createAsteroid = () => {
    const side = Math.floor(rand(0, 4)); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const speed = rand(1, 3);
    const size = rand(15, 40);
    if (side === 0) { y = -size; x = rand(0, WIDTH); vx = rand(-1, 1); vy = speed; }
    else if (side === 1) { x = WIDTH + size; y = rand(0, HEIGHT); vx = -speed; vy = rand(-1, 1); }
    else if (side === 2) { y = HEIGHT + size; x = rand(0, WIDTH); vx = rand(-1, 1); vy = -speed; }
    else { x = -size; y = rand(0, HEIGHT); vx = speed; vy = rand(-1, 1); }
    asteroids.push({ x, y, vx, vy, r: size });
  };

  // draw asteroid with gradient and glow
  const drawAsteroid = (a) => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#f99');
    grad.addColorStop(1, '#800');
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.keyCode] = true));
  window.addEventListener('keyup', e => (keys[e.keyCode] = false));

  // ----- star field -----
  const stars = Array.from({ length: 100 }, () => ({
    x: rand(0, WIDTH),
    y: rand(0, HEIGHT),
    r: rand(0.5, 1.5)
  }));
  const drawStars = () => {
    // dark space gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // faint stars with slight glow
    ctx.fillStyle = '#bbb';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 2;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  // ----- main loop -----
  let running = true;
  let score = 0;
  const loop = () => {
    if (!running) return;
    drawStars();
    // update ship
    ship.update();
    ship.draw();
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // draw
      drawAsteroid(a);
      // collision with ship
        if (dist(ship, a) < ship.r + a.r) {
          playExplosion();
          running = false;
        }
      // remove off‑screen
      if (a.x < -a.r || a.x > WIDTH + a.r || a.y < -a.r || a.y > HEIGHT + a.r) {
        asteroids.splice(i, 1);
      }
    }
    // spawn
    if (frameCount++ % spawnInterval === 0) createAsteroid();
    // ship off‑screen check
    if (ship.x < -ship.r || ship.x > WIDTH + ship.r || ship.y < -ship.r || ship.y > HEIGHT + ship.r) {
      running = false;
    }
    // score
    score++;
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', WIDTH / 2 - 120, HEIGHT / 2);
    } else {
      requestAnimationFrame(loop);
    }
  };
  // start
  requestAnimationFrame(loop);
})();
