// Simple canvas space game with enhanced graphics
// Target canvas with id="game"
// Target canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ---- Audio setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound(){
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = osc;
  }
  function stopThrustSound(){
    if (thrustOsc){
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Game objects -----
  // Ship object with thrust visual effect
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 10,
    thrusting: false,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // ship hull
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      // thrust flame
      if (this.thrusting) {
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
      }
      ctx.restore();
    },
    update() {
      this.x += this.vx;
      this.y += this.vy;
      // wrap around edges
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    }
  };

  // set thrust visual flag during update
  function handleInput() {
    // Ensure audio context is running after user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.thrusting = true;
      startThrustSound();
    } else {
      ship.thrusting = false;
      stopThrustSound();
    }
  }

  // Asteroid with irregular polygon shape
function createAsteroid() {
    const size = Math.random() * 20 + 15;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.2;
    const sides = 8;
    const points = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const r = size * (0.6 + Math.random() * 0.4);
      points.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
    }
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: size,
      points,
      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x + this.points[0].x, this.y + this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.x + this.points[i].x, this.y + this.points[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#aaa';
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,200,200,0.3)';
        ctx.fill();
      },
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.r) this.x = width + this.r;
        if (this.x > width + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = height + this.r;
        if (this.y > height + this.r) this.y = -this.r;
      }
    };
  }

  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 3,
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
      }
    };
  }

  const asteroids = [];
  const stars = [];
  const ASTEROID_COUNT = 8;
  const STAR_COUNT = 5;
  for (let i = 0; i < ASTEROID_COUNT; i++) asteroids.push(createAsteroid());
  for (let i = 0; i < STAR_COUNT; i++) stars.push(createStar());

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Game state -----
  let score = 0;
  let gameOver = false;

  function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  }

  function update() {
    if (gameOver) return;
    // handle input and thrust visual
    handleInput();
    // ship friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.update();

    asteroids.forEach(a => a.update());

    // collision ship-asteroid
    for (const a of asteroids) {
      if (checkCollision({x: ship.x, y: ship.y, r: ship.radius}, a)) {
        gameOver = true;
        playBeep(100, 0.3); // collision sound
        break;
      }
    }

    // star collection
for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        if (checkCollision({x: ship.x, y: ship.y, r: ship.radius}, {x: s.x, y: s.y, r: s.r})) {
          score++;
          playBeep(400, 0.1); // star collection sound
          stars.splice(i, 1);
          stars.push(createStar());
        }
      }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw stars with subtle twinkle
    stars.forEach(s => s.draw());
    // asteroids
    asteroids.forEach(a => a.draw());
    // ship with glow effect
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 8;
    ship.draw();
    ctx.shadowBlur = 0; // reset
    // UI overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
