// Enhanced Cosmic Courier graphics
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800), H = (canvas.height = 600);
  // generate starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.1); }
  function playCollision() { playTone(100, 0.2, 'square'); }
  function playPickup() { playTone(600, 0.15); }
  function playDelivery() { playTone(800, 0.2, 'triangle'); }
  function playGameOver() { playTone(50, 0.5, 'sawtooth'); }

  const ship = {
    x: W / 2,
    y: H / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotSpeed: 0.06,
    health: 100,
    fuel: 100,
    hasParcel: false,
  };

  const keys = {};
  window.addEventListener('keydown', e => {
  // resume AudioContext on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.code] = true;
});
  window.addEventListener('keyup', e => (keys[e.code] = false));

  const asteroids = [];
  for (let i = 0; i < 8; i++) {
    asteroids.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 20 + Math.random() * 15,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    });
  }

  let beacon = { x: 100, y: 100, r: 15, delivered: false };
  let delivery = { x: W - 100, y: H - 100, r: 15 };
  let score = 0;
  let timer = 0;
  const deadline = 30 * 60; // 30 seconds at 60fps

  function loop() {
    // Input handling
    if (keys['ArrowLeft']) ship.angle -= ship.rotSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotSpeed;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel = Math.max(0, ship.fuel - 0.1);
      playThrust();
    }

    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple screen wrap
    if (ship.x < 0) ship.x += W;
    if (ship.x > W) ship.x -= W;
    if (ship.y < 0) ship.y += H;
    if (ship.y > H) ship.y -= H;
    // Move starfield opposite to ship movement for parallax
    stars.forEach(s => {
      s.x -= ship.vx;
      s.y -= ship.vy;
      if (s.x < 0) s.x += W;
      if (s.x > W) s.x -= W;
      if (s.y < 0) s.y += H;
      if (s.y > H) s.y -= H;
    });

    // Move asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += W;
      if (a.x > W) a.x -= W;
      if (a.y < 0) a.y += H;
      if (a.y > H) a.y -= H;
    });

    // Collision ship-asteroid
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < ship.r + a.r) {
          ship.health -= 0.5;
          playCollision();
        }
    }

    // Beacon pickup
    if (!ship.hasParcel) {
      const d = Math.hypot(ship.x - beacon.x, ship.y - beacon.y);
      if (d < ship.r + beacon.r) {
        ship.hasParcel = true;
        playPickup();
      }
    }

    // Delivery
    if (ship.hasParcel) {
      const d = Math.hypot(ship.x - delivery.x, ship.y - delivery.y);
      if (d < ship.r + delivery.r) {
          playDelivery();
        score++;
        ship.hasParcel = false;
        // relocate beacon & delivery for next level
        beacon = { x: Math.random() * W, y: Math.random() * H, r: 15, delivered: false };
        delivery = { x: Math.random() * W, y: Math.random() * H, r: 15 };
        timer = 0;
      }
    }

    // Timer / lose condition
    timer++;
    if (timer > deadline || ship.health <= 0 || ship.fuel <= 0) {
      playGameOver();
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
      ctx.fillStyle = 'white';
      ctx.fillText(`Score: ${score}`, W / 2 - 60, H / 2 + 40);
      return;
    }

    // Render
    // background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    // starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-ship.r, -ship.r, ship.r, ship.r);
    shipGrad.addColorStop(0, 'lightblue');
    shipGrad.addColorStop(1, 'white');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // beacon with glow
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = ship.hasParcel ? 'orange' : 'lime';
    ctx.fillStyle = ship.hasParcel ? 'orange' : 'lime';
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, beacon.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // delivery point with subtle glow
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'cyan';
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.arc(delivery.x, delivery.y, delivery.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${Math.round(ship.health)}`, 10, 38);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 56);
    ctx.fillText(`Parcel: ${ship.hasParcel ? 'Yes' : 'No'}`, 10, 74);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
