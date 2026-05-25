// Simple endless runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playJumpSound() { playTone(440); }
  function playCrashSound() { playTone(150); }

  // Player
  const player = {
    x: 50,
    y: height - 30,
    w: 20,
    h: 20,
    vy: 0,
    gravity: 0.8,
    jumpStrength: -12,
    onGround: true,
    draw() { ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, this.w, this.h); }
  };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 90; // frames
  let frames = 0;

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: width, y: height - size, w: size, h: size, speed: 4 });
  }

  function update() {
    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= height) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Obstacles
    if (frames % obstacleFreq === 0) spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // Reset game on collision
        playCrashSound();
        obstacles.length = 0;
        player.x = 50; player.y = height - 30; player.vy = 0; frames = 0;
        break;
      }
    }
    frames++;
  }

  function render() {
    // sky gradient background
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#87CEEB'); // light sky
    sky.addColorStop(1, '#1E90FF'); // deep sky
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 10, width, 10);
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(frames / 10), 10, 20);
    // player (draw with a small gradient)
    const pGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    pGrad.addColorStop(0, '#00ff00');
    pGrad.addColorStop(1, '#006400');
    ctx.fillStyle = pGrad;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // obstacles with gradient shading
    for (const o of obstacles) {
      const oGrad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      oGrad.addColorStop(0, '#ff5555');
      oGrad.addColorStop(1, '#8b0000');
      ctx.fillStyle = oGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Input
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ') && player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  });

  loop();
})();
