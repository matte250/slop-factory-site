// Simple "Orbit Flip" game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Resize canvas to match its displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const center = { x: () => canvas.width / 2, y: () => canvas.height / 2 };
  const radius = Math.min(canvas.width, canvas.height) * 0.35;
  let angle = 0; // radians
  let speed = 0.02; // radians per frame
  let direction = 1; // 1 = clockwise, -1 = counter‑clockwise

  // Flip direction on any click/tap; also play flip sound
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const startBackground = () => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(60, audioCtx.currentTime);
    g.gain.setValueAtTime(0.02, audioCtx.currentTime);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    // keep running
  };
  startBackground();
  const playFlipSound = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, audioCtx.currentTime);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.1);
  };
  canvas.addEventListener('pointerdown', () => {
    direction *= -1;
    playFlipSound();
  });

  // Simple background tunnel effect – moving vertical lines
  const tunnelLines = [];
  const lineCount = 30;
  for (let i = 0; i < lineCount; i++) {
    tunnelLines.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 1 + Math.random() * 2 });
  }

  const draw = () => {
    // Fade previous frame for motion trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background gradient (dark space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0b0d1a');
    bgGrad.addColorStop(1, '#02030a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tunnel – moving lines with depth shading
    ctx.lineWidth = 2;
    tunnelLines.forEach(l => {
      const alpha = 0.2 + 0.3 * (l.y / canvas.height);
      ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, l.y + 30);
      ctx.stroke();
      l.y += l.speed;
      if (l.y > canvas.height) l.y = -30;
    });

    // Central pivot with subtle glow
    const pivotGrad = ctx.createRadialGradient(center.x(), center.y(), 2, center.x(), center.y(), 8);
    pivotGrad.addColorStop(0, '#888');
    pivotGrad.addColorStop(1, '#111');
    ctx.fillStyle = pivotGrad;
    ctx.beginPath();
    ctx.arc(center.x(), center.y(), 5, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting dot with glowing gradient
    const dotX = center.x() + radius * Math.cos(angle);
    const dotY = center.y() + radius * Math.sin(angle);
    const dotGrad = ctx.createRadialGradient(dotX, dotY, 2, dotX, dotY, 12);
    dotGrad.addColorStop(0, '#ffaaaa');
    dotGrad.addColorStop(0.5, '#ff4444');
    dotGrad.addColorStop(1, '#880000');
    ctx.fillStyle = dotGrad;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.fill();

    angle += speed * direction;
    requestAnimationFrame(draw);
  };

  draw();
})();
