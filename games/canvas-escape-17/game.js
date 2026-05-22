// Minimal endless‑runner game using the canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Player
  const player = { w: 30, h: 30, x: W / 2 - 15, y: H - 40, speed: 5 };

  // Game state
  let shapes = [];
  let spawnTimer = 0;
  const spawnInterval = 60; // frames
  let frame = 0;
  let score = 0;
  let lives = 3;
  let gameOver = false;

  // Input handling and audio context
  const keys = {};
  let audioCtx = null;
  function initAudio(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  function playTone(freq, duration){
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect(){
    playTone(800, 0.1);
  }
  function playHit(){
    playTone(200, 0.2);
  }
  window.addEventListener('keydown', e => {
    initAudio();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnShape() {
    const size = 20 + Math.random() * 20;
    const x = Math.random() * (W - size);
    const speed = 2 + frame / 1000; // gradually faster
    const type = Math.random() < 0.1 ? 'star' : 'obstacle'; // 10% stars give points
    shapes.push({ x, y: -size, size, speed, type });
  }

  function update() {
    if (gameOver) return;
    // Move player
    if (keys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if (keys.ArrowRight) player.x = Math.min(W - player.w, player.x + player.speed);

    // Spawn shapes
    if (frame % spawnInterval === 0) spawnShape();

    // Update shapes
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      s.y += s.speed;
      // Collision detection
      const collides =
        s.x < player.x + player.w &&
        s.x + s.size > player.x &&
        s.y < player.y + player.h &&
        s.y + s.size > player.y;

        if (collides) {
          if (s.type === 'star') {
            score += 10;
            playCollect();
          } else {
            lives--;
            playHit();
            if (lives <= 0) {
              gameOver = true;
            }
          }
          shapes.splice(i, 1);
          continue;
        }
      // Remove off‑screen shapes
      if (s.y > H) {
        if (s.type === 'star') score += 1; // missed star gives small bonus
        shapes.splice(i, 1);
      }
    }
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

// Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Player with rounded corners and gradient
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y + player.h);
    playerGrad.addColorStop(0, '#5ac8fa');
    playerGrad.addColorStop(1, '#007aff');
    ctx.fillStyle = playerGrad;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Shapes with distinct drawings
    shapes.forEach(s => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      if (s.type === 'star') {
        // 5‑point star
        ctx.fillStyle = '#ffd700';
        ctx.translate(s.x + s.size / 2, s.y + s.size / 2);
        ctx.beginPath();
        const spikes = 5;
        const outer = s.size / 2;
        const inner = outer / 2.5;
        let rot = Math.PI / 2 * 3;
        let cx = 0, cy = 0;
        ctx.moveTo(0, -outer);
        for (let i = 0; i < spikes; i++) {
          cx = Math.cos(rot) * outer;
          cy = Math.sin(rot) * outer;
          ctx.lineTo(cx, cy);
          rot += Math.PI / spikes;
          cx = Math.cos(rot) * inner;
          cy = Math.sin(rot) * inner;
          ctx.lineTo(cx, cy);
          rot += Math.PI / spikes;
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // obstacle: triangle
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.moveTo(s.x + s.size / 2, s.y);
        ctx.lineTo(s.x, s.y + s.size);
        ctx.lineTo(s.x + s.size, s.y + s.size);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, W - 80, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.font = '16px sans-serif';
      ctx.fillText('Refresh to play again', W / 2, H / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start animation
  requestAnimationFrame(loop);
})();
