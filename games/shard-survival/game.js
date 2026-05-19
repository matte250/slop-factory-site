// Simple shard survival game
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 400;
  const height = canvas.height = 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur/1000);
    osc.stop(audioCtx.currentTime + dur/1000);
  }

  // Starfield background
  const stars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5});
    }
  }
  initStars();

  // Background ambient sound
  const ambient = setInterval(() => playTone(80, 200), 3000);

  // Player (shard)
  const player = {x: width/2-10, y: height-60, w:20, h:20, speed:3};

  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
      // start sound
      playTone(300, 150);
    }
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 1200; // ms
  let lastTime = 0;
  let gameOver = false;
  let score = 0;

  function spawnObstacle() {
    const w = 30 + Math.random()*50;
    const h = 20 + Math.random()*30;
    const x = Math.random() * (width - w);
    const type = Math.random() < 0.5 ? 'spike' : 'blade';
    const angle = 0; // for blade rotation
    obstacles.push({x, y: -h, w, h, speed:2 + Math.random()*2, type, angle});
    // subtle spawn sound
    playTone(220, 80);
  }

  function update(dt) {
    // player movement
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(width-player.w, player.x));
    player.y = Math.max(0, Math.min(height-player.h, player.y));

    // starfield motion (slow downward)
    for (let s of stars) {
      s.y += 0.4;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }

    // obstacle generation
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
    }

    // move obstacles downwards
    for (let i = obstacles.length-1; i>=0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y > height) obstacles.splice(i,1);
      // collision
      if (rectIntersect(player, o)) {
        gameOver = true;
        playTone(150, 300);
        clearInterval(ambient);
      }
    }

    if (!gameOver) score += dt/1000; // seconds survived
  }

  function rectIntersect(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // starfield
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // player with glow
    ctx.save();
    ctx.shadowColor = '#8cf';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#8cf';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();

    // obstacles – spikes & rotating blades
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // draw triangle spike pointing down
        ctx.fillStyle = '#c33';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x + o.w/2, o.y + o.h);
        ctx.lineTo(o.x + o.w, o.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // rotating blade – simple line rectangle with rotation
        ctx.save();
        ctx.translate(o.x + o.w/2, o.y + o.h/2);
        ctx.rotate(o.angle);
        ctx.fillStyle = '#c33';
        ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
        ctx.restore();
        // slowly rotate for visual effect
        o.angle += 0.03;
      }
    });

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(timestamp){
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
