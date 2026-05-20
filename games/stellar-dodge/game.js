// Simple Stellar Dodge game with enhanced graphics
// Assumes a <canvas id="game"></canvas> element exists in the page.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // full‑window canvas
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.08); }
  function playExplosion() { playTone(150, 0.2); }
  function playGameOver() { playTone(60, 0.5); }

  const PLAYER_SIZE = 20;
  const METEOR_SIZE = 30;
  const STAR_SIZE = 10;
  const METEOR_SPEED = 2;
  const STAR_SPEED = 1.5;
  const PLAYER_SPEED = 4;
  const SPAWN_INTERVAL = 1500; // ms
  const STAR_INTERVAL = 2000;
  const BG_STAR_INTERVAL = 100; // background twinkling stars

  let score = 0;
  let lives = 3;
  let lastSpawn = 0;
  let lastStar = 0;
  let lastBgStar = 0;
  let keys = {};
  const meteors = [];
  const stars = [];
  const bgStars = [];
  const particles = [];

  // Player ship – stylized triangle with stroke
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.height / 2);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    },
    update() {
      if (keys['ArrowLeft'] && this.x - this.width / 2 > 0) this.x -= PLAYER_SPEED;
      if (keys['ArrowRight'] && this.x + this.width / 2 < canvas.width) this.x += PLAYER_SPEED;
      if (keys['ArrowUp'] && this.y - this.height / 2 > 0) this.y -= PLAYER_SPEED;
      if (keys['ArrowDown'] && this.y + this.height / 2 < canvas.height) this.y += PLAYER_SPEED;
    }
  };

  class Meteor {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = -METEOR_SIZE;
      this.r = METEOR_SIZE / 2 + Math.random() * 10;
      this.vy = METEOR_SPEED + Math.random();
    }
    update() { this.y += this.vy; }
    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#ff8c00');
      grad.addColorStop(1, '#8b0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class Star {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = -STAR_SIZE;
      this.r = STAR_SIZE / 2 + Math.random() * 4;
      this.vy = STAR_SPEED + Math.random();
    }
    update() { this.y += this.vy; }
    draw() {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class BgStar {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.r = Math.random() * 2 + 0.5;
      this.alpha = Math.random();
    }
    update() {
      this.alpha -= 0.01;
      if (this.alpha <= 0) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 2 + 0.5;
        this.alpha = Math.random();
      }
    }
    draw() {
      ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.life = 30;
      this.size = Math.random() * 2 + 1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
    }
    draw() {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function rectCircleCollision(circle, rect) {
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > rect.width / 2 + circle.r) return false;
    if (distY > rect.height / 2 + circle.r) return false;
    if (distX <= rect.width / 2) return true;
    if (distY <= rect.height / 2) return true;
    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update(timestamp) {
    // spawn meteors
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      meteors.push(new Meteor());
      lastSpawn = timestamp;
    }
    if (timestamp - lastStar > STAR_INTERVAL) {
      stars.push(new Star());
      lastStar = timestamp;
    }
    if (timestamp - lastBgStar > BG_STAR_INTERVAL) {
      bgStars.push(new BgStar());
      lastBgStar = timestamp;
    }

    // clear with subtle space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001030');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw background twinkling stars
    for (let i = bgStars.length - 1; i >= 0; i--) {
      const bs = bgStars[i];
      bs.update();
      bs.draw();
    }

    // update and draw collectible stars (behind)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.update();
      s.draw();
      if (s.y - s.r > canvas.height) stars.splice(i, 1);
      else if (rectCircleCollision({x: s.x, y: s.y, r: s.r}, player)) {
        score += 10;
        stars.splice(i, 1);
        playCollect();
      }
    }

    // update player
    player.update();
    player.draw();

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.update();
      m.draw();
      if (m.y - m.r > canvas.height) {
        meteors.splice(i, 1);
      } else if (rectCircleCollision({x: m.x, y: m.y, r: m.r}, player)) {
        lives--;
        // play explosion sound
        playExplosion();
        // create explosion particles
        for (let p = 0; p < 12; p++) particles.push(new Particle(m.x, m.y));
        meteors.splice(i, 1);
        if (lives <= 0) {
          // play game over sound
          playGameOver();
          // game over screen
          ctx.fillStyle = '#fff';
          ctx.font = '48px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
          ctx.fillText(`Score: ${score}`,
            canvas.width / 2, canvas.height / 2 + 60);
          return;
        }
      }
    }

    // update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.life <= 0) particles.splice(i, 1);
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);

    requestAnimationFrame(update);
  }

  // input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  requestAnimationFrame(update);
})();
