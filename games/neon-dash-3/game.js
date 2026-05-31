// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  // Helper to draw neon background gradient
  // Audio setup
  let audioCtx = null;
  function initAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    }
  }
  function playTone(freq, dur){
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }
  function playJump(){ playTone(600, 0.15); }
  function playSlide(){ playTone(300, 0.1); }
  function playGameOver(){ playTone(150, 0.5); }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#111");
    grad.addColorStop(1, "#222");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Simple particle system for jump effect
  const particles = [];
  function spawnParticle(x, y) {
    particles.push({x, y, vy: -2 - Math.random()*2, alpha: 1, radius: 2 + Math.random()*2});
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.1;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    ctx.fillStyle = "rgba(0,255,255,0.7)";
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 40;
  const PLAYER_X = 80; // fixed horizontal position
  const OBSTACLE_SPEED = 6;
  const OBSTACLE_FREQ = 1500; // ms
  const SLIDE_TIME = 500; // ms

  let lastObstacle = 0;
  let obstacles = [];
  let gameOver = false;

  const player = {
    y: H - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    sliding: false,
    slideTimer: 0,
    draw() {
      ctx.fillStyle = '#0ff'; // neon cyan
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(PLAYER_X, this.y, this.width, this.height);
      ctx.shadowBlur = 0;
    },
    update() {
      // apply gravity
      this.vy += GRAVITY;
      this.y += this.vy;
      // floor
      const floor = H - this.height;
      if (this.y > floor) {
        this.y = floor;
        this.vy = 0;
      }
      // slide timer
      if (this.sliding) {
        this.slideTimer -= 16;
        if (this.slideTimer <= 0) this.endSlide();
      }
    },
    jump() {
      if (this.vy === 0) {
        this.vy = JUMP_VELOCITY;
        // spawn a burst of particles on jump
        for (let i = 0; i < 8; i++) {
          spawnParticle(PLAYER_X + this.width / 2, this.y + this.height);
        }
        playJump();
      }
    },
    startSlide() {
      if (this.sliding) return;
      this.sliding = true;
      this.slideTimer = SLIDE_TIME;
      // reduce hitbox height, keep bottom aligned
      this.height = PLAYER_SIZE / 2;
      this.y = H - this.height;
      playSlide();
    },
    endSlide() {
      this.sliding = false;
      this.height = PLAYER_SIZE;
      this.y = H - this.height;
    }
  };

  function spawnObstacle() {
    const size = Math.random() < 0.5 ? PLAYER_SIZE : PLAYER_SIZE * 1.5; // low or high obstacle
    const obstacle = {
      x: W,
      y: H - size,
      width: size,
      height: size,
      draw() {
        ctx.fillStyle = '#f0f'; // neon magenta
        ctx.fillRect(this.x, this.y, this.width, this.height);
      },
      update() {
        this.x -= OBSTACLE_SPEED;
      }
    };
    obstacles.push(obstacle);
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        PLAYER_X < o.x + o.width &&
        PLAYER_X + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  function gameLoop(timestamp) {
  if (gameOver) return;
  // draw background gradient (replaces clearRect)
  drawBackground();
    if (gameOver) return;
    drawBackground();

    // spawn obstacles
    if (timestamp - lastObstacle > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacle = timestamp;
    }

    // update and draw obstacles
    obstacles.forEach(o => o.update());
    obstacles = obstacles.filter(o => o.x + o.width > 0);
    obstacles.forEach(o => o.draw());

    // update and draw particles
    updateParticles();
    drawParticles();

    // update and draw player
    player.update();
    player.draw();

    // collision
    if (checkCollision()) {
      gameOver = true;
      playGameOver();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      return;
    }

    requestAnimationFrame(gameLoop);
  }

  // Input handling – click/tap for jump, ArrowDown for slide
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
    if (e.code === 'ArrowDown') player.startSlide();
  });
  window.addEventListener('mousedown', () => player.jump());

  // start the loop
  requestAnimationFrame(gameLoop);
})();
