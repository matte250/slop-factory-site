// Meteor Dodge game implementation
// Canvas with id "game" expected in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
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
  };

  // Simple background hum (two tones alternating)
  const musicInterval = setInterval(() => {
    playTone(220, 0.1);
    setTimeout(() => playTone(440, 0.1), 150);
  }, 2000);


  const player = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    move: 0 // -1 left, 1 right, 0 none
  };

  const meteors = [];
  const spawnInterval = 800; // ms
  let lastSpawn = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.code] = true;
});
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  const update = (dt) => {
    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.move = -1;
    else if (keys['ArrowRight'] || keys['KeyD']) player.move = 1;
    else player.move = 0;
    player.x += player.move * player.speed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > width) player.x = width - player.w;

    // Spawn meteors
    if (Date.now() - lastSpawn > spawnInterval) {
      lastSpawn = Date.now();
      meteors.push({
        x: Math.random() * (width - 20),
        y: -20,
        r: 15 + Math.random() * 10,
        speed: 1 + Math.random() * 3,
        color: `hsl(${Math.random() * 360},70%,50%)`
      });
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off-screen
      if (m.y - m.r > height) meteors.splice(i, 1);
      // Collision with player
      const px = player.x, py = player.y, pw = player.w, ph = player.h;
      if (m.x + m.r > px && m.x - m.r < px + pw && m.y + m.r > py && m.y - m.r < py + ph) {
        gameOver = true;
        // Play collision sound
        playTone(80, 0.2);
        // Stop background music
        clearInterval(musicInterval);
      }
    }
  };

  const draw = () => {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw moving stars
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      s.y += 0.4; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    ctx.globalAlpha = 1;
    // Draw player as triangle ship
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y); // tip
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // Draw meteors with glow
    for (const m of meteors) {
      ctx.save();
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.restore();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
