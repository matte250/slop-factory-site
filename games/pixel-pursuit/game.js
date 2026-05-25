// Minimal endless runner based on IDEA.md
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  const PLAYER_SIZE = 20;
  const GRAVITY = 0.4;
  const JUMP = -8;
  const OBSTACLE_W = 30;
  const ORB_R = 8;
  const SPAWN_OBSTACLE_EVERY = 1500; // ms
  const SPAWN_ORB_EVERY = 1000;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playTone(300); }
  function playCollect() { playTone(600); }
  function playGameOver() { playTone(100, 0.5); }
  const ORB_TIMEOUT = 5000; // ms without orb -> lose

  let lastObstacle = 0, lastOrb = 0, lastOrbCollected = Date.now();
  let score = 0;
  let gameOver = false;

  // Particle system for orb collection
  const particles = [];
  function createParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 30,
        color: `hsl(${Math.random() * 360},100%,50%)`
      });
    }
  }

  const player = {
    x: 50,
    y: height - PLAYER_SIZE,
    vy: 0,
    onGround: true,
    draw() {
      // player as a gradient circle
      const grad = ctx.createRadialGradient(this.x + PLAYER_SIZE/2, this.y + PLAYER_SIZE/2, 2, this.x + PLAYER_SIZE/2, this.y + PLAYER_SIZE/2, PLAYER_SIZE/2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#00f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x + PLAYER_SIZE/2, this.y + PLAYER_SIZE/2, PLAYER_SIZE/2, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y > height - PLAYER_SIZE) {
        this.y = height - PLAYER_SIZE;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) this.vy = JUMP;
    }
  };

  const obstacles = [];
  const orbs = [];

  function spawnObstacle() {
    // spike shaped obstacle (triangle)
    obstacles.push({ x: width, y: height - PLAYER_SIZE, w: OBSTACLE_W, h: PLAYER_SIZE });
  }

  function spawnOrb() {
    const y = Math.random() * (height - 2 * ORB_R) + ORB_R;
    orbs.push({ x: width, y, r: ORB_R, collected: false });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + PLAYER_SIZE > b.x && a.y < b.y + b.h && a.y + PLAYER_SIZE > b.y;
  }

  function circleRectIntersect(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update() {
    const now = Date.now();
    if (gameOver) return;

    // spawn
    if (now - lastObstacle > SPAWN_OBSTACLE_EVERY) { spawnObstacle(); lastObstacle = now; }
    if (now - lastOrb > SPAWN_ORB_EVERY) { spawnOrb(); lastOrb = now; }

    // move objects left
    const speed = 4;
    obstacles.forEach(o => o.x -= speed);
    orbs.forEach(o => o.x -= speed);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    // remove dead particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // remove off-screen
    while (obstacles.length && obstacles[0].x + OBSTACLE_W < 0) obstacles.shift();
    while (orbs.length && orbs[0].x + ORB_R < 0) orbs.shift();

    // player update
    player.update();

    // collision with obstacles (draw triangle spikes)
    for (const o of obstacles) {
      if (rectIntersect(player, o)) { gameOver = true; break; }
    }

    // collision with orbs
    for (const o of orbs) {
      if (!o.collected && circleRectIntersect(o, { x: player.x, y: player.y, w: PLAYER_SIZE, h: PLAYER_SIZE })) {
        o.collected = true;
        score++;
        lastOrbCollected = now;
        createParticles(o.x, o.y);
      }
    }

    // lose if no orb collected for ORB_TIMEOUT
    if (now - lastOrbCollected > ORB_TIMEOUT) gameOver = true;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // ground line with shadow
    ctx.fillStyle = '#222';
    ctx.fillRect(0, height - 2, width, 2);

    // particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    // player
    player.draw();

    // obstacles as spikes
    ctx.fillStyle = '#f22';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // orbs with glow
    orbs.forEach(o => {
      if (!o.collected) {
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, 'rgba(255,255,0,0.9)');
        grad.addColorStop(1, 'rgba(255,255,0,0.2)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff6';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      player.jump();
      playJump();
    }
    if (gameOver && e.code === 'Enter') location.reload();
  });

  // start
  loop();
})();
