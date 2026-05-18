// Simple Meteor Dodge game
// Canvas must exist with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = { x: width / 2, y: height - 30, w: 40, h: 20, speed: 5 };

  // State
  let meteors = [];
  let shields = [];
  let shieldActive = false;
  let shieldTimer = 0;
  let gameOver = false;
  let frame = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Load sound effects
  const hitSound = new Audio('https://cdn.jsdelivr.net/gh/juliangarnier/AudioContext/music/boom.wav');
  const shieldSound = new Audio('https://cdn.jsdelivr.net/gh/juliangarnier/AudioContext/music/coin.wav');
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/juliangarnier/AudioContext/music/track.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(()=>{});

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, v: 2 + Math.random() * 2 });
  }

  function spawnShield() {
    const size = 25;
    shields.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, v: 1.5 });
  }

  function update() {
    if (gameOver) return;
    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Meteors
    if (frame % 30 === 0) spawnMeteor(); // roughly one per half‑second at 60fps
    meteors.forEach(m => m.y += m.v + 0.01 * frame); // accelerate over time
    meteors = meteors.filter(m => m.y < height + m.h);

    // Shields
    if (frame % 600 === 0) spawnShield(); // occasional power‑up
    shields.forEach(s => s.y += s.v);
    shields = shields.filter(s => s.y < height + s.h);

    // Collision detection
    meteors.forEach(m => {
      if (!shieldActive && rectIntersect(ship, m)) {
        hitSound.currentTime = 0;
        hitSound.play();
        gameOver = true;
      }
    });
    shields.forEach((s, i) => {
      if (rectIntersect(ship, s)) {
        shieldActive = true;
        shieldTimer = 300; // 5 seconds at 60fps
        shieldSound.currentTime = 0;
        shieldSound.play();
        shields.splice(i, 1);
      }
    });
    if (shieldActive) {
      shieldTimer--;
      if (shieldTimer <= 0) shieldActive = false;
    }

    frame++;
    draw();
    requestAnimationFrame(update);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#001020');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Ship as triangle, color indicates shield
    ctx.fillStyle = shieldActive ? 'rgba(0,255,255,0.8)' : 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.closePath();
    ctx.fill();

    // Meteors as circles with radial shading
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w * 0.2,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Shields as glowing aura
    shields.forEach(s => {
      ctx.fillStyle = 'rgba(255,215,0,0.7)';
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(200,0,0,0.8)';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  update();
})();
