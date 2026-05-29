// Minimalist canvas game with enhanced graphics
// Canvas element with id "game"

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Play a tone of given frequency (Hz) and duration (seconds)
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Unlock audio on first user interaction
  const unlockAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('click', unlockAudio);

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player (ship)
  const player = {
    // position is center of ship
    x: width / 2,
    y: height - 30,
    size: 20,
    speed: 3,
    color: '#00f',
  };

  // Input state
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Obstacles (spikes) and orbs
  const spikes = [];
  const orbs = [];
  // Background stars
  const stars = [];
  const maxStars = 100;
  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnSpike() {
    const size = 20 + Math.random() * 10;
    const x = Math.random() * (width - size);
    spikes.push({ x, y: -size, size, speed: 2 + Math.random() * 2 });
  }

  function spawnOrb() {
    const r = 8 + Math.random() * 6;
    const x = Math.random() * (width - r * 2) + r;
    orbs.push({ x, y: -r, r, speed: 2 });
  }

  function update() {
    if (gameOver) return;
    // Move player (centered)
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // Keep within bounds (using half size)
    player.x = Math.max(player.size / 2, Math.min(width - player.size / 2, player.x));
    player.y = Math.max(player.size / 2, Math.min(height - player.size / 2, player.y));

    // Spawn spikes/orbs
    if (frame % 60 === 0) spawnSpike(); // roughly every second
    if (frame % 180 === 0) spawnOrb(); // every 3 seconds

    // Update spikes
    spikes.forEach((sp) => (sp.y += sp.speed));
    // Remove off‑screen spikes
    while (spikes.length && spikes[0].y > height) spikes.shift();

    // Update orbs
    orbs.forEach((o) => (o.y += o.speed));
    while (orbs.length && orbs[0].y > height) orbs.shift();

    // Collision detection
    for (const sp of spikes) {
      // simple bounding box collision using player's size as square
      const half = player.size / 2;
      if (
        player.x - half < sp.x + sp.size &&
        player.x + half > sp.x &&
        player.y - half < sp.y + sp.size &&
        player.y + half > sp.y
      ) {
        gameOver = true;
        // Play collision sound
        playTone(200, 0.3);
      }
    }
    // Collect orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < o.r + player.size / 2) {
        score += 10;
        // Play orb collection sound
        playTone(500, 0.2);
        orbs.splice(i, 1);
      }
    }

    // Increment score over time
    score += 0.05;
    frame++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(st => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Player ship (triangle)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.size / 2);
    ctx.lineTo(player.x - player.size / 2, player.y - player.size / 2);
    ctx.lineTo(player.x + player.size / 2, player.y - player.size / 2);
    ctx.closePath();
    ctx.fill();
    // Spikes (draw as red triangles with gradient)
    const spikeGrad = ctx.createLinearGradient(0, 0, 0, height);
    spikeGrad.addColorStop(0, '#f88');
    spikeGrad.addColorStop(1, '#a00');
    ctx.fillStyle = spikeGrad;
    spikes.forEach((sp) => {
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y + sp.size);
      ctx.lineTo(sp.x + sp.size / 2, sp.y);
      ctx.lineTo(sp.x + sp.size, sp.y + sp.size);
      ctx.closePath();
      ctx.fill();
    });
    // Orbs with glow
    orbs.forEach((o) => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, 'rgba(0,255,0,0.8)');
      grad.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score & game over text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the loop once the page is ready
  if (document.readyState === 'complete') loop();
  else window.addEventListener('load', loop);
})();
