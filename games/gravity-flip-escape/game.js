// Gravity Flip Escape game
// Canvas element with id="game" expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  const radius = 15;
  let gravity = 0.4; // positive = down
  let player = {
    x: width / 2,
    y: height - radius - 5,
    vy: 0,
  };

  // simple platform generator
  const platformHeight = 10;
  const platformGap = 120; // vertical gap between platforms
  const platforms = [];
// particle system for gravity flip effect
const particles = [];
function addParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 2;
  particles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 30,
    size: 2 + Math.random() * 3,
  });
}
  function addPlatform(y) {
    const w = 80 + Math.random() * 100;
    const x = Math.random() * (width - w);
    platforms.push({ x, y, w, h: platformHeight });
  }
  // initial platforms
  for (let y = height; y > -height; y -= platformGap) {
    addPlatform(y);
  }

  function toggleGravity() {
    gravity = -gravity;
    // create a small burst of particles at the player
    for (let i = 0; i < 12; i++) {
      addParticle(player.x, player.y);
    }
    // play flip sound
    playTone(440, 0.1);
  }
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      toggleGravity();
    }
  });

  function update() {
    // apply gravity
    player.vy += gravity;
    player.y += player.vy;

    // scroll platforms up when player moves upward past middle
    if (player.y < height / 2 && gravity < 0) {
      const dy = height / 2 - player.y;
      player.y = height / 2;
      platforms.forEach(p => p.y += dy);
    } else if (player.y > height / 2 && gravity > 0) {
      const dy = player.y - height / 2;
      player.y = height / 2;
      platforms.forEach(p => p.y -= dy);
    }

    // update particles (gravity flip effect)
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // remove off‑screen platforms and add new ones
    while (platforms.length && (platforms[0].y > height || platforms[0].y < -platformHeight)) {
      platforms.shift();
    }
    const lastY = platforms.length ? platforms[platforms.length - 1].y : height;
    if (gravity < 0 && lastY > -platformGap) {
      addPlatform(lastY - platformGap);
    } else if (gravity > 0 && lastY < height + platformGap) {
      addPlatform(lastY + platformGap);
    }

    // collision detection
    let onPlatform = false;
    for (const p of platforms) {
      if (
        player.x + radius > p.x &&
        player.x - radius < p.x + p.w &&
        ((gravity > 0 && player.y + radius >= p.y && player.y + radius <= p.y + p.h && player.vy >= 0) ||
         (gravity < 0 && player.y - radius <= p.y + p.h && player.y - radius >= p.y && player.vy <= 0))
      ) {
        onPlatform = true;
        player.vy = 0;
        player.y = gravity > 0 ? p.y - radius : p.y + p.h + radius;
        break;
      }
    }
    if (!onPlatform && (player.y - radius > height || player.y + radius < 0)) {
      // lose condition sound
      playTone(220, 0.3);
      alert('Game Over');
      // reset
      player.y = gravity > 0 ? height - radius - 5 : radius + 5;
      player.vy = 0;
      platforms.length = 0;
      particles.length = 0;
      for (let y = height; y > -height; y -= platformGap) addPlatform(y);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e3a8a'); // dark blue top
    bgGrad.addColorStop(1, '#0f172a'); // almost black bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw particles (fade out)
    particles.forEach(p => {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw player with radial gradient
    const grad = ctx.createRadialGradient(
      player.x - radius / 3,
      player.y - radius / 3,
      radius / 8,
      player.x,
      player.y,
      radius
    );
    grad.addColorStop(0, '#ffab91');
    grad.addColorStop(1, '#e64a19');
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // draw platforms with rounded corners and gradient
    platforms.forEach(p => {
      const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      pg.addColorStop(0, '#4b5563');
      pg.addColorStop(1, '#1f2937');
      ctx.fillStyle = pg;
      ctx.beginPath();
      const r = 3;
      ctx.moveTo(p.x + r, p.y);
      ctx.lineTo(p.x + p.w - r, p.y);
      ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + r);
      ctx.lineTo(p.x + p.w, p.y + p.h - r);
      ctx.quadraticCurveTo(p.x + p.w, p.y + p.h, p.x + p.w - r, p.y + p.h);
      ctx.lineTo(p.x + r, p.y + p.h);
      ctx.quadraticCurveTo(p.x, p.y + p.h, p.x, p.y + p.h - r);
      ctx.lineTo(p.x, p.y + r);
      ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
      ctx.closePath();
      ctx.fill();
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
