// Simple Meteor Dodge game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 600);
  // Starfield
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      // Ship with gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#004400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      this.x = Math.max(0, Math.min(this.x, width - this.w));
    },
  };

  // Meteor class
  class Meteor {
    constructor() {
      this.r = Math.random() * 15 + 10; // radius
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = Math.random() * 2 + 2 + Meteor.baseSpeed;
    }
    static baseSpeed = 0;
    update() {
      this.y += this.speed;
    }
    draw() {
      // Meteor with radial gradient and glow
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#ffb380');
      grad.addColorStop(1, '#8b0000');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset for other drawings
    }
    isOffScreen() {
      return this.y - this.r > height;
    }
    collidesWithShip() {
      const dx = Math.abs(this.x - (ship.x + ship.w / 2));
      const dy = Math.abs(this.y - (ship.y + ship.h / 2));
      // simple bounding box check
      return dx < this.r + ship.w / 2 && dy < this.r + ship.h / 2;
    }
  }

  const meteors = [];
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    meteors.push(new Meteor());
    // sound for meteor spawn
    playTone(200, 0.08);
  }

  function update() {
    if (gameOver) return;
    ship.update();
    // Move stars for parallax effect
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // spawn meteors
    if (spawnTimer <= 0) {
      spawnMeteor();
      spawnTimer = spawnInterval;
    } else {
      spawnTimer--;
    }
    // update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.update();
      if (m.collidesWithShip()) {
        gameOver = true;
      }
      if (m.isOffScreen()) {
        meteors.splice(i, 1);
        score++;
        // speed up every 10 points
        if (score % 10 === 0) {
          Meteor.baseSpeed += 0.5;
          spawnInterval = Math.max(30, spawnInterval - 5);
        }
      }
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // Ship and meteors
    ship.draw();
    for (const m of meteors) m.draw();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') ship.moveLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') ship.moveRight = true;
    if (gameOver && e.code === 'Space') restart();
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') ship.moveLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') ship.moveRight = false;
  });

  function restart() {
    meteors.length = 0;
    score = 0;
    Meteor.baseSpeed = 0;
    spawnInterval = 90;
    ship.x = width / 2 - ship.w / 2;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
