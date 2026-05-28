// Minimal Cosmic Dodge game
window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const ship = {x: 50, y: height/2 - 15, w: 30, h: 30, dy: 0, speed: 4};
  const asteroids = [];
  const stars = [];
  // generate stars
  for (let i = 0; i < 100; i++) {
    stars.push({x: Math.random() * width, y: Math.random() * height, r: Math.random() * 2 + 0.5});
  }
  let lastAsteroid = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const speed = Math.random() * 2 + 1;
    asteroids.push({x: width, y: Math.random() * (height - size), w: size, h: size, speed});
  }

  function update(dt) {
    // ship movement
    ship.y += ship.dy;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // asteroids movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      // collision
      if (!gameOver && a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        playBeep(200, 0.3); // collision sound
        gameOver = true;
      }
    }
    // spawn new asteroids
    if (performance.now() - lastAsteroid > 800) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
  }

  function draw() {
    // background: black with stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // ship – draw as a green triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids – draw as gray circles with simple shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // score / game over
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const survived = ((performance.now() - startTime)/1000).toFixed(1);
    ctx.fillText(`Time: ${survived}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastTime || timestamp);
      update(dt);
    }
    draw();
    lastTime = timestamp;
    requestAnimationFrame(loop);
  }
  let lastTime = 0;

  // controls
  window.addEventListener('keydown', e => {
    // Ensure audio context is running on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp' || e.key === 'w') {
      ship.dy = -ship.speed;
      playBeep(600, 0.1); // upward thrust
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      ship.dy = ship.speed;
      playBeep(400, 0.1); // downward thrust
    }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowUp','ArrowDown','w','s'].includes(e.key)) ship.dy = 0;
  });

  requestAnimationFrame(loop);
});
