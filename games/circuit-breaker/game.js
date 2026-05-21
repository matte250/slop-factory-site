// Simple "Circuit Breaker" canvas game
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set full‑size canvas
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const speed = 2; // pixels per frame
  const turnRate = 0.04; // radians per key press
  const trail = [];
  const maxTrail = 5000;
  const nodeRadius = 8;
  const cursorRadius = 4;
  let angle = 0;
  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let score = 0;
  let nodes = [];
  let gameOver = false;

  // spawn energy nodes periodically
  const spawnNode = () => {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      collected: false,
    });
  };
  setInterval(spawnNode, 2000);

  const keys = {};
  window.addEventListener('keydown', e => { 
    // Unlock audio on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true; 
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const checkSelfCollision = () => {
    // check distance to earlier points (skip last 20 to avoid immediate neighbour)
    for (let i = 0; i < trail.length - 20; i++) {
      const p = trail[i];
      const dx = p.x - x;
      const dy = p.y - y;
      if (dx * dx + dy * dy < (cursorRadius * 2) ** 2) return true;
    }
    return false;
  };

  const update = () => {
    if (gameOver) return;
    // handle input
    if (keys['ArrowLeft']) angle -= turnRate;
    if (keys['ArrowRight']) angle += turnRate;

    // move
    x += Math.cos(angle) * speed;
    y += Math.sin(angle) * speed;

    // wall collision
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
      playTone(220, 0.3);
      gameOver = true;
    }

    // self collision
    if (checkSelfCollision()) { playTone(330, 0.2); gameOver = true; }

    // trail management
    trail.push({ x, y });
    if (trail.length > maxTrail) trail.shift();

    // energy collection
    nodes.forEach(node => {
      if (!node.collected) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy < (cursorRadius + nodeRadius) ** 2) {
          node.collected = true;
          score += 10;
          playTone(660, 0.1);
        }
      }
    });
    // remove collected nodes
    nodes = nodes.filter(n => !n.collected);
  };

  const draw = () => {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#0b0c10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw trail
    // Trail style with glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    trail.forEach((p, i) => {
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    // draw cursor with glowing gradient
    const cursorGrad = ctx.createRadialGradient(x, y, 0, x, y, cursorRadius);
    cursorGrad.addColorStop(0, '#ff0');
    cursorGrad.addColorStop(1, '#ff6600');
    ctx.fillStyle = cursorGrad;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, cursorRadius, 0, Math.PI * 2);
    ctx.fill();
    // reset shadow for other draws
    ctx.shadowColor = 'transparent';
    // draw nodes with glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10;
    nodes.forEach(node => {
      const nodeGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeRadius);
      nodeGrad.addColorStop(0, '#ff4d4d');
      nodeGrad.addColorStop(1, '#8b0000');
      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    // reset shadow
    ctx.shadowColor = 'transparent';
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  const loop = () => {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
