// Light Runner – minimal endless runner on a canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
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
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  // Set canvas size to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Player (glowing dot)
  const player = {
    x: 60,
    y: 0,
    radius: 8,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    color: '#0ff',
    onGround: false,
  };

  // Obstacles – vertical walls from the bottom up
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  let speed = 2; // world scroll speed (pixels per frame)
  let frame = 0;
  let gameOver = false;

  const addObstacle = () => {
    const height = 30 + Math.random() * (canvas.height / 2);
    obstacles.push({ x: canvas.width, y: canvas.height - height, w: 20, h: height });
  };

  const handleInput = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      // Play jump sound
      playTone(300, 0.1);
    }
  };

  window.addEventListener('keydown', e => {
    // Resume audio context on first user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'Space' || e.code === 'ArrowUp') handleInput();
  });
  window.addEventListener('touchstart', e => {
    e.preventDefault();
    handleInput();
  }, { passive: false });

  const update = () => {
    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.radius > canvas.height) {
      player.y = canvas.height - player.radius;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles movement & generation
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
      addObstacle();
      obstacleTimer = 0;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // Collision detection (simple AABB vs circle)
      const dx = Math.max(o.x - player.x, 0, player.x - (o.x + o.w));
      const dy = Math.max(o.y - player.y, 0, player.y - (o.y + o.h));
      if (dx * dx + dy * dy < player.radius * player.radius) {
        // Play collision sound
        playTone(100, 0.2);
        gameOver = true;
      }
      // Remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Increase speed gradually
    if (frame % 600 === 0) speed += 0.3; // every 10 seconds at 60fps
    frame++;
  };

const draw = () => {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player with glow
  ctx.save();
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Obstacles with gradient
  const obsGrad = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
  obsGrad.addColorStop(0, '#555');
  obsGrad.addColorStop(1, '#bbb');
  ctx.fillStyle = obsGrad;
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
};

  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // Start the game
  requestAnimationFrame(loop);
})();
