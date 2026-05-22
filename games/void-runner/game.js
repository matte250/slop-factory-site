// Minimal Void Runner implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback defaults)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = {
    x: canvas.width / 2,
    y: canvas.height * 0.8,
    angle: -Math.PI / 2,
    radius: 12,
    speed: 0,
    thrust: 0.2,
    friction: 0.98,
    turnSpeed: 0.07,
  };

  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const obstacles = [];
  const obstacleSpawnRate = 90; // frames between spawns
  let frameCount = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (canvas.width - size) + size / 2;
    const y = -size;
    const speed = 1 + Math.random() * 2;
    obstacles.push({ x, y, size, speed });
  }

  function update() {
    if (gameOver) return;
    // Controls
    if (keys.ArrowLeft) player.angle -= player.turnSpeed;
    if (keys.ArrowRight) player.angle += player.turnSpeed;
    if (keys.ArrowUp) {
      player.speed += player.thrust;
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // Apply friction
    player.speed *= player.friction;
    // Move player
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
    // Wrap horizontally
    if (player.x < 0) player.x += canvas.width;
    if (player.x > canvas.width) player.x -= canvas.width;
    // Constrain vertically
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height) player.y = canvas.height;

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.size > canvas.height) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (frameCount % obstacleSpawnRate === 0) spawnObstacle();
    frameCount++;

    // Collision detection (circle approximation)
    for (const o of obstacles) {
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.radius + o.size / 2) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star field (simple twinkling points)
    if (!window.stars) {
      window.stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random()
      }));
    }
    ctx.fillStyle = 'white';
    for (const s of window.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw player (glowing ship)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    // Ship body gradient
    const shipGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, player.radius);
    shipGrad.addColorStop(0, gameOver ? '#ff4444' : '#88f');
    shipGrad.addColorStop(1, gameOver ? '#ff0000' : '#0044ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.radius, 0);
    ctx.lineTo(-player.radius, player.radius / 2);
    ctx.lineTo(-player.radius, -player.radius / 2);
    ctx.closePath();
    ctx.fill();
    // Outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw obstacles (glowing circles)
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.size / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
