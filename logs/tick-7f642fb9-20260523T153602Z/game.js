// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill window
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Game state
  let running = false;
  let gameOver = false;
  let score = 0;
  const speed = 5; // world scroll speed (px/frame)

  // Player definition
  const player = {
    width: 40,
    height: 40,
    x: canvas.width * 0.2,
    y: canvas.height - 60,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.5,
    lane: 0, // -1 left, 0 center, 1 right
    laneOffset: 60,
  };

  function resetPlayer() {
    player.x = canvas.width * 0.2;
    player.y = canvas.height - 60;
    player.vy = 0;
    player.lane = 0;
  }

  // Obstacles, particles, and road
  const obstacles = [];
  const particles = [];
  const obstacleFreq = 120; // frames between obstacles
  let obstacleTimer = 0;
  let roadOffset = 0; // offset for moving lane marker

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3) - 1; // -1,0,1
    const size = 40;
    const y = canvas.height - 60;
    const x = canvas.width + size;
    const offsetX = lane * player.laneOffset;
    const obs = { x: x + offsetX, y: y - size, width: size, height: size, lane };
    obstacles.push(obs);
    // create spark particles at obstacle location
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: obs.x + size / 2 + (Math.random() - 0.5) * 10,
        y: obs.y - size / 2 + (Math.random() - 0.5) * 10,
        vy: - (1 + Math.random() * 1),
        alpha: 1,
        size: 2 + Math.random() * 2,
        color: '#0ff'
      });
    }
  }

  // Input handling
  function handleJump() {
    if (!running) return;
    if (player.vy === 0) {
      player.vy = player.jumpStrength;
      // play jump sound
      playTone(300, 0.1);
    }
  }
  function handleLaneChange(dir) {
    if (!running) return;
    const newLane = Math.max(-1, Math.min(1, player.lane + dir));
    if (newLane !== player.lane) {
      player.lane = newLane;
      player.x = canvas.width * 0.2 + player.lane * player.laneOffset;
    }
  }

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') handleJump();
    if (e.code === 'ArrowLeft') handleLaneChange(-1);
    if (e.code === 'ArrowRight') handleLaneChange(1);
    if (e.code === 'Enter' && gameOver) start();
  });
  document.addEventListener('click', () => {
    if (!running) return handleJump();
    if (gameOver) start();
  });

  // Collision detection
  function collides(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // Game loop
  function update() {
    if (!running) return;
    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > canvas.height - 60) {
      player.y = canvas.height - 60;
      player.vy = 0;
    }
    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;
      if (obs.x + obs.width < 0) obstacles.splice(i, 1);
      else if (collides(player, obs)) {
        running = false;
        gameOver = true;
        // play collision sound
        playTone(100, 0.3);
      }
    }
    // particles update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.05; // gravity for sparks
      p.y += p.vy;
      p.x += (Math.random() - 0.5) * 0.5; // small drift
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    // road scrolling offset
    roadOffset = (roadOffset + speed) % 80;
    // spawn obstacles
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = obstacleFreq;
    } else {
      obstacleTimer--;
    }
    // score increments by distance travelled
    score += speed * 0.01;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background – moving neon gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // subtle vertical lines for cityscape feel
    ctx.strokeStyle = 'rgba(0,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    // moving road lane markers
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let y = canvas.height - 20; y > canvas.height - 120; y -= 80) {
      ctx.beginPath();
      ctx.moveTo(-roadOffset, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // player – neon hovercraft
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y - player.height, player.width, player.height);
    ctx.restore();
  // obstacles – neon blocks
  ctx.save();
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#f00';
  for (const o of obstacles) {
    ctx.fillRect(o.x, o.y - o.height, o.width, o.height);
  }
  ctx.restore();
  // particles – glowing sparks
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.restore();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press Enter or Click to Restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    resetPlayer();
    obstacles.length = 0;
    obstacleTimer = 0;
    score = 0;
    gameOver = false;
    running = true;
  }

  // start automatically
  start();
  requestAnimationFrame(loop);
})();
