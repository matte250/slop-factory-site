// Meteor Dodge – enhanced graphics with sound
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('mousedown', resumeAudio);

  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };

  // ----- Game objects -----
  const player = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  const meteors = [];
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  let lastSpawn = 0;
  let spawnInterval = 1000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + score / 20000; // accelerate over time
    meteors.push({ x, y: -radius, r: radius, speed });
    // sound effect for spawn
    playTone(250, 80);
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // stars twinkle (simple vertical drift)
    for (const s of stars) {
      s.y += 0.2;
      if (s.y > height) s.y = 0;
    }

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      if (m.y - m.r > height) meteors.splice(i, 1);
    }

    // collision detection
    for (const m of meteors) {
      const cx = m.x, cy = m.y, r = m.r;
      const rectX = player.x, rectY = player.y, rectW = player.w, rectH = player.h;
      const nearestX = Math.max(rectX, Math.min(cx, rectX + rectW));
      const nearestY = Math.max(rectY, Math.min(cy, rectY + rectH));
      const dx = cx - nearestX, dy = cy - nearestY;
      if (dx * dx + dy * dy < r * r) {
        gameOver = true;
        // collision sound
        playTone(100, 300);
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001022');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // player – draw a simple triangle ship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    // meteors – radial gradient for a glowing effect
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(120,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI – score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff4';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      score += dt;
      if (timestamp - lastSpawn > spawnInterval) {
        spawnMeteor();
        lastSpawn = timestamp;
        spawnInterval = Math.max(200, spawnInterval - 5);
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
