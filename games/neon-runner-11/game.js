// Minimal endless runner based on IDEA.md
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // quick envelope
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };
  const playJump = () => playTone(400, 0.1);
  const playHit = () => playTone(150, 0.3);
  // Resume audio context on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  const player = {
    w: 30,
    h: 30,
    x: 50,
    y: height - 30,
    vy: 0,
    jumpStrength: -12,
    speed: 4,
  };

  const keys = { left: false, right: false, up: false };
  const gravity = 0.5;
  const obstacles = [];
  let scrollSpeed = 2;
  let spawnTimer = 0;
  let gameOver = false;
  let score = 0;

  const onKey = (e, down) => {
    const val = down;
    if (e.code === 'ArrowLeft') keys.left = val;
    else if (e.code === 'ArrowRight') keys.right = val;
    else if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = val;
  };
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));

  const spawnObstacle = () => {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 50;
    obstacles.push({ x: width, y: height - h, w, h });
  };

  const rectOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    if (gameOver) return;

    // player horizontal movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // jump
    if (keys.up && player.vy === 0) {
      player.vy = player.jumpStrength;
      playJump();
    }
    player.vy += gravity;
    player.y += player.vy;
    if (player.y > height - player.h) {
      player.y = height - player.h;
      player.vy = 0;
    }

    // obstacles movement & spawn
    spawnTimer -= scrollSpeed;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 200 + Math.random() * 200; // distance until next spawn
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= scrollSpeed;
      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        score++;
      } else if (rectOverlap(player, o)) {
        playHit();
        gameOver = true;
      }
    }

    // speed up over time
    scrollSpeed += 0.0005;

    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    // background gradient (dark to deeper)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // helper for rounded rect
    const drawRounded = (x, y, w, h, r, color, glow) => {
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
      ctx.fillStyle = color;
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    };

    // player with neon glow
    drawRounded(player.x, player.y, player.w, player.h, 5, '#0ff', true);

    // obstacles – varying neon reds with subtle glow
    obstacles.forEach(o => {
      const hue = 0; // red hue
      const sat = 80 + Math.random() * 20;
      const light = 40 + Math.random() * 20;
      const color = `hsl(${hue}, ${sat}%, ${light}%)`;
      drawRounded(o.x, o.y, o.w, o.h, 3, color, true);
    });

    // UI overlay
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  update();
})();
