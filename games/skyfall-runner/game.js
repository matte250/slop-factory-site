// Skyfall Runner – simple endless side‑scroller
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;
  // background stars for effect
  const stars = [];
  const STAR_COUNT = 50;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // --- Audio setup -------------------------------------------------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLiftSound() { playTone(440, 0.07); }
  function playCrashSound() { playTone(150, 0.3); }



  // --- Game objects -------------------------------------------------
  const player = {
    x: 80,
    y: HEIGHT / 2,
    w: 40,
    h: 20,
    vy: 0,
    // trail points for after‑image effect
    trail: [],
    // draw plane with a simple trail
    draw() {
      // update trail (store recent x positions)
      this.trail.push({x: this.x, y: this.y});
      if (this.trail.length > 10) this.trail.shift();
      // draw fading trail
      this.trail.forEach((pt, i) => {
        const alpha = i / this.trail.length * 0.4;
        ctx.fillStyle = `rgba(255,255,0,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y + this.h / 2);
        ctx.lineTo(pt.x + this.w, pt.y);
        ctx.lineTo(pt.x + this.w, pt.y + this.h);
        ctx.closePath();
        ctx.fill();
      });
      // draw plane (front)
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }
  };

  const obstacles = [];
  const OBSTACLE_W = 30;
  const GAP_HEIGHT = 120; // vertical gap between top/bottom parts
  const SPEED = 3;
  let frames = 0;
  let running = true;
  let crashPlayed = false;

  // --- Input --------------------------------------------------------
  const lift = () => { audioCtx.resume(); playLiftSound(); player.vy = -6; };
  canvas.addEventListener('mousedown', lift);
  canvas.addEventListener('touchstart', lift);

  // --- Helpers -------------------------------------------------------
  function spawnObstacle() {
    const topHeight = Math.random() * (HEIGHT - GAP_HEIGHT - 40) + 20;
    const bottomY = topHeight + GAP_HEIGHT;
    obstacles.push({
      x: WIDTH,
      top: { y: 0, h: topHeight },
      bottom: { y: bottomY, h: HEIGHT - bottomY },
    });
  }

  function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // --- Main loop -----------------------------------------------------
  function update() {
    if (!running) return;

    // physics
    player.vy += 0.3; // gravity
    player.y += player.vy;
    // keep within canvas vertically (optional)
    if (player.y < 0) player.y = 0;

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= SPEED;
      if (obstacles[i].x + OBSTACLE_W < 0) obstacles.splice(i, 1);
    }

    // spawn
    if (frames++ % 90 === 0) spawnObstacle();

    // collision detection
    for (const o of obstacles) {
      // top part
if (rectCollide(player.x, player.y, player.w, player.h,
                       o.x, o.top.y, OBSTACLE_W, o.top.h) ||
           // bottom part
           rectCollide(player.x, player.y, player.w, player.h,
                       o.x, o.bottom.y, OBSTACLE_W, o.bottom.h)) {
        running = false;
        if (!crashPlayed) { playCrashSound(); crashPlayed = true; }
      }
    }
    // lose when falls below canvas
    if (player.y + player.h > HEIGHT) running = false;

    // draw
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#001d3a'); // deep sky
    gradient.addColorStop(1, '#003366'); // darker
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed; // move left
      if (s.x < 0) {
        s.x = WIDTH;
        s.y = Math.random() * HEIGHT;
      }
    }
    // obstacles
    ctx.fillStyle = '#555';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.top.y, OBSTACLE_W, o.top.h);
      ctx.fillRect(o.x, o.bottom.y, OBSTACLE_W, o.bottom.h);
    }
    // player
    player.draw();

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    } else {
      requestAnimationFrame(update);
    }
  }

  // start game
  requestAnimationFrame(update);
})();
