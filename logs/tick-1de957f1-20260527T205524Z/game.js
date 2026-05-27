// Canvas Escape – minimal endless‑runner
// Canvas element with id "game" is expected in the HTML.

(() => {
  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume on user interaction (click or key press)
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  function playCollision() { playTone(150, 200); }
  function playGameOver() { playTone(80, 500); }

  const canvas = document.getElementById('game');
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- player -----
  const player = {
    x: width * 0.2,
    y: height / 2,
    radius: 12,
    speedX: 0,
    speedY: 0,
    maxSpeed: 4,
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      // keep inside bounds (lose condition if out)
      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.alive = false;
    },
    draw() {
      // radial gradient for glowing effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#fffacd');
      grad.addColorStop(1, '#ff8800');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    },
    alive: true,
  };

  // ----- input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    player.speedX = 0; player.speedY = 0;
    if (keys.ArrowUp) player.speedY = -player.maxSpeed;
    if (keys.ArrowDown) player.speedY = player.maxSpeed;
    if (keys.ArrowLeft) player.speedX = -player.maxSpeed;
    if (keys.ArrowRight) player.speedX = player.maxSpeed;
  }

  // ----- obstacles -----
  class Obstacle {
    constructor() {
      this.x = width + 40; // start off‑screen
      this.y = Math.random() * height;
      this.width = 80; // length of bar
      this.height = 20; // thickness of bar
      this.gap = 80; // size of gap in the bar
      this.angle = 0; // rotation angle in radians
      this.speed = 2; // horizontal speed
      // random rotation direction
      this.rotSpeed = (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 180) * (1 + Math.random() * 2);
    }
    update() {
      this.x -= this.speed;
      this.angle += this.rotSpeed;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = '#3498db';
      // draw two rectangles leaving a gap in the middle
      // top part
      ctx.fillRect(-this.width / 2, -this.height / 2 - this.gap / 2, this.width, this.height);
      // bottom part
      ctx.fillRect(-this.width / 2, this.gap / 2, this.width, this.height);
      ctx.restore();
    }
    // simple circle‑rectangle collision using separating axis theorem approximation
    collides(circle) {
      // approximate by checking distance from obstacle center line
      const dx = circle.x - this.x;
      const dy = circle.y - this.y;
      // rotate point opposite to obstacle rotation
      const cos = Math.cos(-this.angle);
      const sin = Math.sin(-this.angle);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      // check against two axis‑aligned rectangles
      const halfW = this.width / 2;
      const halfH = this.height / 2;
      const gapHalf = this.gap / 2;
      const inTop = ry > -halfH - circle.radius && ry < -gapHalf && rx > -halfW && rx < halfW;
      const inBottom = ry > gapHalf && ry < halfH + circle.radius && rx > -halfW && rx < halfW;
      return inTop || inBottom;
    }
    offscreen() { return this.x + this.width < 0; }
  }

  const obstacles = [];
  let frame = 0;
  let gameOverPlayed = false;
  let score = 0;

  function spawnObstacle() {
    obstacles.push(new Obstacle());
  }

  function update() {
    if (!player.alive) return;
    handleInput();
    player.update();
    // obstacles
    obstacles.forEach(o => o.update());
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].offscreen()) obstacles.shift();
    // collision
    for (const o of obstacles) {
      if (o.collides(player)) { player.alive = false; playCollision(); break; }
    }
    // score – increase per frame
    score++;
    // spawn new obstacles every 120 frames (~2 sec at 60fps)
    if (frame % 120 === 0) spawnObstacle();
    frame++;
  }

function draw() {
    // motion‑blur effect: draw a translucent dark rectangle over previous frame
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // obstacles (draw with gradient)
    obstacles.forEach(o => o.draw());
    // player
    if (player.alive) player.draw();
    // score overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (!player.alive) {
      if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (player.alive) requestAnimationFrame(loop);
  }

  // start
  spawnObstacle();
  requestAnimationFrame(loop);
})();
