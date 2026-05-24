// Canvas Catapult game
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  const W = (canvas.width = 800);
  const H = (canvas.height = 600);

  const catapult = { x: 100, y: H - 50 };
  let stone = null;
  const particles = []; // explosion particles
  const targets = [];
  let score = 0;
  let health = 3;
  let dragging = false;
  let aim = { x: 0, y: 0 };

  const maxPower = 15;
  const gravity = 0.3;

  function spawnTarget() {
    const size = 30;
    const y = Math.random() * (H - size);
    targets.push({ x: W + size, y, size, speed: 2 });
  }

  function update() {
    // stone motion
    if (stone && stone.active) {
      stone.vy += gravity;
      stone.x += stone.vx;
      stone.y += stone.vy;
      // out of bounds
      if (stone.x > W || stone.y > H) stone.active = false;
    }
    // targets motion
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      t.x -= t.speed;
      // miss
      if (t.x + t.size < 0) {
        health--;
        // play miss sound
        playTone(100, 200);
        targets.splice(i, 1);
      }
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.05; // slight gravity
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // collisions
    if (stone && stone.active) {
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        const dx = stone.x - t.x;
        const dy = stone.y - t.y;
        const dist = Math.hypot(dx, dy);
        if (dist < stone.radius + t.size / 2) {
          score++;
          stone.active = false;
          // create explosion particles
          const particleCount = 12;
          for (let p = 0; p < particleCount; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            particles.push({
              x: stone.x,
              y: stone.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 30,
              radius: Math.random() * 2 + 1,
              color: `hsl(${Math.random() * 30}, 100%, 50%)`,
            });
          }
          targets.splice(i, 1);
          break;
        }
      }
    }
    // spawn new targets periodically
    if (Math.random() < 0.02) spawnTarget();
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky
    bgGrad.addColorStop(1, '#f0e68c'); // ground hue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // catapult base
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(catapult.x - 20, catapult.y, 40, 20);
    // catapult arm
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(catapult.x, catapult.y);
    const armX = dragging ? aim.x : catapult.x - 50;
    const armY = dragging ? aim.y : catapult.y - 50;
    ctx.lineTo(armX, armY);
    ctx.stroke();
    // aiming line (if dragging)
    if (dragging) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(catapult.x, catapult.y);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
    }
    // stone with shading
    if (stone && stone.active) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      const grad = ctx.createRadialGradient(
        stone.x - stone.radius / 3,
        stone.y - stone.radius / 3,
        stone.radius / 4,
        stone.x,
        stone.y,
        stone.radius
      );
      grad.addColorStop(0, '#ddd');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(stone.x, stone.y, stone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // targets (gradient circles)
    targets.forEach(t => {
      const grad = ctx.createRadialGradient(
        t.x,
        t.y,
        t.size * 0.2,
        t.x,
        t.y,
        t.size / 2
      );
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#ff0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'black';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Health: ${health}`, 10, 60);
    // particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    if (health <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', W / 2 - 100, H / 2);
    }
  }

  function loop() {
    if (health > 0) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  canvas.addEventListener('mousedown', e => {
    if (health <= 0) return;
    // resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    dragging = true;
    aim.x = e.offsetX;
    aim.y = e.offsetY;
  });
  canvas.addEventListener('mousemove', e => {
    if (dragging) {
      aim.x = e.offsetX;
      aim.y = e.offsetY;
    }
  });
  canvas.addEventListener('mouseup', e => {
    if (!dragging) return;
    dragging = false;
    const dx = catapult.x - e.offsetX;
    const dy = catapult.y - e.offsetY;
    const dist = Math.hypot(dx, dy);
    const power = Math.min(dist / 10, maxPower);
    const angle = Math.atan2(dy, dx);
    stone = {
      x: catapult.x,
      y: catapult.y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      radius: 8,
      active: true,
    };
    // play launch sound
    playTone(200, 150);
  });

  loop();
});
