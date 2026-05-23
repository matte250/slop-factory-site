// Minimal Beacon Dash game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // ----- Game objects -----
  const ship = { x: width / 2, y: height - 50, w: 20, h: 30, speed: 4 };
  const beacons = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Audio setup -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (freq, dur, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playCollect = () => playTone(800, 0.1);
  const playExplosion = () => playTone(150, 0.3, 'triangle');
  const playThrust = () => playTone(400, 0.05);


  // ----- Utility -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollide = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ----- Spawn -----
  const spawnBeacon = () => {
    beacons.push({ x: rand(0, width - 20), y: -20, w: 20, h: 20, speed: 2 });
  };
  const spawnAsteroid = () => {
    const size = rand(15, 35);
    asteroids.push({ x: rand(0, width - size), y: -size, w: size, h: size, speed: rand(1.5, 3) });
  };
  // spawn intervals
  let beaconTimer = 0,
    asteroidTimer = 0;

  // ----- Main loop -----
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
      return;
    }

    // clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // starfield (twinkling)
    // pre‑generated stars for consistent twinkle
    if (!window._stars) {
      window._stars = Array.from({ length: 80 }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
      }));
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw gradient overlay for depth
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw stars with slight flicker
    window._stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // update ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) {
      ship.y -= ship.speed;
      playThrust();
    }
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // draw ship (gradient triangle with thrust)
    // main hull
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#4cff4c');
    shipGrad.addColorStop(1, '#00aa00');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving up
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w / 2, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w / 2 - 4, ship.y + ship.h + 10);
      ctx.lineTo(ship.x + ship.w / 2 + 4, ship.y + ship.h + 10);
      ctx.closePath();
      ctx.fill();
    }

    // spawn beacons/asteroids
    beaconTimer++;
    asteroidTimer++;
    if (beaconTimer > 100) { spawnBeacon(); beaconTimer = 0; }
    if (asteroidTimer > 150) { spawnAsteroid(); asteroidTimer = 0; }

    // update and draw beacons (glowing circles)
    for (let i = beacons.length - 1; i >= 0; i--) {
      const b = beacons[i];
      b.y += b.speed;
      // radial gradient for glow effect
      const grad = ctx.createRadialGradient(b.x + b.w/2, b.y + b.h/2, 0, b.x + b.w/2, b.y + b.h/2, b.w);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/2, 0, Math.PI*2);
      ctx.fill();
      // collect
      if (rectCollide(ship, b)) { score++; beacons.splice(i, 1); playCollect(); }
      else if (b.y > height) beacons.splice(i, 1);
    }

    // update and draw asteroids (gradient rocks)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // rock gradient
      const rockGrad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.2,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      rockGrad.addColorStop(0, '#aaa');
      rockGrad.addColorStop(1, '#555');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      // optional slight outline
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (rectCollide(ship, a)) { playExplosion(); gameOver = true; }
      else if (a.y > height) asteroids.splice(i, 1);
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(loop);
  };

  // start
  requestAnimationFrame(loop);
})();
