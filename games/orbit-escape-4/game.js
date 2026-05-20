// Orbit Escape – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playGameOverSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  // Generate static star field
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Planet parameters (center of canvas)
  const planet = { x: width / 2, y: height / 2, radius: 40 };

  // Ship state
  let ship = {
    x: planet.x + planet.radius + 20, // start just outside planet
    y: planet.y,
    vx: 0,
    vy: -0.6, // initial low orbit velocity (counter‑clockwise)
    angle: Math.PI / 2, // facing upward
    radius: 8,
  };

  const GRAVITY = 0.05; // acceleration magnitude toward planet
  const THRUST = 0.15; // thrust per frame when up arrow pressed
  const ROT_SPEED = 0.04; // radians per frame for left/right arrows

  let keys = {};
  let alive = true;
  let startTime = performance.now();
  let score = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') {
      audioCtx.resume(); // ensure context is running
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') {
      stopThrustSound();
    }
  });

  function update(dt) {
    if (!alive) return;
    // rotate ship
    if (keys['ArrowLeft']) ship.angle -= ROT_SPEED;
    if (keys['ArrowRight']) ship.angle += ROT_SPEED;
    // thrust forward
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
    }
    // gravity toward planet
    const dx = planet.x - ship.x;
    const dy = planet.y - ship.y;
    const dist = Math.hypot(dx, dy);
    const ax = (dx / dist) * GRAVITY;
    const ay = (dy / dist) * GRAVITY;
    ship.vx += ax;
    ship.vy += ay;

    // integrate position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // lose conditions
    if (dist < planet.radius + ship.radius) {
      alive = false; // crash
      playGameOverSound();
    } else if (
      ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height
    ) {
      alive = false; // left canvas
      playGameOverSound();
    }

    // update score (seconds survived)
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
  }

  function render() {
    // background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw planet with radial gradient
    const grad = ctx.createRadialGradient(
      planet.x - planet.radius / 3,
      planet.y - planet.radius / 3,
      planet.radius * 0.2,
      planet.x,
      planet.y,
      planet.radius
    );
    grad.addColorStop(0, '#88c0ff');
    grad.addColorStop(1, '#3366ff');
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // draw ship
    drawShip();

    // UI score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (!alive) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    render();
    if (alive) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
