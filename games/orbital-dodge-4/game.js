// Orbital Dodge – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playThrust(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playExplosion(){
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      data[i] = (Math.random()*2-1) * Math.pow(1-i/bufferSize,2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.3);
  }
  // generate static background stars
  const starCount = 100;
  const stars = Array.from({length: starCount}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
  }));

  // ----- utility -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- ship -----
  const ship = {
    x: width / 2,
    y: height / 2 - 150, // start 150px above centre
    angle: 0, // radians, 0 points up
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.05,
    rotateSpeed: 0.05,
  };

  // ----- asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  const asteroidSpeed = 1.2;

  function spawnAsteroid() {
    // spawn at random edge, moving towards centre
    const edge = Math.floor(rand(0, 4)); // 0=top,1=right,2=bottom,3=left
    let x, y;
    if (edge === 0) { x = rand(0, width); y = -20; }
    else if (edge === 1) { x = width + 20; y = rand(0, height); }
    else if (edge === 2) { x = rand(0, width); y = height + 20; }
    else { x = -20; y = rand(0, height); }
    const angle = Math.atan2(height / 2 - y, width / 2 - x);
    asteroids.push({ x, y, angle, radius: rand(8, 20) });
  }

  setInterval(spawnAsteroid, asteroidSpawnInterval);

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ----- game loop -----
  function update(dt) {
    // rotation
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    // thrust
    if (keys['ArrowUp']) {
      ship.vx += Math.sin(ship.angle) * ship.thrust;
      ship.vy -= Math.cos(ship.angle) * ship.thrust;
      playThrust();
    }
    // apply velocity (simple orbital mechanic: slight pull to centre)
    const cx = width / 2, cy = height / 2;
    const dx = cx - ship.x, dy = cy - ship.y;
    const pull = 0.001; // centripetal pull
    ship.vx += dx * pull;
    ship.vy += dy * pull;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += Math.cos(a.angle) * asteroidSpeed;
      a.y += Math.sin(a.angle) * asteroidSpeed;
      // collision with ship
      if (dist(a, ship) < a.radius + ship.radius) {
        // game over – play explosion sound then restart
        playExplosion();
        setTimeout(() => { window.location.reload(); }, 500);
        return;
      }
      // remove off‑screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
      }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // planet with gradient
    const planetGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, 30);
    planetGrad.addColorStop(0, '#555');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    // ship with outline and optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // thrust flame
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius / 2, ship.radius + 10);
      ctx.lineTo(-ship.radius / 2, ship.radius + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // asteroids with radial shading
    asteroids.forEach(a => {
      const aGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      aGrad.addColorStop(0, '#ddd');
      aGrad.addColorStop(1, '#444');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
