// Meteor Dodge Game
// Assumes a <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions if not set in HTML
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  // Background stars configuration
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const PLAYER_W = 40;
  const PLAYER_H = 20;
  const PLAYER_SPEED = 5;
  const METEOR_MIN_SIZE = 15;
  const METEOR_MAX_SIZE = 30;
  const SPAWN_INTERVAL = 90; // frames
  const MAX_MISSES = 3;

  let player = { x: canvas.width / 2 - PLAYER_W / 2, y: canvas.height - PLAYER_H - 5, width: PLAYER_W, height: PLAYER_H };
  let meteors = [];
  let left = false, right = false;
  let frame = 0;
  let score = 0;
  let misses = 0;
  let highScore = Number(localStorage.getItem('meteorDodgeHigh') || 0);
  let gameOver = false;

  const spawnMeteor = () => {
    const size = Math.random() * (METEOR_MAX_SIZE - METEOR_MIN_SIZE) + METEOR_MIN_SIZE;
    const speed = 1 + (score / 100);
    meteors.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed });
  };

  const update = () => {
    if (gameOver) return;
    // Move player
    if (left) player.x = Math.max(0, player.x - PLAYER_SPEED);
    if (right) player.x = Math.min(canvas.width - player.width, player.x + PLAYER_SPEED);

    // Spawn meteors
    if (frame % SPAWN_INTERVAL === 0) spawnMeteor();
    frame++;

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Check collision with player
      if (
        m.y + m.size > player.y &&
        m.x < player.x + player.width &&
        m.x + m.size > player.x
      ) {
        // Collision sound
        playBeep(600, 0.2);
        endGame();
        return;
      }
      // Passed bottom – count as missed or scored
      if (m.y > canvas.height) {
        meteors.splice(i, 1);
        score++;
        // Score increase beep
        playBeep(300, 0.05);
        // optional penalty after three consecutive misses could be added
      }
    }
  };

  const draw = () => {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#001d3d');
    bg.addColorStop(1, '#000814');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      // Move star for subtle parallax
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
    }

    // Player - draw as triangle ship
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Meteors with radial gradient
    for (const m of meteors) {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.1,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#b22222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High: ${highScore}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  const endGame = () => {
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('meteorDodgeHigh', highScore);
    }
    // Show final screen for a moment then restart on key press
    document.addEventListener('keydown', restart, { once: true });
  };

  const restart = () => {
    // reset state
    player.x = canvas.width / 2 - PLAYER_W / 2;
    meteors = [];
    score = 0;
    misses = 0;
    frame = 0;
    gameOver = false;
    loop();
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  }
  // Ensure audio can start after user interaction
  const unlockAudio = () => { audioCtx.resume(); document.removeEventListener('click', unlockAudio); };
  document.addEventListener('click', unlockAudio);

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
    // Play move sound (optional subtle beep)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playBeep(200, 0.05);
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  });

  // Start game
  loop();
})();
