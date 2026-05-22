// Simple endless runner with enhanced graphics
// Ship ascends on click/tap, avoids scrolling buildings.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Resize canvas to fill its container
  const stars = [];
  const clouds = [];
  const generateStars = () => {
    const count = Math.floor(canvas.width * canvas.height * 0.0001);
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.6, r: Math.random() * 1.5 + 0.5 });
    }
  };
  // Generate simple clouds for background
  const generateClouds = () => {
    const count = Math.floor(canvas.width * 0.02);
    clouds.length = 0;
    for (let i = 0; i < count; i++) {
      const w = 60 + Math.random() * 40;
      const h = 30 + Math.random() * 20;
      clouds.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.4, w, h, speed: 0.5 + Math.random() * 0.5 });
    }
  };
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      generateStars();
      generateClouds();
    };
  window.addEventListener('resize', resize);
  // Generate stars and clouds initially and on resize
  generateStars();
  generateClouds();
  resize();

  const ship = {
    x: 50,
    y: 0,
    w: 20,
    h: 15,
    vy: 0,
    color: '#ff0',
  };

  const gravity = 0.4;
  const thrust = -8; // upward velocity on input

  let buildings = [];
  const buildingSpeed = 2;
  const buildingGap = 150; // distance between buildings
  const minHeight = 40;
  const maxHeight = 200;

  let frame = 0;
  let score = 0;
  let running = true;

  let thrusting = false;
  const inputHandler = () => {
    if (running) {
      ship.vy = thrust;
      thrusting = true;
      // Play thrust sound
      playTone(400, 0.08);
    }
  };
  canvas.addEventListener('click', inputHandler);
  canvas.addEventListener('touchstart', inputHandler);

  const addBuilding = () => {
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    const x = canvas.width + (buildings.length ? buildingGap : 0);
    buildings.push({ x, w: 40, h: height });
  };

  const update = () => {
    if (!running) return;
    frame++;
    // Ship physics
    ship.vy += gravity;
    ship.y += ship.vy;
    // Keep ship within top bound
    if (ship.y < 0) ship.y = 0, ship.vy = 0;
    // Ground check (bottom of canvas)
    if (ship.y + ship.h > canvas.height) {
      running = false;
      playTone(150, 0.3);
    }
    // Buildings movement
    buildings.forEach(b => b.x -= buildingSpeed);
    // Clouds movement (parallax)
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.w < 0) {
        c.x = canvas.width + Math.random() * 100;
        c.y = Math.random() * canvas.height * 0.4;
      }
    });
    // Remove off‑screen buildings
    if (buildings.length && buildings[0].x + buildings[0].w < 0) buildings.shift();
    // Add new building as needed
    if (!buildings.length || buildings[buildings.length - 1].x < canvas.width - buildingGap) {
      addBuilding();
    }
    // Collision detection
    for (const b of buildings) {
      const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
      const buildingRect = { x: b.x, y: canvas.height - b.h, w: b.w, h: b.h };
if (rectIntersect(shipRect, buildingRect)) {
            running = false;
            playTone(200, 0.2);
            break;
          }
    }
    // Score based on distance
    score = Math.floor(frame * buildingSpeed / 10);
  };

  const rectIntersect = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const draw = () => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#001d3a');
    skyGrad.addColorStop(1, '#0a2a5a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw clouds (simple rounded rectangles with gradient)
    for (const c of clouds) {
      const gradient = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
      gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(1, 'rgba(255,255,255,0.3)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
    }
    // Clear ground area before drawing other elements
    // (ground will be drawn later over sky)
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // removed
    // Draw ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    // Draw ship (simple triangle with thrust flame)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (thrusting && running) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h);
      ctx.lineTo(ship.x - ship.w / 4, ship.y + ship.h + 10);
      ctx.lineTo(ship.x + ship.w / 4, ship.y + ship.h + 10);
      ctx.closePath();
      ctx.fill();
      thrusting = false; // reset after draw
    }
    // Draw buildings with gradient and window lights
    for (const b of buildings) {
      const grad = ctx.createLinearGradient(0, canvas.height - b.h, 0, canvas.height);
      grad.addColorStop(0, '#333');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, canvas.height - b.h, b.w, b.h);
      // Window grid
      const rows = Math.floor(b.h / 20);
      const cols = Math.floor(b.w / 15);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() < 0.1) { // lit window chance
            ctx.fillStyle = '#ffea00';
            const wx = b.x + c * 15 + 3;
            const wy = canvas.height - b.h + r * 20 + 3;
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
    }
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}` , 10, 30);
    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Final Score: ${score}` , canvas.width / 2, canvas.height / 2 + 10);
    }
  };

  };

  const loop = () => {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  };
  // Start the game
  // Initialize first building to avoid empty start
  addBuilding();
  requestAnimationFrame(loop);
})();
