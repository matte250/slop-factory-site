// Simple Canvas Meteor Dodge game
// The HTML contains <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 440, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Create starfield background
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
  };

  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
  });

  let meteors = [];
  let spawnTimer = 0;
  const spawnInterval = 1000; // ms
  let lastTime = 0;
  let score = 0;
  let hits = 0;
  const maxHits = 3;

  // Ensure audio can play after user interaction
function ensureAudio(){
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
window.addEventListener('keydown', ensureAudio);
window.addEventListener('mousedown', ensureAudio);

function spawnMeteor() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 1 + score * 0.02; // accelerate with score
    meteors.push({ x, y: -radius, r: radius, speed });
  }

  function update(dt) {
    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Meteors
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnMeteor();
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // collision detection (simple rect-circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const dx = Math.max(shipRect.x - m.x, 0, m.x - (shipRect.x + shipRect.w));
      const dy = Math.max(shipRect.y - m.y, 0, m.y - (shipRect.y + shipRect.h));
      if (dx * dx + dy * dy < m.r * m.r) {
        hits++;
        playBeep(150, 0.2); // hit sound
        meteors.splice(i, 1);
        continue;
      }
      // Remove off-screen
      if (m.y - m.r > canvas.height) {
        meteors.splice(i, 1);
        score++;
      }
    }
  }

  function draw() {
    // Clear with dark space background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(st => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (already drawn as triangle)
    // Meteors with radial gradient for a glowing effect
    meteors.forEach((m) => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(255,100,100,0.9)');
      grad.addColorStop(1, 'rgba(150,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Hits: ${hits}/${maxHits}`, 10, 40);
    if (hits >= maxHits) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (hits < maxHits) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
