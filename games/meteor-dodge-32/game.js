// Simple Meteor Dodge game (based on IDEA.md)
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 600;
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 5,
    dx: 0
  };

  // Meteor prototype
  class Meteor {
    constructor() {
      this.w = 30 + Math.random() * 20;
      this.h = this.w;
      this.x = Math.random() * (WIDTH - this.w);
      this.y = -this.h;
      this.speed = 2 + Math.random() * 2;
    }
    update(acc) { this.y += this.speed * acc; }
    draw() { ctx.fillStyle = '#555'; ctx.fillRect(this.x, this.y, this.w, this.h); }
  }

  let meteors = [];
  let lastSpawn = 0;
  let spawnInterval = 1000; // ms
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;
  let speedMultiplier = 1;
  // Stars for background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 2 + 1,
      speed: 0.2 + Math.random() * 0.5
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    else if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x + ship.dx));

    // Spawn meteors
    if (performance.now() - lastSpawn > spawnInterval) {
      meteors.push(new Meteor());
      playBeep(300, 0.05); // spawn sound
      lastSpawn = performance.now();
    }

    // Increase difficulty over time
    speedMultiplier = 1 + (performance.now() - startTime) / 30000; // 3% per sec

    // Update meteors
    meteors.forEach(m => m.update(speedMultiplier));
    // Remove off-screen meteors
    meteors = meteors.filter(m => m.y < HEIGHT);
    // Update background stars
    stars.forEach(s => {
      s.y += s.speed * speedMultiplier;
      if (s.y > HEIGHT) {
        s.y = 0;
        s.x = Math.random() * WIDTH;
      }
    });

    // Collision detection
    for (const m of meteors) {
      if (
        ship.x < m.x + m.w &&
        ship.x + ship.w > m.x &&
        ship.y < m.y + m.h &&
        ship.y + ship.h > m.y
      ) {
        playBeep(100, 0.2); // collision sound
        gameOver = true;
        break;
      }
    }

    // Score is elapsed seconds
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Draw background stars
    ctx.fillStyle = '#222';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as a triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw meteors with radial gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.1,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '30px sans-serif';
      ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 30);
    }
  }

  function loop(ts) {
    if (!gameOver) {
      const dt = ts - (lastRender || ts);
      update(dt);
    }
    draw();
    lastRender = ts;
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastRender;
  requestAnimationFrame(loop);
})();
