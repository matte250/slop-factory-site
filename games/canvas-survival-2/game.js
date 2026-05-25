// Canvas Survival game implementation
(() => {
  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  };
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  const player = { x: width/2, y: height/2, r: 5, speed: 2, vx:0, vy:0 };
  const keys = {};
  window.addEventListener('keydown', e=> {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e=> keys[e.key] = false);

  let obstacles = [];
  let powerUps = [];
  let safeRadius = Math.min(width, height)/2 - 20;
  let safeShrinkRate = 0.02; // per frame
  let speedBoost = 1;
  let boostTimer = 0;
  let gameOver = false;

  const spawnObstacle = () => {
    const angle = Math.random()*2*Math.PI;
    const dist = Math.max(width, height);
    const x = width/2 + Math.cos(angle)*dist;
    const y = height/2 + Math.sin(angle)*dist;
    const speed = 0.5 + Math.random()*0.5;
    const vx = (width/2 - x) * speed / dist;
    const vy = (height/2 - y) * speed / dist;
    obstacles.push({x, y, r:8, vx, vy});
  };
  const spawnPowerUp = () => {
    const types = ['speed','shrink'];
    const type = types[Math.floor(Math.random()*types.length)];
    const x = Math.random()*width;
    const y = Math.random()*height;
    powerUps.push({x,y,r:6,type});
  };

  let obstacleTimer = 0;
  let powerTimer = 0;

  const update = () => {
    if (gameOver) return;
    // player movement
    player.vx = (keys['ArrowLeft']||keys['a']?-1:0) + (keys['ArrowRight']||keys['d']?1:0);
    player.vy = (keys['ArrowUp']||keys['w']?-1:0) + (keys['ArrowDown']||keys['s']?1:0);
    const len = Math.hypot(player.vx, player.vy);
    if (len) { player.x += player.vx/len * player.speed * speedBoost; player.y += player.vy/len * player.speed * speedBoost; }
    // keep within canvas bounds
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // obstacles movement
    obstacles.forEach(o => { o.x += o.vx; o.y += o.vy; });
    obstacles = obstacles.filter(o => o.x+o.r>0 && o.x-o.r<width && o.y+o.r>0 && o.y-o.r<height);

    // spawn logic
    if (obstacleTimer++ > 120) { spawnObstacle(); obstacleTimer = 0; }
    if (powerTimer++ > 600) { spawnPowerUp(); powerTimer = 0; }

    // safe zone shrink
    safeRadius -= safeShrinkRate * (speedBoost===2?1.5:1);
    if (safeRadius < 30) safeRadius = 30;

    // power-up timer
    if (boostTimer > 0) { boostTimer--; if (boostTimer===0) speedBoost = 1; }

    // collisions
    for (let i=obstacles.length-1;i>=0;i--) {
      const o = obstacles[i];
      const d = Math.hypot(player.x-o.x, player.y-o.y);
      if (d < player.r + o.r) { playBeep(150, 0.3); gameOver = true; break; }
    }
    const dSafe = Math.hypot(player.x - width/2, player.y - height/2);
    if (dSafe > safeRadius) gameOver = true;
    for (let i=powerUps.length-1;i>=0;i--) {
      const p = powerUps[i];
      const d = Math.hypot(player.x-p.x, player.y-p.y);
      if (d < player.r + p.r) {
        if (p.type==='speed') { playBeep(300, 0.2); speedBoost = 2; boostTimer = 300; }
        else if (p.type==='shrink') { playBeep(200, 0.2); safeShrinkRate *= 2; setTimeout(()=>{safeShrinkRate/=2;},5000); }
        powerUps.splice(i,1);
      }
    }
  };

const draw = () => {
  // Background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);

  // Safe zone with radial gradient
  const safeGrad = ctx.createRadialGradient(width/2, height/2, safeRadius*0.5, width/2, height/2, safeRadius);
  safeGrad.addColorStop(0, 'rgba(0,255,0,0.2)');
  safeGrad.addColorStop(1, 'rgba(0,100,0,0.05)');
  ctx.beginPath();
  ctx.arc(width/2, height/2, safeRadius, 0, 2*Math.PI);
  ctx.fillStyle = safeGrad;
  ctx.fill();

  // Player with glow
  ctx.save();
  ctx.shadowColor = 'white';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, 2*Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();

  // Obstacles with stroke
  obstacles.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, 2*Math.PI);
    ctx.fillStyle = '#f44';
    ctx.fill();
    ctx.strokeStyle = '#800';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Power-ups as distinct shapes
  powerUps.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.type === 'speed') {
      // star
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = i * (2 * Math.PI / 5) - Math.PI / 2;
        const x = Math.cos(angle) * p.r;
        const y = Math.sin(angle) * p.r;
        ctx.lineTo(x, y);
        const innerAngle = angle + Math.PI / 5;
        const ix = Math.cos(innerAngle) * (p.r/2);
        const iy = Math.sin(innerAngle) * (p.r/2);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fillStyle = '#ff0';
      ctx.fill();
    } else {
      // triangle for shrink
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(p.r * Math.sin(Math.PI/3), p.r * Math.cos(Math.PI/3));
      ctx.lineTo(-p.r * Math.sin(Math.PI/3), p.r * Math.cos(Math.PI/3));
      ctx.closePath();
      ctx.fillStyle = '#0ff';
      ctx.fill();
    }
    ctx.restore();
  });

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width/2, height/2);
  }
};

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
