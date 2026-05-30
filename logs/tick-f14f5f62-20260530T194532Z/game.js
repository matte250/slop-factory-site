// game.js – simple Neon Grid Escape implementation
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Sound effects using HTMLAudioElement with data URIs
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep
  const spawnSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // placeholder beep
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = {
    size: 20,
    x: width / 2 - 10,
    y: height - 40,
    speed: 4,
    color: '#0ff',
  };

  // Game state
  let spikes = [];
  let lasers = [];
  let gridOffset = 0;
  let frame = 0;
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnSpike() {
    const size = 20;
    const x = Math.random() * (width - size);
    spikes.push({ x, y: -size, size, speed: 2, color: '#f0f' });
    // play spawn sound
    spawnSound.currentTime = 0;
    spawnSound.play();
  }

  function spawnLaser() {
    const thickness = 8;
    const y = -thickness;
    const speed = 1.5;
    const direction = Math.random() < 0.5 ? 1 : -1; // left to right or reverse
    const length = Math.random() * (width / 2) + width / 4;
    const startX = direction === 1 ? -length : width;
    lasers.push({ x: startX, y, length, thickness, speed, direction, color: '#f00' });
    // play spawn sound
    spawnSound.currentTime = 0;
    spawnSound.play();
  }

  function update() {
    if (!running) return;
    // Move player
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // Update spikes
    spikes.forEach(s => s.y += s.speed);
    spikes = spikes.filter(s => s.y < height);

    // Update lasers
    lasers.forEach(l => {
      l.y += l.speed;
      l.x += l.speed * l.direction;
    });
    lasers = lasers.filter(l => l.y < height && (l.direction === 1 ? l.x < width : l.x > -l.length));

    // Spawn obstacles
    if (frame % 80 === 0) spawnSpike();
    if (frame % 200 === 0) spawnLaser();

    // Collision detection
    const hit = spikes.some(s =>
      player.x < s.x + s.size && player.x + player.size > s.x &&
      player.y < s.y + s.size && player.y + player.size > s.y);
    const laserHit = lasers.some(l => {
      // laser is a moving rectangle
      const lx = l.x;
      const ly = l.y;
      const lw = l.length;
      const lh = l.thickness;
      return player.x < lx + lw && player.x + player.size > lx &&
             player.y < ly + lh && player.y + player.size > ly;
    });
    if (hit || laserHit) {
      // play hit sound
      hitSound.currentTime = 0;
      hitSound.play();
      running = false;
    }

    // Grid scrolling effect
    gridOffset = (gridOffset + 2) % 40;
    frame++;
    score = Math.floor(frame / 60);
  }

  function drawGrid() {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = gridOffset; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridOffset; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    // Background – neon gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#010024');
    bgGrad.addColorStop(1, '#090979');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Grid with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    drawGrid();
    // Reset glow for other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // Player – glowing square
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // Spikes – glowing triangles
    spikes.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.size);
      ctx.lineTo(s.x + s.size / 2, s.y);
      ctx.lineTo(s.x + s.size, s.y + s.size);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
    // Lasers – glowing gradient rectangles
    lasers.forEach(l => {
      const grad = ctx.createLinearGradient(l.x, l.y, l.x + l.length, l.y);
      grad.addColorStop(0, 'rgba(255,0,0,0.3)');
      grad.addColorStop(0.5, 'rgba(255,0,0,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(l.x, l.y, l.length, l.thickness);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
    // Score
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (running) {
      update();
    }
    render();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
