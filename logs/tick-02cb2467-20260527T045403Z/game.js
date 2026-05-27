// Simple Pixel Dodger game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player configuration
  const player = { x: width / 2 - 10, y: height - 30, size: 20, speed: 4, color: '#000' };
  const keys = {};

  // Shape configuration
  const shapes = [];
  const particles = [];
  const shapeSize = 20;
  const spawnInterval = 800; // ms
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  // Input handling and audio context unlock
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioUnlocked = false;
  const unlockAudio = () => {
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  };
  // Simple tone player using Web Audio API
  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  window.addEventListener('keydown', e => { keys[e.key] = true; unlockAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnShape() {
    const x = Math.random() * (width - shapeSize);
    const isGreen = Math.random() < 0.4; // 40% green, else red
    const color = isGreen ? '#00ff00' : '#ff3300'; // vivid colors
    shapes.push({ x, y: -shapeSize, size: shapeSize, color, isGreen, speed: 2 + Math.random() * 2 });
    // create a burst of particles at the spawn point for visual flair
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: x + shapeSize / 2,
        y: -shapeSize,
        radius: Math.random() * 3 + 1,
        alpha: 0.8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5 + 0.2,
        color: color
      });
    }
  }

  function update(dt) {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep player in bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // spawn new shapes
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnShape();
      lastSpawn = performance.now();
    }

    // update particles (fade and drift)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // update shapes
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      s.y += s.speed;
      // collision with player
      if (
        s.x < player.x + player.size &&
        s.x + s.size > player.x &&
        s.y < player.y + player.size &&
        s.y + s.size > player.y
      ) {
        if (s.isGreen) {
          score++;
          // play collect sound
          playTone(660, 0.08, 'triangle');
          shapes.splice(i, 1);
          continue;
        } else {
          // play hit sound and end game
          playTone(220, 0.3, 'sawtooth');
          gameOver = true;
        }
      }
      // shape reaches bottom
      if (s.y > height) {
        gameOver = true;
      }
    }
  }

function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw player with gradient circle (already set up in draw)
    const playerGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size * 0.1,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    playerGrad.addColorStop(0, '#fff');
    playerGrad.addColorStop(1, player.color);
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // draw shapes as circles with gradient
    shapes.forEach(s => {
      const grad = ctx.createRadialGradient(
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size * 0.1,
        s.x + s.size / 2,
        s.y + s.size / 2,
        s.size / 2
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, s.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw particles for sparkle effect
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
