// Simple wind‑balloon canvas game
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  // balloon (drawn as ellipse with gradient)
  const balloon = {
    w: 40,
    h: 60,
    x: W / 2 - 20,
    y: H - 80,
    speedX: 0,
    speedY: -2, // constant upward motion
    // gradient will be created each frame
  };

  // obstacles: simple rectangles
  const obstacles = [];
  const obstacleFreq = 90; // frames between spawns
  // clouds for background
  const clouds = [];
  const cloudFreq = 150; // frames between cloud spawns
  let frame = 0;
  let score = 0;
  let gameOver = false;
  // input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startFlameSound();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // --- Sound setup ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // flame sound: low hum using oscillator
  const flameOsc = audioCtx.createOscillator();
  const flameGain = audioCtx.createGain();
  flameOsc.type = 'sawtooth';
  flameOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
  flameGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  flameOsc.connect(flameGain).connect(audioCtx.destination);
  // start paused; will start on first user interaction
  let flamePlaying = false;
  const startFlameSound = () => {
    if (!flamePlaying) {
      flameOsc.start();
      flamePlaying = true;
    }
  };
  const stopFlameSound = () => {
    if (flamePlaying) {
      flameGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      flamePlaying = false;
    }
  };
  // crash sound: short noise burst using buffer
  const crashBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
  const data = crashBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const playCrash = () => {
    const source = audioCtx.createBufferSource();
    source.buffer = crashBuffer;
    source.connect(audioCtx.destination);
    source.start();
  };

  function spawnObstacle() {
    const w = 30 + Math.random() * 50;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (W - w);
    obstacles.push({ x, y: -h, w, h, speedY: 2 + Math.random() * 1.5 });
  }

  function spawnCloud() {
    const w = 60 + Math.random() * 80;
    const h = 30 + Math.random() * 20;
    const x = Math.random() * (W - w);
    clouds.push({ x, y: -h, w, h, speedY: 0.5 + Math.random() * 0.5 });
  }

  function update() {
    if (gameOver) return;
    // move balloon horizontally
    if (keys['ArrowLeft']) balloon.x -= 3;
    if (keys['ArrowRight']) balloon.x += 3;
    // keep within bounds
    balloon.x = Math.max(0, Math.min(W - balloon.w, balloon.x));
    // upward motion (actually canvas scrolls down)
    balloon.y += balloon.speedY;
    // generate obstacles and clouds
    if (frame % obstacleFreq === 0) spawnObstacle();
    if (frame % cloudFreq === 0) spawnCloud();
    // move obstacles down
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speedY;
      if (o.y > H) obstacles.splice(i, 1);
    }
    // move clouds down (parallax slower)
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      c.y += c.speedY;
      if (c.y > H) clouds.splice(i, 1);
    }
    // collision detection
    for (const o of obstacles) {
        if (balloon.x < o.x + o.w && balloon.x + balloon.w > o.x &&
            balloon.y < o.y + o.h && balloon.y + balloon.h > o.y) {
          gameOver = true;
          playCrash();
          stopFlameSound();
        }
    }
    // lose if out of top bound
    if (balloon.y < -balloon.h) gameOver = true;
    // score based on frames survived
    score = Math.floor(frame / 60);
    frame++;
  }

  function draw() {
    // draw background sky gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // light sky
    bgGrad.addColorStop(1, '#1e90ff'); // deeper sky
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // draw clouds (soft white ellipses)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // balloon drawn as gradient ellipse
    const grad = ctx.createRadialGradient(
      balloon.x + balloon.w / 2,
      balloon.y + balloon.h / 2,
      5,
      balloon.x + balloon.w / 2,
      balloon.y + balloon.h / 2,
      balloon.w / 2
    );
    grad.addColorStop(0, '#ffeb3b');
    grad.addColorStop(1, '#ff6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(
      balloon.x + balloon.w / 2,
      balloon.y + balloon.h / 2,
      balloon.w / 2,
      balloon.h / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    // draw flame under balloon
    const flameGrad = ctx.createRadialGradient(
      balloon.x + balloon.w / 2,
      balloon.y + balloon.h,
      2,
      balloon.x + balloon.w / 2,
      balloon.y + balloon.h + 10,
      12
    );
    flameGrad.addColorStop(0, '#ff9');
    flameGrad.addColorStop(1, '#f90');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(
      balloon.x + balloon.w / 2,
      balloon.y + balloon.h + 6,
      balloon.w / 6,
      8,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    // obstacles as simple spikes (triangles)
    ctx.fillStyle = '#a33';
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    }
    // score text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 30);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
