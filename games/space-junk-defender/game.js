// Simple Space Junk Defender with enhanced graphics
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Ship
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  const keys = { left: false, right: false, fire: false };

  // Game objects
  const debris = [];
  const lasers = [];
  let score = 0;
  let lives = 3;
  let frame = 0;
  let gameOver = false;

  const rand = (min, max) => Math.random() * (max - min) + min;

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  const playLaser = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  };

  const playExplosion = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };


  const spawnDebris = () => {
    const w = rand(15, 30);
    debris.push({ x: rand(0, width - w), y: -w, w, h: w, speed: 1 + score / 1000 });
  };

  const drawShip = () => {
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0aa';
    ctx.stroke();
  };

  // Pre-create a starfield background
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
  }));

  const drawBackground = () => {
    // Space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawDebris = () => {
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(
        d.x + d.w / 2,
        d.y + d.h / 2,
        d.w * 0.1,
        d.x + d.w / 2,
        d.y + d.h / 2,
        d.w / 2
      );
      grad.addColorStop(0, '#ffb84d');
      grad.addColorStop(1, '#b35400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawLasers = () => {
    lasers.forEach(l => {
      const grad = ctx.createRadialGradient(
        l.x + l.w / 2,
        l.y + l.h / 2,
        0,
        l.x + l.w / 2,
        l.y + l.h / 2,
        l.w
      );
      grad.addColorStop(0, '#ff5555');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x + l.w / 2, l.y + l.h / 2, l.w, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawHUD = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, width - 80, 20);
  };

  const rectIntersect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    if (gameOver) return;
    frame++;
    // Ship movement
    if (keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.right) ship.x = Math.min(width - ship.w, ship.x + ship.speed);
    // Fire
    if (keys.fire) {
      lasers.push({ x: ship.x + ship.w / 2 - 1, y: ship.y, w: 2, h: 10, speed: 7 });
      playLaser();
      keys.fire = false; // single shot per key press
    }
    // Update lasers
    lasers.forEach(l => l.y -= l.speed);
    // Remove off-screen lasers
    for (let i = lasers.length - 1; i >= 0; i--) if (lasers[i].y + lasers[i].h < 0) lasers.splice(i, 1);
    // Spawn debris every 60 frames (~1 sec at 60fps)
    if (frame % 60 === 0) spawnDebris();
    // Update debris
    debris.forEach(d => d.y += d.speed);
    // Collision: laser vs debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      let hit = false;
      for (let j = lasers.length - 1; j >= 0; j--) {
        if (rectIntersect(d, lasers[j])) {
          hit = true;
          lasers.splice(j, 1);
          break;
        }
      }
        if (hit) {
          debris.splice(i, 1);
          playExplosion();
          score += 10;
          continue;
        }
        // Collision: debris vs ship
        if (rectIntersect(d, ship)) {
          debris.splice(i, 1);
          playExplosion();
          lives--;
          if (lives <= 0) {
            gameOver = true;
          }
        } else if (d.y > height) {
        // missed debris
        debris.splice(i, 1);
        score += 1;
      }
    }
  };

  const render = () => {
    ctx.clearRect(0, 0, width, height);
    drawShip();
    drawDebris();
    drawLasers();
    drawHUD();
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 30);
    }
  };

  const loop = () => {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Input handlers
  // Ensure audio context is running on user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };

  window.addEventListener('keydown', e => {
    resumeAudio();
    if (e.key === 'ArrowLeft') keys.left = true;
    else if (e.key === 'ArrowRight') keys.right = true;
    else if (e.key === ' ' || e.key === 'Spacebar') keys.fire = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    else if (e.key === 'ArrowRight') keys.right = false;
  });

  // Start loop
  requestAnimationFrame(loop);
})();
