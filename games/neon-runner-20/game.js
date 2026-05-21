// Simple endless runner for canvas with id "game"
(() => {
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 400);
  const GRAVITY = 0.6;
  const JUMP = -12;

  const player = { x: 50, y: H - 50, w: 30, h: 30, vy: 0, onGround: true };
  const obstacles = [];
  let frame = 0;
  let speed = 4;
  let gameOver = false;

  const spawnObstacle = () => {
    const size = 30 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, w: size, h: size });
  };

  const rectsCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const reset = () => {
    obstacles.length = 0;
    player.y = H - 50;
    player.vy = 0;
    player.onGround = true;
    frame = 0;
    speed = 4;
    gameOver = false;
    loop();
  };

  const loop = () => {
    if (gameOver) return;
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // neon ground line
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.stroke();

    // player
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H - 20) {
      player.y = H - 20 - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // neon player square with glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // obstacles - neon spikes with glow
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // gradient fill for neon effect
      const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#f0f');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.shadowBlur = 0;
        if (rectsCollide(player, o)) {
          gameOver = true;
          playTone(200, 0.3); // collision sound
        }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn
    if (frame % 120 === 0) spawnObstacle();
    frame++;
    speed += 0.001; // gradual increase

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.fillText('Click to Restart', W / 2, H / 2 + 40);
    } else {
      requestAnimationFrame(loop);
    }
  };

  // input
  let audioStarted = false;
  const ensureAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); audioStarted = true; };
  const jump = () => {
    ensureAudio();
    if (player.onGround) {
      player.vy = JUMP;
      playTone(500, 0.15); // jump sound
    }
  };
  canvas.addEventListener('mousedown', () => {
    if (gameOver) reset(); else jump();
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameOver) reset(); else jump();
  });

  // start
  loop();
})();
