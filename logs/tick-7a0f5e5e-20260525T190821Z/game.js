// Simple endless runner with improved graphics for canvas id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Game state
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  // Load sound effects (provide .wav/.mp3 files in same directory)
  const sounds = {
    jump: new Audio('jump.wav'),
    star: new Audio('star.wav'),
    gameOver: new Audio('gameover.wav'),
    // optional background music loop
    // bgm: (() => { const a = new Audio('bgm.mp3'); a.loop = true; a.volume = 0.3; return a; })()
  };
  // Uncomment below to start background music automatically
  // sounds.bgm && sounds.bgm.play();

  // parallax clouds
  skyGradient.addColorStop(0, '#4a90e2'); // top sky blue
  skyGradient.addColorStop(1, '#a1c4fd'); // bottom lighter

  // parallax clouds
  const clouds = [];
  function spawnCloud() {
    const y = Math.random() * (height * 0.5);
    const size = 30 + Math.random() * 50;
    clouds.push({x: width, y, size, speed: speed * 0.3});
  }
  let cloudTimer = 0;
  let score = 0;
  let gameOver = false;
  const gravity = 0.6;
  const jumpStrength = -12;
  const speed = 4; // world scroll speed

  const player = {
    x: 80,
    y: height - 60,
    w: 40,
    h: 40,
    vy: 0,
    onGround: true,
    draw() { ctx.fillStyle = '#0b8'; ctx.fillRect(this.x, this.y, this.w, this.h); },
    update() {
      this.vy += gravity;
      this.y += this.vy;
      if (this.y + this.h >= height) {
        this.y = height - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() { if (this.onGround) { this.vy = jumpStrength; this.onGround = false; sounds.jump.currentTime = 0; sounds.jump.play(); } }
  };

  // obstacles and stars store {x, y, w, h, type}
  const obstacles = [];
  const stars = [];
  let spawnTimer = 0;

  function spawn() {
    // random gap between obstacles
    const gap = 150 + Math.random() * 100;
    const lastX = obstacles.length ? obstacles[obstacles.length - 1].x : width;
    const obsX = lastX + gap;
    const obsHeight = 30 + Math.random() * 40;
    obstacles.push({x: obsX, y: height - obsHeight, w: 30, h: obsHeight, type: 'obstacle'});
    // maybe add a star above
    if (Math.random() < 0.5) {
      stars.push({x: obsX + 15, y: height - obsHeight - 60, r: 8, type: 'star'});
    }
  }

  function updateObjects(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const o = arr[i];
      o.x -= speed;
      if (o.x + (o.w || o.r * 2) < 0) arr.splice(i, 1);
    }
  }

  function checkCollisions() {
    // player vs obstacles
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        sounds.gameOver.currentTime = 0;
        sounds.gameOver.play();
        break;
      }
    }
    // player vs stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = (player.x + player.w/2) - (s.x + s.r);
      const dy = (player.y + player.h/2) - (s.y + s.r);
      const dist = Math.hypot(dx, dy);
if (dist < player.w/2 + s.r) {
          score += 10;
          stars.splice(i, 1);
          sounds.star.currentTime = 0;
          sounds.star.play();
        }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // sky background
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x + c.size/2, c.y + c.size/2, c.size/2, 0, Math.PI * 2);
      ctx.fill();
    });
    // ground line
    ctx.fillStyle = '#654';
    ctx.fillRect(0, height - 10, width, 10);
    // player (draw as rounded character)
    ctx.fillStyle = '#0b8';
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI * 2);
    ctx.fillRect(player.x, player.y, player.w, player.h); // keep rectangle base for collision
    // obstacles
    ctx.fillStyle = '#b33';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // stars
    ctx.fillStyle = '#ff0';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x + s.r, s.y + s.r, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop() {
    if (!gameOver) {
      player.update();
      updateObjects(obstacles);
      updateObjects(stars);
      // update clouds
      for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        c.x -= c.speed;
        if (c.x + c.size < 0) clouds.splice(i, 1);
      }
      cloudTimer += speed;
      if (cloudTimer > 200) { spawnCloud(); cloudTimer = 0; }

      spawnTimer += speed;
      if (spawnTimer > 120) { spawn(); spawnTimer = 0; }
      checkCollisions();
      score += 0.1; // incremental score
    }
    draw();
    requestAnimationFrame(loop);
  }

  // input handling
  canvas.addEventListener('mousedown', () => player.jump());
  canvas.addEventListener('touchstart', e => { e.preventDefault(); player.jump(); }, {passive:false});

  // start
  spawn();
  loop();
})();
