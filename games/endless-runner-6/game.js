// Endless runner implementation with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.width || 800;
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (frequency, duration = 0.1) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playSound(440);
  const playGameOverSound = () => playSound(150, 0.5);

  const H = canvas.height = canvas.height || 400;

  const player = {x: 50, y: H - 30, w: 30, h: 30, vy: 0, onGround: true};
  let speed = 200; // pixels per second
  const accel = 5; // speed increase per second
  const gravity = 800; // px/s²
  const jumpV = -350; // initial jump velocity
  const obstacles = [];
  let lastTime = 0;
  let score = 0;
  let running = true;

  const spawnObstacle = () => {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 60;
    obstacles.push({x: W + w, y: H - h, w, h});
  };
  // initial obstacles
  spawnObstacle();

  const onClick = () => {
    // resume AudioContext on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = jumpV;
      player.onGround = false;
      playJumpSound();
    }
  };
  canvas.addEventListener('click', onClick);

  const rectIntersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = (dt) => {
    // move player horizontally
    player.x += speed * dt;
    // update vertical motion
    player.vy += gravity * dt;
    player.y += player.vy * dt;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // move obstacles left relative to player movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * dt;
      // remove passed obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn new obstacles when needed
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < W - 200) {
      spawnObstacle();
    }
    // collision check
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        running = false;
        break;
      }
    }
    // speed ramp up
    speed += accel * dt;
    // score based on distance
    score = Math.floor(player.x);
  };

  const draw = () => {
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue top
    skyGrad.addColorStop(1, '#FFFFFF'); // white near horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // ground with simple texture
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, H - 30, W, 30);
    // draw a thin line for ground edge
    ctx.strokeStyle = '#2e4b3e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 30);
    ctx.lineTo(W, H - 30);
    ctx.stroke();
    // player with rounded rect and gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#00aaff');
    playerGrad.addColorStop(1, '#0055aa');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 6);
    ctx.fill();
    // obstacles as rounded rects with dark red gradient
    for (const o of obstacles) {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#b22222');
      obsGrad.addColorStop(1, '#8b0000');
      ctx.fillStyle = obsGrad;
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 4);
      ctx.fill();
    }
    // score text with shadow for readability
    ctx.fillStyle = '#000';
    ctx.font = '18px sans-serif';
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText('Score: ' + score, 10, 25);
    ctx.shadowColor = 'transparent';
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  const loop = (time) => {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
