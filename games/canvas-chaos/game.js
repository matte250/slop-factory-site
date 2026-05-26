// Canvas Chaos game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 400;
  const H = canvas.height = canvas.offsetHeight || 600;

  const player = { x: W / 2, y: H - 30, r: 15, speed: 6 };
  let score = 0;
  let missed = 0;
  const maxMissed = 3;
  const objects = [];
  let lastSpawn = 0;
  let gameOver = false;

  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  // ensure context runs after user interaction
  const resumeAudio = () => { audioCtx.state === 'suspended' && audioCtx.resume(); };
  window.addEventListener('mousedown', resumeAudio, {once:true});
  window.addEventListener('keydown', resumeAudio, {once:true});

  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playCoin = () => playTone(800, 0.08);
  const playSpike = () => playTone(150, 0.2);
  const playGameOver = () => playTone(60, 0.5);

  // Input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
  });

  function spawn() {
    const type = Math.random() < 0.7 ? 'coin' : 'spike'; // more coins than spikes
    const x = Math.random() * (W - 20) + 10;
    objects.push({ type, x, y: -10, r: 10, speed: 2 + Math.random() * 2 });
  }

  function update(dt) {
    if (gameOver) return;
    // move player
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));

    // spawn objects periodically
    if (performance.now() - lastSpawn > 800) {
      spawn();
      lastSpawn = performance.now();
    }

    // update objects
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.y += obj.speed;
      // collision with player
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < obj.r + player.r) {
        if (obj.type === 'spike') {
          gameOver = true;
          playSpike();
          playGameOver();
        } else {
          score++;
          playCoin();
          objects.splice(i, 1);
        }
        continue;
      }
      // missed coin
      if (obj.y - obj.r > H) {
        if (obj.type === 'coin') {
          missed++;
          if (missed >= maxMissed) {
            gameOver = true;
            playGameOver();
          }
        }
        objects.splice(i, 1);
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // player - radial gradient for a glossy look
    const grad = ctx.createRadialGradient(player.x - player.r/3, player.y - player.r/3, player.r/5, player.x, player.y, player.r);
    grad.addColorStop(0, '#66f');
    grad.addColorStop(1, '#006');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // objects with subtle shadows and gradients
    objects.forEach(o => {
      // shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      if (o.type === 'coin') {
        const cg = ctx.createRadialGradient(o.x, o.y - o.r/2, o.r/5, o.x, o.y, o.r);
        cg.addColorStop(0, '#fffdc1');
        cg.addColorStop(1, '#b8860b');
        ctx.fillStyle = cg;
      } else {
        const sg = ctx.createRadialGradient(o.x, o.y - o.r/2, o.r/5, o.x, o.y, o.r);
        sg.addColorStop(0, '#ff5555');
        sg.addColorStop(1, '#8b0000');
        ctx.fillStyle = sg;
      }
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      // reset shadow for UI text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Missed: ${missed}/${maxMissed}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 20);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
