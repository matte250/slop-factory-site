// Meteor Dodge game implementation
// Assumes an existing <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Game state
  let ship, meteors, shots, stars, score, lastMeteorTime, gameOver;

  let audioCtx;
let laserGain;
let explosionGain;
function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  laserGain = audioCtx.createGain();
  laserGain.gain.value = 0.2;
  laserGain.connect(audioCtx.destination);
  explosionGain = audioCtx.createGain();
  explosionGain.gain.value = 0.3;
  explosionGain.connect(audioCtx.destination);
}
function playLaser() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 800;
  osc.connect(laserGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
function playExplosion() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}
function reset() {
  // initialize stars for background
  const STAR_COUNT = 100;
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      speed: Math.random() * 0.5 + 0.2 // slow downward drift
    });
  }
    ship = { x: WIDTH / 2 - 15, y: HEIGHT - 30, w: 30, h: 20, speed: 5 };
    meteors = [];
    shots = [];
    score = 0;
    lastMeteorTime = 0;
    gameOver = false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (!audioCtx) initAudio(); if (e.code === 'Space') e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnMeteor() {
    const size = Math.random() * 30 + 20; // 20-50px
    const speed = Math.random() * 2 + 1; // 1-3px per frame
    meteors.push({ x: Math.random() * (WIDTH - size), y: -size, w: size, h: size, speed });
  }

  function update(delta) {
  // move background stars
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > HEIGHT) {
      star.y = 0;
      star.x = Math.random() * WIDTH;
    }
  });
    if (gameOver) return;
    // Ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x));

    // Shooting
    if (keys['Space']) {
      // Simple rate limit
      if (!ship.lastShot || performance.now() - ship.lastShot > 250) {
          playLaser();
        shots.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 7 });
        ship.lastShot = performance.now();
      }
    }

    // Update shots
    shots.forEach(s => s.y -= s.speed);
    shots = shots.filter(s => s.y + s.h > 0);

    // Spawn meteors over time
    if (performance.now() - lastMeteorTime > 800) {
      spawnMeteor();
      lastMeteorTime = performance.now();
    }

    // Update meteors
    meteors.forEach(m => m.y += m.speed);

    // Collision detection (shots vs meteors)
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      // Ship collision
      if (rectIntersect(m, ship)) {
          playExplosion();
          gameOver = true;
        gameOver = true;
        break;
      }
      // Shot collisions
      for (let j = shots.length - 1; j >= 0; j--) {
        const s = shots[j];
        if (rectIntersect(m, s)) {
          meteors.splice(i, 1);
          shots.splice(j, 1);
          score += 10;
          break;
        }
      }
    }

    // Meteors reaching bottom ends game
    if (meteors.some(m => m.y > HEIGHT)) gameOver = true;
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Background: star field
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw stars
    ctx.fillStyle = '#777';
    stars.forEach(star => {
      ctx.fillRect(star.x, star.y, 2, 2);
    });

    // Ship: simple triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Shots: laser with glow
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    shots.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x + s.w / 2, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0; // reset

    // Meteors: radial gradient circles
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  reset();
  requestAnimationFrame(loop);
})();
