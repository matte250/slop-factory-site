// Minimal Cosmic Drift game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // generate background stars
  const starCount = 100;
  const stars = Array.from({length: starCount}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // sound utilities
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume audio context on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Ship with rotation and gradient
  // Ship with rotation and gradient
  const ship = {
    angle: 0, // direction in radians

    x: width / 2,
    y: height / 2,
    r: 8,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    friction: 0.99,
    update() {
      // update direction angle based on velocity
      if (this.vx !== 0 || this.vy !== 0) {
        this.angle = Math.atan2(this.vy, this.vx);
      }
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
      // wrap around edges
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    },
    draw() {
      // draw ship as a rotated triangle with gradient and glow
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,255,0,0.7)';
      const grad = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#004400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.r, 0);
      ctx.lineTo(-this.r, this.r/2);
      ctx.lineTo(-this.r, -this.r/2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = '#0f0';
      ctx.fill();
    }
  };

  // Asteroids
  const asteroids = [];
  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    if (side === 0) { x = 0; y = Math.random()*height; vx = speed; vy = Math.sin(angle)*speed; }
    else if (side === 1) { x = width; y = Math.random()*height; vx = -speed; vy = Math.sin(angle)*speed; }
    else if (side === 2) { x = Math.random()*width; y = 0; vx = Math.cos(angle)*speed; vy = speed; }
    else { x = Math.random()*width; y = height; vx = Math.cos(angle)*speed; vy = -speed; }
    asteroids.push({x, y, vx, vy, r: size});
  }
  for (let i = 0; i < 8; i++) spawnAsteroid();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousedown', e => { canvas.isDragging = true; canvas.dragStart = {x:e.offsetX, y:e.offsetY}; });
  canvas.addEventListener('mouseup', () => { canvas.isDragging = false; });
  canvas.addEventListener('mousemove', e => {
    if (!canvas.isDragging) return;
    const dx = e.offsetX - canvas.dragStart.x;
    const dy = e.offsetY - canvas.dragStart.y;
    ship.vx += dx * 0.01;
    ship.vy += dy * 0.01;
    canvas.dragStart = {x:e.offsetX, y:e.offsetY};
  });

  function update() {
    // controls
    if (keys['ArrowUp'] || keys['w']) { ship.vy -= ship.thrust; playTone(400, 0.05); }
    if (keys['ArrowDown'] || keys['s']) { ship.vy += ship.thrust; playTone(300, 0.05); }
    if (keys['ArrowLeft'] || keys['a']) { ship.vx -= ship.thrust; }
    if (keys['ArrowRight'] || keys['d']) { ship.vx += ship.thrust; }

    ship.update();
    // move asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; if (a.x < -a.r) a.x = width + a.r; if (a.x > width + a.r) a.x = -a.r; if (a.y < -a.r) a.y = height + a.r; if (a.y > height + a.r) a.y = -a.r; });
    // collision check
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        // end game
        // play collision sound
        playTone(100, 0.3);
        cancelAnimationFrame(animationId);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,width,height);
        ctx.fillStyle = '#f00';
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width/2, height/2);
        return;
      }
    }
    // maybe spawn more
    if (Math.random() < 0.01) spawnAsteroid();
    draw();
    animationId = requestAnimationFrame(update);
  }

  function draw() {
    ctx.clearRect(0,0,width,height);
    drawStars();
    ship.draw();
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    });
  }

  let animationId = requestAnimationFrame(update);
})();
