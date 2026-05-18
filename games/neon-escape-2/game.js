// Minimalist endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Set a fixed size – can be adjusted later.
  canvas.width = 400;
  canvas.height = 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
    }
  }

  const lanes = 3;
  const laneHeight = canvas.height / lanes;
  const player = {
    x: 50,
    lane: 1, // 0‑top,1‑mid,2‑bottom
    radius: 8,
    color: '#0ff',
  };

  let speed = 2; // pixels per frame
  let score = 0;
  let gameOver = false;
  const obstacles = [];
  const orbs = [];

  // Utility for lane Y coordinate (center of lane)
  const laneY = (lane) => lane * laneHeight + laneHeight / 2;

  // Random generator helpers
  const randInt = (max) => Math.floor(Math.random() * max);

  // Spawn obstacles / orbs at intervals
  let spawnCounter = 0;
  const spawnInterval = 90; // frames

  function spawn() {
    const lane = randInt(lanes);
    // 30% chance for orb, else spike
    if (Math.random() < 0.3) {
      orbs.push({ x: canvas.width, lane, radius: 5, collected: false });
    } else {
      obstacles.push({ x: canvas.width, lane, width: 12, height: laneHeight * 0.8 });
    }
  }

  // Input handling – arrow keys and click/tap
  function changeLane(delta) {
    const newLane = player.lane + delta;
    if (newLane >= 0 && newLane < lanes) {
      player.lane = newLane;
      // Play a tone for lane change: up lower pitch, down higher pitch
      const freq = delta < 0 ? 400 : 600;
      playTone(freq, 0.07);
    }
  }

  window.addEventListener('keydown', (e) => {
    resumeAudio();
    if (e.key === 'ArrowUp') changeLane(-1);
    else if (e.key === 'ArrowDown') changeLane(1);
  });
  canvas.addEventListener('pointerdown', () => {
    resumeAudio();
    // Simple toggle: move up if not top, else down
    if (player.lane > 0) changeLane(-1);
    else changeLane(1);
  });

  function update() {
    if (gameOver) return;
    // Move obstacles/orbs leftward
    obstacles.forEach((o) => (o.x -= speed));
    orbs.forEach((o) => (o.x -= speed));

    // Remove off‑screen items
    while (obstacles.length && obstacles[0].x + obstacles[0].width < 0) obstacles.shift();
    while (orbs.length && orbs[0].x + orbs[0].radius < 0) orbs.shift();

    // Collision detection
    const playerY = laneY(player.lane);
    for (const o of obstacles) {
      if (o.lane === player.lane) {
        const left = o.x;
        const right = o.x + o.width;
        const top = laneY(o.lane) - laneHeight / 2;
        const bottom = laneY(o.lane) + laneHeight / 2;
        const px = player.x;
        const py = playerY;
        // Simple AABB vs circle test
        const nearestX = Math.max(left, Math.min(px, right));
        const nearestY = Math.max(top, Math.min(py, bottom));
        const dx = px - nearestX;
        const dy = py - nearestY;
        if (dx * dx + dy * dy < player.radius * player.radius) {
          gameOver = true;
        }
      }
    }

    for (const orb of orbs) {
      if (!orb.collected && orb.lane === player.lane) {
        const dx = player.x - orb.x;
        const dy = playerY - laneY(orb.lane);
        if (dx * dx + dy * dy < (player.radius + orb.radius) ** 2) {
          orb.collected = true;
          speed += 0.15; // slight speed boost
          score += 10;
          // Play collection sound (bright tone)
          playTone(800, 0.1);
        }
      }
    }

    // Increment score based on distance travelled
    score += speed * 0.05;

    // Spawn logic
    spawnCounter++;
    if (spawnCounter >= spawnInterval) {
      spawnCounter = 0;
      spawn();
    }
  }

  function draw() {
    // Background gradient (dark neon vibe)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Neon lane lines
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * laneHeight);
      ctx.lineTo(canvas.width, i * laneHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw obstacles as neon spikes (triangles)
    ctx.fillStyle = '#f00';
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 8;
    obstacles.forEach((o) => {
      const yTop = laneY(o.lane) - laneHeight / 2;
      const yMid = laneY(o.lane);
      const yBot = laneY(o.lane) + laneHeight / 2;
      ctx.beginPath();
      ctx.moveTo(o.x, yTop);
      ctx.lineTo(o.x + o.width / 2, yMid);
      ctx.lineTo(o.x, yBot);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset shadow for other elements

    // Draw player with glow
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, laneY(player.lane), player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw orbs with pulse glow
    orbs.forEach((o) => {
      if (!o.collected) {
        ctx.save();
        const pulse = Math.sin(Date.now() / 200) * 2 + 3; // radius oscillation
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(o.x, laneY(o.lane), o.radius + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
