// Simple Asteroid Dodge game targeting <canvas id="game">.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.offsetWidth || 800);
  const h = (canvas.height = canvas.offsetHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function ensureAudio(){
    if (!audioStarted){
      audioCtx.resume();
      audioStarted = true;
    }
  }
  function playTone(freq, duration){
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Stars background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 1,
    });
  }

  // Ship
  const ship = {
    w: 40,
    h: 20,
    x: w / 2 - 20,
    y: h - 30,
    speed: 5,
    draw() {
      // Draw ship as a triangle
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    move(dir) {
      this.x = Math.max(0, Math.min(w - this.w, this.x + dir * this.speed));
      // play movement sound
      playTone(400, 0.07);
    },
  };

  // Asteroids
  const asteroids = [];
  const asteroidConfig = { size: 30, speed: 2, spawnRate: 90 }; // frames between spawns
  let frame = 0;
  let score = 0;
  let running = true;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const x = Math.random() * (w - asteroidConfig.size);
    asteroids.push({ x, y: -asteroidConfig.size, size: asteroidConfig.size });
  }

  function update() {
    if (!running) return;
    // move ship
    if (keys['ArrowLeft'] || keys['a']) ship.move(-1);
    if (keys['ArrowRight'] || keys['d']) ship.move(1);

    // spawn
    if (frame % asteroidConfig.spawnRate === 0) spawnAsteroid();
    frame++;

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += asteroidConfig.speed;
      // collision
        if (
          a.x < ship.x + ship.w &&
          a.x + a.size > ship.x &&
          a.y < ship.y + ship.h &&
          a.y + a.size > ship.y
        ) {
          running = false;
          // crash sound
          playTone(150, 0.5);
        }
      // remove off-screen
      if (a.y > h) {
        asteroids.splice(i, 1);
        score++;
      }
    }
  }

  // Draw background stars and game objects with enhanced visuals
function draw() {
    // Space background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#000020');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // Ship
    ship.draw();
    // Asteroids with subtle shading
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      radGrad.addColorStop(0, '#bbb');
      radGrad.addColorStop(1, '#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff5050';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // start
  ctx.font = '16px sans-serif';
  loop();
})();
