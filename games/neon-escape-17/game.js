// Simple Neon Escape game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = 800);
  const h = (canvas.height = 600);

  // Drone
  const drone = { x: w / 2, y: h - 80, size: 20, speed: 4, energy: 100 };

  // Input handling and audio init
  const keys = {};
  let audioCtx;
  function initAudio(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playTone(freq, dur){
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    initAudio();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Game objects
  const barriers = [];
  const orbs = [];
  let frame = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;

  function spawnBarrier() {
    const width = 80 + Math.random() * 120;
    const x = Math.random() * (w - width);
    barriers.push({ x, y: -30, w: width, h: 20, speed: 2 + Math.random() * 2 });
  }

  function spawnOrb() {
    const radius = 8;
    const x = radius + Math.random() * (w - radius * 2);
    const y = -radius;
    orbs.push({ x, y, r: radius, speed: 2 + Math.random() * 1.5 });
  }

  function update() {
    if (gameOver) return;
    // Drone movement
    if (keys.ArrowLeft) drone.x -= drone.speed;
    if (keys.ArrowRight) drone.x += drone.speed;
    if (keys.ArrowUp) drone.y -= drone.speed;
    if (keys.ArrowDown) drone.y += drone.speed;
    drone.x = Math.max(0, Math.min(w, drone.x));
    drone.y = Math.max(0, Math.min(h, drone.y));
    // Energy drain
    drone.energy -= 0.05;

    // Spawn objects
    if (frame % 120 === 0) spawnBarrier();
    if (frame % 90 === 0) spawnOrb();

    // Update barriers
    for (let i = barriers.length - 1; i >= 0; i--) {
      const b = barriers[i];
      b.y += b.speed;
      if (b.y > h) barriers.splice(i, 1);
      // Collision with drone
        if (
          drone.x > b.x - drone.size &&
          drone.x < b.x + b.w + drone.size &&
          drone.y > b.y - drone.size &&
          drone.y < b.y + b.h + drone.size
        ) {
          gameOver = true;
          playTone(150, 0.3); // collision sound
        }
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speed;
      if (o.y - o.r > h) orbs.splice(i, 1);
      // Collect
      const dx = drone.x - o.x;
      const dy = drone.y - o.y;
      if (Math.hypot(dx, dy) < drone.size + o.r) {
        drone.energy = Math.min(100, drone.energy + 15);
        orbs.splice(i, 1);
        playTone(600, 0.15); // orb collection sound
      }
    }

    if (drone.energy <= 0) gameOver = true;
    // Play game over sound once
    if (gameOver && !gameOverSoundPlayed) {
      playTone(80, 0.5);
      gameOverSoundPlayed = true;
    }
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // Neon background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1a001a');
    bgGrad.addColorStop(1, '#0a0010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Enable additive blending for neon glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;

    // Draw drone (cyan neon with glow and outline)
    // Create radial gradient for a soft core
    const droneGrad = ctx.createRadialGradient(drone.x, drone.y, drone.size * 0.2, drone.x, drone.y, drone.size);
    droneGrad.addColorStop(0, '#aff');
    droneGrad.addColorStop(1, '#0ff');
    ctx.fillStyle = droneGrad;
    ctx.beginPath();
    ctx.arc(drone.x, drone.y, drone.size, 0, Math.PI * 2);
    ctx.fill();
    // Neon outline
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0; // reset for subsequent shapes

    // Draw barriers (magenta neon with rounded corners)
    ctx.fillStyle = '#f0f';
    barriers.forEach(b => {
      ctx.beginPath();
      const radius = 4;
      ctx.moveTo(b.x + radius, b.y);
      ctx.lineTo(b.x + b.w - radius, b.y);
      ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + radius);
      ctx.lineTo(b.x + b.w, b.y + b.h - radius);
      ctx.quadraticCurveTo(b.x + b.w, b.y + b.h, b.x + b.w - radius, b.y + b.h);
      ctx.lineTo(b.x + radius, b.y + b.h);
      ctx.quadraticCurveTo(b.x, b.y + b.h, b.x, b.y + b.h - radius);
      ctx.lineTo(b.x, b.y + radius);
      ctx.quadraticCurveTo(b.x, b.y, b.x + radius, b.y);
      ctx.closePath();
      ctx.fill();
    });

    // Draw orbs (yellow neon with glow)
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset after orbs
    // Reset composite mode for UI elements
    ctx.globalCompositeOperation = 'source-over';

    // Energy bar
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, drone.energy * 2, 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 200, 10);

    if (gameOver) {
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
