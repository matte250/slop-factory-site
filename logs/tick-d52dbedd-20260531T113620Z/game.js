// Minimalist Gravity Flip game – enhanced graphics
// Canvas element with id="game" is expected in the HTML.

(() => {
  // Set up a subtle radial background gradient
  const bgGradient = (() => {
    const grad = ctx.createRadialGradient(width/2, height/2, Math.min(width, height)*0.1, width/2, height/2, Math.max(width, height));
    grad.addColorStop(0, '#222');
    grad.addColorStop(1, '#000');
    return grad;
  })();
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a simple beep
  function playBeep(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure AudioContext is resumed on first user interaction
  canvas.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gravityDir *= -1;
    playBeep(440, 0.08); // flip sound
  });

  const BALL_RADIUS = 10;
  const GRAVITY = 0.3; // acceleration per frame
  const PLATFORM_LENGTH = Math.min(width, height) * 0.8;
  const PLATFORM_SPEED = 0.01; // radians per frame

  let gravityDir = 1; // 1 = down, -1 = up
  // click listener now handles gravity flip and sound

  const ball = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    update() {
      // apply gravity
      this.vy += GRAVITY * gravityDir;
      this.x += this.vx;
      this.y += this.vy;
    },
draw() {
        // radial gradient for a 3‑D sphere look
        const grad = ctx.createRadialGradient(this.x - this.radius/3, this.y - this.radius/3, this.radius/5, this.x, this.y, this.radius);
        grad.addColorStop(0, '#ff8a65');
        grad.addColorStop(1, '#d84315');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // subtle white highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius/3, this.y - this.radius/3, this.radius/3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
  };

  const platform = {
    angle: 0,
    update() {
      this.angle += PLATFORM_SPEED;
    },
    // return end points of the rotating line (centered)
    getPoints() {
      const cx = width / 2;
      const cy = height / 2;
      const half = PLATFORM_LENGTH / 2;
      const cos = Math.cos(this.angle);
      const sin = Math.sin(this.angle);
      const x1 = cx - half * cos;
      const y1 = cy - half * sin;
      const x2 = cx + half * cos;
      const y2 = cy + half * sin;
      return { x1, y1, x2, y2 };
    },
    draw() {
      const { x1, y1, x2, y2 } = this.getPoints();
      // gradient stroke for depth
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, '#90caf9');
      grad.addColorStop(1, '#1e88e5');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // reset shadow
      ctx.shadowBlur = 0;
    }
  };

  // Helper: distance from point to line segment
  function pointLineDist(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1; yy = y1;
    } else if (param > 1) {
      xx = x2; yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Collision handling – simple stick to platform when nearing from gravity direction
  function handleCollision() {
    const { x1, y1, x2, y2 } = platform.getPoints();
    const dist = pointLineDist(ball.x, ball.y, x1, y1, x2, y2);
    if (dist < ball.radius) {
      // Determine which side of the line the ball is on
      const side = (ball.x - x1) * (y2 - y1) - (ball.y - y1) * (x2 - x1);
      // side > 0 means one side, <0 the opposite
      const shouldStick = (gravityDir === 1 && side > 0) || (gravityDir === -1 && side < 0);
      if (shouldStick) {
          // play a short impact sound
          playBeep(660, 0.05, 'triangle');
        // Project ball onto line to keep it on surface
        const t = ((ball.x - x1) * (x2 - x1) + (ball.y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        // Move ball to surface
        const normal = Math.sqrt((ball.x - projX) ** 2 + (ball.y - projY) ** 2);
        const moveFactor = (ball.radius - normal) / normal;
        ball.x = ball.x + (ball.x - projX) * moveFactor;
        ball.y = ball.y + (ball.y - projY) * moveFactor;
        // Cancel velocity perpendicular to platform
        const vx = ball.vx;
        const vy = ball.vy;
        const nx = -(y2 - y1);
        const ny = x2 - x1;
        const len = Math.hypot(nx, ny);
        const nxu = nx / len;
        const nyu = ny / len;
        const perp = vx * nxu + vy * nyu;
        ball.vx = vx - perp * nxu;
        ball.vy = vy - perp * nyu;
        // Add small friction along platform
        ball.vx *= 0.99;
        ball.vy *= 0.99;
      }
    }
  }

  function loseCheck() {
    if (ball.y - ball.radius > height || ball.y + ball.radius < 0) {
      // Reset game state
      ball.x = width / 2;
      ball.y = height / 2;
      ball.vx = 0;
      ball.vy = 0;
      gravityDir = 1;
    }
  }

  function loop() {
    // Update background gradient with subtle hue shift
    const hue = (Date.now() * 0.02) % 360;
    const bgGrad = ctx.createRadialGradient(width/2, height/2, Math.min(width, height)*0.1, width/2, height/2, Math.max(width, height));
    bgGrad.addColorStop(0, `hsl(${hue},30%,20%)`);
    bgGrad.addColorStop(1, `hsl(${(hue+60)%360},30%,10%)`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    platform.update();
    platform.draw();
    ball.update();
    handleCollision();
    ball.draw();
    loseCheck();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
