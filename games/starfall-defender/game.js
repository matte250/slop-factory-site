// Simple Starfall Defender implementation with enhanced graphics
// Assumes <canvas id="game"></canvas> exists in the HTML

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or a default size
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API for lightweight sounds
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  document.addEventListener('click', resumeAudio, { once: true });
  document.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const playShoot = () => playTone(800);
  const playExplosion = () => playTone(200);

  const KEY = { LEFT: false, RIGHT: false, SPACE: false };
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') KEY.LEFT = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') KEY.RIGHT = true;
    if (e.code === 'Space') KEY.SPACE = true;
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') KEY.LEFT = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') KEY.RIGHT = false;
    if (e.code === 'Space') KEY.SPACE = false;
  });
  canvas.addEventListener('click', () => {
    fireBullet();
  });

  const player = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 5,
draw() {
        // draw ship as an upward triangle
        ctx.fillStyle = '#0af';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
      },
    update() {
      if (KEY.LEFT) this.x = Math.max(0, this.x - this.speed);
      if (KEY.RIGHT) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    }
  };

  const bullets = [];
  function fireBullet() {
    // play shooting sound
    playShoot();
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 7,
      draw() {
        // neon bullet with glow
        ctx.save();
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
      },
      update() {
        this.y -= this.speed;
      }
    });
  }

  const stars = [];
  let starSpawnInterval = 2000; // ms
  let lastStarSpawn = 0;
  let difficultyTimer = 0;

  function spawnStar() {
    const size = Math.random() * 20 + 10;
    stars.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 1,
      draw() {
        // star with radial gradient for glow
        const grd = ctx.createRadialGradient(
          this.x + this.size / 2,
          this.y + this.size / 2,
          this.size * 0.1,
          this.x + this.size / 2,
          this.y + this.size / 2,
          this.size / 2
        );
        grd.addColorStop(0, 'rgba(255,255,255,0.9)');
        grd.addColorStop(1, 'rgba(200,200,255,0.2)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      },
      update() {
        this.y += this.speed;
      }
    });
  }

  let score = 0;
  let gameOver = false;

  function update(delta) {
    if (gameOver) return;
    player.update();
    // fire on space press (once per press)
    if (KEY.SPACE) {
      fireBullet();
      KEY.SPACE = false; // prevent continuous fire
    }
    // update bullets
    bullets.forEach(b => b.update());
    // remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y + bullets[i].height < 0) bullets.splice(i, 1);
    }
    // spawn stars
    difficultyTimer += delta;
    if (Date.now() - lastStarSpawn > starSpawnInterval) {
      spawnStar();
      lastStarSpawn = Date.now();
    }
    // gradually increase difficulty
    if (difficultyTimer > 15000) {
      starSpawnInterval = Math.max(500, starSpawnInterval - 200);
      difficultyTimer = 0;
    }
    // update stars
    stars.forEach(s => s.update());
    // collision detection
    for (let i = stars.length - 1; i >= 0; i--) {
      const star = stars[i];
      // check bottom
      if (star.y + star.size >= canvas.height) {
        gameOver = true;
        break;
      }
      // bullet collisions
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const bx = b.x, by = b.y, bw = b.width, bh = b.height;
        if (bx < star.x + star.size && bx + bw > star.x &&
            by < star.y + star.size && by + bh > star.y) {
          // hit
          playExplosion();
          bullets.splice(j, 1);
          stars.splice(i, 1);
          score += 10;
          break;
        }
      }
    }
  }

  function draw() {
    // draw starry background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#001');
      bgGradient.addColorStop(1, '#000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // optional subtle starfield (static small white dots)
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.1) + ')';
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
      }
      // clear previous main drawings (will be overdrawn)
      // Note: we already filled background, no need for clearRect

    player.draw();
    bullets.forEach(b => b.draw());
    stars.forEach(s => s.draw());
    // HUD
    ctx.fillStyle = '#0f0';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
