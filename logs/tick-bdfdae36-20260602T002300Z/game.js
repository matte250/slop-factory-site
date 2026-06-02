// Space Drift – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const ship = { x: WIDTH / 2, y: HEIGHT - 60, size: 20, speed: 4 };
  let asteroids = [];
  let powerUps = [];
  let fuel = 100; // percent
  let score = 0;
  let gameOver = false;

  // ----- Stars (twinkling) -----
  const STAR_COUNT = 200;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: Math.random() * 0.02 + 0.01,
    });
  }

// ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playThrust = () => playTone(400, 80);
  const playExplosion = () => playTone(100, 300, 'sawtooth');
  const playPowerUp = () => playTone(800, 120, 'triangle');

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const spawnAsteroid = () => {
    const size = rand(15, 40);
    asteroids.push({ x: rand(size, WIDTH - size), y: -size, r: size, speed: rand(1, 3) });
  };
  const spawnPowerUp = () => {
    const size = 15;
    powerUps.push({ x: rand(size, WIDTH - size), y: -size, size, speed: 1.5 });
  };

  // ----- Drawing -----
  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // gradient ship body
    const grad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawAsteroids = () => {
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      radGrad.addColorStop(0, '#aaa');
      radGrad.addColorStop(1, '#444');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawPowerUps = () => {
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,165,0,0.1)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawHUD = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f66';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  };

  const checkCollisions = () => {
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size / 2) {
        gameOver = true;
        playExplosion();
        return;
      }
    }
    powerUps = powerUps.filter(p => {
      const dx = ship.x - p.x;
      const dy = ship.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size / 2 + p.size / 2) {
        fuel = Math.min(100, fuel + 20);
        score += 10;
        playPowerUp();
        return false;
      }
      return true;
    });
  };

  const update = () => {
    if (gameOver) return;
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y - a.r < HEIGHT);
    powerUps.forEach(p => p.y += p.speed);
    powerUps = powerUps.filter(p => p.y - p.size < HEIGHT);
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;
    // twinkling stars
    stars.forEach(s => {
      s.alpha += s.delta;
      if (s.alpha <= 0 || s.alpha >= 1) s.delta *= -1;
    });
    checkCollisions();
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnPowerUp();
  };

  const render = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // dark space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });
    drawShip();
    drawAsteroids();
    drawPowerUps();
    drawHUD();
  };

  const loop = () => {
    update();
    render();
    requestAnimationFrame(loop);
  };

  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (gameOver && e.key === 'Enter') {
      asteroids = [];
      powerUps = [];
      fuel = 100;
      score = 0;
      gameOver = false;
    }
    switch (e.key) {
      case 'ArrowLeft':
        ship.x = Math.max(ship.size, ship.x - ship.speed);
        playThrust();
        break;
      case 'ArrowRight':
        ship.x = Math.min(WIDTH - ship.size, ship.x + ship.speed);
        playThrust();
        break;
      case 'ArrowUp':
        ship.y = Math.max(ship.size, ship.y - ship.speed);
        playThrust();
        break;
      case 'ArrowDown':
        ship.y = Math.min(HEIGHT - ship.size, ship.y + ship.speed);
        playThrust();
        break;
    }
  });

  loop();
});
  };

  const drawPowerUps = () => {
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,165,0,0.1)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawHUD = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f66';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  };

  const checkCollisions = () => {
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size / 2) {
        gameOver = true;
        return;
      }
    }
    powerUps = powerUps.filter(p => {
      const dx = ship.x - p.x;
      const dy = ship.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size / 2 + p.size / 2) {
        fuel = Math.min(100, fuel + 20);
        score += 10;
        return false;
      }
      return true;
    });
  };

  const update = () => {
    if (gameOver) return;
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y - a.r < HEIGHT);
    powerUps.forEach(p => p.y += p.speed);
    powerUps = powerUps.filter(p => p.y - p.size < HEIGHT);
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;
    // twinkling stars
    stars.forEach(s => {
      s.alpha += s.delta;
      if (s.alpha <= 0 || s.alpha >= 1) s.delta *= -1;
    });
    checkCollisions();
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnPowerUp();
  };

  const render = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // dark space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });
    drawShip();
    drawAsteroids();
    drawPowerUps();
    drawHUD();
  };

  const loop = () => {
    update();
    render();
    requestAnimationFrame(loop);
  };

  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (gameOver && e.key === 'Enter') {
      asteroids = [];
      powerUps = [];
      fuel = 100;
      score = 0;
      gameOver = false;
    }
    switch (e.key) {
      case 'ArrowLeft':
        ship.x = Math.max(ship.size, ship.x - ship.speed);
        break;
      case 'ArrowRight':
        ship.x = Math.min(WIDTH - ship.size, ship.x + ship.speed);
        break;
      case 'ArrowUp':
        ship.y = Math.max(ship.size, ship.y - ship.speed);
        break;
      case 'ArrowDown':
        ship.y = Math.min(HEIGHT - ship.size, ship.y + ship.speed);
        break;
    }
  });

  loop();
})();
