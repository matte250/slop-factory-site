// Simple canvas game based on IDEA.md
// Assumes an HTML canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback if not set in HTML)
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Game state
  const player = { x: 50, y: canvas.height / 2, radius: 15, speed: 4 };
  const obstacles = [];
  const particles = []; // particle trail effects
  const obstacleFreq = 1500; // ms
  const obstacleSpeed = 3;
  let lastObstacle = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  function spawnObstacle() {
    // Random pastel color for each obstacle
    const hue = Math.random() * 360;
    const color = `hsl(${hue}, 70%, 50%)`;
    const size = Math.random() * 30 + 20;
    const y = Math.random() * (canvas.height - size);
    obstacles.push({ x: canvas.width, y, size, color });
  }

  // Helper to draw rounded rectangle
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }


  function update(dt) {
    // Player movement (WASD or arrow keys)
    if (keys.w || keys.ArrowUp) player.y -= player.speed;
    if (keys.s || keys.ArrowDown) player.y += player.speed;
    if (keys.a || keys.ArrowLeft) player.x -= player.speed;
    if (keys.d || keys.ArrowRight) player.x += player.speed;
    // Keep inside bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Collision detection (circle vs square)
      const distX = Math.abs(player.x - (o.x + o.size / 2));
      const distY = Math.abs(player.y - (o.y + o.size / 2));
      if (distX > o.size / 2 + player.radius || distY > o.size / 2 + player.radius) {
        // no collision
      } else if (distX <= o.size / 2 || distY <= o.size / 2) {
        gameOver = true;
      } else {
        const dx = distX - o.size / 2;
        const dy = distY - o.size / 2;
        if (dx * dx + dy * dy <= player.radius * player.radius) {
          gameOver = true;
        }
      }
        if (o.x + o.size < 0) {
          obstacles.splice(i, 1);
          score++;
          // Play score sound
          playSound(440, 0.1);
        }
      }
    }

    // Add particle at player position
    particles.push({ x: player.x, y: player.y, radius: 2, alpha: 1 });

    // Update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.alpha -= 0.02;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Spawn new obstacles
    if (Date.now() - lastObstacle > obstacleFreq) {
      spawnObstacle();
      // Play spawn sound
      playSound(220, 0.05);
      lastObstacle = Date.now();
    }
    }

    // Spawn new obstacles
    if (Date.now() - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = Date.now();
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1e3a8a'); // dark blue
    bgGrad.addColorStop(1, '#3b82f6'); // light blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw particles (trail)
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw player with radial gradient
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.2, player.x, player.y, player.radius);
    playerGrad.addColorStop(0, '#a3e635');
    playerGrad.addColorStop(1, '#166534');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw obstacles with rounded rectangles
    obstacles.forEach((o) => {
      ctx.fillStyle = o.color || '#D32F2F';
      roundRect(o.x, o.y, o.size, o.size, 6);
    });
    
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw obstacles
    ctx.fillStyle = '#D32F2F';
    obstacles.forEach((o) => {
      ctx.fillRect(o.x, o.y, o.size, o.size);
    });
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
