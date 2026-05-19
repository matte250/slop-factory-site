// Canvas Avoider game with enhanced graphics
(() => {
  // Audio setup
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() { playTone(120, 200); }
  function playSpawn() { playTone(440, 80); }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width = canvas.clientWidth * dpr;
  const h = canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  // player
  const player = {x: w/2, y: h/2, r: 10, speed: 200}; // px/s
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // obstacles
  const obstacles = [];
  const spawnInterval = 800; // ms
  let lastSpawn = 0;

  // timing
  let startTime = null;
  let gameOver = false;

function update(dt) {
    // move player
    if (keys.ArrowUp) player.y -= player.speed * dt;
    if (keys.ArrowDown) player.y += player.speed * dt;
    if (keys.ArrowLeft) player.x -= player.speed * dt;
    if (keys.ArrowRight) player.x += player.speed * dt;
    // keep inside canvas
    player.x = Math.max(player.r, Math.min(w - player.r, player.x));
    player.y = Math.max(player.r, Math.min(h - player.r, player.y));

    // spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      const size = 20 + Math.random()*30;
      const x = Math.random()*w;
      const y = Math.random()*h;
      const angle = Math.random()*2*Math.PI;
      const speed = 50 + Math.random()*100;
      obstacles.push({
        x,
        y,
        w: size,
        h: size,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 2,
        color: `hsl(${Math.random() * 360},70%,50%)`
      });
      playSpawn();
      lastSpawn = performance.now();
    }

    // move obstacles and rotate
    for (let i=obstacles.length-1;i>=0;i--) {
      const o = obstacles[i];
      o.x += o.vx*dt;
      o.y += o.vy*dt;
      o.angle += (o.angularVelocity || 0) * dt;
      // remove if out of bounds
      if (o.x < -o.w || o.x > w || o.y < -o.h || o.y > h) obstacles.splice(i,1);
    }

    // collision detection
    for (const o of obstacles) {
      const closestX = Math.max(o.x, Math.min(player.x, o.x+o.w));
      const closestY = Math.max(o.y, Math.min(player.y, o.y+o.h));
      const dx = player.x - closestX;
      const dy = player.y - closestY;
      if (dx*dx + dy*dy < player.r*player.r) {
        playCollision();
        gameOver = true;
        break;
      }
    }
  }


  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#001028');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // player with radial gradient and glow
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.r * 0.2,
      player.x, player.y, player.r
    );
    playerGrad.addColorStop(0, '#00aaff');
    playerGrad.addColorStop(1, '#0066ff');
    ctx.save();
    ctx.shadowColor = 'rgba(0,102,255,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // obstacles with individual colors and rotation
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.angle || 0);
      ctx.fillStyle = o.color || 'red';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    }

    // score overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  function loop(ts) {
    if (!startTime) startTime = ts;
    const dt = (ts - (lastTime||ts))/1000;
    lastTime = ts;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastTime;
  requestAnimationFrame(loop);
})();
