// Neon Runner – minimal endless runner
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const resize = () => {
    canvas.width = canvas.offsetWidth * DPR;
    canvas.height = canvas.offsetHeight * DPR;
    ctx.scale(DPR, DPR);
  };
  window.addEventListener('resize', resize);
  resize();

   // Game constants
   const GRAVITY = 0.6;
   const JUMP_VELOCITY = -12;
   const PLAYER_SIZE = 30;
   const OBSTACLE_WIDTH = 30;
   const GAP_WIDTH = 150;
   const TOKEN_SIZE = 15;
   const STAR_SPEED = 0.5;

  // State
  let speed = 4; // pixels per frame, will increase
  let score = 0;
   const player = {x: 80, y: canvas.height - PLAYER_SIZE, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE, onGround: true};
   const obstacles = [];
   const tokens = [];
   const stars = [];
   // initialise starfield
   for (let i = 0; i < 80; i++) {
     stars.push({
       x: Math.random() * canvas.width,
       y: Math.random() * canvas.height,
       r: Math.random() * 2 + 1,
     });
   }
   let frame = 0;

  const spawn = () => {
    // every 120 frames spawn obstacle and optional token
    if (frame % 120 === 0) {
      const obstacle = {x: canvas.width, y: canvas.height - PLAYER_SIZE, w: OBSTACLE_WIDTH, h: PLAYER_SIZE};
      obstacles.push(obstacle);
      // maybe token before obstacle
      if (Math.random() < 0.5) {
        const token = {x: canvas.width + GAP_WIDTH/2, y: canvas.height - PLAYER_SIZE - 60, w: TOKEN_SIZE, h: TOKEN_SIZE, collected: false};
        tokens.push(token);
      }
    }
  };

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= canvas.height - PLAYER_SIZE) {
      player.y = canvas.height - PLAYER_SIZE;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // obstacles move left
    obstacles.forEach(o => o.x -= speed);
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // stars move left for parallax
    stars.forEach(s => {
      s.x -= STAR_SPEED;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    });
    // tokens move left
    tokens.forEach(t => t.x -= speed);
    while (tokens.length && tokens[0].x + tokens[0].w < 0) tokens.shift();
    // collision detection
    for (const o of obstacles) {
      if (rectCollide(player, o)) {
        gameOver();
        return;
      }
    }
    for (const t of tokens) {
      if (!t.collected && rectCollide(player, t)) {
        t.collected = true;
        score += 10;
      }
    }
    // increase speed gradually
    if (frame % 600 === 0) speed *= 1.05;
    frame++;
    spawn();
  };

   const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background – simple neon gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001030');
    grad.addColorStop(1, '#000810');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield – moving tiny stars
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // player – neon square with glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();
    // obstacles – dark blocks with slight glow
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff0';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    ctx.restore();
    // tokens – glowing circles
    ctx.fillStyle = '#f0f';
    tokens.forEach(t => {
      if (!t.collected) {
        ctx.beginPath();
        ctx.arc(t.x + t.w/2, t.y + t.h/2, t.w/2, 0, Math.PI*2);
        ctx.fill();
      }
    });
    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const rectCollide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const gameOver = () => {
    cancelAnimationFrame(rAF);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f88';
    ctx.textAlign = 'center';
    ctx.font = '32px monospace';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 30);
  };

  const loop = () => {
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  };
  let rAF = requestAnimationFrame(loop);

  // input – space or tap
  const jump = () => { if (player.onGround) { player.vy = JUMP_VELOCITY; player.onGround = false; } };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);
})();
