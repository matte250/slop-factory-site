// Neon Escape: simple top‑down endless runner
// Canvas with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  // ensure audio context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);

  // full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // generate starfield for background
    stars.length = 0;
    const STAR_COUNT = 120;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.4,
      });
    }
  };
  resize();
  window.addEventListener('resize', resize);

  // player state
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speed: 2.5,
    angle: 0, // radians, 0 = up
    color: '#0ff',
  };

  // input handling (left/right rotate)
  const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // obstacles – simple moving rectangles (bars) and spikes (triangles)
  const obstacles = [];
  const OBSTACLE_SPACING = 120; // distance between generated columns
  let lastObstacleY = -OBSTACLE_SPACING;
  // starfield for background
  const stars = [];
  // trail for player motion blur
  const trail = [];
  const MAX_TRAIL = 20;


  // score tracking
  let distance = 0;
  let gameOver = false;

  // utility helpers
  const rand = (a, b) => Math.random() * (b - a) + a;
  const degToRad = deg => deg * Math.PI / 180;

  // generate a column of obstacles at a given y offset (relative to player forward movement)
  const generateObstacles = () => {
    // create a random gap for the player to pass through
    const gapWidth = 80; // pixels
    const gapX = rand(gapWidth, canvas.width - gapWidth);
    // left bar
    obstacles.push({
      type: 'bar',
      x: 0,
      y: lastObstacleY,
      w: gapX - gapWidth / 2,
      h: 20,
    });
    // right bar
    obstacles.push({
      type: 'bar',
      x: gapX + gapWidth / 2,
      y: lastObstacleY,
      w: canvas.width - (gapX + gapWidth / 2),
      h: 20,
    });
    // occasional spikes (triangle) inside the gap
    if (Math.random() < 0.3) {
      const spikeSize = 12;
      obstacles.push({
        type: 'spike',
        x: gapX,
        y: lastObstacleY - spikeSize,
        size: spikeSize,
      });
    }
    lastObstacleY -= OBSTACLE_SPACING;
  };

  // initial obstacles
  for (let i = 0; i < 10; i++) generateObstacles();

  // collision detection
  const checkCollision = () => {
    // canvas edge
    if (
      player.x - player.radius < 0 ||
      player.x + player.radius > canvas.width ||
      player.y - player.radius < 0 ||
      player.y + player.radius > canvas.height
    ) {
      return true;
    }
    // obstacles
    for (const o of obstacles) {
      if (o.type === 'bar') {
        // simple AABB vs circle
        const dx = Math.max(o.x - player.x, 0, player.x - (o.x + o.w));
        const dy = Math.max(o.y - player.y, 0, player.y - (o.y + o.h));
        if (dx * dx + dy * dy < player.radius * player.radius) return true;
      } else if (o.type === 'spike') {
        // point‑in‑triangle test (spike points upward)
        const { x, y, size } = o;
        const p0 = { x, y };
        const p1 = { x: x - size, y: y + size };
        const p2 = { x: x + size, y: y + size };
        const area = (p0.x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (p0.y - p2.y);
        const s = ((p0.x - p2.x) * (player.y - p2.y) - (player.x - p2.x) * (p0.y - p2.y)) / area;
        const t = ((player.x - p2.x) * (p1.y - p2.y) - (player.x - p2.x) * (p1.x - p2.x)) / area;
        if (s >= 0 && t >= 0 && s + t <= 1) return true;
      }
    }
    return false;
  };

  // main loop
  const loop = () => {
    if (gameOver) {
      // display game over
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Distance: ${Math.floor(distance)}`, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }

    // handle rotation input
    if (keys.ArrowLeft || keys.a) {
      player.angle -= degToRad(2);
      playBeep(300, 0.05);
    }
    if (keys.ArrowRight || keys.d) {
      player.angle += degToRad(2);
      playBeep(400, 0.05);
    }

  // move player forward in its current direction
  player.x += Math.sin(player.angle) * player.speed;
  player.y -= Math.cos(player.angle) * player.speed; // canvas y grows downwards

  // update trail for motion blur effect
  trail.push({ x: player.x, y: player.y, alpha: 1 });
  if (trail.length > MAX_TRAIL) trail.shift();


    // shift obstacles opposite to player movement to create illusion of forward motion
    const dy = player.speed; // vertical shift (since player moves upward in game space)
    for (const o of obstacles) o.y += dy;
    distance += player.speed;

    // generate new obstacles when needed
    while (lastObstacleY > -canvas.height) generateObstacles();

    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y > canvas.height) obstacles.shift();

    // collision check
    if (checkCollision()) {
      playBeep(150, 0.3);
      gameOver = true;
    }

  // draw background with neon gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw stars (twinkling background)
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    s.y += player.speed * 0.5; // slower than player for parallax
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;


    // draw obstacles with neon glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0f';
    for (const o of obstacles) {
      if (o.type === 'bar') {
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else if (o.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x - o.size, o.y + o.size);
        ctx.lineTo(o.x + o.size, o.y + o.size);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    // draw motion trail for player
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = (i + 1) / trail.length;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // draw player (glowing dot)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // neon glow effect
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance: ${Math.floor(distance)}`, 10, 30);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
