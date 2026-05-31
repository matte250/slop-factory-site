// Simple Orb Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player
  const player = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 10,
    speed: 3,
    color: 'lime',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroid class
  class Asteroid {
    constructor() {
      // spawn on random edge
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: // top
          this.x = Math.random() * WIDTH;
          this.y = -20;
          break;
        case 1: // right
          this.x = WIDTH + 20;
          this.y = Math.random() * HEIGHT;
          break;
        case 2: // bottom
          this.x = Math.random() * WIDTH;
          this.y = HEIGHT + 20;
          break;
        case 3: // left
          this.x = -20;
          this.y = Math.random() * HEIGHT;
          break;
      }
      // direction toward canvas centre
      const dx = WIDTH / 2 - this.x;
      const dy = HEIGHT / 2 - this.y;
      const len = Math.hypot(dx, dy);
      const speed = 1 + Math.random(); // 1‑2 px per frame
      this.vx = (dx / len) * speed;
      this.vy = (dy / len) * speed;
      this.radius = 8 + Math.random() * 12;
      this.color = 'crimson';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    collidesWith(obj) {
      const dist = Math.hypot(this.x - obj.x, this.y - obj.y);
      return dist < this.radius + obj.radius;
    }
  }

  let asteroids = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  function updatePlayer() {
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    // keep inside canvas
    if (player.x < 0) player.x = 0;
    if (player.x > WIDTH) player.x = WIDTH;
    if (player.y < 0) player.y = 0;
    if (player.y > HEIGHT) player.y = HEIGHT;
  }

  function spawnAsteroid(time) {
    if (time - lastSpawn > spawnInterval) {
      asteroids.push(new Asteroid());
      // sound for new asteroid
      playTone(300, 0.05);
      lastSpawn = time;
      // increase difficulty
      spawnInterval = Math.max(500, spawnInterval - 20);
    }
  }

  function checkCollisions() {
    for (const a of asteroids) {
      if (a.collidesWith(player)) {
        // collision sound
        playTone(150, 0.2);
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // fade previous frame for motion trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw player with radial gradient
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.radius * 0.2,
      player.x, player.y, player.radius
    );
    playerGrad.addColorStop(0, '#aaffaa');
    playerGrad.addColorStop(1, '#007700');
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = playerGrad;
    ctx.fill();
    // outline for better visibility
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 2;
    ctx.stroke();

    // asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.3,
        a.x, a.y, a.radius
      );
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#880000');
      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // score with drop shadow
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${seconds}s`, 10, 20);
    ctx.shadowBlur = 0;
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      return;
    }
    updatePlayer();
    spawnAsteroid(timestamp);
    asteroids.forEach(a => a.update());
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
