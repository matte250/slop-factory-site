// Enhanced Asteroid Dodge game with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
   // Enable crisp rendering
   ctx.imageSmoothingEnabled = false;
   // Audio context for sound effects
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   function playTone(freq, dur) {
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.type = 'sine';
     osc.frequency.value = freq;
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
     osc.start();
     osc.stop(audioCtx.currentTime + dur);
   }
   function playCollision() { playTone(150, 0.3); }
   function playScore() { playTone(440, 0.1); }
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;
  // Starfield background
  const stars = Array.from({ length: 100 }, () => ({ x: Math.random() * width, y: Math.random() * height, sz: Math.random() * 2 + 1 }));

  // Ship
  const ship = { x: width / 2, y: height - 30, w: 30, h: 20, speed: 5 };

  // Game state
  let asteroids = [];
  let score = 0;
  let lives = 3;
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms

    // Input handling
    const keys = {};
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      // Resume audio context on first interaction
      if (audioCtx.state === 'suspended') audioCtx.resume();
    });
    window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Move stars (parallax background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5; // slow downward motion
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      const size = Math.random() * 30 + 10;
      asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 3 });
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Passed bottom -> score
      if (a.y > height) {
          asteroids.splice(i, 1);
          playScore();
          score++;
          continue;
      }
      // Collision
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        asteroids.splice(i, 1);
        playCollision();
        lives--;
        if (lives <= 0) {
          // Game over: stop animation
          cancelAnimationFrame(animId);
          alert(`Game Over! Score: ${score}`);
          return;
        }
      }
    }
  }

  function draw() {
    // Background gradient (dark space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle)
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.closePath();
    ctx.fill();
    // Asteroids (radial gradient circles)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
