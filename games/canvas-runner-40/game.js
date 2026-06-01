// Simple side‑scroll runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;
  // Create sky gradient background
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#87ceeb'); // light blue
  skyGradient.addColorStop(1, '#fff'); // near horizon
  // Ground color
  const groundColor = '#4caf50';
  // Sun
  const sunX = width * 0.85;
  const sunY = height * 0.2;
  const sunRadius = 40;
  // Clouds
  const clouds = [];
  let cloudTimer = 0;
  function spawnCloud() {
    const r = 20 + Math.random() * 30;
    const y = Math.random() * height * 0.4;
    clouds.push({ x: width, y, r });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() {
    playTone(440, 0.1);
  }
  function playGameOverSound() {
    // low pitch descending beep series
    for (let i = 0; i < 3; i++) {
      playTone(200 - i * 50, 0.15);
    }
  }

  // Player properties
  const player = {
    x: 50,
    y: height - 30,
    radius: 10,
    vy: 0,
    onGround: true,
jump() {
        if (this.onGround) {
          this.vy = -8; // upward velocity
          this.onGround = false;
          playJumpSound();
        }
      },
    update() {
      this.vy += 0.4; // gravity
      this.y += this.vy;
      if (this.y >= height - 30) {
        this.y = height - 30;
        this.vy = 0;
        this.onGround = true;
      }
    },
    draw() {
      // player with radial gradient
    const grad = ctx.createRadialGradient(this.x, this.y, this.radius*0.2, this.x, this.y, this.radius);
    grad.addColorStop(0, '#fff700');
    grad.addColorStop(1, '#ff8c00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    }
  };

  // Obstacle constructor
  function Obstacle() {
    this.x = width;
    this.y = height - 30;
    this.w = 20;
    this.h = 30;
  }
  Obstacle.prototype.update = function() {
    this.x -= 4; // speed
  };
  Obstacle.prototype.draw = function() {
    // obstacle with simple vertical gradient
    const grad = ctx.createLinearGradient(this.x, this.y - this.h, this.x, this.y);
    grad.addColorStop(0, '#b71c1c'); // dark red top
    grad.addColorStop(1, '#f44336'); // bright red bottom
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y - this.h, this.w, this.h);
  };

  const obstacles = [];
  let spawnTimer = 0;
  let gameOver = false;

  function spawnObstacle() {
    obstacles.push(new Obstacle());
  }

  function checkCollision(ob) {
    // simple AABB vs circle
    const distX = Math.abs(player.x - (ob.x + ob.w / 2));
    const distY = Math.abs(player.y - (ob.y - ob.h / 2));
    if (distX > (ob.w / 2 + player.radius)) return false;
    if (distY > (ob.h / 2 + player.radius)) return false;
    if (distX <= (ob.w / 2)) return true;
    if (distY <= (ob.h / 2)) return true;
    const dx = distX - ob.w / 2;
    const dy = distY - ob.h / 2;
    return (dx * dx + dy * dy <= (player.radius * player.radius));
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width/2-60, height/2);
      return;
    }
    // draw sky background
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    // draw sun
    const sunGrad = ctx.createRadialGradient(sunX, sunY, sunRadius*0.1, sunX, sunY, sunRadius);
    sunGrad.addColorStop(0, '#fff176');
    sunGrad.addColorStop(1, '#f57f17');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI*2);
    ctx.fill();
    // draw clouds
    cloudTimer--;
    if (cloudTimer <= 0) {
      spawnCloud();
      cloudTimer = 200 + Math.random()*100;
    }
    for (let i = clouds.length-1; i>=0; i--) {
      const c = clouds[i];
      c.x -= 1; // slower than obstacles
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
      ctx.fill();
      if (c.x + c.r < 0) clouds.splice(i,1);
    }
    // draw ground as rectangle
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, height - 20, width, 20);

    // player
    player.update();
    player.draw();

    // obstacles
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 90 + Math.random()*60; // frames until next
    }
    for (let i = obstacles.length-1; i>=0; i--) {
      const ob = obstacles[i];
      ob.update();
      ob.draw();
      if (ob.x + ob.w < 0) obstacles.splice(i,1);
      else if (checkCollision(ob)) {
        gameOver = true;
        playGameOverSound();
      }
    }
    requestAnimationFrame(loop);
  }

  // input
  function ensureAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  window.addEventListener('keydown', e => {
    ensureAudio();
    if (e.code === 'Space') player.jump();
  });
  canvas.addEventListener('click', () => {
    ensureAudio();
    player.jump();
  });

  // start
  requestAnimationFrame(loop);
})();
