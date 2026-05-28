// Sky Diver Game
// Assumes a <canvas id="game"></canvas> present in the page
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // ----- Constants -----
  const GRAVITY = 0.2;
  const MAX_SPEED = 6;
  const PLATFORM_W = 80;
  const PLATFORM_H = 10;
  const HAZARD_W = 30;
  const HAZARD_H = 30;
  const CLOUD_W = 100;
  const CLOUD_H = 60;
  const SPAWN_INTERVAL = 120; // frames
  const HAZARD_INTERVAL = 300; // frames
  const CLOUD_INTERVAL = 200; // frames

  // ----- Audio Setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function soundParachute(){ playTone(400, 0.1); }
  function soundLanding(){ playTone(600, 0.08); }
  function soundCrash(){ playTone(150, 0.3); }
  function soundGameOver(){ playTone(100, 0.5); }

  // ----- Game State -----
  const player = {x: canvas.width/2-15, y: 50, w:30, h:40, vy:0, parachute:false};
  const platforms = [];
  const hazards = [];
  const clouds = [];
  let frame = 0;
  let score = 0;
  let running = true;
  let gameOverPlayed = false;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    audioCtx.resume(); // ensure audio context running
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnPlatform() {
    const x = Math.random() * (canvas.width - PLATFORM_W);
    platforms.push({x, y: -PLATFORM_H, w: PLATFORM_W, h: PLATFORM_H});
  }

  function spawnHazard() {
    const x = Math.random() * (canvas.width - HAZARD_W);
    hazards.push({x, y: -HAZARD_H, w: HAZARD_W, h: HAZARD_H});
  }

  function spawnCloud() {
    const x = Math.random() * (canvas.width - CLOUD_W);
    clouds.push({x, y: -CLOUD_H, w: CLOUD_W, h: CLOUD_H});
  }

  function rectIntersect(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    // Player input
    if (keys.ArrowLeft) player.x -= 3;
    if (keys.ArrowRight) player.x += 3;
    if (keys.ArrowUp) {
      if (!player.parachute) soundParachute();
      player.parachute = true;
    } else {
      player.parachute = false;
    }
    // Boundaries
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    // Physics
    const accel = player.parachute ? GRAVITY/2 : GRAVITY;
    player.vy = Math.min(player.vy + accel, player.parachute ? MAX_SPEED/2 : MAX_SPEED);
    player.y += player.vy;

    // Move objects down relative to player to create scrolling effect
    const scroll = player.vy;
    platforms.forEach(p=>p.y+=scroll);
    hazards.forEach(h=>h.y+=scroll);
    clouds.forEach(c=>c.y+=scroll);
    // Remove off‑screen
    while (platforms.length && platforms[0].y>canvas.height) platforms.shift();
    while (hazards.length && hazards[0].y>canvas.height) hazards.shift();
    while (clouds.length && clouds[0].y>canvas.height) clouds.shift();

    // Collision with platforms – reset fall speed briefly
    platforms.forEach(p=>{
      if (rectIntersect(player,p) && player.vy>0){
        player.y = p.y - player.h;
        player.vy = 0;
        soundLanding();
      }
    });

    // Collision with hazards – end game
    for (const h of hazards) {
      if (rectIntersect(player,h)) {
        running = false;
        soundCrash();
        break;
      }
    }

    // Lose if falling off bottom
    if (player.y > canvas.height) running = false;

    // Spawn logic
    if (frame % SPAWN_INTERVAL === 0) spawnPlatform();
    if (frame % HAZARD_INTERVAL === 0) spawnHazard();
    if (frame % CLOUD_INTERVAL === 0) spawnCloud();
    frame++;
    score = Math.floor(frame/10);
  }

  function draw() {
    // Background gradient sky
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,'#87ceeb'); // light blue top
    grad.addColorStop(1,'#1e90ff'); // deeper blue bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Clouds (soft white ellipses)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
    });

    // Player (skydiver) – simple silhouette
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x+player.w, player.y);
    ctx.lineTo(player.x+player.w, player.y+player.h);
    ctx.lineTo(player.x, player.y+player.h);
    ctx.closePath();
    ctx.fill();
    // Parachute indicator (semi‑transparent semi‑circle)
    if (player.parachute) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(player.x+player.w/2, player.y, player.w, 0, Math.PI, true);
      ctx.fill();
    }
    // Platforms
    ctx.fillStyle = '#4caf50';
    platforms.forEach(p=>ctx.fillRect(p.x,p.y,p.w,p.h));
    // Hazards – red triangles to look like danger
    ctx.fillStyle = '#f44336';
    hazards.forEach(h=>{
      ctx.beginPath();
      ctx.moveTo(h.x, h.y+h.h);
      ctx.lineTo(h.x+h.w/2, h.y);
      ctx.lineTo(h.x+h.w, h.y+h.h);
      ctx.closePath();
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10,20);
  }

  function loop(){
    if (!running){
      if (!gameOverPlayed){
        soundGameOver();
        gameOverPlayed = true;
      }
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#fff';
      ctx.font='24px sans-serif';
      ctx.fillText('Game Over', canvas.width/2-60, canvas.height/2);
      ctx.fillText('Score: '+score, canvas.width/2-50, canvas.height/2+30);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // start
  requestAnimationFrame(loop);
})();
