// Simple dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const resumeAudio = () => audioCtx.resume();
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });

  const player = { x: width / 2 - 15, y: height - 30, w: 30, h: 30, speed: 5 };
  const blocks = [];
  const particles = [];
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  let lastSpawn = 0;
  let spawnInterval = 1500;
  let lastTime = 0;
  let gameOver = false;
  const startTime = performance.now();

  function spawnBlock() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3 + (performance.now() - startTime) / 20000;
    blocks.push({ x, y: -size, w: size, h: size, speed });
    // particle burst
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedP = Math.random() * 1 + 0.5;
      particles.push({
        x: x + size / 2,
        y: -size / 2,
        vx: Math.cos(angle) * speedP,
        vy: Math.sin(angle) * speedP,
        size: Math.random() * 2 + 1,
        alpha: 0.8,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
    beep(300, 'sine', 0.1);
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // blocks movement
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      if (b.y > height) blocks.splice(i, 1);
    }

    // particles update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // collision
    for (const b of blocks) {
      if (b.x < player.x + player.w &&
          b.x + b.w > player.x &&
          b.y < player.y + player.h &&
          b.y + b.h > player.y) {
        gameOver = true;
        beep(100, 'sawtooth', 0.3);
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#a0c4ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;

    // player as circle
    ctx.fillStyle = 'steelblue';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // blocks with gradient
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    for (const b of blocks) {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      grad.addColorStop(0, '#ff6b6b');
      grad.addColorStop(1, '#c81d25');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // particles
    ctx.shadowColor = 'transparent';
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,255,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // timer
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Survived: ${elapsed}s`, width / 2, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!gameOver) {
      if (timestamp - lastSpawn > spawnInterval) {
        spawnBlock();
        lastSpawn = timestamp;
        spawnInterval = Math.max(300, spawnInterval - 10);
      }
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, type='sine', duration=0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // resume audio on first user interaction
  const resumeAudio = () => {audioCtx.resume();};
  window.addEventListener('click', resumeAudio, {once:true});
  window.addEventListener('keydown', resumeAudio, {once:true});
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  const player = { x: width / 2 - 15, y: height - 30, w: 30, h: 30, speed: 5 };
  const blocks = [];
  const particles = [];
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let lastTime = 0;
  let gameOver = false;
  let startTime = performance.now();

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnBlock() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3 + (performance.now() - startTime) / 20000; // increase over time
    blocks.push({ x, y: -size, w: size, h: size, speed });
    // create a burst of particles at spawn
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedP = Math.random() * 1 + 0.5;
      particles.push({
        x: x + size / 2,
        y: -size / 2,
        vx: Math.cos(angle) * speedP,
        vy: Math.sin(angle) * speedP,
        size: Math.random() * 2 + 1,
        alpha: 0.8,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
    beep(300, 'sine', 0.1); // spawn sound
  }
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = 2 + Math.random() * 3 + (performance.now() - startTime) / 20000; // increase over time
    blocks.push({ x, y: -size, w: size, h: size, speed });
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    // keep inside bounds
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // remove offscreen
      if (b.y > height) blocks.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // collision
    for (const b of blocks) {
      if (b.x < player.x + player.w &&
          b.x + b.w > player.x &&
          b.y < player.y + player.h &&
          b.y + b.h > player.y) {
        gameOver = true;
        beep(100, 'sawtooth', 0.3); // collision sound
        break;
      }
    }
  }
    // player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    // keep inside bounds
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // remove offscreen
      if (b.y > height) blocks.splice(i, 1);
    }

    // collision
    for (const b of blocks) {
      if (b.x < player.x + player.w &&
          b.x + b.w > player.x &&
          b.y < player.y + player.h &&
          b.y + b.h > player.y) {
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#a0c4ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // reset for other drawings
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    // player
    ctx.fillStyle = 'steelblue';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    // reset shadow for blocks
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    // blocks
    for (const b of blocks) {
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      blockGrad.addColorStop(0, '#ff6b6b');
      blockGrad.addColorStop(1, '#c81d25');
      ctx.fillStyle = blockGrad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    // particles (if any)
    ctx.shadowColor = 'transparent';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.fillStyle = `rgba(255,255,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // timer
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Survived: ${elapsed}s`, width / 2, height / 2 + 30);
    }
  }

  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!gameOver) {
      if (timestamp - lastSpawn > spawnInterval) {
        spawnBlock();
        lastSpawn = timestamp;
        // gradually speed up spawns
        spawnInterval = Math.max(300, spawnInterval - 10);
      }
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();