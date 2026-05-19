// game.js – minimalist canvas game based on IDEA.md
// Target canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const width = (canvas.width = window.innerWidth * DPR);
  const height = (canvas.height = window.innerHeight * DPR);
  ctx.scale(DPR, DPR);

  // ----- Audio -----
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // resume audio on first user interaction
  const resumeAudio = () => { audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playOrbSound() { playTone(600, 0.1); }
  function playCollisionSound() { playTone(200, 0.3); }

  // ----- Game state -----
  const player = { x: width / (2 * DPR), y: height / DPR - 60, r: 10, speed: 4 };
  let left = false,
    right = false;
  let obstacles = []; // rotating lines & moving blocks
  let orbs = [];
  let stars = [];
  let score = 0;
  let alive = true;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') right = false;
  });

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  // ----- Spawn -----
  function spawnLine() {
    const length = rand(80, 150);
    const x = rand(length / 2, width / DPR - length / 2);
    const y = -20;
    const angle = rand(0, Math.PI * 2);
    const rotSpeed = rand(-0.03, 0.03);
    obstacles.push({ type: 'line', x, y, length, angle, rotSpeed });
  }
  function spawnBlock() {
    const w = rand(40, 80);
    const h = rand(20, 40);
    const x = rand(0, width / DPR - w);
    const y = -h - 10;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const speed = rand(1, 3);
    obstacles.push({ type: 'block', x, y, w, h, dir, speed });
  }
  function spawnOrb() {
    const r = 6;
    const x = rand(r, width / DPR - r);
    const y = -r - 10;
    const speed = 2;
    orbs.push({ x, y, r, speed });
  }
  function spawnStar() {
    const size = rand(1, 3);
    const x = rand(0, width / DPR);
    const y = -size;
    const speed = rand(0.5, 1.5);
    const opacity = rand(0.3, 1);
    stars.push({ x, y, size, speed, opacity });
  }

  // ----- Game loop -----
  let frame = 0;
  function update() {
    if (!alive) return;

    // player movement
    if (left) player.x -= player.speed;
    if (right) player.x += player.speed;
    // keep inside bounds
    if (player.x - player.r < 0) player.x = player.r;
    if (player.x + player.r > width / DPR) player.x = width / DPR - player.r;

    // spawn entities
    if (frame % 120 === 0) spawnLine(); // every 2 seconds at 60fps
    if (frame % 180 === 0) spawnBlock();
    if (frame % 150 === 0) spawnOrb();
    if (frame % 10 === 0) spawnStar(); // twinkling background stars

    // update obstacles and stars
    obstacles.forEach(o => {
      o.y += 2; // scroll down
      if (o.type === 'line') {
        o.angle += o.rotSpeed;
        // collision with player (line-point distance)
        const aX = o.x + Math.cos(o.angle) * o.length / 2;
        const aY = o.y + Math.sin(o.angle) * o.length / 2;
        const bX = o.x - Math.cos(o.angle) * o.length / 2;
        const bY = o.y - Math.sin(o.angle) * o.length / 2;
        const px = player.x,
          py = player.y;
        const lab2 = (aX - bX) ** 2 + (aY - bY) ** 2;
        const t = Math.max(
          0,
          Math.min(1, ((px - bX) * (aX - bX) + (py - bY) * (aY - bY)) / lab2)
        );
        const projX = bX + t * (aX - bX);
        const projY = bY + t * (aY - bY);
        if (dist(px, py, projX, projY) < player.r) { playCollisionSound(); alive = false; }
      } else if (o.type === 'block') {
        o.x += o.dir * o.speed;
        // bounce within canvas
        if (o.x < 0 || o.x + o.w > width / DPR) o.dir *= -1;
        // collision with player rectangle-circle
        if (
          player.x + player.r > o.x &&
          player.x - player.r < o.x + o.w &&
          player.y + player.r > o.y &&
          player.y - player.r < o.y + o.h
        )
          alive = false;
      }
    });
    // update stars (twinkling background)
    stars.forEach(s => {
      s.y += s.speed;
      s.opacity += (Math.random() - 0.5) * 0.02; // subtle flicker
      if (s.opacity > 1) s.opacity = 1;
      if (s.opacity < 0.2) s.opacity = 0.2;
    });


    // update orbs
    orbs.forEach((orb, i) => {
      orb.y += orb.speed;
        if (dist(player.x, player.y, orb.x, orb.y) < player.r + orb.r) {
          score += 10;
          playOrbSound();
          orbs.splice(i, 1);
        }

    });

    // remove off‑screen entities
    obstacles = obstacles.filter(o => o.y < height / DPR + 100);
    orbs = orbs.filter(o => o.y < height / DPR + 20);

    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, width / DPR, height / DPR);

    // corridor background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height / DPR);
    bgGrad.addColorStop(0, '#0d0d2b');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width / DPR, height / DPR);

    // draw stars (twinkling background)
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.fill();
    });

    // draw player with glowing gradient
    const playerGrad = ctx.createRadialGradient(
      player.x,
      player.y,
      0,
      player.x,
      player.y,
      player.r * 2
    );
    playerGrad.addColorStop(0, '#0f0');
    playerGrad.addColorStop(1, '#030');
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = playerGrad;
    ctx.fill();
    // subtle outer glow
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // draw obstacles with enhanced visuals
    obstacles.forEach(o => {
      if (o.type === 'line') {
        const aX = o.x + Math.cos(o.angle) * o.length / 2;
        const aY = o.y + Math.sin(o.angle) * o.length / 2;
        const bX = o.x - Math.cos(o.angle) * o.length / 2;
        const bY = o.y - Math.sin(o.angle) * o.length / 2;
        // neon line with glow
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(aX, aY);
        ctx.lineTo(bX, bY);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
      } else if (o.type === 'block') {
        // block with subtle gradient
        const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(1, '#b8860b');
        ctx.fillStyle = grad;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    });

    // draw orbs
    orbs.forEach(o => {
      const gradient = ctx.createRadialGradient(
        o.x,
        o.y,
        0,
        o.x,
        o.y,
        o.r
      );
      gradient.addColorStop(0, '#ff0');
      gradient.addColorStop(1, '#880');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width / DPR, height / DPR);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / DPR / 2, height / DPR / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (alive) requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
