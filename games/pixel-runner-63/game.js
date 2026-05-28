// Minimal endless runner for canvas#game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 400;
  const H = canvas.height = canvas.offsetHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioUnlocked = false;
  const unlockAudio = () => {
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  };
  const playTone = (freq, duration = 0.1, type = 'sine') => {
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
  };
  const playJumpSound = () => playTone(300, 0.15);
  const playCollectSound = () => playTone(600, 0.07);
  const playGameOverSound = () => playTone(100, 0.4, 'triangle');
  // Player
  const player = {x: 50, y: H - 30, w: 20, h: 20, vy: 0, jumps: 0};
  const GRAVITY = 0.8, JUMP = -12, MAX_JUMPS = 1;

  // Obstacles & orbs
  const obstacles = [];
  const orbs = [];
  const speed = 3;
  let score = 0;
  let gameOver = false;

  // Input
  const jump = () => {
    unlockAudio();
    if (player.jumps < MAX_JUMPS) {
      player.vy = JUMP;
      player.jumps++;
      playJumpSound();
    }
  };
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

  // Spawn helpers
  const spawnObstacle = () => {
    obstacles.push({x: W, y: H - 30, w: 20, h: 20});
  };
  const spawnOrb = () => {
    const size = 10;
    const y = H - 60 - Math.random() * 80;
    orbs.push({x: W, y, w: size, h: size});
  };
  let obsTimer = 0, orbTimer = 0;

  const update = () => {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) { player.y = H - player.h; player.vy = 0; player.jumps = 0; }

    // move obstacles & check collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      else if (rectCollide(player, o)) {
        gameOver = true;
        playGameOverSound();
      }
    }
    // move orbs & collect
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.x -= speed;
      if (orb.x + orb.w < 0) orbs.splice(i, 1);
      else if (rectCollide(player, orb)) { score++; playCollectSound(); orbs.splice(i, 1); }
    }

    // spawning
    if (obsTimer-- <= 0) { spawnObstacle(); obsTimer = 80 + Math.random() * 80; }
    if (orbTimer-- <= 0) { spawnOrb(); orbTimer = 120 + Math.random() * 120; }
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ground with slight shadow
    ctx.fillStyle = '#333';
    ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, H - 12, W, 2);
    ctx.globalAlpha = 1.0;

    // player as a circle with glow
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      0,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w
    );
    playerGrad.addColorStop(0, '#0f0');
    playerGrad.addColorStop(1, '#030');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles – varying colors and rounded corners
    obstacles.forEach(o => {
      ctx.fillStyle = '#d44';
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y);
      ctx.lineTo(o.x + o.w - 4, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + 4);
      ctx.lineTo(o.x + o.w, o.y + o.h - 4);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - 4, o.y + o.h);
      ctx.lineTo(o.x + 4, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - 4);
      ctx.lineTo(o.x, o.y + 4);
      ctx.quadraticCurveTo(o.x, o.y, o.x + 4, o.y);
      ctx.fill();
    });

    // orbs – radial glow
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        0,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      orbGrad.addColorStop(0, '#ff0');
      orbGrad.addColorStop(1, '#a80');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W/2-60, H/2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  loop();

  function rectCollide(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
})();
