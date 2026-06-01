// Minimal endless‑runner for <canvas id="game"></canvas>
// Player: 20×20 square, runs to the right (canvas scroll simulated by moving obstacles left)
// Controls: ArrowUp – jump, ArrowDown – slide (lower height)
// Obstacles: triangles and circles, spawned every 1.5‑2 s
// Lose on any collision; score = survived seconds.

(() => {
  // ---- Audio Setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure context is resumed on first user gesture
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  function playJumpSound() { playTone(300, 0.12, 'triangle'); }
  function playSlideSound() { playTone(120, 0.1, 'sawtooth'); }
  function playHitSound() { playTone(60, 0.3, 'square'); }

  // ---- End Audio Setup ----
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 20;
  const SLIDE_HEIGHT = 10;

  const player = {
    x: 50,
    y: H - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    onGround: true,
    sliding: false,
    update() {
      // apply gravity
      this.vy += GRAVITY;
      this.y += this.vy;
      // ground collision
      if (this.y >= H - this.h) {
        this.y = H - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    draw() {
      // rounded player with shadow
      const radius = 4;
      ctx.fillStyle = '#0a0';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.w - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + radius);
      ctx.lineTo(this.x + this.w, this.y + this.h - radius);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - radius, this.y + this.h);
      ctx.lineTo(this.x + radius, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent';
    }
  };

  const obstacles = [];
  let lastSpawn = 0;
  const spawnInterval = () => 1500 + Math.random() * 500; // ms

  function spawnObstacle(time) {
    const type = Math.random() < 0.5 ? 'triangle' : 'circle';
    const size = 20 + Math.random() * 10;
    const ob = {
      x: W,
      y: H - size,
      w: size,
      h: size,
      type,
draw() {
          // shadow for depth
          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 4;
          if (this.type === 'circle') {
            const grad = ctx.createRadialGradient(
              this.x + this.w / 2,
              this.y + this.h / 2,
              this.w * 0.1,
              this.x + this.w / 2,
              this.y + this.h / 2,
              this.w / 2
            );
            grad.addColorStop(0, '#ff6666');
            grad.addColorStop(1, '#aa0000');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // triangle pointing left with gradient
            const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
            grad.addColorStop(0, '#ff7777');
            grad.addColorStop(1, '#aa0000');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.h);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h / 2);
            ctx.closePath();
            ctx.fill();
          }
          ctx.shadowColor = 'transparent';
        }
    };
    obstacles.push(ob);
    lastSpawn = time;
  }

  let score = 0;
  let running = true;
  let lastTime = performance.now();

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp' && player.onGround && !player.sliding) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      playJumpSound();
    }
    if (e.code === 'ArrowDown' && player.onGround) {
      player.sliding = true;
      player.h = SLIDE_HEIGHT;
      player.y = H - player.h;
      playSlideSound();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') {
      player.sliding = false;
      player.h = PLAYER_SIZE;
      player.y = H - player.h;
    }
  });

  function loop(time) {
    if (!running) return;
    const dt = time - lastTime;
    lastTime = time;
    score += dt / 1000;

    // clear
     // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#87ceeb'); // sky blue
  bgGrad.addColorStop(1, '#fff'); // near white ground
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // ground line
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 1);
  ctx.lineTo(W, H - 1);
  ctx.stroke();

    // update & draw player
    player.update();
    player.draw();

    // spawn obstacles
    if (time - lastSpawn > spawnInterval()) {
      spawnObstacle(time);
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 6; // speed
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      else o.draw();
    }

    // collision (AABB)
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playHitSound();
        running = false;
        break;
      }
    }

    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.fillText('Score: ' + Math.floor(score), W / 2, H / 2 + 20);
    } else {
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
