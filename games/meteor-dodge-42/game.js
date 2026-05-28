// Meteor Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Player
  const player = { w: 40, h: 20, x: W / 2 - 20, y: H - 30, speed: 4, vx: 0 };
  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  window.addEventListener('click', resumeAudio);

  // Meteors
  const meteors = [];
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      alpha: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  let meteorTimer = 0;
  let level = 0;

  // Game state
  let running = true;
  let score = 0;

  const rand = (min, max) => Math.random() * (max - min) + min;

  function spawnMeteor() {
    const size = rand(20, 50);
    meteors.push({ x: rand(0, W - size), y: -size, w: size, h: size, speed: 1 + level * 0.3 });
    // Play a short beep when a meteor appears
    playBeep(500, 0.04);
  }

  function update() {
    if (!running) return;
    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -player.speed;
    else if (keys['ArrowRight'] || keys['KeyD']) player.vx = player.speed;
    else player.vx = 0;
    player.x = Math.max(0, Math.min(W - player.w, player.x + player.vx));

    // Move background stars (twinkling)
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      // randomize brightness for twinkle effect
      s.alpha = Math.random() * 0.5 + 0.5;
    });

    // Meteors
    meteorTimer--;
    if (meteorTimer <= 0) {
      spawnMeteor();
      // increase difficulty over time
      level = Math.min(10, level + 0.01);
      meteorTimer = Math.max(20, 100 - level * 8);
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // remove off-screen
      if (m.y > H) { meteors.splice(i, 1); score++; playBeep(300, 0.03); }
      // collision with player
      if (m.x < player.x + player.w && m.x + m.w > player.x &&
          m.y < player.y + player.h && m.y + m.h > player.y) {
        // collision sound
        playBeep(150, 0.3);
        running = false;
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background stars
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // player ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // meteors as circles with gradient
    meteors.forEach(m => {
      const grd = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, m.w * 0.1, m.x + m.w / 2, m.y + m.h / 2, m.w / 2);
      grd.addColorStop(0, '#f88');
      grd.addColorStop(1, '#800');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
