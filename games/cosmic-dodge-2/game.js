// Simple Cosmic Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Background ambience – low hum every few seconds
  setInterval(() => playTone(30, 0.4), 4000);
  // Ensure audio context resumes on first interaction
  window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, {once: true});
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, z: Math.random()*0.5+0.5});
  }
  const updateStars = () => {
    for (let s of stars) {
      s.y += s.z * 2;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random()*canvas.width;
      }
    }
  };
  const drawStars = () => {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#02010a');
    bgGrad.addColorStop(1, '#0c001f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars as small glowing circles
    for (let s of stars) {
      const starGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 2);
      const intensity = Math.random() * 0.5 + 0.5; // twinkle
      starGrad.addColorStop(0, `rgba(255,255,255,${intensity})`);
      starGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Player ship
  const ship = {x: canvas.width/2, y: canvas.height*0.8, size: 20, speed: 5};
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  // Play movement sound on arrow key press
  window.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      playTone(440, 0.05);
    }
  });
  window.addEventListener('keyup', e => keys[e.key] = false);
  const updateShip = () => {
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep inside
    ship.x = Math.max(0, Math.min(canvas.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));
  };
  const drawShip = () => {
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size/2);
    ctx.lineTo(ship.x - ship.size/2, ship.y + ship.size/2);
    ctx.lineTo(ship.x + ship.size/2, ship.y + ship.size/2);
    ctx.closePath();
    ctx.fill();
  };

  // Asteroids
  const asteroids = [];
  const spawnAsteroid = () => {
    // Play spawn sound
    playTone(200, 0.08);
    const side = Math.random(); // 0 left, 1 top, 2 right
    let x, y, vx, vy;
    const radius = Math.random()*15+10;
    if (side < 0.33) { // left
      x = -radius; y = Math.random()*canvas.height;
      vx = Math.random()*2+1; vy = (Math.random()-0.5)*2;
    } else if (side < 0.66) { // top
      x = Math.random()*canvas.width; y = -radius;
      vx = (Math.random()-0.5)*2; vy = Math.random()*2+1;
    } else { // right
      x = canvas.width+radius; y = Math.random()*canvas.height;
      vx = -(Math.random()*2+1); vy = (Math.random()-0.5)*2;
    }
    asteroids.push({x, y, vx, vy, radius});
  };
  let asteroidTimer = 0;
  const updateAsteroids = (dt) => {
    asteroidTimer += dt;
    if (asteroidTimer > 1000) { // spawn every second
      spawnAsteroid();
      asteroidTimer = 0;
    }
    for (let i = asteroids.length-1; i>=0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
        asteroids.splice(i,1);
      }
    }
  };
  const drawAsteroids = () => {
    ctx.fillStyle = '#f44';
    for (let a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
      ctx.fill();
    }
  };

  // Collision
  const checkCollision = () => {
    for (let a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.size/2) return true;
    }
    return false;
  };

  // Score
  let startTime = null;
  let gameOver = false;
  const drawScore = () => {
    const elapsed = ((Date.now() - startTime)/1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 30);
  };

  // Main loop
  let last = performance.now();
  function loop(ts){
    const dt = ts - last; last = ts;
    if (!startTime) startTime = Date.now();
    updateStars();
    updateShip();
    updateAsteroids(dt);
    drawStars();
    drawAsteroids();
    drawShip();
    drawScore();
    if (checkCollision()) { // Play collision sound
    if (!gameOver) playTone(150, 0.3);
      gameOver = true;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    } else {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
