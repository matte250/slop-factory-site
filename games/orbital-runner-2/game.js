// Orbital Runner – simple canvas game
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set full‑screen size (adjust as needed)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'square') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  // sound wrappers
  const sounds = {
    thrust: () => playTone(300, 0.08, 'sawtooth'),
    collect: () => playTone(800, 0.07, 'triangle'),
    crash: () => playTone(100, 0.3, 'sawtooth'),
  };

  // ----- Game objects -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 10,
    angle: -Math.PI / 2, // pointing up
    speed: 0,
    thrust: 0.2,
    friction: 0.99,
    rotateSpeed: 0.07,
    update() {
      // rotate ship
      if (keys.ArrowLeft) this.angle -= this.rotateSpeed;
      if (keys.ArrowRight) this.angle += this.rotateSpeed;
      // thrust
      if (keys.ArrowUp) {
        this.speed += this.thrust;
        this.vx += Math.cos(this.angle) * this.thrust;
        this.vy += Math.sin(this.angle) * this.thrust;
        // play thrust sound
        if (typeof sounds !== 'undefined') sounds.thrust();
      }
      // apply velocity
      this.x += this.vx || 0;
      this.y += this.vy || 0;
      // friction
      this.vx *= this.friction;
      this.vy *= this.friction;
      // wrap around edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    },
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // ship body gradient
      const grad = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.shadowColor = 'rgba(0,255,255,0.6)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    },
    vx: 0,
    vy: 0,
  };

  class Asteroid {
    constructor() {
      this.radius = 20 + Math.random() * 30;
      this.x = Math.random() * canvas.width;
      this.y = -this.radius;
      this.speedY = 1 + Math.random() * 2;
      this.angle = Math.random() * Math.PI * 2;
      this.rotateSpeed = (Math.random() - 0.5) * 0.04;
    }
    update() {
      this.y += this.speedY;
      this.angle += this.rotateSpeed;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // asteroid gradient fill
      const grad = ctx.createRadialGradient(0, 0, this.radius * 0.3, 0, 0, this.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.restore();
    }
  }

  class Star {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = -5;
      this.radius = 3;
      this.speedY = 2 + Math.random() * 2;
    }
    update() {
      this.y += this.speedY;
    }
    draw() {
      // glowing star gradient
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
      grad.addColorStop(0, 'rgba(255,255,150,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const asteroids = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  const keys = {};
  // Resume audio context on first user gesture
  function resumeAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  }
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    if (asteroids.length < 6) asteroids.push(new Asteroid());
  }
  function spawnStar() {
    if (Math.random() < 0.02) stars.push(new Star());
  }

  function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.radius + b.radius;
  }

  function update() {
    if (gameOver) return;
    // background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ship.update();
    ship.draw();
    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      a.draw();
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
      else if (checkCollision(ship, a)) {
        // play crash sound
        if (typeof sounds !== 'undefined') sounds.crash();
        gameOver = true;
      }
    }
    // stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.update();
      s.draw();
      if (s.y - s.radius > canvas.height) stars.splice(i, 1);
      else if (checkCollision(ship, s)) {
        score++;
        stars.splice(i, 1);
      }
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    spawnAsteroid();
    spawnStar();
    update();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
