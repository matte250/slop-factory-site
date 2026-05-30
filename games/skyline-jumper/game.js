// Simple endless platformer for canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  function resize() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  const player = { x: 50, y: 0, w: 20, h: 30, vy: 0, onGround: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function unlockAudio(){ if (audioCtx.state !== 'running') audioCtx.resume(); }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound(){ playTone(500, 0.1); }
  function playLoseSound(){ playTone(100, 0.3); }
  function playBackgroundTone(){ playTone(200, 0.2); }
  // background loop
  setInterval(playBackgroundTone, 2000);
  const gravity = 0.5;
  const jumpStrength = -10;
  const speed = 2; // world scroll speed
  const platforms = [];
  const platformWidth = 80;
  const platformGap = 150; // average gap

  function createPlatform(x) {
    const y = canvas.height - (Math.random() * 80 + 40);
    platforms.push({ x, y, w: platformWidth, h: 10 });
  }

  // initial platforms
  for (let i = 0; i < 5; i++) createPlatform(i * (platformWidth + platformGap));

  function update() {
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    player.onGround = false;
    // collision with platforms
    for (const p of platforms) {
      if (
        player.vy >= 0 &&
        player.x < p.x + p.w &&
        player.x + player.w > p.x &&
        player.y + player.h > p.y &&
        player.y + player.h - player.vy <= p.y
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
    // world scroll
    for (const p of platforms) p.x -= speed;
    // remove off-screen platforms
    while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
    // add new platforms
    const last = platforms[platforms.length - 1];
    if (last && last.x < canvas.width) {
      const gap = platformGap + (Math.random() - 0.5) * 60;
      createPlatform(last.x + platformWidth + gap);
    }
    // lose condition
if (player.y > canvas.height) {
        // reset game
        playLoseSound();
        player.x = 50; player.y = 0; player.vy = 0;
        platforms.length = 0;
        for (let i = 0; i < 5; i++) createPlatform(i * (platformWidth + platformGap));
      }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    // platforms
    ctx.fillStyle = '#fff';
    for (const p of platforms) ctx.fillRect(p.x, p.y, p.w, p.h);
    // player as triangle
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
  }

  // draw simple parallax skyline
  const bgLayers = [];
  const layerCount = 3;
  for (let i = 0; i < layerCount; i++) {
    const buildings = [];
    const buildingCount = Math.ceil(canvas.width / 60) + 2;
    for (let b = 0; b < buildingCount; b++) {
      const bw = 40 + Math.random() * 30;
      const bh = canvas.height * (0.2 + Math.random() * 0.3) * (1 - i * 0.2);
      const bx = b * 60 + Math.random() * 20;
      buildings.push({ x: bx, w: bw, h: bh });
    }
    bgLayers.push({ buildings, speed: speed * (0.3 + i * 0.2) });
  }

  function drawBackground() {
    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#4a90e2');
    grad.addColorStop(1, '#001d3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // parallax buildings
    bgLayers.forEach(layer => {
      ctx.fillStyle = `rgba(30,30,30,${0.5 + layer.speed * 0.05})`;
      layer.buildings.forEach(b => {
        ctx.fillRect(b.x, canvas.height - b.h, b.w, b.h);
        b.x -= layer.speed;
        if (b.x + b.w < 0) {
          b.x = canvas.width + Math.random() * 30;
          b.w = 40 + Math.random() * 30;
          b.h = canvas.height * (0.2 + Math.random() * 0.3) * (1 - (bgLayers.indexOf(layer)) * 0.2);
        }
      });
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // input
  canvas.addEventListener('click', () => {
    unlockAudio();
    if (player.onGround) {
      player.vy = jumpStrength;
      playJumpSound();
    }
  });
  window.addEventListener('keydown', e => {
    unlockAudio();
    if (e.code === 'Space' && player.onGround) {
      player.vy = jumpStrength;
      playJumpSound();
    }
  });
})();
