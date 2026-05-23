// Simple Gravity Dodge game
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioUnlocked = false;
  function unlockAudio(){
    if (audioUnlocked) return;
    const buffer = audioCtx.createBuffer(1,1,22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    audioUnlocked = true;
  }
  window.addEventListener('keydown', unlockAudio, {once:true});
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur/1000);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  let health = 3;
  let score = 0;
  let lastTime = 0;
  const asteroids = [];
  const stars = [];
  // initialize background stars
  (function initStars(){
    const count = 80;
    for(let i=0;i<count;i++){
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random()*2 + 1
      });
    }
  })();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  function spawnAsteroid() {
    // each asteroid gets a rotation angle
    const angle = Math.random() * Math.PI * 2;
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed: 2 + Math.random() * 3 });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Asteroid logic
    if (Math.random() < 0.02) spawnAsteroid();
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision
      if (
        a.x < ship.x + ship.w && a.x + a.size > ship.x &&
        a.y < ship.y + ship.h && a.y + a.size > ship.y
      ) {
          health--;
          playTone(150, 200);
          asteroids.splice(i, 1);
          continue;
      }
      // out of bounds
      if (a.y > height) {
          score++; playTone(300, 100);
        asteroids.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship - triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids - radial gradient circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size*0.2, a.x + a.size/2, a.y + a.size/2, a.size/2);
      grad.addColorStop(0, '#a44');
      grad.addColorStop(1, '#400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Health: ${health}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (health > 0) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  requestAnimationFrame(loop);
})();
