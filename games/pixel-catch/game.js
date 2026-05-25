// Pixel Catch – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 300;

  // Basket
  const basket = { w: 60, h: 20, x: width / 2 - 30, y: height - 30, speed: 6 };
  // Control via mouse
  canvas.addEventListener('mousemove', e => {
    // ensure audio can play after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    basket.x = e.clientX - rect.left - basket.w / 2;
    clampBasket();
  });
  // Arrow keys fallback
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  function clampBasket() {
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.w > width) basket.x = width - basket.w;
  }

  // Falling objects
  const objects = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let misses = 0;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCatch() { playTone(400, 0.1); }
  function playMiss() { playTone(150, 0.2); }
  function playGameOver() { playTone(100, 0.5); }
  const maxMisses = 3;

  function spawnObject() {
    const size = 15 + Math.random() * 10;
    objects.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }

  function update() {
    // move basket with arrows if no mouse movement
    if (keys['ArrowLeft']) basket.x -= basket.speed;
    if (keys['ArrowRight']) basket.x += basket.speed;
    clampBasket();

    // spawn objects
    if (spawnTimer-- <= 0) { spawnObject(); spawnTimer = spawnInterval; }

    // update objects
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      o.y += o.speed;
      // collision with basket
      if (o.y + o.h >= basket.y &&
          o.x + o.w > basket.x &&
          o.x < basket.x + basket.w) {
        score++;
        playCatch();
        objects.splice(i, 1);
        continue;
      }
      // missed
      if (o.y > height) {
        misses++;
        playMiss();
        objects.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
// basket with rounded corners
  ctx.fillStyle = '#555';
  ctx.beginPath();
  const radius = 5;
  ctx.moveTo(basket.x + radius, basket.y);
  ctx.lineTo(basket.x + basket.w - radius, basket.y);
  ctx.quadraticCurveTo(basket.x + basket.w, basket.y, basket.x + basket.w, basket.y + radius);
  ctx.lineTo(basket.x + basket.w, basket.y + basket.h - radius);
  ctx.quadraticCurveTo(basket.x + basket.w, basket.y + basket.h, basket.x + basket.w - radius, basket.y + basket.h);
  ctx.lineTo(basket.x + radius, basket.y + basket.h);
  ctx.quadraticCurveTo(basket.x, basket.y + basket.h, basket.x, basket.y + basket.h - radius);
  ctx.lineTo(basket.x, basket.y + radius);
  ctx.quadraticCurveTo(basket.x, basket.y, basket.x + radius, basket.y);
  ctx.closePath();
  ctx.fill();
    // objects as colorful circles with gradient
    objects.forEach(o => {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, o.w/4, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, '#ff8888');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Misses: ${misses}/${maxMisses}`, 10, 40);
  }

  function loop() {
    if (misses >= maxMisses) {
      playGameOver();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
      return; // stop loop
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
