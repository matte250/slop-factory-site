// Asteroid Dodge game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 800;
  const h = canvas.height = canvas.offsetHeight || 600;

  // audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const startAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  const beep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  };
  const playCollect = () => beep(800, 0.1);
  const playCollision = () => beep(200, 0.4);
  // ambient hum (optional)
  const hum = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  hum.frequency.value = 60;
  hum.type = 'sine';
  humGain.gain.value = 0.02;
  hum.connect(humGain).connect(audioCtx.destination);
  hum.start();

  // player ship
  const ship = { x: 50, y: h/2, w: 40, h: 20, dy: 0 };
  const shipSpeed = 4;

  // game objects
  const asteroids = [];
  const stars = [];
  const asteroidSpawnRate = 90; // frames
  const starSpawnRate = 150;
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // input
  const keys = {};
  window.addEventListener('keydown', e => {
    startAudio();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update() {
    // player movement (up/down arrows or w/s)
    if (keys.ArrowUp || keys.w) ship.dy = -shipSpeed;
    else if (keys.ArrowDown || keys.s) ship.dy = shipSpeed;
    else ship.dy = 0;
    ship.y = Math.max(0, Math.min(h - ship.h, ship.y + ship.dy));

    // spawn asteroids
    if (frame % asteroidSpawnRate === 0) {
      const size = 20 + Math.random()*30;
      asteroids.push({ x: w, y: Math.random()*(h-size), w: size, h: size, speed: 2 + Math.random()*3 });
    }
    // spawn stars
    if (frame % starSpawnRate === 0) {
      const size = 5 + Math.random()*5;
      stars.push({ x: w, y: Math.random()*(h-size), r: size, speed: 1.5 });
    }

    // move asteroids
    for (let i = asteroids.length-1; i>=0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // collision
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        playCollision();
        gameOver = true;
      }
      if (a.x + a.w < 0) asteroids.splice(i,1);
    }
    // move stars
    for (let i = stars.length-1; i>=0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      // collect
      if (s.x < ship.x + ship.w && s.x + s.r > ship.x && s.y < ship.y + ship.h && s.y + s.r > ship.y) {
        playCollect();
        score += 10;
        stars.splice(i,1);
        continue;
      }
      if (s.x + s.r < 0) stars.splice(i,1);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,w,h);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);
    // draw ship as triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // draw asteroids with gradient circles for depth
    asteroids.forEach(a => {
      const radGrad = ctx.createRadialGradient(
        a.x + a.w/2, a.y + a.h/2, a.w*0.2,
        a.x + a.w/2, a.y + a.h/2, a.w/2
      );
      radGrad.addColorStop(0, '#888');
      radGrad.addColorStop(1, '#222');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // draw stars with twinkling glow
    stars.forEach(s => {
      const glow = ctx.createRadialGradient(
        s.x, s.y, 0,
        s.x, s.y, s.r * 2
      );
      const alpha = 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.1 + s.x));
      glow.addColorStop(0, `rgba(255,255,200,${alpha})`);
      glow.addColorStop(1, 'rgba(255,255,150,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', w/2-120, h/2);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    frame++;
    requestAnimationFrame(loop);
  }
  loop();
})();
