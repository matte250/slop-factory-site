// Minimal endless side‑scroll runner with simple graphics enhancements
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple beep generator
  const playBeep = (freq, dur) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    oscillator.stop(audioCtx.currentTime + dur);
  };

  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    groundY = canvas.height * 0.8; // recompute ground position on resize
  };
  resize();
  window.addEventListener('resize', resize);

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 4; // world scroll speed

  let groundY = canvas.height * 0.8; // updated on resize

  const player = {
    x: 50,
    y: groundY,
    radius: 12,
    vy: 0,
    onGround: true,
    draw() {
      // draw a gradient circle for the player
      const grad = ctx.createRadialGradient(this.x + this.radius / 2, this.y - this.radius / 2, this.radius / 4, this.x + this.radius / 2, this.y - this.radius / 2, this.radius);
      grad.addColorStop(0, '#00f');
      grad.addColorStop(1, '#006');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y - this.radius, this.radius, 0, Math.PI * 2);
      ctx.fill();
    },
    update(gY) {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y >= gY) {
        this.y = gY;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
  };

  // simple obstacle definition
  const obstacles = [];
  const spawnObstacle = () => {
    const width = 20 + Math.random() * 30;
    const height = 20 + Math.random() * 40;
    obstacles.push({ x: canvas.width + width, y: groundY, w: width, h: height });
  };
  // spawn every ~1.5‑2 seconds
  setInterval(spawnObstacle, 1600);

  // Input: space or click triggers jump
  const tryJump = () => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playBeep(600, 0.08); // jump sound
    }
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') tryJump(); });
  canvas.addEventListener('click', tryJump);

  let running = true;
  const gameOver = () => {
    running = false;
    // play collision sound
    playBeep(200, 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  };

  const checkCollision = (obj) => {
    // approximate player as a square bounding box based on its radius
    const half = player.radius;
    return (
      player.x - half < obj.x + obj.w &&
      player.x + half > obj.x &&
      player.y - half < obj.y &&
      player.y > obj.y - obj.h
    );
  };

  function loop() {
    if (!running) return;
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB'); // light sky
    skyGradient.addColorStop(1, '#4682B4'); // deeper sky
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ground gradient
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(1, '#654321');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    // update and draw player
    player.update();
    player.draw();
    // move obstacles
    // draw obstacles with gradient
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SPEED;
      const obsGrad = ctx.createLinearGradient(o.x, o.y - o.h, o.x, o.y);
      obsGrad.addColorStop(0, '#a00'); // dark top
      obsGrad.addColorStop(1, '#f44'); // bright bottom
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y - o.h, o.w, o.h);
      if (checkCollision(o)) {
        gameOver();
        return;
      }
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    requestAnimationFrame(loop);
  }

  loop();
})();
