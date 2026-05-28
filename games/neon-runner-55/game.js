// Simple endless‑runner with neon graphics
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playJumpSound() { playTone(400, 120); }
  function playGameOverSound() { playTone(150, 400); }

  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Player
  const player = {
    x: 50,
    y: height - 60,
    w: 40,
    h: 40,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.6,
    onGround: true,
    color: '#0ff',
  };

  const obstacles = [];
  const obstacleSpeed = 4;
  const particles = []; // neon jump particles
  const obstacleFreq = 90; // frames
  let frameCount = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 30 + Math.random() * 30;
    const neonPalette = ['#ff0', '#0ff', '#f0f', '#0f0', '#f00'];
    obstacles.push({
      x: width,
      y: height - size,
      w: size,
      h: size,
      color: neonPalette[Math.floor(Math.random() * neonPalette.length)],
    });
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= height) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.vy += 0.1; // gravity effect on particles
      if (p.life <= 0) particles.splice(i, 1);
    }
    // obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn
    if (frameCount % obstacleFreq === 0) spawnObstacle();
    // collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
    frameCount++;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#090927');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // set neon glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    // player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // obstacles
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size; // larger blur for bright particles
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input: click or tap triggers jump if on ground
  function handleInput() {
    if (player.onGround) {
      // ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
      // generate neon jump particles
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.3;
        const speed = 2 + Math.random() * 2;
        particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * -speed,
          size: 2 + Math.random() * 2,
          life: 30 + Math.random() * 10,
          color: '#0ff',
        });
      }
    }
  }
  canvas.addEventListener('click', handleInput);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(); }, { passive: false });

  // start
  requestAnimationFrame(loop);
})();
