// Simple Space Debris Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  let thrustPlaying = false;
  function startThrustSound(){
    if (thrustPlaying) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    osc.type = 'square';
    gain.gain.value = 0.03;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = osc;
    thrustPlaying = true;
  }
  function stopThrustSound(){
    if (thrustOsc){
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
    thrustPlaying = false;
  }
  function playTone(freq, type, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: width / 2, y: height * 0.8, w: 30, h: 15, speed: 0, fuel: 100 };
  const debris = [];
  const packets = [];
  // stars for background
  const stars = Array.from({length: 100}, () => ({ x: Math.random()*width, y: Math.random()*height, r: Math.random()*2+0.5 }));
  // exhaust particles
  const particles = [];
  let score = 0;
  let lastTime = 0;

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const spawnDebris = () => {
    const size = rand(15, 40);
    debris.push({ x: rand(0, width), y: -size, r: size, angle: rand(0, Math.PI * 2), rot: rand(-0.05, 0.05) });
  };
  const spawnPacket = () => {
    const size = 10;
    packets.push({ x: rand(0, width), y: -size, r: size });
  };
  const rectCollide = (a, b) => a.x < b.x + b.r && a.x + a.w > b.x - b.r && a.y < b.y + b.r && a.y + a.h > b.y - b.r;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; audioCtx.resume && audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update(dt) {
    // Update stars background
    stars.forEach(s => {
      s.y += ship.speed * dt * 0.3;
    });
    // Recycle stars
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].y - stars[i].r > height) {
        stars[i].x = Math.random() * width;
        stars[i].y = -stars[i].r;
        stars[i].r = Math.random() * 2 + 0.5;
      }
    }
    // Update particles
    particles.forEach(p => {
      p.y += ship.speed * dt * 0.5;
      p.life -= dt;
    });
    // Remove expired particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    // Fuel drains
    ship.fuel -= dt * 0.01; // drain per ms
    if (ship.fuel <= 0) ship.fuel = 0;

    // Horizontal thrust
    const thrusting = keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];
    if (keys['ArrowLeft'] || keys['KeyA']) ship.x -= ship.speed * dt;
    if (keys['ArrowRight'] || keys['KeyD']) ship.x += ship.speed * dt;
    // Apply constant forward speed (visual only)
    ship.speed = 0.2; // pixels per ms
    // Emit exhaust particles when thrusting
    if (thrusting) {
      // start thrust sound
      startThrustSound();
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: ship.x + ship.w / 2 + (Math.random() - 0.5) * 5,
          y: ship.y + ship.h,
          life: 300,
          r: Math.random() * 2 + 1,
          color: 'orange'
        });
      }
    } else {
      // stop when not thrusting
      stopThrustSound();
    }
    // Clamp ship inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Move debris downwards
    debris.forEach(d => {
      d.y += ship.speed * dt * 0.5; // slower than ship to simulate forward motion
      d.angle += d.rot;
    });
    // Move packets downwards
    packets.forEach(p => p.y += ship.speed * dt * 0.5);

    // Remove off‑screen objects
    while (debris.length && debris[0].y - debris[0].r > height) debris.shift();
    while (packets.length && packets[0].y - packets[0].r > height) packets.shift();

    // Spawn new obstacles / packets
    if (Math.random() < dt * 0.0015) spawnDebris();
    if (Math.random() < dt * 0.0008) spawnPacket();

    // Collision detection
    for (let i = debris.length - 1; i >= 0; i--) {
      if (rectCollide(ship, debris[i])) {
        // Play crash sound
        playTone(120, 'sawtooth', 0.6);
        // Stop thrust sound if playing
        stopThrustSound();
        // Game over – stop animation
        cancelAnimationFrame(animId);
        alert(`Game Over! Score: ${score}`);
        return false;
      }
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      if (rectCollide(ship, packets[i])) {
        score += 10;
        packets.splice(i, 1);
      }
    }
    return true;
  }

  function draw() {
    // Clear canvas first
    ctx.clearRect(0, 0, width, height);
    // Draw starfield background
    ctx.fillStyle = '#111';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw exhaust particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / 300, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // Ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#050');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.closePath();
    ctx.fill();
    // Debris (rotating squares with gradient)
    debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      const grad = ctx.createLinearGradient(-d.r/2, -d.r/2, d.r/2, d.r/2);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#aaa');
      ctx.fillStyle = grad;
      ctx.fillRect(-d.r / 2, -d.r / 2, d.r, d.r);
      ctx.restore();
    });
    // Packets (blue circles)
    ctx.fillStyle = '#00f';
    packets.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';n    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (ship.fuel <= 0) {
      ctx.fillText('Out of fuel!', width / 2 - 50, height / 2);
    }
  }

  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (update(dt)) {
      draw();
      animId = requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();
