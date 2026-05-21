// Canvas Runner Game
// Implements endless runner per IDEA.md
// Enhanced graphics: gradient background, player silhouette, obstacle shading

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 400);

  // Game state
  let speed = 2;
  let score = 0;
  let running = true;

  // Player
  const player = {
    w: 30,
    h: 50,
    x: 50,
    y: H - 100,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    onGround: false,
    draw() {
      // Simple silhouette (triangle) for better visual
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= groundY) {
        this.y = groundY - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) this.vy = this.jumpStrength;
    },
  };

  // Ground line
  const groundY = H - 50;

  // Obstacles and orbs
  const obstacles = [];
  const orbs = [];
  const obstacleFreq = 120; // frames
  const orbFreq = 80;
  let frameCount = 0;

  function spawnObstacle() {
    const height = 30 + Math.random() * 40;
    obstacles.push({ x: W, y: groundY - height, w: 20, h: height });
  }

  function spawnOrb() {
    const radius = 8;
    const y = groundY - 100 - Math.random() * 150;
    orbs.push({ x: W, y, r: radius });
  }

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
  }

  function updateOrbs() {
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x -= speed;
      if (o.x + o.r < 0) orbs.splice(i, 1);
    }
  }

  function checkCollisions() {
    // Player vs obstacles
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        running = false;
        return;
      }
    }
    // Player vs orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = player.x + player.w / 2 - (o.x + o.r);
      const dy = player.y + player.h / 2 - (o.y + o.r);
        if (dx * dx + dy * dy < (player.w / 2 + o.r) ** 2) {
          score += 10;
          orbs.splice(i, 1);
          // Play collection sound
          playSound(600, 0.07);
        }
      }
    }
  }

    }
  }

  function drawBackground() {
    // Gradient sky that shifts hue with speed
    const hue = Math.floor((speed * 10) % 360);
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, `hsl(${hue}, 80%, 60%)`);
    grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 80%, 40%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, groundY);
    // Ground with simple gradient shading
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#444');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);
  }

    function drawObstacles() {
      // Obstacles with dark gradient shading
      for (const o of obstacles) {
        const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        grad.addColorStop(0, '#a22');
        grad.addColorStop(1, '#600');
        ctx.fillStyle = grad;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }

    function drawOrbs() {
      for (const o of orbs) {
        const grad = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
        grad.addColorStop(0, 'rgba(255,255,0,0.9)');
        grad.addColorStop(1, 'rgba(255,165,0,0.4)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
      ctx.fillText('Score: ' + score, W / 2 - 50, H / 2 + 30);
      return;
    }
    ctx.clearRect(0, 0, W, H);

    // increase speed gradually
    speed += 0.001;

    // spawn entities
    if (frameCount % obstacleFreq === 0) spawnObstacle();
    if (frameCount % orbFreq === 0) spawnOrb();

    updateObstacles();
    updateOrbs();
    player.update();
    checkCollisions();

    drawBackground();
    drawObstacles();
    drawOrbs();
    player.draw();
    drawScore();

    frameCount++;
    requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      player.jump();
      audioCtx.resume();
      playSound(300, 0.1);
    }
  });
  canvas.addEventListener('click', () => {
    player.jump();
    audioCtx.resume();
    playSound(300, 0.1);
  });

  // Start
  requestAnimationFrame(loop);
})();
