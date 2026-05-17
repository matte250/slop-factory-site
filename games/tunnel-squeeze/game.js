// Simple "Tunnel Squeeze" game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * DPR;
  canvas.height = canvas.clientHeight * DPR;
  ctx.scale(DPR, DPR);

  const dot = { r: 8, y: canvas.height / DPR - 30, speed: 2 };
  const tunnel = {
    baseW: 200,
    minW: 80,
    curW: 200,
    shrinkTime: 200, // ms
    lastShrink: 0,
    segments: []
  };

  // Add a new tunnel segment at the bottom every frame
  function addSegment() {
    const w = tunnel.curW;
    tunnel.segments.push({ y: canvas.height / DPR, w });
  }

  function update(dt) {
    // Move dot upward
    dot.y -= dot.speed * (dt / 16);
    if (dot.y < -dot.r) {
      dot.y = canvas.height / DPR - dot.r;
      // increase difficulty gradually
      dot.speed *= 1.05;
    }

    // Shift tunnel segments upward
    tunnel.segments.forEach(s => s.y -= dot.speed * (dt / 16));
    // Remove off‑screen segments
    while (tunnel.segments.length && tunnel.segments[0].y < -tunnel.baseW) {
      tunnel.segments.shift();
    }
    addSegment();

    // Handle shrink timeout
    if (tunnel.lastShrink && Date.now() - tunnel.lastShrink > tunnel.shrinkTime) {
      tunnel.curW = tunnel.baseW;
      tunnel.lastShrink = 0;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(0, 0);
    // draw tunnel walls
    ctx.fillStyle = '#444';
    tunnel.segments.forEach(seg => {
      const half = seg.w / 2;
      const cx = canvas.width / DPR / 2;
      ctx.fillRect(0, seg.y, cx - half, 1);
      ctx.fillRect(cx + half, seg.y, canvas.width / DPR - (cx + half), 1);
    });
    // draw dot
    ctx.beginPath();
    ctx.arc(canvas.width / DPR / 2, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.restore();
  }

  function loop(ts) {
    const now = performance.now();
    if (!loop.last) loop.last = now;
    const dt = now - loop.last;
    loop.last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // tap / click narrows the tunnel briefly
  function shrink() {
    tunnel.curW = tunnel.minW;
    tunnel.lastShrink = Date.now();
  }
  canvas.addEventListener('pointerdown', shrink);
  // start game
  requestAnimationFrame(loop);
})();
