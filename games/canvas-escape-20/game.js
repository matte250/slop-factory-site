// Minimal Canvas Escape game
(() => {
  // Sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
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
  const sounds = {
    jump: () => playSound(440, 0.1),
    slide: () => playSound(220, 0.15),
    star: () => playSound(800, 0.08),
    hit: () => playSound(120, 0.3),
    gameOver: () => playSound(60, 0.5),
  };

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 400);
  const GRAVITY = 0.5;
  const SPEED = 3;

  const player = {
    x: 80,
    y: H - 30,
    w: 20,
    h: 20,
    vy: 0,
    jumping: false,
    sliding: false,
    update() {
      if (this.jumping) {
        this.vy += GRAVITY;
        this.y += this.vy;
        if (this.y >= H - this.h) {
          this.y = H - this.h;
          this.vy = 0;
          this.jumping = false;
        }
      } else if (this.sliding) {
        // slide stays on ground for short time
        this.slidingTimer = (this.slidingTimer || 15) - 1;
        if (this.slidingTimer <= 0) this.sliding = false;
      }
    },
    draw() {
      ctx.fillStyle = '#0af';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    },
  };

  const obstacles = [];
  const stars = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'wall';
    const thickness = 20 + Math.random() * 10;
    if (type === 'spike') {
      obstacles.push({ type, x: W, y: H - thickness, w: thickness, h: thickness });
    } else {
      obstacles.push({ type, x: W, y: 0, w: thickness, h: thickness });
    }
  }

  function spawnStar() {
    const size = 12;
    const y = Math.random() * (H - 100) + 50;
    stars.push({ x: W, y, w: size, h: size, collected: false });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    frames++;
    if (frames % 120 === 0) spawnObstacle();
    if (frames % 200 === 0) spawnStar();
    player.update();
    // move obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SPEED;
      // collision logic based on type
if (rectCollide(player, o)) {
          if (o.type === 'spike' && !player.jumping) {
            sounds.hit();
            gameOver = true;
            sounds.gameOver();
          }
          if (o.type === 'wall' && !player.sliding) {
            sounds.hit();
            gameOver = true;
            sounds.gameOver();
          }
        }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= SPEED;
      if (!s.collected && rectCollide(player, s)) {
        s.collected = true;
        score += 10;
        sounds.star();
      }
      if (s.x + s.w < 0) stars.splice(i, 1);
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0c3e');
    bgGrad.addColorStop(1, '#000c31');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground and ceiling with slight shading
    ctx.fillStyle = '#444';
    ctx.fillRect(0, H - 20, W, 20);
    ctx.fillRect(0, 0, W, 20);

    // Player – draw as a rounded blue circle
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0af';
    ctx.fill();

    // Obstacles – spikes as triangles, walls as dark rectangles
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        ctx.fillStyle = '#a00';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#a00';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    });

    // Stars – five‑pointed star shape with glow
    ctx.save();
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = 'rgba(255,255,0,0.7)';
    ctx.shadowBlur = 8;
    stars.forEach(s => {
      if (!s.collected) {
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const r = s.w / 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI / 2) + i * (2 * Math.PI / 5);
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          ctx.lineTo(x, y);
          const innerAngle = angle + Math.PI / 5;
          const ix = cx + Math.cos(innerAngle) * (r / 2.5);
          const iy = cy + Math.sin(innerAngle) * (r / 2.5);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.restore();

    // Score text with outline for readability
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('Score: ' + score, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.fillText('Score: ' + score, 10, 10);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '28px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // controls
  window.addEventListener('keydown', e => {
    // Ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === 'ArrowUp' && !player.jumping && !player.sliding) {
      player.jumping = true;
      player.vy = -10;
      sounds.jump();
    }
    if (e.key === 'ArrowDown' && !player.sliding && !player.jumping) {
      player.sliding = true;
      player.slidingTimer = 15;
      // shrink for slide
      player.h = 10;
      setTimeout(() => (player.h = 20), 200);
      sounds.slide();
    }
  });

  // start
  requestAnimationFrame(loop);
})();
