// Minimal Neon Maze game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction (key press)
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // player state
  const player = {
    x: W / 2,
    y: H - 60,
    size: 15,
    speed: 2,
    dir: 0, // radians, 0 = up
    color: '#0ff'
  };

  const walls = [];
  const orbs = [];
  let score = 0;
  let gameOver = false;

  // generate a wall segment ahead of player
  function genSegment(yPos) {
    const gap = 120; // gap width for player to pass
    const left = Math.random() * (W - gap - 40) + 20;
    const right = left + gap;
    walls.push({ x: 0, y: yPos, w: left, h: 20 }); // left wall
    walls.push({ x: right, y: yPos, w: W - right, h: 20 }); // right wall
    // possibly place an orb in the gap
    if (Math.random() < 0.3) {
      const ox = left + gap / 2;
      orbs.push({ x: ox, y: yPos + 10, r: 6, collected: false });
    }
  }

  // initial maze
  for (let i = 0; i < 30; i++) genSegment(i * 40);

  // controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
      player.dir -= Math.PI / 2;
      playTone(400, 0.1); // turn left sound
    }
    if (e.code === 'ArrowRight') {
      player.dir += Math.PI / 2;
      playTone(600, 0.1); // turn right sound
    }
  });

  function update() {
    if (gameOver) return;
    // move forward
    player.x += Math.sin(player.dir) * player.speed;
    player.y -= Math.cos(player.dir) * player.speed;

    // keep inside canvas horizontally (wrap)
    if (player.x < 0) player.x = W;
    if (player.x > W) player.x = 0;

    // generate new segment as we scroll up
    const minY = Math.min(...walls.map(w => w.y));
    if (player.y - minY < H) genSegment(minY - 40);

    // collision with walls
    for (const w of walls) {
      if (
        player.x + player.size > w.x &&
        player.x - player.size < w.x + w.w &&
        player.y + player.size > w.y &&
        player.y - player.size < w.y + w.h
      ) {
          gameOver = true;
          // play collision sound (low buzz)
          playTone(150, 0.3);
        }
      }
    }

    // collect orbs
    for (const o of orbs) {
      if (!o.collected && Math.hypot(player.x - o.x, player.y - o.y) < player.size + o.r) {
        o.collected = true;
        score++;
        // play collect sound (high ping)
        playTone(800, 0.15);
      }
    }

    // collect orbs
    for (const o of orbs) {
      if (!o.collected && Math.hypot(player.x - o.x, player.y - o.y) < player.size + o.r) {
        o.collected = true;
        score++;
      }
    }
  }

  function draw() {
    // background gradient (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // neon glow settings
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';

    // draw walls with neon cyan
    ctx.fillStyle = '#0ff';
    for (const w of walls) {
      // rounded wall segments for smoother look
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(w.x + radius, w.y);
      ctx.lineTo(w.x + w.w - radius, w.y);
      ctx.quadraticCurveTo(w.x + w.w, w.y, w.x + w.w, w.y + radius);
      ctx.lineTo(w.x + w.w, w.y + w.h - radius);
      ctx.quadraticCurveTo(w.x + w.w, w.y + w.h, w.x + w.w - radius, w.y + w.h);
      ctx.lineTo(w.x + radius, w.y + w.h);
      ctx.quadraticCurveTo(w.x, w.y + w.h, w.x, w.y + w.h - radius);
      ctx.lineTo(w.x, w.y + radius);
      ctx.quadraticCurveTo(w.x, w.y, w.x + radius, w.y);
      ctx.closePath();
      ctx.fill();
    }

    // draw orbs with pulsing neon magenta gradient
    for (const o of orbs) {
      if (!o.collected) {
        const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        orbGrad.addColorStop(0, '#f0f');
        orbGrad.addColorStop(1, '#800080');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // draw player as rounded neon square with glow
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    const sz = player.size;
    const x = player.x - sz;
    const y = player.y - sz;
    const r = 6; // corner radius
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + sz * 2 - r, y);
    ctx.quadraticCurveTo(x + sz * 2, y, x + sz * 2, y + r);
    ctx.lineTo(x + sz * 2, y + sz * 2 - r);
    ctx.quadraticCurveTo(x + sz * 2, y + sz * 2, x + sz * 2 - r, y + sz * 2);
    ctx.lineTo(x + r, y + sz * 2);
    ctx.quadraticCurveTo(x, y + sz * 2, x, y + sz * 2 - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // UI text with subtle glow
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillText('GAME OVER', W / 2 - 50, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
