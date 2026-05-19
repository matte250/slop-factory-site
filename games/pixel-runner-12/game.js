// Minimal endless runner with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const groundHeight = 40; // ground thickness
    // Setup simple audio using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    };
    const playJumpSound = () => playTone(300, 0.1);
    const playHitSound = () => playTone(100, 0.3);
  setSize();
  window.addEventListener('resize', setSize);

  // Game state
  let running = true;
  let score = 0;
  const player = { x: 80, y: 0, w: 20, h: 20, vy: 0, onGround: false };
  const gravity = 0.6;
  const jumpStrength = -12;
  const obstacles = [];
  const obstacleFreq = 90; // frames
  let frame = 0;

    const reset = () => {
      player.y = canvas.height - groundHeight - player.h;
      player.vy = 0;
      player.onGround = true;
      obstacles.length = 0;
      score = 0;
      frame = 0;
      running = true;
      requestAnimationFrame(loop);
    };

  const handleInput = (e) => {
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!running) return reset();
    if (player.onGround) {
      player.vy = jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleInput(e); });
  window.addEventListener('mousedown', handleInput);

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30;
    const y = canvas.height - size;
    obstacles.push({ x: canvas.width, y, w: size, h: size, speed: 6 });
  };

  const rectCollision = (a, b) => (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );

  const loop = () => {
    if (!running) return;
    // Draw sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#00172d');
    skyGrad.addColorStop(1, '#004b8d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw ground (groundHeight defined globally)
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    // No extra clearing needed; background already drawn


    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= canvas.height - groundHeight) {
    player.y = canvas.height - groundHeight - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player with gradient
    const pGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      2,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    pGrad.addColorStop(0, '#0ff');
    pGrad.addColorStop(1, '#005f5f');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles
    if (frame % obstacleFreq === 0) spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
        // Draw obstacle as a glowing spike
        const oGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        oGrad.addColorStop(0, '#ff6b6b');
        oGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      // Collision
      if (rectCollision(player, o)) {
        running = false;
      }
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Score
    score++;
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 30);

    frame++;
    if (running) {
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + Math.floor(score / 60), canvas.width / 2, canvas.height / 2 + 30);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click or press Space to restart', canvas.width / 2, canvas.height / 2 + 70);
    }
  };

  // Initialize player position and start loop
  player.y = canvas.height - player.h;
  requestAnimationFrame(loop);
})();
