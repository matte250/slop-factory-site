// Simple Meteor Shield game with enhanced graphics
// Canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // size canvas to its displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const shield = { width: 80, height: 10, x: canvas.width / 2 - 40, y: canvas.height - 20 };
  // audio setup
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  };
  const playTone = (freq, dur) => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const meteors = [];
  let health = 5;
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms

  // input handling
  const moveShield = (dx) => {
    shield.x = Math.max(0, Math.min(canvas.width - shield.width, shield.x + dx));
  };
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    shield.x = Math.max(0, Math.min(canvas.width - shield.width, mouseX - shield.width / 2));
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveShield(-10);
    if (e.key === 'ArrowRight') moveShield(10);
  });

  const spawnMeteor = () => {
    const radius = 10 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    meteors.push({ x, y: -radius, radius, speed });
  };

  const update = (dt) => {
    // spawn
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }
    // move meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // collision with shield
      if (
        m.y + m.radius >= shield.y &&
        m.x > shield.x &&
        m.x < shield.x + shield.width
      ) {
        // create explosion effect
        createExplosion(m.x, m.y);
        // play hit sound
        playTone(440, 0.1);
        meteors.splice(i, 1);
        continue;
      }
      // missed
      if (m.y - m.radius > canvas.height) {
        meteors.splice(i, 1);
        health--;
        if (health <= 0) {
          // game over, stop animation
          playTone(150, 0.5);
          alert('Game Over');
          window.location.reload();
        }
      }
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
      // missed
      if (m.y - m.radius > canvas.height) {
        meteors.splice(i, 1);
        health--;
        if (health <= 0) {
          // game over, stop animation
          playTone(150, 0.5);
          alert('Game Over');
          window.location.reload();
        }
      }
    }
  };

  // Star field for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.5
  }));

  // particles for explosion
  const particles = [];
  const createExplosion = (x, y) => {
    for (let i = 0; i < 15; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2 + 1,
        life: 30 + Math.random() * 20
      });
    }
  };

  const draw = () => {
    // background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // shield with rounded corners
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.moveTo(shield.x + 10, shield.y);
    ctx.lineTo(shield.x + shield.width - 10, shield.y);
    ctx.quadraticCurveTo(shield.x + shield.width, shield.y, shield.x + shield.width, shield.y + 10);
    ctx.lineTo(shield.x + shield.width, shield.y + shield.height - 10);
    ctx.quadraticCurveTo(shield.x + shield.width, shield.y + shield.height, shield.x + shield.width - 10, shield.y + shield.height);
    ctx.lineTo(shield.x + 10, shield.y + shield.height);
    ctx.quadraticCurveTo(shield.x, shield.y + shield.height, shield.x, shield.y + shield.height - 10);
    ctx.lineTo(shield.x, shield.y + 10);
    ctx.quadraticCurveTo(shield.x, shield.y, shield.x + 10, shield.y);
    ctx.fill();
    // meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.radius * 0.3, m.x, m.y, m.radius);
      grad.addColorStop(0, '#CCCCCC');
      grad.addColorStop(1, '#666666');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // particles
    particles.forEach((p, i) => {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // health
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + health, 10, 20);
  };

  let lastTime = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
