// Meteor Dodge game implementation
// Canvas element with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Simple sound effects using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Create star field for background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const player = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    lives: 3,
    draw() {
      // draw spaceship as a triangle
      ctx.fillStyle = '#0af';
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    move(dir) {
      this.x += dir * this.speed;
      this.x = Math.max(0, Math.min(this.x, width - this.w));
    }
  };

    const meteors = [];
    const particles = [];
  const meteorSize = 30;
  const spawnInterval = 800; // ms
  let lastSpawn = 0;
  let lastTime = performance.now();
  let score = 0;

  function spawnMeteor() {
  // sound for meteor appearance
  beep(500, 0.05);
    // each meteor gets a random rotation angle and speed
    const angle = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
    meteors.push({
      x: Math.random() * (width - meteorSize),
      y: -meteorSize,
      speed: 2 + Math.random() * 3,
      angle,
      rotationSpeed,
    });
  }

  function update(dt) {
    // player controlled by keys
    if (keys['ArrowLeft']) {
      player.move(-1);
      // add thrust particles
      particles.push({
        x: player.x + player.w / 2,
        y: player.y + player.h,
        life: 30,
        vx: (Math.random() - 0.5) * 1,
        vy: 1 + Math.random() * 1,
      });
      // thrust sound
      beep(300, 0.03);
    }
    if (keys['ArrowRight']) {
      player.move(1);
      particles.push({
        x: player.x + player.w / 2,
        y: player.y + player.h,
        life: 30,
        vx: (Math.random() - 0.5) * 1,
        vy: 1 + Math.random() * 1,
      });
    }

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      m.angle += m.rotationSpeed;
      // collision
      if (
        m.x < player.x + player.w &&
        m.x + meteorSize > player.x &&
        m.y < player.y + player.h &&
        m.y + meteorSize > player.y
      ) {
player.lives--;
          // collision sound
          beep(200, 0.2);
          meteors.splice(i, 1);
          if (player.lives <= 0) {
            gameOver = true;
          }
          continue;
      }
      // remove off‑screen
      if (m.y > height) meteors.splice(i, 1);
    }

    // spawn new meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnMeteor();
      lastSpawn = performance.now();
    }

    // score based on time survived
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // dark sky background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // player
    player.draw();
    // draw stars background
    ctx.fillStyle = '#222';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.radius, s.radius);
    });
    // meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + meteorSize / 2,
        m.y + meteorSize / 2,
        meteorSize * 0.1,
        m.x + meteorSize / 2,
        m.y + meteorSize / 2,
        meteorSize / 2
      );
      grad.addColorStop(0, '#ff8');
      grad.addColorStop(1, '#a33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + meteorSize / 2, m.y + meteorSize / 2, meteorSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${player.lives}`, 10, 20);
    ctx.fillText(`Score: ${score}s`, 10, 40);
  }

  let gameOver = false;
  const startTime = performance.now();
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${score}s`, width / 2, height / 2 + 20);
    }
  }
  requestAnimationFrame(loop);
})();
