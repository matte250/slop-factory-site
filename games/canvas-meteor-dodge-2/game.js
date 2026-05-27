// Simple Meteor Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Make canvas full‑screen
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Starfield background
  const stars = [];
  function initStars() {
    const count = Math.floor(canvas.width * canvas.height / 8000);
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }
  initStars();
  // Update stars on resize
  window.addEventListener('resize', initStars);

  function drawStars() {
    // Dark space background
    ctx.fillStyle = '#02010a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Small twinkling stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // Move star downward for a subtle parallax effect
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
    });
  }

  // Player ship
  const ship = {
    width: 30,
    height: 30,
    x: canvas.width / 2,
    y: canvas.height - 40,
    speed: 6,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  // Audio context for sound effects (resume on first interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('touchstart', resumeAudio, { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Convenience sound helpers
  function playThrust() { playTone(300, 0.08); }
  function playScore() { playTone(600, 0.05); }
  function playExplosion() {
    // Quick descending frequency blast
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.2);
  }

  // Play thrust sound on key press
  function handleKeyDown(e) {
    if (e.key in keys) {
      keys[e.key] = true;
      playThrust();
    }
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Touch drag support
  let touchX = null;
  canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; });
  canvas.addEventListener('touchmove', e => { touchX = e.touches[0].clientX; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', () => { touchX = null; });

  // Meteors
  const meteors = [];
  let meteorSpawnTimer = 0;
  let meteorSpawnInterval = 90; // frames
  let meteorSpeed = 2;

  // Scoring
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const radius = Math.random() * 20 + 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    meteors.push({ x, y: -radius, radius, speed: meteorSpeed + Math.random() });
  }

  function update() {
    if (gameOver) return;

    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (touchX !== null) {
      const dx = touchX - ship.x;
      ship.x += Math.sign(dx) * Math.min(Math.abs(dx), ship.speed);
    }
    // Clamp ship within canvas
    ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));

    // Spawn meteors
    meteorSpawnTimer++;
    if (meteorSpawnTimer >= meteorSpawnInterval) {
      spawnMeteor();
      meteorSpawnTimer = 0;
      // Gradually increase difficulty
      if (meteorSpawnInterval > 30) meteorSpawnInterval -= 1;
      meteorSpeed += 0.02;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off‑screen meteors and increment score
if (m.y - m.radius > canvas.height) {
            meteors.splice(i, 1);
            score++;
            playScore();
            continue;
          }
      // Collision detection (simple circle‑triangle approximation)
      const dx = Math.abs(m.x - ship.x);
      const dy = Math.abs(m.y - ship.y);
      const shipHalf = ship.width / 2;
      if (dx < shipHalf + m.radius && dy < ship.height / 2 + m.radius) {
        gameOver = true;
        playExplosion();
        break;
      }
    }
  }

  function drawShip() {
    // Ship with gradient fill for a sleek look
    const grad = ctx.createLinearGradient(ship.x, ship.y - ship.height / 2, ship.x, ship.y + ship.height / 2);
    grad.addColorStop(0, '#4caf50');
    grad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.height / 2);
    ctx.lineTo(ship.x - ship.width / 2, ship.y + ship.height / 2);
    ctx.lineTo(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.closePath();
    ctx.fill();
    // Simple thruster flame when moving left/right
    if (keys.ArrowLeft || keys.ArrowRight) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(ship.x, ship.y + ship.height / 2, ship.width / 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMeteors() {
    // Meteors with radial gradient for depth
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      grad.addColorStop(0, '#ff8a80');
      grad.addColorStop(1, '#b71c1c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 30);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
  }

  function loop() {
    // Clear frame (optional since drawStars draws background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Render background stars first
    drawStars();
    if (!gameOver) {
      update();
      drawMeteors();
      drawShip();
      drawScore();
    } else {
      drawGameOver();
    }
    requestAnimationFrame(loop);
  }

  // Start the game loop after page load
  window.addEventListener('load', () => {
    requestAnimationFrame(loop);
  });
})();
