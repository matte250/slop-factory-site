// Simple "Pixel Tower Escape" game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
   if (!canvas) { console.error('Canvas #game not found'); return; }
   const ctx = canvas.getContext('2d');
   const width = canvas.width = canvas.clientWidth || 400;
   const height = canvas.height = canvas.clientHeight || 600;

   // Audio setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   // Background ambient tone
   const bgOsc = audioCtx.createOscillator();
   const bgGain = audioCtx.createGain();
   bgOsc.frequency.value = 60; // low hum
   bgGain.gain.value = 0.02;
   bgOsc.connect(bgGain);
   bgGain.connect(audioCtx.destination);
   bgOsc.start();

   // Helper to play a short sound (frequency, duration in seconds)
   function playSound(freq, dur) {
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.frequency.value = freq;
     osc.type = 'square';
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
     osc.start();
     osc.stop(audioCtx.currentTime + dur);
   }


  const player = {
    x: width / 2,
    y: height - 30,
    w: 20,
    h: 20,
    vy: 0,
    speed: 2,
    color: '#ff0'
  };

  const platforms = [];
  const platformHeight = 10;
  const platformGap = 80; // vertical distance between platforms
  const platformSpeed = 1.5; // how fast they move down

  // generate initial platforms
  for (let i = 0; i < 10; i++) {
    createPlatform(height - i * platformGap);
  }

  function createPlatform(y) {
    const w = 80 + Math.random() * 40;
    const x = Math.random() * (width - w);
    platforms.push({ x, y, w, h: platformHeight, color: '#0f0' });
  }

  let left = false;
  let right = false;
  // handle click/tap – toggle direction
  canvas.addEventListener('click', () => {
    // simple: alternate left/right each click
    left = !left;
    right = !left;
    // click sound
    playSound(300, 0.08);
  });

  function update(dt) {
    // gravity
    player.vy += 0.1;
    player.y += player.vy;
    // horizontal movement based on direction flag
    if (left) player.x -= player.speed;
    if (right) player.x += player.speed;
    // keep within bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > width) player.x = width - player.w;

    // platform collision (only when falling)
    if (player.vy > 0) {
      for (const p of platforms) {
        if (
          player.x < p.x + p.w &&
          player.x + player.w > p.x &&
          player.y + player.h > p.y &&
          player.y + player.h < p.y + p.h
        ) {
          // snap to platform and bounce
          player.y = p.y - player.h;
          player.vy = -4; // jump up
          // jump sound
          playSound(600, 0.05);
        }
      }
    }

    // move platforms down (simulating upward scroll)
    for (const p of platforms) {
      p.y += platformSpeed;
    }
    // remove off-screen platforms & add new ones
    if (platforms[0].y > height) {
      platforms.shift();
      createPlatform(-platformHeight);
    }

    // lose condition: fall below canvas
    if (player.y > height) {
      // restart simple
      resetGame();
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d'); // dark night sky
    bgGrad.addColorStop(1, '#003566'); // deeper blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw platforms with rounded corners and varied shades
    for (const p of platforms) {
      const shade = Math.floor(100 + Math.random() * 55);
      ctx.fillStyle = `rgb(${shade},${shade + 30},${shade})`;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(p.x + radius, p.y);
      ctx.lineTo(p.x + p.w - radius, p.y);
      ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + radius);
      ctx.lineTo(p.x + p.w, p.y + p.h - radius);
      ctx.quadraticCurveTo(p.x + p.w, p.y + p.h, p.x + p.w - radius, p.y + p.h);
      ctx.lineTo(p.x + radius, p.y + p.h);
      ctx.quadraticCurveTo(p.x, p.y + p.h, p.x, p.y + p.h - radius);
      ctx.lineTo(p.x, p.y + radius);
      ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
      ctx.closePath();
      ctx.fill();
    }

    // draw player as a glowing circle
    const grad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      2,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w
    );
    grad.addColorStop(0, '#fff700'); // bright center
    grad.addColorStop(1, '#ff8c00'); // orange edge
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  let last = 0;
  function loop(timestamp) {
    const dt = timestamp - last;
    last = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    player.x = width / 2;
    player.y = height - 30;
    player.vy = 0;
    platforms.length = 0;
    for (let i = 0; i < 10; i++) {
      createPlatform(height - i * platformGap);
    }
    left = false; right = false;
  }

  requestAnimationFrame(loop);
})();
