// Simple top‑down drone runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  // ----- starfield background -----
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // ----- sounds -----
  const soundCollect = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAwAAAB0AwCAgAABp0b2a0cBQCQ%2Bpu/2UEQIABAP6UAGSTNKcYhA/23kT7cHYMOE4zZl5ZLMKi6nvG7FuU%2Bz/dwr6UV4HX4k/0hI6buIrUvlv6tvDnhvY8uFz%2BhpNkQvHOxI0R%2Fs%2FQOH6%2BAMzE0xYnXjtG4aVBv2%2F%2BGYPbLQPG3tQZ%2FS2u/WQ//7c2GbhHIL2qFDRICg5nSSuns%2BzGfPT9kkTVEGR88Q8%2FCR6QOiFh1xYoosaF0z3nUOO6xYlv/85vyYlMDZ%2FzZ8V0vYicJmgZ%2F7cBuQ==' );
  const soundCrash = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAwAAAB0AwCAgAABp0b6a0cBQCYACj/3UEQIAABAP6UAGSTNKcYhA/23lT7cHYMOE4zZl5ZLMKi6nvG7FuU%2Bz%2Fdwr6UV4HX4k%2F0hI6buIrUvlv6tvDnhvY8uFz%2BhpNkQvHOxI0R%2Fs%2FQOH6%2BAMzE0xYnXjtG4aVBv2%2F%2BGYPbLQPG3tQZ%2FS2u%2FWQ//7c2GbhHIL2qFDRICg5nSSuns%2BzGfPT9kkTVEGR88Q8%2FCR6QOiFh1xYoosaF0z3nUOO6xYlv/85vyYlMDZ%2FzZ8V0vYicJmgZ%2F7cBuQ==' );

  // ----- player -----
  const drone = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    w: 30,
    h: 20,
    speed: 4,
    draw() {
      // draw drone as a sleek triangle
      ctx.fillStyle = '#0a84ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    update(keys) {
      if (keys.ArrowLeft) this.x -= this.speed;
      if (keys.ArrowRight) this.x += this.speed;
      if (keys.ArrowUp) this.y -= this.speed;
      if (keys.ArrowDown) this.y += this.speed;
      // keep inside canvas
      this.x = Math.max(this.w / 2, Math.min(canvas.width - this.w / 2, this.x));
      this.y = Math.max(this.h / 2, Math.min(canvas.height - this.h / 2, this.y));
    }
  };

  // ----- input -----
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ----- entities -----
  const obstacles = [];
  const batteries = [];
  let frames = 0;
  let score = 0;
  let gameOver = false;

  function spawnObstacle() {
    const size = 20 + Math.random() * 20;
    obstacles.push({
      x: Math.random() * (canvas.width - size) + size / 2,
      y: -size,
      r: size / 2,
      speed: 2 + Math.random() * 2
    });
  }

  function spawnBattery() {
    const r = 10;
    batteries.push({
      x: Math.random() * (canvas.width - 2 * r) + r,
      y: -r,
      r,
      speed: 1.5
    });
  }

  function rectCircleCollide(rect, circle) {
    // closest point on rect to circle center
    const cx = Math.max(rect.x - rect.w / 2, Math.min(circle.x, rect.x + rect.w / 2));
    const cy = Math.max(rect.y - rect.h / 2, Math.min(circle.y, rect.y + rect.h / 2));
    const dx = cx - circle.x;
    const dy = cy - circle.y;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function update() {
    if (gameOver) return;
    frames++;
    // spawn entities
    if (frames % 80 === 0) spawnObstacle();
    if (frames % 150 === 0) spawnBattery();

    // update starfield
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    drone.update(keys);

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.r > canvas.height) obstacles.splice(i, 1);
      else if (rectCircleCollide(drone, o)) {
        soundCrash.currentTime = 0;
        soundCrash.play();
        gameOver = true;
      }
    }
    // move batteries
    for (let i = batteries.length - 1; i >= 0; i--) {
      const b = batteries[i];
      b.y += b.speed;
      if (b.y - b.r > canvas.height) batteries.splice(i, 1);
      else if (rectCircleCollide(drone, b)) {
        score += 10;
        batteries.splice(i, 1);
      }
    }
  }

  function draw() {
    // draw moving starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // overlay gradient sky for depth
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#b2e0ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw drone as triangle with stroke
    drone.draw();

    // draw obstacles with radial gradient for depth
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
      grad.addColorStop(0, '#ff8a80');
      grad.addColorStop(1, '#d32f2f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw batteries as glowing circles
    batteries.forEach(b => {
      const grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.3, b.x, b.y, b.r);
      grad.addColorStop(0, '#b9f6ca');
      grad.addColorStop(1, '#388e3c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // score overlay
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // game over overlay with semi‑transparent panel and text
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  loop();
})();
