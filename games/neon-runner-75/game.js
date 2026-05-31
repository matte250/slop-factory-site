// Neon Runner – simple canvas game
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  let audioCtx = null;
  function initAudio(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  // Simple tone generator
  function playTone(frequency, duration = 0.1){
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playCollision(){
    // Low-pitched crash tone
    playTone(120, 0.3);
  }
  function playOrbCollect(){
    // High-pitched chime
    playTone(800, 0.15);
  }
  const { width, height } = canvas;
  // Starfield for background depth
  const starCount = 100;
  const stars = new Array(starCount).fill(0).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  // Player – a thin vertical neon line
  const player = {
    x: 60,
    y: height / 2,
    w: 4,
    h: 30,
    speed: 4,
    color: '#0ff',
  };

  // Bar generator
  const barSpacing = 200; // distance between bars
  const barWidth = 30;
  const gapHeight = 120;
  let bars = [];
  let frames = 0;

  // Orb (shield) generator
  let orb = null;
  let shield = { active: false, remaining: 0 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBar() {
    const gapY = Math.random() * (height - gapHeight - 20) + 10;
    bars.push({ x: width, gapY, passed: false });
  }

  function spawnOrb() {
    const oy = Math.random() * (height - 20) + 10;
    orb = { x: width, y: oy, r: 8, collected: false };
  }

  function reset() {
    player.y = height / 2;
    bars = [];
    frames = 0;
    shield = { active: false, remaining: 0 };
    orb = null;
  }

  function update() {
    // move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    player.y = Math.max(0, Math.min(height - player.h, player.y));

    // spawn bars
    if (frames % Math.floor(barSpacing / 2) === 0) spawnBar();
    // occasionally spawn orb
    if (!orb && Math.random() < 0.005) spawnOrb();

    // move bars left
    bars.forEach(b => (b.x -= 2));
    bars = bars.filter(b => b.x + barWidth > 0);

    // move stars left for parallax effect
    stars.forEach(s => {
      s.x -= 0.5;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    });

    // move orb left
    if (orb) {
      orb.x -= 2;
      if (orb.x + orb.r < 0) orb = null;
    }
    // collision detection
    for (const b of bars) {
      if (!b.passed && b.x < player.x + player.w && b.x + barWidth > player.x) {
        const inGap = player.y > b.gapY && player.y + player.h < b.gapY + gapHeight;
        if (!inGap) {
          if (shield.active) {
            shield.remaining -= 1;
            if (shield.remaining <= 0) shield.active = false;
          } else {
            // game over – reset
          playCollision();
          reset();
          return;
          }
        }
        b.passed = true;
      }
    }

    // orb collection
    if (orb && !orb.collected) {
      const dx = player.x + player.w / 2 - orb.x;
      const dy = player.y + player.h / 2 - orb.y;
        if (Math.hypot(dx, dy) < orb.r + player.w) {
          shield = { active: true, remaining: 1 };
          orb.collected = true;
          playOrbCollect();
        }
    }

    frames++;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw background gradient (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw starfield for depth
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // draw player with neon glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0; // reset

    // draw bars with neon glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0f';
    for (const b of bars) {
      // top rect
      ctx.fillRect(b.x, 0, barWidth, b.gapY);
      // bottom rect
      ctx.fillRect(b.x, b.gapY + gapHeight, barWidth, height - b.gapY - gapHeight);
    }
    ctx.shadowBlur = 0;

    // draw orb with pulsating glow
    if (orb && !orb.collected) {
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * 2);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // shield indicator – cyan overlay with low opacity
    if (shield.active) {
      ctx.fillStyle = 'rgba(0,255,255,0.15)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  reset();
  loop();
})();
