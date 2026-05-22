// Simple endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio assets (place your files in an 'assets' folder)
  const sounds = {
    jump: new Audio('assets/jump.wav'),
    slide: new Audio('assets/slide.wav'),
    orb: new Audio('assets/orb.wav'),
    death: new Audio('assets/death.wav')
  };
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);
  const GROUND = H - 50;
  const PLAYER = {
    w: 30,
    h: 50,
    x: 80,
    y: GROUND - 50,
    vy: 0,
    jumpV: -12,
    gravity: 0.6,
    sliding: false,
    slideTimer: 0,
    slideDuration: 15,
    onGround() {return this.y >= GROUND - this.h;}
  };
  const obstacles = [];
  const orbs = [];
  let frame = 0, score = 0, gameOver = false;

  // Input handling: click/tap toggles jump or slide
  canvas.addEventListener('pointerdown', () => {
    if (gameOver) return reset();
if (PLAYER.onGround()) {
          PLAYER.vy = PLAYER.jumpV;
          sounds.jump.currentTime = 0; sounds.jump.play();
} else if (!PLAYER.sliding) {
        PLAYER.sliding = true;
        PLAYER.slideTimer = PLAYER.slideDuration;
        PLAYER.h = 30; // shorter height while sliding
        sounds.slide.currentTime = 0; sounds.slide.play();
      }
  });

  function reset() {
    obstacles.length = 0;
    orbs.length = 0;
    PLAYER.y = GROUND - 50;
    PLAYER.vy = 0;
    PLAYER.h = 50;
    PLAYER.sliding = false;
    frame = 0;
    score = 0;
    gameOver = false;
    loop();
  }

  function spawnObstacle() {
    const w = 20 + Math.random() * 30;
    const h = 30 + Math.random() * 40;
    obstacles.push({x: W + w, y: GROUND - h, w, h});
  }

  function spawnOrb() {
    const r = 8;
    const y = GROUND - 80 - Math.random() * 100;
    orbs.push({x: W + r, y, r});
  }

  function update() {
    frame++;
    // Player physics
    PLAYER.vy += PLAYER.gravity;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y > GROUND - PLAYER.h) {
      PLAYER.y = GROUND - PLAYER.h;
      PLAYER.vy = 0;
    }
    if (PLAYER.sliding) {
      PLAYER.slideTimer--;
      if (PLAYER.slideTimer <= 0) {
        PLAYER.sliding = false;
        PLAYER.h = 50;
      }
    }
    // Move obstacles & orbs
    obstacles.forEach(o => o.x -= 4);
    orbs.forEach(o => o.x -= 4);
    // Remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (orbs.length && orbs[0].x + orbs[0].r < 0) orbs.shift();
    // Spawn logic
    if (frame % 120 === 0) spawnObstacle();
    if (frame % 200 === 0) spawnOrb();
    // Collision detection
    for (const o of obstacles) {
if (PLAYER.x < o.x + o.w && PLAYER.x + PLAYER.w > o.x &&
           PLAYER.y < o.y + o.h && PLAYER.y + PLAYER.h > o.y) {
         gameOver = true;
         sounds.death.currentTime = 0; sounds.death.play();

    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = (PLAYER.x + PLAYER.w/2) - o.x;
      const dy = (PLAYER.y + PLAYER.h/2) - o.y;
      if (Math.hypot(dx, dy) < o.r + Math.min(PLAYER.w, PLAYER.h)/2) {
        score += 10;
        sounds.orb.currentTime = 0; sounds.orb.play();
        orbs.splice(i, 1);
      }
    }
    // Falling off ground (gap) – simplified as y > GROUND
    if (PLAYER.y > GROUND) gameOver = true;
    if (!gameOver) score++;
  }

  function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#1a237e'); // dark blue top
  bgGrad.addColorStop(1, '#0d47a1'); // darker bottom
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // Ground gradient
  const groundGrad = ctx.createLinearGradient(0, GROUND, 0, H);
  groundGrad.addColorStop(0, '#37474f');
  groundGrad.addColorStop(1, '#263238');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  // Player silhouette with rounded corners
  ctx.fillStyle = '#fff';
  const radius = 5;
  ctx.beginPath();
  ctx.moveTo(PLAYER.x + radius, PLAYER.y);
  ctx.lineTo(PLAYER.x + PLAYER.w - radius, PLAYER.y);
  ctx.quadraticCurveTo(PLAYER.x + PLAYER.w, PLAYER.y, PLAYER.x + PLAYER.w, PLAYER.y + radius);
  ctx.lineTo(PLAYER.x + PLAYER.w, PLAYER.y + PLAYER.h - radius);
  ctx.quadraticCurveTo(PLAYER.x + PLAYER.w, PLAYER.y + PLAYER.h, PLAYER.x + PLAYER.w - radius, PLAYER.y + PLAYER.h);
  ctx.lineTo(PLAYER.x + radius, PLAYER.y + PLAYER.h);
  ctx.quadraticCurveTo(PLAYER.x, PLAYER.y + PLAYER.h, PLAYER.x, PLAYER.y + PLAYER.h - radius);
  ctx.lineTo(PLAYER.x, PLAYER.y + radius);
  ctx.quadraticCurveTo(PLAYER.x, PLAYER.y, PLAYER.x + radius, PLAYER.y);
  ctx.fill();
  // Obstacles with simple style
  ctx.fillStyle = '#f44336';
  obstacles.forEach(o => {
    // Draw as filled rectangle with a dark outline
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  });
  // Orbs with glow effect
  orbs.forEach(o => {
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    grad.addColorStop(0, '#b2ff59');
    grad.addColorStop(1, '#33691e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Score / Game Over (retain original styling but reposition)
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 30);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over - Click to Restart', W/2, H/2);
  }
}


  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }
  // expose for debugging
  window.gameReset = reset;
  loop();
})();
