// Simple top-down game: avoid drifting debris
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // generate star field for background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5
  }));

  const ship = { x: width / 2, y: height - 30, w: 30, h: 15, speed: 4 };
  let health = 3;
  let score = 0;
  const debris = [];
  const keys = { left: false, right: false };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollision = () => playTone(150, 0.2);
  const playSpawn = () => playTone(300, 0.1);

  const spawnDebris = () => {
    // sound for spawning debris
    if (typeof playSpawn === 'function') playSpawn();
    const w = 20 + Math.random() * 20;
    debris.push({ x: Math.random() * (width - w), y: -20, w, h: 20, speed: 2 + Math.random() * 3 });
  };

  const update = () => {
    // move stars (downward scroll)
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });
    // move ship
    if (keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.right) ship.x = Math.min(width - ship.w, ship.x + ship.speed);
    // move debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed;
      // collision
if (
          d.x < ship.x + ship.w &&
          d.x + d.w > ship.x &&
          d.y < ship.y + ship.h &&
          d.y + d.h > ship.y
        ) {
          // play collision sound
          if (typeof playCollision === 'function') playCollision();
        health--;
        debris.splice(i, 1);
        if (health <= 0) return false; // game over
        continue;
      }
      // remove off‑screen
      if (d.y > height) debris.splice(i, 1);
    }
    // occasional spawn
    if (Math.random() < 0.02) spawnDebris();
    score++;
    return true;
  };

  const draw = () => {
    // draw star field background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.clearRect(0, 0, width, height);
    // ship (draw as triangle with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.shadowColor = 'rgba(0,255,255,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // debris (draw as glowing circles)
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(d.x + d.w/2, d.y + d.h/2, 0, d.x + d.w/2, d.y + d.h/2, d.w);
      grad.addColorStop(0, 'rgba(255,165,0,0.9)');
      grad.addColorStop(1, 'rgba(255,69,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x + d.w/2, d.y + d.h/2, d.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Health: ${health}`, 5, 15);
    ctx.fillText(`Score: ${score}`, 5, 30);
  };

  const loop = () => {
    if (update()) {
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  };

  // input
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // start
  requestAnimationFrame(loop);
})();
