// Simple Meteor Dodge game
// Canvas with id "game" must exist in the HTML.

(() => {
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas, abort
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
  };

  // Input state
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Meteors
  const meteors = [];
  const meteorSpawnInterval = 1000; // ms
  const meteorMinSpeed = 2;
  const meteorMaxSpeed = 5;
  const meteorRadius = 15;

  function spawnMeteor() {
    const x = Math.random() * (width - meteorRadius * 2) + meteorRadius;
    const speed = Math.random() * (meteorMaxSpeed - meteorMinSpeed) + meteorMinSpeed;
    meteors.push({ x, y: -meteorRadius, radius: meteorRadius, speed });
    // Play a low tone when a meteor appears
    playTone(200, 0.05);
  }
  const spawnTimer = setInterval(spawnMeteor, meteorSpawnInterval);

  let score = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(width - ship.width, ship.x + ship.speed);

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Check collision with ship (simple AABB check)
      if (
        m.y + m.radius >= ship.y &&
        m.x + m.radius > ship.x &&
        m.x - m.radius < ship.x + ship.width
      ) {
        gameOver = true;
        // Play collision sound
        playTone(800, 0.2);
        clearInterval(spawnTimer);
        break;
      }
      // Remove off‑screen meteors and increase score
      if (m.y - m.radius > height) {
        meteors.splice(i, 1);
        score++;
        // Play score increment sound
        playTone(400, 0.07);
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001030');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ship – draw as a triangle
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Meteors – radial gradient circles
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.radius * 0.2, m.x, m.y, m.radius);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score – larger, neon style
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 5;
    ctx.fillText(`Score: ${score}`, 10, 24);
    ctx.shadowBlur = 0;

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff4444';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.textAlign = 'start';
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start loop
  requestAnimationFrame(loop);
})();
