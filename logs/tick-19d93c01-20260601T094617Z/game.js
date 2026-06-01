// Minimal endless runner with improved neon graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  // audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // neon gradient helper
  function neonGradient(color) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, `${color}AA`);
    grad.addColorStop(1, `${color}33`);
    return grad;
  }
  // background gradient for neon sky
  function skyGradient() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#005');
    return grad;
  }
  // starfield for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2
  }));
  // particle system for jumps
  const particles = [];

  // Game state
  let frame = 0;
  let score = 0;
  const speed = 4; // world scroll speed

  // Player definition
  const player = {
    w: 40,
    h: 60,
    x: 80,
    y: height - 60,
    vy: 0,
    gravity: 0.8,
    jumpStrength: -15,
    sliding: false,
    slideTimer: 0,
    update() {
      // apply gravity
      this.vy += this.gravity;
      this.y += this.vy;
      // floor collision
      const floor = this.sliding ? height - this.h / 2 : height - this.h;
      if (this.y > floor) {
        this.y = floor;
        this.vy = 0;
      }
      // slide duration
      if (this.sliding) {
        this.slideTimer--;
        if (this.slideTimer <= 0) this.sliding = false;
      }
    },
    draw() {
      ctx.fillStyle = neonGradient('#0ff');
      ctx.fillRect(this.x, this.y, this.w, this.sliding ? this.h / 2 : this.h);
    }
  };

  // Simple obstacle constructor
  function Obstacle(x, w, h) {
    this.x = x;
    this.w = w;
    this.h = h;
    this.y = height - h;
  }
  Obstacle.prototype.update = function() { this.x -= speed; };
  Obstacle.prototype.draw = function() {
    ctx.fillStyle = neonGradient('#f00');
    ctx.fillRect(this.x, this.y, this.w, this.h);
  };

  const obstacles = [];
  function spawnObstacle() {
    const w = 30 + Math.random() * 40;
    const h = 30 + Math.random() * 60;
    const x = width + w;
    obstacles.push(new Obstacle(x, w, h));
  }

  // Input handling
  document.addEventListener('keydown', e => {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space' && player.vy === 0) {
      player.vy = player.jumpStrength;
      // jump sound
      playTone(800, 0.12);
      // emit jump particles
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h / 2,
          vx: (Math.random() - 0.5) * 2,
          vy: - (Math.random() * 3 + 2),
          size: Math.random() * 2 + 1,
          alpha: 1
        });
      }
    } else if (e.code === 'ArrowDown' && !player.sliding && player.vy === 0) {
      player.sliding = true;
      player.slideTimer = 30; // frames
      // slide sound
      playTone(400, 0.1);
    }
  });

  // Collision detection
  function checkCollision(ob) {
    const pw = player.w;
    const ph = player.sliding ? player.h / 2 : player.h;
    const px = player.x;
    const py = player.y;
    return !(px + pw < ob.x || px > ob.x + ob.w || py + ph < ob.y || py > ob.y + ob.h);
  }

  // Game loop
  function loop() {
    frame++;
    // clear with slight blur for neon effect
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    // background starfield
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // update and render particles (jump sparkle)
    ctx.globalAlpha = 1;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.alpha -= 0.02;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = neonGradient('#ff0');
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1; // reset

    // update player
    player.update();
    player.draw();

    // spawn obstacles periodically
    if (frame % 90 === 0) spawnObstacle();

    // update & draw obstacles, remove off‑screen
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.update();
      ob.draw();
      if (ob.x + ob.w < 0) obstacles.splice(i, 1);
      else if (checkCollision(ob)) {
        // Game over – stop the loop
        ctx.fillStyle = '#ff0';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', width / 2 - 80, height / 2);
        return; // exit without requesting another frame
      }
    }

    // score display
    score = Math.floor(frame / 10);
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
