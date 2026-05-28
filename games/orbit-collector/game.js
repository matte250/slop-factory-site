// Orbit Collector Game
// Canvas element with id="game" is expected in the HTML.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  let bgGrad;
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  // Set canvas size to fill parent or window
  function resize() {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    // Create background gradient
    bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#040f1c');
  }
  resize();
  window.addEventListener('resize', resize);

  // Game parameters
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  const orbitRadius = 80;
  const dotRadius = 8;
  const starRadius = 6;
  const dotSpeed = 4; // speed when shot outward
  const rotationSpeed = 0.03; // radians per frame
  const starSpawnInterval = 1500; // ms
  const starFallSpeed = 2;
  const maxMisses = 3;

  // Game state
  let angle = 0;
  let shooting = false;
  let dotPos = { x: center.x + orbitRadius, y: center.y };
  let dotVel = { x: 0, y: 0 };
  let stars = [];
  let lastSpawn = 0;
  let missed = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  function shoot() {
    if (shooting || gameOver) return;
    shooting = true;
    // Velocity points radially outward from center
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    dotVel.x = dirX * dotSpeed;
    dotVel.y = dirY * dotSpeed;
    // Play shooting sound
    playTone(600, 0.1);
  }
  canvas.addEventListener('mousedown', function(e){
    audioCtx.resume();
    shoot();
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    audioCtx.resume();
    shoot();
  }, { passive: false });

  // Helper
  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  // Main loop
  function update(timestamp) {
    if (gameOver) {
      drawGameOver();
      return;
    }
    // Clear with gradient background
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update center (in case canvas resized)
    center.x = canvas.width / 2;
    center.y = canvas.height / 2;

    // Spawn stars
    if (timestamp - lastSpawn > starSpawnInterval) {
      const starX = Math.random() * canvas.width;
      stars.push({ x: starX, y: -starRadius, speed: starFallSpeed + Math.random() * 1.5 });
      lastSpawn = timestamp;
    }

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      // Collision with dot
if (distance(s, dotPos) < dotRadius + starRadius) {
          stars.splice(i, 1);
          score++;
          // Play collect sound
          playTone(400, 0.08);
          continue;
        }
      // Missed
if (s.y - starRadius > canvas.height) {
          stars.splice(i, 1);
          missed++;
          // Play miss sound
          playTone(200, 0.15);
          if (missed >= maxMisses) {
            gameOver = true;
            // Play game over sound
            playTone(100, 0.5);
          }
          continue;
        }
    }

    // Update dot
    if (shooting) {
      dotPos.x += dotVel.x;
      dotPos.y += dotVel.y;
      // If dot leaves canvas, reset to orbit
      if (
        dotPos.x < -dotRadius || dotPos.x > canvas.width + dotRadius ||
        dotPos.y < -dotRadius || dotPos.y > canvas.height + dotRadius
      ) {
        shooting = false;
        angle = 0; // optional reset
        dotPos.x = center.x + orbitRadius * Math.cos(angle);
        dotPos.y = center.y + orbitRadius * Math.sin(angle);
      }
    } else {
      // Orbiting
      angle += rotationSpeed;
      dotPos.x = center.x + orbitRadius * Math.cos(angle);
      dotPos.y = center.y + orbitRadius * Math.sin(angle);
    }

    // Draw orbit path
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center.x, center.y, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw central point
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw dot with radial gradient
    const dotGrad = ctx.createRadialGradient(dotPos.x, dotPos.y, dotRadius * 0.2, dotPos.x, dotPos.y, dotRadius);
    dotGrad.addColorStop(0, '#ffdd99');
    dotGrad.addColorStop(1, '#ff6600');
    ctx.fillStyle = dotGrad;
    ctx.beginPath();
    ctx.arc(dotPos.x, dotPos.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw stars with radial gradient glow
    stars.forEach(s => {
      const starGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, starRadius);
      starGrad.addColorStop(0, '#fff');
      starGrad.addColorStop(0.5, '#ffd700');
      starGrad.addColorStop(1, '#ff8c00');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, starRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw UI (score & misses) with contrast color
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Misses: ${missed}/${maxMisses}`, 10, 40);

    requestAnimationFrame(update);
  }

  function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(update);
})();
