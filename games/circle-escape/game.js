// Minimalist "Circle Escape" game implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const player = { x: width / 2, y: height / 2, r: 12, speed: 3 };
  const enemies = [];
  const orbs = [];
  let score = 0;
  let running = true;
  const keys = {};

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume on first interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  canvas.addEventListener('mousemove', resumeAudio, { once: true });

  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCollect() { // pleasant chime
    playTone(800, 0.08, 'triangle');
  }

  function playCrash() { // low buzz
    playTone(150, 0.3, 'sawtooth');
  }

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 30;
    // spawn outside canvas bounds
    const dist = Math.max(width, height);
    const startX = player.x + Math.cos(angle) * dist;
    const startY = player.y + Math.sin(angle) * dist;
    const speed = 0.5 + Math.random() * 0.7;
    enemies.push({ x: startX, y: startY, r: radius, speed, angle: Math.atan2(player.y - startY, player.x - startX) });
  }

  function spawnOrb() {
    const r = 5;
    const x = r + Math.random() * (width - 2 * r);
    const y = r + Math.random() * (height - 2 * r);
    orbs.push({ x, y, r });
  }

  setInterval(spawnEnemy, 2000);
  setInterval(spawnOrb, 3000);

  function update() {
    // keyboard movement (if mouse not used)
    if (!keys['ArrowUp'] && !keys['ArrowDown'] && !keys['ArrowLeft'] && !keys['ArrowRight']) {
      // no keys pressed, rely on mouse position already set
    } else {
      if (keys['ArrowUp']) player.y -= player.speed;
      if (keys['ArrowDown']) player.y += player.speed;
      if (keys['ArrowLeft']) player.x -= player.speed;
      if (keys['ArrowRight']) player.x += player.speed;
    }
    // keep player inside canvas
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    // move enemies toward player
    enemies.forEach(e => {
      e.x += Math.cos(e.angle) * e.speed * 60; // speed per second approximated
      e.y += Math.sin(e.angle) * e.speed * 60;
      // update direction gradually for smoother chase
      e.angle = Math.atan2(player.y - e.y, player.x - e.x);
    });
  }

  function checkCollisions() {
    // player vs enemies
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (Math.hypot(dx, dy) < e.r + player.r) {
        running = false;
        playCrash();
        return;
      }
    }
    // player vs orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      if (Math.hypot(dx, dy) < o.r + player.r) {
        score++;
        orbs.splice(i, 1);
        playCollect();
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw orbs with subtle glow
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      orbGrad.addColorStop(0, '#aaffff');
      orbGrad.addColorStop(1, '#004455');
      ctx.fillStyle = orbGrad;
      ctx.shadowColor = '#aaffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset
    // draw enemies with red gradient and pulse effect
    enemies.forEach(e => {
      const enemyGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      const hue = Math.floor(Date.now() / 10) % 360;
      enemyGrad.addColorStop(0, `hsl(${hue}, 80%, 70%)`);
      enemyGrad.addColorStop(1, `hsl(${hue}, 80%, 40%)`);
      ctx.fillStyle = enemyGrad;
      ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // draw player with bright green glow
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!running) { draw(); return; }
    update();
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
