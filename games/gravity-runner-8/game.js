// Enhanced Gravity Runner with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  // Audio setup
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
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJump = () => playTone(400, 0.08);
  const playCrash = () => playTone(100, 0.3);

  const GRAVITY = 0.6;
  const JUMP = -12;
  // Game state
  const CLOUD_SPEED = 0.5;
  const CLOUD_SPAWN_INTERVAL = 200;
  let cloudSpawnCounter = 0;
  let score = 0;
  const particles = []; // {x,y,vx,vy,life}
  const MAX_PARTICLE_LIFE = 30;
  const PLAYER_RADIUS = 20;

  const player = {
    x: 80,
    y: height - PLAYER_RADIUS,
    vy: 0,
    radius: PLAYER_RADIUS,
    onGround: true,
  };

  const obstacles = [];
  const clouds = []; // background clouds
  let speed = 4;
  let frame = 0;
  let running = true;

  // Audio state flag
  let audioStarted = false;
  const spawnObstacle = () => {
    const w = 30 + Math.random() * 40;
    const h = 30 + Math.random() * 60;
    obstacles.push({ x: width, y: height - h, w, h });
  };

  const update = () => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= height - player.radius) {
      player.y = height - player.radius;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles periodically
    if (frame % Math.max(80 - speed * 5, 30) === 0) spawnObstacle();

    // Particle update & generation
    // generate trail particles at player's position
    particles.push({x: player.x, y: player.y + player.radius, vx: (Math.random() - 0.5) * 1, vy: -Math.random() * 2 - 1, life: MAX_PARTICLE_LIFE});
    // update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // Cloud update & generation
    cloudSpawnCounter++;
    if (cloudSpawnCounter >= CLOUD_SPAWN_INTERVAL) {
      cloudSpawnCounter = 0;
      clouds.push({
        x: width,
        y: Math.random() * (height / 2),
        w: 60 + Math.random() * 40,
        h: 20 + Math.random() * 20,
        speed: CLOUD_SPEED,
      });
    }
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) clouds.splice(i, 1);
    }

    // Collision detection (circle‑AABB)
    for (const o of obstacles) {
      const closestX = Math.max(o.x, Math.min(player.x, o.x + o.w));
      const closestY = Math.max(o.y, Math.min(player.y, o.y + o.h));
      const dx = player.x - closestX;
      const dy = player.y - closestY;
        if (dx * dx + dy * dy < player.radius * player.radius) {
          running = false;
          playCrash();
        }
    }

    // Increase difficulty and score
    speed += 0.001;
    score += 0.1; // incremental score
    frame++;
  };


  const draw = () => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87CEEB');
    bgGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Cloud rendering (parallax background)
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score display
    ctx.fillStyle = '#333';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
    // Particle rendering with fading
    particles.forEach(p => {
      const alpha = (p.life / MAX_PARTICLE_LIFE) * 0.8;
      ctx.fillStyle = `rgba(255,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Player with shading
    const grad = ctx.createRadialGradient(player.x - 5, player.y - 5, player.radius * 0.2, player.x, player.y, player.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#3498db');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Obstacles with simple shading
    obstacles.forEach(o => {
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#e74c3c');
      obsGrad.addColorStop(1, '#c0392b');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

  };

  const loop = () => {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Input
  window.addEventListener('keydown', e => {
    // Ensure audio context is resumed on first interaction
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
    if ((e.code === 'Space' || e.key === ' ') && player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
      playJump();
    }
  });

  loop();
})();
