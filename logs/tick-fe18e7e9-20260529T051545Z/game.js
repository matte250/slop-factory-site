// Neon Reflex – enhanced graphics version
(() => {
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 400);
  const H = (canvas.height = canvas.offsetHeight || 300);

  const PLAYER_SIZE = 20;
  const LANE_Y = [H * 0.25, H * 0.75]; // two lanes (up/down)
  let player = { x: 50, y: LANE_Y[0], lane: 0 };

  const obstacles = [];
  // background stars for neon effect
  const stars = [];
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
    });
  }
  // player trail positions
  const trail = [];
  const OBSTACLE_W = 30;
  const OBSTACLE_H = H * 0.4;
  let speed = 2;
  let spawnTimer = 0;
  let score = 0;
  let running = true;

  const toggleLane = () => {
    // sound on lane change
    playTone(440, 0.1);
    player.lane = 1 - player.lane;
    player.y = LANE_Y[player.lane];
  };
  window.addEventListener('click', toggleLane);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') toggleLane(); });

  const drawNeon = (x, y, w, h, color, radius = 0) => {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  if (radius > 0) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
  ctx.shadowBlur = 0;
};
function spawnObstacle() {
    const top = Math.random() < 0.5; // from top or bottom
    const y = top ? 0 : H - OBSTACLE_H;
    obstacles.push({ x: W, y, w: OBSTACLE_W, h: OBSTACLE_H });
  }

  function update(dt) {
  // update stars for parallax effect
  stars.forEach(s => {
    s.x -= speed * 0.3;
    if (s.x < 0) s.x = W;
  });
  // update player trail
  trail.push({ x: player.x, y: player.y });
  if (trail.length > 12) trail.shift();
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision
      if (
        player.x < o.x + o.w &&
        player.x + PLAYER_SIZE > o.x &&
        player.y < o.y + o.h &&
        player.y + PLAYER_SIZE > o.y
      ) {
        playTone(220, 0.3);
        running = false;
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn logic
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 1500 / speed; // faster spawns as speed rises
    }
    // increase difficulty
    speed += 0.001;
    score += dt * 0.001;
  }

  function render() {
  // clear canvas
  ctx.clearRect(0, 0, W, H);
  // draw gradient neon background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(0.5, '#003');
  bgGrad.addColorStop(1, '#001');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // moving tunnel lines for depth effect
  ctx.strokeStyle = 'rgba(0,255,255,0.08)';
  for (let i = 0; i < 40; i++) {
    const lineX = (i * 30 + (performance.now() / 6)) % W;
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, H);
    ctx.stroke();
  }
  // stars background
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // player trail effect
  trail.forEach((p, i) => {
    const alpha = (i + 1) / trail.length * 0.4;
    ctx.globalAlpha = alpha;
    drawNeon(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, '#0ff', 4);
  });
  ctx.globalAlpha = 1;
  // player with slight radius for smoother look
  drawNeon(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, '#0ff', 4);
  // obstacles with rounded corners
  obstacles.forEach(o => drawNeon(o.x, o.y, o.w, o.h, '#f0f', 5));
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f88';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

    // clear canvas
    ctx.clearRect(0, 0, W, H);
    // draw gradient neon background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(0.5, '#003');
    bgGrad.addColorStop(1, '#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // moving tunnel lines for depth effect
    ctx.strokeStyle = 'rgba(0,255,255,0.08)';
    for (let i = 0; i < 40; i++) {
      const lineX = (i * 30 + (performance.now() / 6)) % W;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, H);
      ctx.stroke();
    }
    // player with slight radius for smoother look
    drawNeon(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, '#0ff', 4);
    // obstacles with rounded corners
    obstacles.forEach(o => drawNeon(o.x, o.y, o.w, o.h, '#f0f', 5));
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f88';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (running) update(dt);
    render();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
