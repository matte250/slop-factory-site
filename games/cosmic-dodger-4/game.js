// Cosmic Dodger game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound(){
    if(thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.02;
    thrustOsc.frequency.value = 200;
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound(){
    if(thrustOsc){
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playCollisionSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.2);
    osc.frequency.value = 100;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime+0.2);
  }

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: false,
    rotate: 0 // -1 left, 1 right
  };

  // Game state
  let shield = 3;
  const asteroids = [];
  const stars = [];
  let lastSpawn = 0;
  let gameOver = false;
  // Initialize starfield
  (function initStars(){
    const starCount = 100;
    for(let i=0;i<starCount;i++){
      stars.push({
        x: Math.random()*width,
        y: Math.random()*height,
        radius: Math.random()*1.5+0.5
      });
    }
  })();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; e.preventDefault(); });

  function updateInput() {
    ship.rotate = 0;
    ship.thrust = false;
    if (keys['ArrowLeft'] || keys['a']) ship.rotate = -1;
    if (keys['ArrowRight'] || keys['d']) ship.rotate = 1;
    if (keys['ArrowUp'] || keys['w']) ship.thrust = true;
    // audio feedback for thrust
    if (ship.thrust) startThrustSound(); else stopThrustSound();
  }

  function updateShip(dt) {
    const rotSpeed = 3; // rad per second
    ship.angle += ship.rotate * rotSpeed * dt;
    if (ship.thrust) {
      const thrustPower = 100; // pixels per second^2
      ship.vx += Math.cos(ship.angle) * thrustPower * dt;
      ship.vy += Math.sin(ship.angle) * thrustPower * dt;
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Wrap around screen
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
  }

  function spawnAsteroid() {
    const edge = Math.random() < 0.5 ? 'x' : 'y';
    const pos = edge === 'x' ? (Math.random() < 0.5 ? 0 : width) : (Math.random() < 0.5 ? 0 : height);
    const x = edge === 'x' ? pos : Math.random() * width;
    const y = edge === 'y' ? pos : Math.random() * height;
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 40;
    asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 15 + Math.random() * 10
    });
  }

  function updateAsteroids(dt) {
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // wrap
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    }
    // remove old far asteroids (optional)
    if (asteroids.length > 100) asteroids.splice(0, asteroids.length - 100);
  }

  function checkCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        shield--;
        playCollisionSound();
        asteroids.splice(i, 1);
        if (shield <= 0) {
          gameOver = true;
        }
      }
    }
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0,0,width,height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);
    // stars
    ctx.fillStyle = 'white';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    }
    // draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // thrust flame
    if(ship.thrust){
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();

    // draw asteroids (simple jagged using polygon)
    ctx.strokeStyle = 'darkgray';
    ctx.lineWidth = 1;
    for (const a of asteroids) {
      ctx.beginPath();
      const points = 8;
      for(let i=0;i<points;i++){
        const theta = (i/points)*Math.PI*2;
        const r = a.radius * (0.7 + Math.random()*0.6);
        const x = a.x + Math.cos(theta)*r;
        const y = a.y + Math.sin(theta)*r;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fillStyle = '#555';
      ctx.fill();
      ctx.stroke();
    }

    // draw shield
    ctx.fillStyle = 'lightgreen';
    ctx.font = '16px sans-serif';
    ctx.fillText('Shield: ' + shield, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = null;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (!gameOver) {
      updateInput();
      updateShip(dt);
      // spawn asteroid every 1.5 seconds
      if (timestamp - lastSpawn > 1500) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      updateAsteroids(dt);
      checkCollisions();
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
