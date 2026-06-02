// Pixel Runner – simple endless runner using a canvas with id="game"
// Core: player (square), obstacles (spikes), collectibles (pixels), auto‑scroll, jump on space/tap.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;
  // starfield for parallax background
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      size: Math.random() * 2 + 0.5
    });
  }

  // ---- Audio setup ----
  let audioCtx;
  const getAudioCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Some browsers start in suspended state; resume on first use
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  };
  const playSound = (freq, duration) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    osc.start(now);
    osc.stop(now + duration);
  };
  const playJumpSound = () => playSound(300, 0.1);
  const playCollectSound = () => playSound(600, 0.08);
  const playGameOverSound = () => playSound(100, 0.5);

  // Game state
  let speed = 2; // base scroll speed (px/frame)
  let score = 0;
  let frame = 0;
  let gameOver = false;

  // Player definition
  const player = {
    x: 50,
    y: height - 30,
    w: 20,
    h: 20,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    onGround: true,
    draw() {
      // draw player as a small 8‑bit style character (green square with a simple eye)
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // eye
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + this.w * 0.6, this.y + this.h * 0.2, 3, 3);
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y + this.h >= height) {
        this.y = height - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = this.jumpStrength;
        this.onGround = false;
      }
    }
  };

  // Obstacle definition (simple spike as rectangle)
  const obstacles = [];
  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({
      x: width,
      y: height - size,
      w: size,
      h: size,
      passed: false
    });
  }

  // Collectible definition (glowing pixel)
  const collectibles = [];
  function spawnCollectible() {
    const size = 8;
    const yPos = height - 40 - Math.random() * 80;
    collectibles.push({ x: width, y: yPos, w: size, h: size, collected: false });
  }

  // Input handling
  const onInput = (e) => {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    player.jump();
    playJumpSound();
  };
  window.addEventListener('keydown', onInput);
  canvas.addEventListener('pointerdown', onInput);

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    frame++;

    // Increase speed gradually
    if (frame % 600 === 0) speed += 0.3;

    // Spawn obstacles & collectibles
    if (frame % Math.floor(120 / speed) === 0) spawnObstacle();
    if (frame % Math.floor(180 / speed) === 0) spawnCollectible();

    // Update player
    player.update();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision
      if (rectIntersect(player, o)) {
        gameOver = true;
        playGameOverSound();
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      c.x -= speed;
      if (!c.collected && rectIntersect(player, c)) {
        c.collected = true;
        score++;
      }
      if (c.x + c.w < 0) collectibles.splice(i, 1);
    }
  }

  function render() {
    // background gradient based on speed
    ctx.fillStyle = `hsl(${Math.min(120, speed * 30)}, 30%, 12%)`;
    ctx.fillRect(0, 0, width, height);

    // draw starfield (parallax)
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      // move left slower than obstacles for parallax effect
      star.x -= speed * 0.3;
      if (star.x < 0) star.x = width;
    });

    // draw ground line
    ctx.fillStyle = '#222';
    ctx.fillRect(0, height - 10, width, 10);

    // draw player
    player.draw();

    // draw obstacles (spikes)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // draw collectibles as glowing pixels with radial gradient
    collectibles.forEach(c => {
      if (!c.collected) {
        const grad = ctx.createRadialGradient(
          c.x + c.w / 2,
          c.y + c.h / 2,
          0,
          c.x + c.w / 2,
          c.y + c.h / 2,
          c.w
        );
        grad.addColorStop(0, 'rgba(255,255,0,0.9)');
        grad.addColorStop(1, 'rgba(255,255,0,0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 20);
    }
  }

  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
