// Game based on IDEA.md – simple canvas space rescue
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Ship (triangular craft, gradient color generated in draw)
  const ship = {
    x: W / 2,
    y: H - 50,
    w: 30,
    h: 40,
    speed: 4,
    fuel: 200,
    color: null
  };

  // Asteroids
  const asteroids = [];
  const asteroidFreq = 90; // frames
  // Astronauts
  const astronauts = [];
  const astronautFreq = 300;
  let score = 0;
  let frame = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  function playCollect() { beep(800, 0.15); }
  function playCrash() { beep(150, 0.3); }
  function playThrust() { beep(400, 0.05); }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      // play thrust sound on key press
      playThrust();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 1 + Math.random() * 2,
      color: '#888'
    });
  }

  function spawnAstronaut() {
    const size = 15;
    astronauts.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 1.5,
      color: '#ff0'
    });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;
    // ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    // keep inside
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));
    // fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) gameOver = true;

    // spawn
    if (frame % asteroidFreq === 0) spawnAsteroid();
    if (frame % astronautFreq === 0) spawnAstronaut();

    // move asteroids
    asteroids.forEach(a => a.y += a.speed);
    // move astronauts
    astronauts.forEach(a => a.y += a.speed);

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (rectIntersect(ship, a)) { gameOver = true; playCrash(); }
      if (a.y > H) asteroids.splice(i, 1);
    }
    for (let i = astronauts.length - 1; i >= 0; i--) {
      const a = astronauts[i];
      if (rectIntersect(ship, a)) {
        score += 10;
        astronauts.splice(i, 1);
      } else if (a.y > H) {
        astronauts.splice(i, 1);
      }
    }
    frame++;
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // Stars (twinkling)
    if (!window._stars) {
      window._stars = Array.from({length: 100}, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        tw: Math.random() * 0.05
      }));
    }
    ctx.fillStyle = '#fff';
    window._stars.forEach(s => {
      s.r += (Math.random() - 0.5) * s.tw;
      if (s.r < 0.5) s.r = 0.5;
      if (s.r > 2) s.r = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Ship (triangle with vertical gradient)
    const grad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#007');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (rocky look with radial gradient)
    asteroids.forEach(a => {
      const aGrad = ctx.createRadialGradient(
        a.x + a.w/2, a.y + a.h/2, a.w*0.2,
        a.x + a.w/2, a.y + a.h/2, a.w/2
      );
      aGrad.addColorStop(0, '#555');
      aGrad.addColorStop(1, '#111');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // Astronauts (small capsules)
    astronauts.forEach(a => {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
      // visor
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2 - a.h*0.1, a.w*0.3, 0, Math.PI*2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
