// Pixel Runner – simple endless runner
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  function playJumpSound() { playTone(440, 0.1); }
  function playGameOverSound() { playTone(100, 0.5); }
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;
  const GRAVITY = 0.6;
  const JUMP = -12;
  const PLAYER_SIZE = 30;
  const GROUND = H - PLAYER_SIZE;

  const player = { x: 50, y: GROUND, w: PLAYER_SIZE, h: PLAYER_SIZE, vy: 0, onGround: true };
  let obstacles = [];
  let speed = 4;
  let frame = 0;
  let score = 0;
  let running = true;

  const spawnObstacle = () => {
    // Randomly create either a block or a spike obstacle
    const isSpike = Math.random() < 0.5;
    if (isSpike) {
      const width = 20;
      const height = 30;
      obstacles.push({
        x: W,
        y: GROUND + PLAYER_SIZE - height,
        w: width,
        h: height,
        type: 'spike'
      });
    } else {
      const size = 20 + Math.random() * 20;
      obstacles.push({
        x: W,
        y: GROUND + PLAYER_SIZE - size,
        w: size,
        h: size,
        type: 'block'
      });
    }
  };

  const reset = () => {
    obstacles = [];
    speed = 4;
    frame = 0;
    score = 0;
    player.y = GROUND;
    player.vy = 0;
    player.onGround = true;
    running = true;
    requestAnimationFrame(loop);
  };

  const jump = () => {
    if (player.onGround) { player.vy = JUMP; player.onGround = false; playJumpSound(); }
  };

  canvas.addEventListener('click', () => { audioCtx.resume(); running ? jump() : reset(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space') running ? jump() : reset(); });

  const loop = () => {
    if (!running) return;
    frame++;
    // update player
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }
    // spawn obstacles
    if (frame % Math.max(90 - speed * 5, 30) === 0) spawnObstacle();
    // move obstacles & remove off‑screen
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // increase speed gradually
    if (frame % 200 === 0) speed += 0.3;
    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        running = false;
        playGameOverSound();
        break;
      }
    }
    // draw
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky
    bgGrad.addColorStop(1, '#f0e68c'); // ground horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground line
    ctx.fillStyle = '#555';
    ctx.fillRect(0, GROUND + PLAYER_SIZE, W, H - (GROUND + PLAYER_SIZE));
    // player (with shadow)
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x + 2, player.y + 2, player.w, player.h);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // obstacles with styles
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#f00';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    });
    // score
    score = Math.floor(frame / 5);
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // loop
    if (running) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 15);
      ctx.fillText('Click or press Space to restart', W / 2, H / 2 + 35);
    }
  };
  requestAnimationFrame(loop);
})();
