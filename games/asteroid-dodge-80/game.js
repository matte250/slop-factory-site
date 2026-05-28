// Canvas game: move a glowing orb with particle trail
(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback if not set in HTML) and handle high DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = (canvas.clientWidth || 400) * dpr;
  canvas.height = (canvas.clientHeight || 300) * dpr;
  ctx.scale(dpr, dpr);

  const player = { x: 50, y: 50, size: 30, speed: 2 };
  const stars = [];
  // generate simple starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const keys = {};
  const particles = [];

  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    keys[e.key] = true;
    // play sound on movement key press
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      playBeep();
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    // Move player
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
    // Add a particle at player's center
      particles.push({
        x: player.x + player.size/2,
        y: player.y + player.size/2,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 30,
        hue: Math.random() * 360,
      });
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // Fade previous frame for motion trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield background
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw particles with fading
    for (const p of particles) {
      const alpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw player as a circle with gradient
    const grad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 8,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    grad.addColorStop(0, '#00aaff');
    grad.addColorStop(1, '#004488');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
