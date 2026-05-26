// Minimal arcade game based on IDEA.md
// Canvas element with id="game" is expected in the HTML.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  function playCollect(){ playTone(600, 100); }
  function playCrash(){ playTone(150, 300); }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Ship state
  const ship = {x: W/2, y: H/2, vx: 0, vy: 0, r: 10, thrust: 0.2, friction: 0.99};

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Game objects
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({x: Math.random()*W, y: Math.random()*H});
  }
  const orbs = [];
  const asteroids = [];
  const MAX_ORBS = 5;
  const MAX_AST = 3;

  function randPos() { return {x: Math.random()*W, y: Math.random()*H}; }
  function randVel() { const speed = Math.random()*1.5+0.5; const ang = Math.random()*Math.PI*2; return {vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed}; }

  function spawnOrb() { const p = randPos(); orbs.push({x:p.x, y:p.y, r:6}); }
  function spawnAst() { const p = randPos(); const v = randVel(); asteroids.push({x:p.x, y:p.y, vx:v.vx, vy:v.vy, r:15}); }

  for(let i=0;i<MAX_ORBS;i++) spawnOrb();
  for(let i=0;i<MAX_AST;i++) spawnAst();

  // Game state
  let score = 0;
  let time = 30; // seconds
  let last = performance.now();
  let gameOver = false;

  function update(dt) {
    // Ship controls (WASD/arrows)
    if (keys['ArrowUp']||keys['w']) ship.vy -= ship.thrust;
    if (keys['ArrowDown']||keys['s']) ship.vy += ship.thrust;
    if (keys['ArrowLeft']||keys['a']) ship.vx -= ship.thrust;
    if (keys['ArrowRight']||keys['d']) ship.vx += ship.thrust;

    // Apply friction/inertia
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    ship.x = (ship.x + ship.vx + W) % W;
    ship.y = (ship.y + ship.vy + H) % H;

    // Update asteroids
    for (const a of asteroids) {
      a.x = (a.x + a.vx + W) % W;
      a.y = (a.y + a.vy + H) % H;
    }

    // Check orb collection
    for (let i=orbs.length-1;i>=0;i--) {
      const o = orbs[i];
      const dx = ship.x - o.x, dy = ship.y - o.y;
      if (dx*dx+dy*dy < (ship.r+o.r)**2) {
        score++;
        orbs.splice(i,1);
        spawnOrb();
        playCollect();
      }
    }

    // Collision with asteroids -> game over
    for (const a of asteroids) {
      const dx = ship.x - a.x, dy = ship.y - a.y;
      if (dx*dx+dy*dy < (ship.r+a.r)**2) { gameOver = true; }
    }

    // Timer countdown
    time -= dt/1000;
    if (time <= 0) { gameOver = true; time = 0; }
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    // Draw background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // Draw ship as a triangle pointing direction of motion
    const angle = Math.atan2(ship.vy, ship.vx) || 0;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r/2);
    ctx.lineTo(-ship.r, -ship.r/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw glowing orbs
    for (const o of orbs) {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r*3);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r*3, 0, Math.PI*2);
      ctx.fill();
    }
    // Draw glowing asteroids
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
      grad.addColorStop(0, 'rgba(255,100,100,0.9)');
      grad.addColorStop(1, 'rgba(180,0,0,0.7)');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,80,80,0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${time.toFixed(1)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', W/2, H/2-20);
      ctx.font = '24px monospace';
      ctx.fillText(`Final Score: ${score}`, W/2, H/2+20);
    }
  }

  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
