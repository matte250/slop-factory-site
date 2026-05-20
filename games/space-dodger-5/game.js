// Space Dodger game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
   if (!canvas) return console.error('Canvas #game not found');
   const ctx = canvas.getContext('2d');
   const width = canvas.width = canvas.clientWidth || 800;
   const height = canvas.height = canvas.clientHeight || 600;
   // Background stars
   const stars = Array.from({length: 100}, () => ({
     x: Math.random() * width,
     y: Math.random() * height,
     radius: Math.random() * 1.5 + 0.5
   }));
    // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Ensure audio context resumes on first user interaction
    const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
    window.addEventListener('keydown', resumeAudio, {once: true});
    // Collision sound
    function playCollision(){
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
    // Engine hum (continuous while moving)
    let engineOsc = null;
    function startEngine(){
      if (engineOsc) return;
      engineOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      engineOsc.type = 'triangle';
      engineOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      engineOsc.connect(gain).connect(audioCtx.destination);
      engineOsc.start();
    }
    function stopEngine(){
      if (!engineOsc) return;
      engineOsc.stop();
      engineOsc.disconnect();
      engineOsc = null;
    }

  // Ship
  const ship = { x: width / 2, y: height - 40, w: 30, h: 30, speed: 4, dx: 0, dy: 0 };
  // Asteroids
  const asteroids = [];
  const asteroidFreq = 90; // frames between spawns
  let frame = 0;
  let score = 0;
  let start = performance.now();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, w: size, h: size, speed });
  }

  function update() {
    // Move background stars for a subtle parallax effect
    stars.forEach(star => {
      star.y += 0.2; // slow downward drift
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });
    // Move ship
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    // Engine sound based on movement
    if (ship.dx !== 0 || ship.dy !== 0) {
      startEngine();
    } else {
      stopEngine();
    }
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // Spawn asteroids
    if (frame % asteroidFreq === 0) spawnAsteroid();
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > height) asteroids.splice(i, 1);
      // Collision
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        // Game over
        playCollision();
        cancelAnimationFrame(rAF);
        const elapsed = ((performance.now() - start) / 1000).toFixed(1);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', width / 2 - 80, height / 2);
        ctx.fillText(`Score: ${elapsed}s`, width / 2 - 80, height / 2 + 40);
        return;
      }
    }
    score = ((performance.now() - start) / 1000).toFixed(1);
    frame++;
  }

function draw() {
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (circles with gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${score}s`, 10, 20);
  }

  function loop() {
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  }
  let rAF = requestAnimationFrame(loop);
})();
