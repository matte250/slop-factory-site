// Meteor Dodge game
// Canvas with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // starfield background
  const starSpeed = 0.3; // subtle downward motion
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));
  // Sounds (using tiny data URIs)
  const sounds = {
    thrust: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='), // short silent placeholder
    explosion: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
    powerup: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
  };

  // Ship
  // Ship with triangle shape
  const ship = {
    w: 50,
    h: 20,
    x: width / 2 - 25,
    y: height - 30,
    speed: 5,
    lives: 3,
    draw() {
      // Draw ship as a green triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // Exhaust flame when moving
      if (left || right) {
        const grad = ctx.createLinearGradient(0, this.y + this.h, 0, this.y + this.h + 15);
        grad.addColorStop(0, '#ff8c00');
        grad.addColorStop(1, '#c00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x + this.w * 0.3, this.y + this.h);
        ctx.lineTo(this.x + this.w * 0.7, this.y + this.h);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h + 15);
        ctx.closePath();
        ctx.fill();
      }
    },
    move(dir) {
      this.x = Math.min(Math.max(this.x + dir * this.speed, 0), width - this.w);
    },
  };

  // Meteor class
  class Meteor {
    constructor() {
      this.r = Math.random() * 20 + 10;
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = Math.random() * 2 + 1;
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      // Meteor with radial gradient for a fiery look
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#ff8c00'); // bright core
      grad.addColorStop(0.7, '#a52a2a'); // outer rock
      grad.addColorStop(1, '#3b0'); // faint ember edge
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    collides(ship) {
      return (
        this.x + this.r > ship.x &&
        this.x - this.r < ship.x + ship.w &&
        this.y + this.r > ship.y &&
        this.y - this.r < ship.y + ship.h
      );
    }
  }

  // Power‑up class (simple circle, grants extra life)
  class PowerUp {
    constructor() {
      this.r = 8;
      this.x = Math.random() * (width - this.r * 2) + this.r;
      this.y = -this.r;
      this.speed = 2;
    }
    update() { this.y += this.speed; }
    draw() {
      // Power‑up with radial gradient for a glowing effect
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.6, '#ff0');
      grad.addColorStop(1, '#f80');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    collides(ship) {
      return (
        this.x + this.r > ship.x &&
        this.x - this.r < ship.x + ship.w &&
        this.y + this.r > ship.y &&
        this.y - this.r < ship.y + ship.h
      );
    }
  }

  const meteors = [];
  const powerUps = [];
  let frames = 0;
  let left = false,
    right = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') right = false;
  });

  function spawnMeteor() {
    meteors.push(new Meteor());
  }
  function spawnPowerUp() {
    powerUps.push(new PowerUp());
  }

  function update() {
    // move ship
    if (left) { ship.move(-1); sounds.thrust.currentTime = 0; sounds.thrust.play(); }
    if (right) { ship.move(1); sounds.thrust.currentTime = 0; sounds.thrust.play(); }

    // animate stars (slow downward motion)
    stars.forEach(s => {
      s.y += starSpeed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    // spawn objects
    if (frames % 60 === 0) spawnMeteor();
    if (frames % 600 === 0) spawnPowerUp();

    // update meteors
    meteors.forEach(m => m.update());
    // update power‑ups
    powerUps.forEach(p => p.update());

    // collision detection
    for (let i = meteors.length - 1; i >= 0; i--) {
        if (meteors[i].collides(ship)) {
          ship.lives--;
          meteors.splice(i, 1);
          sounds.explosion.currentTime = 0;
          sounds.explosion.play();
          if (ship.lives <= 0) endGame();
        } else if (meteors[i].y - meteors[i].r > height) {
          meteors.splice(i, 1);
        }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (powerUps[i].collides(ship)) {
          ship.lives = Math.min(ship.lives + 1, 5);
          powerUps.splice(i, 1);
          sounds.powerup.currentTime = 0;
          sounds.powerup.play();
        } else if (powerUps[i].y - powerUps[i].r > height) {
          powerUps.splice(i, 1);
        }
    }

    frames++;
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ship.draw();
    meteors.forEach(m => m.draw());
    powerUps.forEach(p => p.draw());
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Lives: ' + ship.lives, 10, 20);
  }

  let animationId;
  function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function endGame() {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  // start the game
  loop();
})();
