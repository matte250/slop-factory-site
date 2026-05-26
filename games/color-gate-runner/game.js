// Simple endless runner game based on IDEA.md
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Avatar
  const avatar = {
    x: 80,
    y: height / 2,
    radius: 20,
    color: 'red',
    vy: 0,
    gravity: 0.4,
    jumpStrength: -8
  };

  // Gates (vertical rectangles with a gap of matching color)
  const gates = [];
  const gateWidth = 30;
  const gateSpeed = 2;
  const gateInterval = 1500; // ms
  let lastGateTime = 0;

  // Score
  let score = 0;

  // Input handling
  const colors = ['red', 'green', 'blue'];
  const keyMap = { KeyR: 'red', KeyG: 'green', KeyB: 'blue' };
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJump() { playTone(440, 0.1); }
  function playPass() { playTone(300, 0.05); }
  function playGameOver() { playTone(150, 0.5); }
  document.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (keyMap[e.code]) {
      avatar.color = keyMap[e.code];
    }
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      avatar.vy = avatar.jumpStrength;
      playJump();
    }
  });

  function createGate() {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const gapHeight = avatar.radius * 2 + 20;
    const gapY = Math.random() * (height - gapHeight) + avatar.radius;
    gates.push({ x: width, color, gapY, gapHeight });
  }

  function update(dt) {
    // Avatar physics
    avatar.vy += avatar.gravity;
    avatar.y += avatar.vy;
    // Prevent falling below floor
    if (avatar.y + avatar.radius > height) {
      avatar.y = height - avatar.radius;
      avatar.vy = 0;
    }
    // Prevent going above ceiling
    if (avatar.y - avatar.radius < 0) {
      avatar.y = avatar.radius;
      avatar.vy = 0;
    }

    // Gates movement
    for (let i = gates.length - 1; i >= 0; i--) {
      const g = gates[i];
      g.x -= gateSpeed;
      // Collision detection
      if (g.x < avatar.x + avatar.radius && g.x + gateWidth > avatar.x - avatar.radius) {
        const withinGap = avatar.y > g.gapY && avatar.y < g.gapY + g.gapHeight;
        if (!withinGap || avatar.color !== g.color) {
          // Lose condition
          playGameOver();
          alert('Game Over! Score: ' + score);
          window.location.reload();
          return;
        }
      }
      // Remove off-screen gates and increment score
      if (g.x + gateWidth < 0) {
        gates.splice(i, 1);
        score++;
        playPass();
      }
    }

    // Gate creation timing
    if (Date.now() - lastGateTime > gateInterval) {
      createGate();
      lastGateTime = Date.now();
    }
  }

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#87CEFA'); // light sky
  bgGrad.addColorStop(1, '#1E90FF'); // deep sky
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw avatar with gradient and outline
  const avatarGrad = ctx.createRadialGradient(
    avatar.x, avatar.y, avatar.radius * 0.2,
    avatar.x, avatar.y, avatar.radius
  );
  avatarGrad.addColorStop(0, 'white');
  avatarGrad.addColorStop(1, avatar.color);
  ctx.beginPath();
  ctx.arc(avatar.x, avatar.y, avatar.radius, 0, Math.PI * 2);
  ctx.fillStyle = avatarGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
  ctx.closePath();

  // Draw gates with colored borders and inner gradient
  gates.forEach(g => {
    const gateGrad = ctx.createLinearGradient(g.x, 0, g.x + gateWidth, 0);
    gateGrad.addColorStop(0, 'white');
    gateGrad.addColorStop(1, g.color);
    ctx.fillStyle = gateGrad;
    // Upper part
    ctx.fillRect(g.x, 0, gateWidth, g.gapY);
    // Lower part
    ctx.fillRect(g.x, g.gapY + g.gapHeight, gateWidth, height - (g.gapY + g.gapHeight));
    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(g.x, 0, gateWidth, g.gapY);
    ctx.strokeRect(g.x, g.gapY + g.gapHeight, gateWidth, height - (g.gapY + g.gapHeight));
  });

  // Draw score with shadow
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.font = '20px sans-serif';
  ctx.shadowColor = 'rgba(255,255,255,0.7)';
  ctx.shadowBlur = 4;
  ctx.fillText('Score: ' + score, 10, 30);
  ctx.restore();
}

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
