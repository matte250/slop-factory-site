// Simple endless arcade based on IDEA.md
(() => {
const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration, type='sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  function playCollision() { playTone(150, 200, 'triangle'); }
  function playScore() { playTone(600, 80, 'sawtooth'); }
  function playGameOver() { playTone(80, 500, 'square'); }

  // Helper to draw rounded rectangles
  function drawRoundedRect(x, y, w, h, r, style) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = style;
    ctx.fill();
  }
  const WIDTH = canvas.width = 400;
  const HEIGHT = canvas.height = 600;

  // Player (rounded square)
  const player = { x: WIDTH / 2 - 15, y: HEIGHT - 30, w: 30, h: 30, speed: 4, dx: 0 };

  // Falling blocks
  const blocks = [];
  // Particle effects
  const particles = [];
  let blockTimer = 0;
  let blockInterval = 1500; // spawn rate (ms)
  let lastTime = 0;
  let speedY = 2;          // falling speed, accelerates
  let score = 0;
  let gameOver = false;


  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true; if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true; });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false; if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false; });

  // Unlock audio on first interaction
  function unlockAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
  window.addEventListener('click', unlockAudio, {once:true});
  window.addEventListener('keydown', unlockAudio, {once:true});

  function spawnBlock() {
    const w = 30 + Math.random() * 70; // 30-100px
    const x = Math.random() * (WIDTH - w);
    blocks.push({ x, y: -20, w, h: 20 });
  }

function update(dt) {
    // player movement
    player.dx = 0;
    if (keys.left) player.dx = -player.speed;
    if (keys.right) player.dx = player.speed;
    player.x += player.dx;
    // keep within canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > WIDTH) player.x = WIDTH - player.w;

    // blocks spawning and movement
    blockTimer += dt;
    if (blockTimer > blockInterval) {
      spawnBlock();
      blockTimer = 0;
      if (blockInterval > 400) blockInterval -= 20;
      speedY += 0.02;
    }
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += speedY;
      // collision with player
      if (b.y + b.h > player.y && b.y < player.y + player.h && b.x < player.x + player.w && b.x + b.w > player.x) {
        playCollision();
        gameOver = true;
        playGameOver();
      }
      // passed bottom – create burst and score
if (b.y > HEIGHT) {
          // create simple particle burst
          for (let j = 0; j < 5; j++) {
            particles.push({
              x: b.x + b.w / 2,
              y: HEIGHT,
              r: Math.random() * 3 + 1,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -Math.random() * 2 - 1,
              alpha: 1,
              color: '#ff3b30'
            });
          }
          blocks.splice(i, 1);
          score++;
          playScore();
        }
        blocks.splice(i, 1);
        score++;
      }
    }

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // player (rounded)
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, '#0a84ff');
    // blocks (rounded)
    blocks.forEach(b => drawRoundedRect(b.x, b.y, b.w, b.h, 4, '#ff3b30'));
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
