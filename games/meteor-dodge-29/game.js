// Meteor Dodge game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  // Resume audio on user interaction (required by browsers)
  const resumeAudio = () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  // Movement sound on key press
  window.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','a','d'].includes(e.key)) {
      playBeep(800, 50);
    }
  });

  // Set canvas size to match its display size
  const setSize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  setSize();
  window.addEventListener('resize', setSize);

  // Ship properties
  const ship = {
    width: 40,
    height: 20,
    x: 0,
    y: 0,
    speed: 7,
    color: '#00f',
    update() {
      this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    },
    draw() {
      // draw ship as a triangle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };
  ship.x = (canvas.width - ship.width) / 2;
  ship.y = canvas.height - ship.height - 5;

  // Meteor properties
  class Meteor {
    constructor() {
      this.radius = Math.random() * 15 + 10;
      this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
      this.y = -this.radius;
      this.speed = Math.random() * 2 + 1; // 1..3
      this.color = '#888';
    }
    update(dt) {
      this.y += this.speed * dt;
    }
    draw() {
      // meteor with radial gradient for glow
      const grad = ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.2,
        this.x, this.y, this.radius
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, this.color);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    isOffScreen() {
      return this.y - this.radius > canvas.height;
    }
  }

  const meteors = [];
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  let lastSpawn = 0;
  const spawnInterval = 800; // ms

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Collision detection (simple AABB vs circle approximation)
  const collides = (m) => {
    const shipRect = { x: ship.x, y: ship.y, w: ship.width, h: ship.height };
    // Find closest point on ship to meteor centre
    const closestX = Math.max(shipRect.x, Math.min(m.x, shipRect.x + shipRect.w));
    const closestY = Math.max(shipRect.y, Math.min(m.y, shipRect.y + shipRect.h));
    const dx = m.x - closestX;
    const dy = m.y - closestY;
    return dx * dx + dy * dy < m.radius * m.radius;
  };

  let startTime = null;
  let gameOver = false;
  let score = 0;

  const update = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (lastTime || timestamp)) / 16; // normalize roughly to 60fps steps
    lastTime = timestamp;

    if (gameOver) {
      // Show final score
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 20);
      ctx.fillText(`Score: ${Math.floor(score)}s`, canvas.width/2, canvas.height/2 + 20);
      return;
    }

    // Move ship based on input
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.update();

    // Spawn meteors
if (timestamp - lastSpawn > spawnInterval) {
        meteors.push(new Meteor());
        playBeep(600, 80); // meteor spawn sound
        lastSpawn = timestamp;
      }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.update(dt);
if (collides(m)) {
          playBeep(200, 300); // collision sound
          gameOver = true;
        }
      if (m.isOffScreen()) {
        meteors.splice(i, 1);
      }
    }

    // Update score (seconds survived)
    score = (timestamp - startTime) / 1000;

    // Render
    // Clear with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw stars (moving background)
    ctx.fillStyle = '#fff';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5; // star speed
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship and meteors
    ship.draw();
    meteors.forEach(m => m.draw());

    // Draw score with bright color
    ctx.fillStyle = '#0f0';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score.toFixed(1)}s`, 10, 20);

    requestAnimationFrame(update);
  };

  let lastTime = null;
  requestAnimationFrame(update);
})();
