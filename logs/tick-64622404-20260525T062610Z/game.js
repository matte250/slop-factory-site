// Simple canvas game based on IDEA.md
// Player controls a ship at the bottom of the canvas (id="game") and collects falling debris for points.
// Hazardous asteroids also fall; colliding with one or letting too much debris pile up ends the game.

(() => {
  // Starfield background
  const STAR_COUNT = 100;
  const stars = [];
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1
      });
    }
  }
  initStars();

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.width || 800;
  const HEIGHT = canvas.height = canvas.height || 600;
  // Simple sound effects (placeholders – replace URLs with actual files)
  const sounds = {
    collect: new Audio('collect.wav'),
    explode: new Audio('explosion.wav'),
    gameOver: new Audio('gameover.wav'),
    bgm: new Audio('bgm.mp3')
  };
  // Enable looping background music and start after first interaction
  sounds.bgm.loop = true;
  let bgmStarted = false;
  function startBgm() {
    if (!bgmStarted) { sounds.bgm.play().catch(() => {}); bgmStarted = true; }
  }

  // Game state
  let score = 0;
  let gameOver = false;
  const debrisPileLimit = 10; // max debris allowed to rest on ground
  let debrisOnGround = 0;

  // Ship definition
  const ship = {
    width: 40,
    height: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(WIDTH - this.width, this.x + this.speed);
    },
    draw() {
      // Ship with a simple gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#0066ff');
      grad.addColorStop(1, '#0033aa');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Falling object constructor
  function createFalling(x, speed, type) {
    return {
      x,
      y: 0,
      size: 20,
      speed,
      type, // 'debris' or 'asteroid'
      update() {
        this.y += this.speed;
      },
      draw() {
        ctx.fillStyle = this.type === 'debris' ? '#0f0' : '#f00';
        ctx.fillRect(this.x, this.y, this.size, this.size);
      }
    };
  }

  const debris = [];
  const asteroids = [];

  // Spawn intervals
  let debrisTimer = 0;
  let asteroidTimer = 0;
  const debrisInterval = 60; // frames
  const asteroidInterval = 150;

  // Input handling
  window.addEventListener('keydown', e => {
    // Start background music on first user interaction
    startBgm();
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  function checkCollision(obj) {
    const withinX = obj.x < ship.x + ship.width && obj.x + obj.size > ship.x;
    const withinY = obj.y < ship.y + ship.height && obj.y + obj.size > ship.y;
    return withinX && withinY;
  }

  function update() {
    if (gameOver) return;
    // Spawn debris
    if (debrisTimer++ >= debrisInterval) {
      debrisTimer = 0;
      const x = Math.random() * (WIDTH - 20);
      debris.push(createFalling(x, 2 + Math.random() * 2, 'debris'));
    }
    // Spawn asteroids
    if (asteroidTimer++ >= asteroidInterval) {
      asteroidTimer = 0;
      const x = Math.random() * (WIDTH - 20);
      asteroids.push(createFalling(x, 3 + Math.random() * 2, 'asteroid'));
    }

    ship.update();

    // Update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.update();
      // Collision with ship
if (checkCollision(d)) {
          score += 10;
          // Play collect sound
          sounds.collect.currentTime = 0;
          sounds.collect.play();
          debris.splice(i, 1);
          continue;
        }
      // Hit ground
      if (d.y + d.size >= HEIGHT) {
        debrisOnGround++;
        debris.splice(i, 1);
        if (debrisOnGround >= debrisPileLimit) {
          endGame('Too much debris piled up!');
          return;
        }
      }
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.update();
      if (checkCollision(a)) {
        // Play explosion sound
        sounds.explode.currentTime = 0;
        sounds.explode.play();
        endGame('Hit by an asteroid!');
        return;
      }
      if (a.y > HEIGHT) {
        // Remove off‑screen asteroid
        asteroids.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Draw starfield background
    ctx.fillStyle = '#000';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > HEIGHT) {
        s.y = 0;
        s.x = Math.random() * WIDTH;
      }
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Draw ship
    ship.draw();
    // Draw debris
    debris.forEach(d => d.draw());
    // Draw asteroids
    asteroids.forEach(a => a.draw());
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    }
  }

  function endGame(msg) {
    gameOver = true;
    // Play game over sound
    sounds.gameOver.currentTime = 0;
    sounds.gameOver.play();
    // Optionally stop background music
    sounds.bgm.pause();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(msg, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText('Final Score: ' + score, WIDTH / 2, HEIGHT / 2 + 60);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
