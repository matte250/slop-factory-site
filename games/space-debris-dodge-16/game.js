// Simple Space Debris Dodge game with improved graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  function playPickupSound() { playTone(800, 0.15, 'triangle'); }
  function playCrashSound() { playTone(150, 0.4, 'sawtooth'); }
  function playThrustSound() { playTone(400, 0.05, 'square'); }

  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed;
      if (s.x < 0) s.x = W;
    }
  }

  // Player ship
  const ship = {
    x: W * 0.1,
    y: H / 2,
    w: 20,
    h: 15,
    speed: 4,
    fuel: 100,
    draw() {
      const grad = ctx.createLinearGradient(this.x - this.w, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#0aa');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    },
    update() {
      if (keys.ArrowUp) this.y -= this.speed;
      if (keys.ArrowDown) this.y += this.speed;
      if (keys.ArrowLeft) this.x -= this.speed;
      if (keys.ArrowRight) this.x += this.speed;
      // keep inside canvas
      this.x = Math.max(this.w, Math.min(W - this.w, this.x));
      this.y = Math.max(this.h, Math.min(H - this.h, this.y));
    },
  };

  // Input handling
  const keys = {};
  let audioStarted = false;
  function startAudio(){
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!audioStarted) { startAudio(); audioStarted = true; }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Debris and fuel pickups
  const debris = [];
  const pickups = [];
  const spawnInterval = 30; // frames
  let frame = 0;
  const rand = (min, max) => Math.random() * (max - min) + min;

  function spawnDebris() {
    const size = rand(10, 30);
    debris.push({
      x: W + size,
      y: rand(size, H - size),
      r: size / 2,
      speed: rand(2, 5),
    });
  }
  function spawnPickup() {
    const size = 12;
    pickups.push({
      x: W + size,
      y: rand(size, H - size),
      r: size / 2,
      speed: 3,
      pulse: 0,
    });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    drawStars(); // background with moving stars
    // fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) return endGame();
    // move ship
    ship.update();
    ship.draw();
    // play thrust sound when moving
    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
      playThrustSound();
    }

    // spawn
    if (frame % spawnInterval === 0) {
      spawnDebris();
      if (Math.random() < 0.2) spawnPickup();
    }
    // update debris (draw as circles with glow)
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x -= d.speed;
      ctx.fillStyle = '#f44';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      if (rectCollide(ship, { x: d.x - d.r, y: d.y - d.r, w: d.r * 2, h: d.r * 2 })) return endGame();
      if (d.x + d.r < 0) debris.splice(i, 1);
    }
    // update pickups (pulsating glow)
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.x -= p.speed;
      p.pulse += 0.1;
      const glow = Math.abs(Math.sin(p.pulse)) * 0.5 + 0.5;
      const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.3, p.x, p.y, p.r * 1.5);
      grad.addColorStop(0, `rgba(255,255,0,${glow})`);
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 1.5, 0, Math.PI * 2);
      ctx.fill();
      // collision check
      if (rectCollide(ship, { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 })) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        pickups.splice(i, 1);
      } else if (p.x + p.r < 0) {
        pickups.splice(i, 1);
      }
    }
    // UI fuel bar
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.fuel * 2, 10);
    frame++;
    requestAnimationFrame(update);
  }

  function endGame() {
    playCrashSound();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  // start loop
  requestAnimationFrame(update);
})();
