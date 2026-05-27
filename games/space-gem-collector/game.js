// Simple Space Gem Collector game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const PLAYER_RADIUS = 12;
  const GEM_RADIUS = 8;
  const ENEMY_SIZE = 16;
  const PLAYER_SPEED = 2.5;

  let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  const player = { x: width / 2, y: height / 2 };
  let gems = [];
  let enemies = [];
  // Sound effects
  const collectSound = new Audio('data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const crashSound = new Audio('data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  let stars = [];
  let score = 0;
  let startTime = performance.now();
  const GAME_DURATION = 60 * 1000; // 60 seconds
  let gameOver = false;

  function randPos(radius = 0) {
    return {
      x: radius + Math.random() * (width - 2 * radius),
      y: radius + Math.random() * (height - 2 * radius)
    };
  }

  function init() {
  // generate starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
    // spawn gems
    for (let i = 0; i < 5; i++) gems.push({ ...randPos(GEM_RADIUS) });
    // spawn enemies
    for (let i = 0; i < 3; i++) enemies.push({ ...randPos(ENEMY_SIZE / 2) });
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (gameOver) return;
    const elapsed = ts - startTime;
    if (elapsed >= GAME_DURATION) endGame();
    update();
    render(elapsed);
    requestAnimationFrame(loop);
  }

  function update() {
    // player movement
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
    if (keys.ArrowLeft) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight) player.x += PLAYER_SPEED;
    // keep inside bounds
    player.x = Math.max(PLAYER_RADIUS, Math.min(width - PLAYER_RADIUS, player.x));
    player.y = Math.max(PLAYER_RADIUS, Math.min(height - PLAYER_RADIUS, player.y));

    // check gem collection
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      if (dx * dx + dy * dy <= (PLAYER_RADIUS + GEM_RADIUS) ** 2) {
        gems.splice(i, 1);
        score++;
        // play collect sound
        collectSound.currentTime = 0;
        collectSound.play();
        // spawn a new gem
        gems.push({ ...randPos(GEM_RADIUS) });
        // increase enemy speed slightly by scaling their base speed later
      }
    }

    // enemy AI – simple vector towards player
    const enemyBaseSpeed = 1 + score * 0.1; // speed rises with score
    enemies.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      e.x += (dx / dist) * enemyBaseSpeed;
      e.y += (dy / dist) * enemyBaseSpeed;
    });

    // collision with enemies
    for (let e of enemies) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (dx * dx + dy * dy <= (PLAYER_RADIUS + ENEMY_SIZE / 2) ** 2) {
        // play crash sound
        crashSound.currentTime = 0;
        crashSound.play();
        endGame();
        break;
      }
    }
  }

  function render(elapsed) { // draw starfield background
  const bgGrad = ctx.createLinearGradient(0,0,width, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#003');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,width,height);
  // stars
  for (let s of stars) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(s.x, s.y, 1, 1);
  }


    // draw player (triangle pointing up)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(Math.atan2(
      keys.ArrowDown - keys.ArrowUp,
      keys.ArrowRight - keys.ArrowLeft
    ));
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_RADIUS);
    ctx.lineTo(-PLAYER_RADIUS / 1.5, PLAYER_RADIUS);
    ctx.lineTo(PLAYER_RADIUS / 1.5, PLAYER_RADIUS);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // draw gems
    ctx.fillStyle = '#ff0';
    gems.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, GEM_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw enemies
    ctx.fillStyle = '#f33';
    enemies.forEach(e => {
      ctx.fillRect(e.x - ENEMY_SIZE / 2, e.y - ENEMY_SIZE / 2, ENEMY_SIZE, ENEMY_SIZE);
    });
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000));
    ctx.fillText(`Time: ${remaining}s`, width - 100, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 24);
    }
  }

  function endGame() {
    gameOver = true;
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
  });

  // Start automatically when script loads
  init();
})();
