// Neon Runner – minimal implementation

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); window.removeEventListener('click', resumeAudio); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playScore = () => playTone(800, 0.08);
  const playCrash = () => playTone(200, 0.4);


  // size canvas to its CSS dimensions
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player – glowing orb
  const player = {
    radius: 10,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 4,
    color: '#0ff',
    move: 0 // -1 left, 1 right, 0 none
  };

  // Controls
  const keyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.move = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') player.move = 1;
  };
  const keyUp = (e) => {
    if ((e.key === 'ArrowLeft' && player.move === -1) || (e.key === 'a' && player.move === -1)) player.move = 0;
    if ((e.key === 'ArrowRight' && player.move === 1) || (e.key === 'd' && player.move === 1)) player.move = 0;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  // Obstacles – neon bars and occasional rotating spikes
  const obstacles = [];
  const obstacleSpacing = 80; // distance between rows
  let lastObstacleY = -obstacleSpacing;
  const barHeight = 20;
  const gapWidth = 80;
  const spikeSize = 15; // size of rotating spike triangles

  const addObstacleRow = () => {
    const y = lastObstacleY - obstacleSpacing;
    const gapX = Math.random() * (canvas.width - gapWidth);
    // Left bar
if (gapX > 0) obstacles.push({ x: 0, y, w: gapX, h: barHeight, type: 'bar' });
      // Right bar
      const rightX = gapX + gapWidth;
      if (rightX < canvas.width) obstacles.push({ x: rightX, y, w: canvas.width - rightX, h: barHeight, type: 'bar' });
      // Occasionally add a rotating spike in the gap
      if (Math.random() < 0.3) {
        const spikeX = gapX + gapWidth / 2;
        obstacles.push({ x: spikeX, y, w: spikeSize, h: spikeSize, type: 'spike', angle: Math.random() * Math.PI * 2 });
      }
    lastObstacleY = y;
  };

  // Collision detection (circle-rect)
  const collides = (c, r) => {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > (r.w / 2 + c.radius)) return false;
    if (distY > (r.h / 2 + c.radius)) return false;
    if (distX <= (r.w / 2)) return true;
    if (distY <= (r.h / 2)) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return (dx * dx + dy * dy <= c.radius * c.radius);
  };

  let score = 0;
  let gameOver = false;
  let frame = 0;

  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
      return;
    }

        // Draw neon background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Move player
    player.x += player.move * player.speed;
    // Keep within bounds
    if (player.x - player.radius < 0 || player.x + player.radius > canvas.width) {
      playCrash();
      gameOver = true;
    }

    // Draw player (glow effect)
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 3);
    grad.addColorStop(0, player.color);
    grad.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Add new obstacles periodically
    if (frame % 60 === 0) addObstacleRow();

    // Move obstacles down (simulating upward motion)
for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += 2; // speed of scroll
      // Rotate spikes
      if (o.type === 'spike') o.angle += 0.05;
      // Draw
      if (o.type === 'spike') {
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
        ctx.rotate(o.angle);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -o.h / 2);
        ctx.lineTo(o.w / 2, o.h / 2);
        ctx.lineTo(-o.w / 2, o.h / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else {
        // Draw neon bar with glow
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#0ff';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;
      }
      // Collision
      if (collides(player, o)) { playCrash(); gameOver = true; }
      // Remove off‑screen
      if (o.y > canvas.height) {
        obstacles.splice(i, 1);
        score++;
        playScore();
      }
    }

    // Simple score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    frame++;
    requestAnimationFrame(loop);
  };

  // Start the game
  requestAnimationFrame(loop);
})();
