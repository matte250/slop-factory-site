(() => {
  const canvas = document.getElementById('game');
  // audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (frequency, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playThrustSound = () => playTone(400, 0.05);
  const playExplosionSound = () => playTone(100, 0.3);
  const playGameOverSound = () => playTone(60, 0.5);
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;
  const center = {x: w/2, y: h/2};
  const ship = {x: center.x, y: center.y - 50, vx: 0, vy: 0, r: 8};
  const gravity = 0.05; // acceleration toward center
  const thrust = 0.2; // outward acceleration on click
  const meteors = [];
  const stars = [];
  // generate static background stars
  for (let i = 0; i < 80; i++) {
    stars.push({x: Math.random() * w, y: Math.random() * h});
  }
  const meteorRate = 2000; // ms between spawns
  const meteorSpeed = 1.5;
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  const spawnMeteor = () => {
    const edge = Math.floor(Math.random()*4);
    let x, y, vx, vy;
    const radius = 6 + Math.random()*6;
    if (edge===0) { // top
      x = Math.random()*w; y = -radius; vx = (Math.random()-0.5)*meteorSpeed; vy = meteorSpeed;
    } else if (edge===1) { // bottom
      x = Math.random()*w; y = h+radius; vx = (Math.random()-0.5)*meteorSpeed; vy = -meteorSpeed;
    } else if (edge===2) { // left
      x = -radius; y = Math.random()*h; vx = meteorSpeed; vy = (Math.random()-0.5)*meteorSpeed;
    } else { // right
      x = w+radius; y = Math.random()*h; vx = -meteorSpeed; vy = (Math.random()-0.5)*meteorSpeed;
    }
    meteors.push({x, y, vx, vy, r: radius});
  };

  const update = (dt) => {
    // ship gravity
    const dx = center.x - ship.x;
    const dy = center.y - ship.y;
    const dist = Math.hypot(dx, dy) || 1;
    ship.vx += (dx/dist)*gravity*dt;
    ship.vy += (dy/dist)*gravity*dt;
    // move ship
    ship.x += ship.vx*dt;
    ship.y += ship.vy*dt;
    // meteors
    for (let i=meteors.length-1;i>=0;i--) {
      const m = meteors[i];
      m.x += m.vx*dt;
      m.y += m.vy*dt;
      // collision with ship
if (Math.hypot(m.x-ship.x, m.y-ship.y) < m.r+ship.r) {
          gameOver = true;
          playExplosionSound();
          playGameOverSound();
        }
      // remove off‑screen meteors
      if (m.x < -m.r || m.x > w+m.r || m.y < -m.r || m.y > h+m.r) {
        meteors.splice(i,1);
      }
    }
    // lose condition: ship leaves canvas
    if (ship.x < -ship.r || ship.x > w+ship.r || ship.y < -ship.r || ship.y > h+ship.r) {
      gameOver = true;
    }
  };

  const draw = () => {
    ctx.clearRect(0,0,w,h);
    // space background gradient
    const bgGrad = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)/2);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);
    // background stars
    ctx.fillStyle = '#222';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#555';
    stars.forEach(s=>{ctx.fillRect(s.x,s.y,1,1);});
    // planet at center
    const planetGrad = ctx.createRadialGradient(center.x,center.y,0,center.x,center.y,40);
    planetGrad.addColorStop(0,'#444');
    planetGrad.addColorStop(1,'#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(center.x,center.y,40,0,Math.PI*2);
    ctx.fill();
    // ship as triangle with glow
    const shipAngle = Math.atan2(ship.vy, ship.vx);
    const shipSize = 12;
    const tipX = ship.x + Math.cos(shipAngle)*shipSize;
    const tipY = ship.y + Math.sin(shipAngle)*shipSize;
    const leftX = ship.x + Math.cos(shipAngle+Math.PI*0.75)*shipSize*0.6;
    const leftY = ship.y + Math.sin(shipAngle+Math.PI*0.75)*shipSize*0.6;
    const rightX = ship.x + Math.cos(shipAngle-Math.PI*0.75)*shipSize*0.6;
    const rightY = ship.y + Math.sin(shipAngle-Math.PI*0.75)*shipSize*0.6;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(tipX,tipY);
    ctx.lineTo(leftX,leftY);
    ctx.lineTo(rightX,rightY);
    ctx.closePath();
    ctx.fill();
    // meteors with orange gradient
    meteors.forEach(m=>{
      const grad = ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.r);
      grad.addColorStop(0,'#ff8');
      grad.addColorStop(1,'#c44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now()-startTime)/1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`,10,20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', w/2, h/2);
    }
  };

  const loop = (timestamp) => {
    const dt = 0.016; // fixed step ~60fps
    if (!gameOver) {
      if (timestamp - lastSpawn > meteorRate) {spawnMeteor(); lastSpawn=timestamp;}
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  };

  // thrust on click/tap
  const applyThrust = (e) => {
    // ensure audio context is running
    audioCtx.resume();
    playThrustSound();
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = ship.x - cx;
    const dy = ship.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    ship.vx += (dx/d)*thrust;
    ship.vy += (dy/d)*thrust;
  };
  canvas.addEventListener('mousedown', applyThrust);
  canvas.addEventListener('touchstart', (e)=>{applyThrust(e.touches[0]);});

  requestAnimationFrame(loop);
})();
