// Pixel Runner game implementation
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;
  // audio context for sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player definition
  const player = {
    x: 50,
    y: H - 40,
    w: 30,
    h: 30,
    vy: 0,
    jumpStrength: -12,
    onGround: true
  };
  const GRAVITY = 0.6;

  // Obstacles array
  const obstacles = [];
  const obstacleSpacing = 1500; // ms between obstacles
  let lastObstacleTime = 0;

  let score = 0;
  let gameOver = false;
  const particles = []; // jump particles

  function spawnObstacle(){
    const size = 30;
    const colors = ['#ff5252', '#52ff52', '#5252ff', '#ff52ff'];
    const obs = {
      x: W,
      y: H - size,
      w: size,
      h: size,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    obstacles.push(obs);
  }

  function update(dt){
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H){
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // obstacles movement
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= 6; // speed
      if (o.x + o.w < 0) obstacles.splice(i,1);
    }
    // particles update
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.vy += 0.05;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i,1);
    }
    // collision detection
    for(const o of obstacles){
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y){
        gameOver = true;
        playSound(200, 0.5); // crash sound
      }
    }
    // scoring
    score += dt * 0.01;
    // spawn new obstacles
    if (performance.now() - lastObstacleTime > obstacleSpacing){
      spawnObstacle();
      lastObstacleTime = performance.now();
    }
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // ground line
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(0, H-10);
    ctx.lineTo(W, H-10);
    ctx.stroke();
    // player (rounded rect, color changes when airborne)
    ctx.fillStyle = player.onGround ? '#fff' : '#ff0';
    drawRoundedRect(player.x, player.y, player.w, player.h, 5);
    // obstacles with individual colors
    for(const o of obstacles){
      ctx.fillStyle = o.color || '#fff';
      drawRoundedRect(o.x, o.y, o.w, o.h, 4);
    }
    // particles rendering
    for(const p of particles){
      ctx.fillStyle = 'rgba(255,255,0,'+p.alpha+')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Score: '+Math.floor(score), 10, 20);
    if (gameOver){
      ctx.fillStyle = 'red';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', W/2-60, H/2);
    }
  }

  // helper to draw rounded rectangles
  function drawRoundedRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
  }

  let lastTime = 0;
  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver){
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling
  function jump(){
    if (player.onGround){
      player.vy = player.jumpStrength;
      player.onGround = false;
      // create jump particles
      for(let i=0;i<8;i++){
        particles.push({
          x: player.x + player.w/2,
          y: player.y + player.h/2,
          vx: (Math.random()-0.5)*2,
          vy: -Math.random()*2 - 1,
          size: Math.random()*3+2,
          alpha: 1
        });
      }
      playSound(600, 0.07); // jump cue
    }
  }
  window.addEventListener('keydown', e=>{ if(e.code==='Space') jump(); });
  canvas.addEventListener('click', jump);

  requestAnimationFrame(loop);
})();
