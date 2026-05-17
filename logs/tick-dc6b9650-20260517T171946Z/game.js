// Simple Radar Pulse game implementation
// Canvas with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Adjust canvas to full window size
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Obstacle definition
  class Obstacle {
    constructor(x, y, size = 30) {
      this.x = x;
      this.y = y;
      this.size = size;
    }
    draw() {
      ctx.fillStyle = '#ff5555';
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
  }

  // Generate random obstacles
  const obstacles = [];
  const OBSTACLE_COUNT = 50;
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    obstacles.push(new Obstacle(x, y));
  }

  // Pulse state
  let pulse = null; // {x, y, radius, maxRadius, alpha}

  const startPulse = (x, y) => {
    pulse = {
      x,
      y,
      radius: 0,
      maxRadius: 150,
      alpha: 1,
    };
  };

  // Click or tap triggers pulse
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startPulse(x, y);
  });

  const update = (delta) => {
    if (pulse) {
      const speed = 300; // pixels per second
      pulse.radius += speed * delta;
      pulse.alpha = 1 - pulse.radius / pulse.maxRadius;
      if (pulse.radius >= pulse.maxRadius) {
        pulse = null;
      }
    }
  };

  const draw = () => {
    // Dark background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw visible obstacles
    obstacles.forEach((obs) => {
      if (pulse) {
        const dx = obs.x - pulse.x;
        const dy = obs.y - pulse.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= pulse.radius) {
          obs.draw();
        }
      }
    });

    // Draw pulse circle
    if (pulse) {
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,255,255,${pulse.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  let lastTime = performance.now();
  const loop = (time) => {
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
