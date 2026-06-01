/*
  Solar Flare Escape – minimal canvas game
  Target canvas with id="game". Arrow keys rotate (←/→) and thrust (↑).
  Random solar flares spawn and accelerate over time. Collision or leaving
  canvas bounds ends the game.
*/
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;

  // Ship state
  const ship = {x: W/2, y: H/2, angle: 0, vx: 0, vy: 0, size: 12, trail: null};
  const ROT_SPEED = 0.07; // rad per frame
  const THRUST = 0.1;

  // Flare and particle state
  const flares = [];
  const particles = [];
  let flareInterval = 2000; // ms
  let lastFlare = 0;
  let flareSpeed = 0.3;
  let startTime = performance.now();
  let gameOver = false;

  // Input handling and sound setup
  const keys = {};
  // Audio context (will be initiated on first user interaction)
  let audioCtx = null;
  let thrustOsc = null;
  let thrustGain = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Ensure context is running (required after user gesture)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startThrustSound() {
    initAudio();
    if (thrustOsc) return; // already playing
    thrustOsc = audioCtx.createOscillator();
    thrustGain = audioCtx.createGain();
    thrustOsc.type = 'sawtooth';
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    thrustGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(thrustGain).connect(audioCtx.destination);
    thrustOsc.start();
  }

  function stopThrustSound() {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustGain.disconnect();
      thrustOsc = null;
      thrustGain = null;
    }
  }

  function playExplosionSound() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') startThrustSound();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') stopThrustSound();
  });

  function spawnFlare() {
    const edge = Math.floor(Math.random()*4);
    let x, y, dx, dy;
    const rad = Math.random()*8 + 4; // radius 4-12
    // spawn at random edge, move inward
    if (edge===0) { x=0; y=Math.random()*H; dx=flareSpeed; dy=(Math.random()-0.5)*flareSpeed; }
    else if (edge===1) { x=W; y=Math.random()*H; dx=-flareSpeed; dy=(Math.random()-0.5)*flareSpeed; }
    else if (edge===2) { x=Math.random()*W; y=0; dx=(Math.random()-0.5)*flareSpeed; dy=flareSpeed; }
    else { x=Math.random()*W; y=H; dx=(Math.random()-0.5)*flareSpeed; dy=-flareSpeed; }
    flares.push({x, y, dx, dy, r: rad});
    // create a burst of particles for visual flair
    for (let i=0;i<5;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = Math.random()*1.5+0.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        life: 60, // frames
        size: Math.random()*2+1,
      });
    }
  }

  function update(dt) {
    // ship rotation
    if (keys['ArrowLeft']) ship.angle -= ROT_SPEED;
    if (keys['ArrowRight']) ship.angle += ROT_SPEED;
    // thrust
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle)*THRUST;
      ship.vy += Math.sin(ship.angle)*THRUST;
    }
    // store previous position for trail
    const prevPos = {x: ship.x, y: ship.y};
    // apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple drag
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // update ship trail (short line)
    ship.trail = prevPos;
    // flare spawning
    const now = performance.now();
    if (now - lastFlare > flareInterval) {
      spawnFlare();
      lastFlare = now;
    }
    // increase difficulty linearly
    const elapsed = (now - startTime)/1000; // seconds
    flareInterval = Math.max(300, 2000 - elapsed*100); // faster over time
    flareSpeed = 0.3 + elapsed*0.02; // faster flares
    // update flares
    for (const f of flares) {
      f.x += f.dx;
      f.y += f.dy;
    }
    // update particles (simple decay)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // collision detection
    for (const f of flares) {
      const dx = ship.x - f.x;
      const dy = ship.y - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist < f.r + ship.size) { gameOver = true; playExplosionSound(); }
    }
    // out of bounds -> game over
    if (!gameOver && (ship.x < 0 || ship.x > W || ship.y < 0 || ship.y > H)) { gameOver = true; playExplosionSound(); }
  }

  // Pre‑generated starfield for background
const stars = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random() * (canvas.width || 0),
    y: Math.random() * (canvas.height || 0),
    r: Math.random() * 1.5 + 0.5,
  });
}

function draw() {
    // background: dark space with stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship glow trail (simple line)
    if (ship.trail) {
      ctx.strokeStyle = 'rgba(0,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ship.trail.x, ship.trail.y);
      ctx.lineTo(ship.x, ship.y);
      ctx.stroke();
    }
    // ship (triangle) with glow
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, -ship.size / 2);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.restore();
    // flares with radial gradient
    for (const f of flares) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,140,0,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (loop.last||timestamp);
      update(dt);
      draw();
      loop.last = timestamp;
      requestAnimationFrame(loop);
    } else {
      draw(); // draw overlay once
    }
  }
  requestAnimationFrame(loop);
})();
