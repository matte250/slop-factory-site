// Vertical Bounce Escape – enhanced graphics
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // resume audio on interaction
  canvas.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Player (circle)
  const player = {
    x: width / 2,
    y: height - 30,
    radius: 10,
    vy: -5, // upward velocity
    gravity: 0.2,
    bounceStrength: -5,
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      // wrap to top when reaching top
      if (this.y < -this.radius) {
        this.y = height + this.radius;
        this.vy = this.bounceStrength;
      }
    },
    draw() {
      // radial gradient for player
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#fff700');
      grad.addColorStop(1, '#ff5');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // subtle shadow
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      // reset shadow after drawing player
      ctx.shadowColor = 'transparent';
    }
  };

  // Platforms (simple rectangles)
  const platformHeight = 10;
  const platformWidth = 80;
  const platforms = [];
  const platformGap = 100; // vertical distance between platforms
  const speed = 1; // scrolling speed

  function createPlatform(y) {
    const gapSize = 30; // gap width for player to pass
    const gapX = Math.random() * (width - gapSize);
    // left part
    platforms.push({ x: 0, y, w: gapX, h: platformHeight });
    // right part
    platforms.push({ x: gapX + gapSize, y, w: width - (gapX + gapSize), h: platformHeight });
  }

  // initial platforms
  for (let y = height; y > -height; y -= platformGap) {
    createPlatform(y);
  }

  function updatePlatforms() {
    for (const p of platforms) {
      p.y += speed;
    }
    // remove off‑screen platforms
    while (platforms.length && platforms[0].y > height) {
      platforms.shift();
    }
    // add new platforms at top if needed
    const lastY = platforms.length ? platforms[platforms.length - 1].y : 0;
    if (lastY > -platformGap) {
      createPlatform(lastY - platformGap);
    }
  }

  function checkCollision() {
    // simple AABB check against platform pieces
    for (const p of platforms) {
if (
          player.y + player.radius > p.y &&
          player.y - player.radius < p.y + p.h &&
          player.x + player.radius > p.x &&
          player.x - player.radius < p.x + p.w
        ) {
          // landed on platform – bounce
          player.vy = player.bounceStrength;
          player.y = p.y - player.radius; // reposition just above
          // play bounce sound
          playTone(440, 0.08);
          break;
        }
    }
    // game over if falls below bottom
    if (player.y - player.radius > height) {
      // game over sound
      playTone(220, 0.5);
      alert('Game Over');
      // reset
      player.x = width / 2;
      player.y = height - 30;
      player.vy = -5;
    }
  }

  // generate star field
const starCount = 80;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5
  });
}
function drawStars() {
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
    // platform gradient
    const platGrad = ctx.createLinearGradient(0, 0, width, 0);
    platGrad.addColorStop(0, '#224');
    platGrad.addColorStop(1, '#448');
    ctx.fillStyle = platGrad;
    for (const p of platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    // reset fillStyle
    ctx.fillStyle = '#fff';
  }

// Update and draw moving star field for depth
function updateStars() {
  for (const s of stars) {
    s.y += speed * 0.3; // slower than platforms
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
  }
}

function loop() {
      // draw background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#001133");
      bgGrad.addColorStop(1, "#004466");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // stars
      updateStars();
      drawStars();

      updatePlatforms();
      player.update();
      checkCollision();
      drawPlatforms();
      player.draw();
      requestAnimationFrame(loop);
    }

  // start game
  loop();
})();
