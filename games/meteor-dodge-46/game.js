// Simple Meteor Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5, shield: 3 };
  const meteors = [];
  let lastMeteor = 0;
  let meteorInterval = 2000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;
  let gameOverPlayed = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    meteors.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 1 + Math.random() * 2 });
    // sound for new meteor
    playTone(120, 0.07);
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed * dt * 0.06; // adjust speed factor
      // collision
      if (m.x < ship.x + ship.w && m.x + m.w > ship.x && m.y < ship.y + ship.h && m.y + m.h > ship.y) {
        // collision sound
        playTone(300, 0.15);
        ship.shield -= 1;
        meteors.splice(i, 1);
        if (ship.shield <= 0) { gameOver = true; }
        continue;
      }
      // remove off-screen
      if (m.y > height) {
        meteors.splice(i, 1);
        score += 1;
      }
    }

    // Spawn new meteors
    if (!gameOver && performance.now() - lastMeteor > meteorInterval) {
      spawnMeteor();
      lastMeteor = performance.now();
      // increase difficulty
      if (meteorInterval > 500) meteorInterval -= 50;
    }

    // Update score based on time
    if (!gameOver) score = Math.floor((performance.now() - lastTime) / 1000);
  }

  function draw() {
    // Background – dark space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ship – draw as a triangle with glow
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.fillStyle = '#0FF';
    ctx.shadowColor = '#0FF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // HUD – shield and score
    ctx.fillStyle = '#FF0';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shield: ' + ship.shield, 10, 20);
    ctx.fillStyle = '#FFF';
    ctx.fillText('Score: ' + score, width - 80, 20);

    // Meteors – radial gradient for glowing effect
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameOver) {
      // play game over sound once
      if (!gameOverPlayed) { playTone(100, 0.5); gameOverPlayed = true; }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFF';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 30);
    }
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
