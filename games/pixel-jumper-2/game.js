// Pixel Jumper – minimal endless runner
// Assumes an HTML <canvas id="game"></canvas> present.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.5;
  const JUMP_VEL = -10;
  const SPEED = 2; // world scroll speed

  // utility: draw rounded rectangle
  function drawRoundedRect(x,y,w,h,r,color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
    ctx.fill();
  }

  // star field for background
  const STAR_COUNT = 80;
  const stars = [];
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      speed: 0.2 + Math.random()*0.3,
      alpha: 0.5 + Math.random()*0.5
    });
  }

  // cloud layer for depth
  const CLOUD_COUNT = 6;
  const clouds = [];
  for(let i=0;i<CLOUD_COUNT;i++){
    const w = 80 + Math.random()*100;
    clouds.push({
      x: Math.random()*W,
      y: Math.random()*H*0.4,
      w,
      h: w*0.5,
      speed: 0.1 + Math.random()*0.2,
      color: '#777'
    });
  }

  // audio utilities
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure context is resumed on first user interaction
  function resumeAudio(){ if (audioCtx.state !== 'running') audioCtx.resume(); }
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump(){ playTone(400, 0.12); }
  function playCollect(){ playTone(800, 0.08); }
  function playGameOver(){ playTone(150, 0.4); }


  const player = {
    x: 50,
    y: H - 60,
    w: 30,
    h: 30,
    vy: 0,
    onGround: false,
    color: '#0ff',
    draw() {
      // draw player as a rounded rectangle with a subtle glow
      drawRoundedRect(this.x, this.y, this.w, this.h, 6, this.color);
    },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.h >= H) {
        this.y = H - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) this.vy = JUMP_VEL;
    }
  };

  // simple platform generator
  const platforms = [];
  const obstacles = [];
  const orbs = [];
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  function addPlatform(x) {
    const width = 120 + Math.random() * 80;
    const y = H - 30 - Math.random() * 120;
    platforms.push({x, y, w: width, h: 20});
    // maybe add obstacle and orb on the platform
    if (Math.random() < 0.3) {
      obstacles.push({x: x + width / 2, y: y - 20, w: 20, h: 20});
    }
    if (Math.random() < 0.4) {
      orbs.push({x: x + width / 3, y: y - 40, r: 8, collected: false});
    }
  }

  // initialise first platforms
  for (let i = 0; i < 5; i++) addPlatform(i * 200);

  function loop(ts) {
    if (gameOver) return;
    const dt = ts - lastTime;
    lastTime = ts;

    // move world left
    platforms.forEach(p => p.x -= SPEED);
    obstacles.forEach(o => o.x -= SPEED);
    orbs.forEach(o => o.x -= SPEED);
    // update stars for parallax effect
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
      }
    });
    // update clouds for slower parallax
    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.w < 0) {
        c.x = W;
        c.y = Math.random() * H * 0.4;
      }
    });
    // remove off‑screen
    while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (orbs.length && orbs[0].x + orbs[0].r < 0) orbs.shift();

    // add new platform if needed
    const last = platforms[platforms.length - 1];
    if (last && last.x + last.w < W) addPlatform(last.x + last.w + 150);

    // player physics
    player.update();
    // simple platform collision (only from top)
    player.onGround = false;
    for (const p of platforms) {
      if (player.vy >= 0 &&
          player.x + player.w > p.x &&
          player.x < p.x + p.w &&
          player.y + player.h >= p.y &&
          player.y + player.h <= p.y + p.h) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    // obstacle collision – end game
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        playGameOver();
      }
    }

    // orb collection
    for (const orb of orbs) {
      if (!orb.collected &&
          player.x < orb.x + orb.r && player.x + player.w > orb.x - orb.r &&
          player.y < orb.y + orb.r && player.y + player.h > orb.y - orb.r) {
        orb.collected = true;
        score += 10;
        playCollect();
      }
    }

    // render
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#0b3d91');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // cloud layer (parallax)
    clouds.forEach(c => {
      drawRoundedRect(c.x, c.y, c.w, c.h, 20, c.color);
    });
    // star field (parallax)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, 2, 2);
      ctx.globalAlpha = 1;
    });
    // draw platforms with rounded edges
    ctx.fillStyle = '#556';
    platforms.forEach(p => drawRoundedRect(p.x, p.y, p.w, p.h, 5, '#556'));

    // draw obstacles
    ctx.fillStyle = '#f44';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // draw orbs
    ctx.fillStyle = '#ff0';
    orbs.filter(o=>!o.collected).forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
      ctx.fill();
    });
    // draw player
    player.draw();
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: '+score, 10, 30);

    if (!gameOver) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W/2-80, H/2);
    }
  }

  // tap / click to jump
  canvas.addEventListener('pointerdown', () => { resumeAudio(); player.jump(); playJump(); });
  requestAnimationFrame(loop);
})();
