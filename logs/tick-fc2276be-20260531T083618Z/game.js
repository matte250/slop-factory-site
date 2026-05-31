// Simple Orbital Defense game
// Canvas element with id="game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playFreq(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let gameOverSoundPlayed = false;
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill its container (optional: could be fixed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const center = { x: canvas.width / 2, y: canvas.height / 2 };

  // generate background stars
  (function initStars() {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
      });
    }
  })();
  const planetRadius = 30;
  const shieldRadius = planetRadius + 20;
  const shieldWidthDeg = 40; // angular width of shield in degrees
  let shieldAngle = 0; // in radians, 0 points to the right

  let health = 5;
  let gameOver = false;

  const asteroids = [];
  const stars = [];
  const particles = [];
  const asteroidSpeed = 2;
  const spawnInterval = 1500; // ms

  // Controls – rotate shield with left/right arrows
  const rotateStep = Math.PI / 30; // 6 degrees per press
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  // resume audio context on first user interaction
  window.addEventListener('click', () => { audioCtx.resume(); }, { once: true });

  function spawnAsteroid() {
    // random edge position
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    if (side === 0) { // top
      x = Math.random() * canvas.width;
      y = -10;
    } else if (side === 1) { // right
      x = canvas.width + 10;
      y = Math.random() * canvas.height;
    } else if (side === 2) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 10;
    } else { // left
      x = -10;
      y = Math.random() * canvas.height;
    }
    // direction vector toward planet center
    const dx = center.x - x;
    const dy = center.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * asteroidSpeed;
    vy = (dy / len) * asteroidSpeed;
    asteroids.push({ x, y, vx, vy, radius: 8 });
  }

  function update() {
    if (gameOver) return;
    // shield rotation controls
    if (keys['ArrowLeft']) shieldAngle -= rotateStep;
    if (keys['ArrowRight']) shieldAngle += rotateStep;
    // normalize angle
    shieldAngle = (shieldAngle + Math.PI * 2) % (Math.PI * 2);

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;

      // distance to planet center
      const dx = a.x - center.x;
      const dy = a.y - center.y;
      const dist = Math.hypot(dx, dy);

      // angle of asteroid relative to planet
      const angle = Math.atan2(dy, dx);
      const diff = Math.abs(((angle - shieldAngle + Math.PI) % (2 * Math.PI)) - Math.PI);

      const shieldHalf = (shieldWidthDeg * Math.PI / 180) / 2;

if (dist <= shieldRadius && diff <= shieldHalf) {
          // blocked by shield – remove asteroid and play sound
          asteroids.splice(i, 1);
          playFreq(400, 0.08);
          continue;
        }

if (dist <= planetRadius) {
          // hit planet – create explosion particles and sound
          health--;
          // play hit sound
          playFreq(200, 0.15);
          // generate particles
          for (let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            particles.push({
              x: a.x,
              y: a.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * 2 + 1,
              alpha: 1
            });
          }
          asteroids.splice(i, 1);
          if (health <= 0) {
            gameOver = true;
            if (!gameOverSoundPlayed) {
              playFreq(100, 0.6);
              gameOverSoundPlayed = true;
            }
          }
        }
      }
    }
  }

  function draw() {
    // background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    // planet with gradient
    const planetGrad = ctx.createRadialGradient(
      center.x,
      center.y,
      planetRadius * 0.2,
      center.x,
      center.y,
      planetRadius
    );
    planetGrad.addColorStop(0, '#4caf50');
    planetGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // shield with glow
    ctx.save();
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 12;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffeb3b';
    const start = shieldAngle - (shieldWidthDeg * Math.PI / 180) / 2;
    const end = shieldAngle + (shieldWidthDeg * Math.PI / 180) / 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, shieldRadius, start, end);
    ctx.stroke();
    ctx.restore();

    // asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ff8a80');
      grad.addColorStop(1, '#c62828');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles (explosions)
    particles.forEach((p, i) => {
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    });

    // health UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Health: ${health}`, 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  setInterval(spawnAsteroid, spawnInterval);
  requestAnimationFrame(loop);
})();
