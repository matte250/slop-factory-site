// Neon Escape – simple canvas game
// Canvas with id="game" is already present in the HTML.
// The player is a glowing dot that moves forward automatically.
// Press Space or click/tap to toggle horizontal direction and dodge spikes.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    if (audioCtx.state !== 'running') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.1);
    }, duration);
  }
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);

  // Enhanced graphics settings
  const starCount = 80;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
  }));

  // Tunnel lines (simple perspective effect)
  const lines = [];
  function addLine() {
    lines.push({ y: -20, speed: 4 + Math.random() * 2, width: Math.random() * 2 + 1 });
  }

  // Player state with trail particles
  const player = {
    x: W / 2,
    y: H * 0.8,
    r: 6,
    dx: 2,
    dy: -3,
    color: '#0ff',
    trail: [],
  };

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.life = 30;
    }
    update() {
      this.life--;
      this.y += 1;
    }
    draw() {
      const alpha = this.life / 30;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
  }

  // Obstacle definition (spike) with neon gradient
  class Spike {
    constructor(x, y, w, h, speed) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.speed = speed;
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#ff4d4d');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // neon outline
      ctx.strokeStyle = '#ff9999';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ff4d4d';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    collides(px, py, pr) {
      const dx = this.x - px;
      const dy = this.y - py;
      const dist2 = dx * dx + dy * dy;
      return dist2 < (pr + this.w / 2) * (pr + this.w / 2);
    }
  }

  const spikes = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnSpike() {
    const w = 12 + Math.random() * 8;
    const h = 20 + Math.random() * 10;
    const x = Math.random() * (W - w) + w / 2;
    const y = -h;
    const speed = 3 + Math.random() * 2;
    spikes.push(new Spike(x, y, w, h, speed));
  }

  function reset() {
    player.x = W / 2;
    player.y = H * 0.8;
    player.dx = 2;
    player.trail = [];
    spikes.length = 0;
    lines.length = 0;
    frame = 0;
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  }

function handleInput() {
    // toggle horizontal direction
    player.dx = -player.dx;
    // play input sound
    playTone(600, 80);
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') handleInput();
    if (e.code === 'KeyR' && gameOver) reset();
  });
  canvas.addEventListener('pointerdown', () => {
    if (!gameOver) handleInput();
    else reset();
  });

  function drawBackground() {
    // starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // tunnel lines
    if (frame % 8 === 0) addLine();
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      l.y += l.speed;
      ctx.beginPath();
      ctx.moveTo(0, l.y);
      ctx.lineTo(W, l.y);
      ctx.stroke();
      if (l.y > H) lines.splice(i, 1);
    }
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Score: ' + Math.floor(score), W / 2, H / 2);
      ctx.fillText('Press R or tap to restart', W / 2, H / 2 + 30);
      return;
    }

    drawBackground();

    // Update player
    player.x += player.dx;
    player.y += player.dy;
    if (player.x < player.r) player.x = player.r;
    if (player.x > W - player.r) player.x = W - player.r;

    // Add particle for trail
    player.trail.push(new Particle(player.x, player.y));
    // Update and draw trail
    for (let i = player.trail.length - 1; i >= 0; i--) {
      const p = player.trail[i];
      p.update();
      p.draw();
      if (p.life <= 0) player.trail.splice(i, 1);
    }

    // Draw player – neon glow with radial gradient
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 3);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.shadowBlur = 12;
    ctx.shadowColor = player.color;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Spike handling
    if (frame % 60 === 0) spawnSpike();
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.update();
      s.draw();
      if (s.collides(player.x, player.y, player.r)) {
          playTone(200, 200);
          gameOver = true;
        }
      if (s.y - s.h > H) spikes.splice(i, 1);
    }

    // Score display
    score += 0.016;
    ctx.fillStyle = '#0ff';
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    frame++;
    requestAnimationFrame(loop);
  }

  reset();
})();
