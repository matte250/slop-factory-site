// Minimal Canvas Escape game

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - 50;
  };
  window.addEventListener('resize', resize);
  resize();

  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playJump = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 400;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
  const playCrash = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };

  const player = {
    x: 100,
    y: 0,
    w: 30,
    h: 30,
    vy: 0,
    jumpStrength: -12,
    color: '#ff0',
    onGround: false,
    update() {
      this.vy += 0.6; // gravity
      this.y += this.vy;
      if (this.y + this.h >= groundY) {
        this.y = groundY - this.h;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = this.jumpStrength;
        playJump();
      }
    },
    draw() {
      // draw player as a rounded square with gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ffa500');
      ctx.fillStyle = grad;
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, this.y);
      ctx.lineTo(this.x + this.w - radius, this.y);
      ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + radius);
      ctx.lineTo(this.x + this.w, this.y + this.h - radius);
      ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - radius, this.y + this.h);
      ctx.lineTo(this.x + radius, this.y + this.h);
      ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - radius);
      ctx.lineTo(this.x, this.y + radius);
      ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
      ctx.closePath();
      ctx.fill();
    },
  };

  let groundY = canvas.height - 50;
  const speed = 4; // scroll speed
  const obstacles = [];
  let scroll = 0;
  let nextObstacleX = canvas.width;
  let gameOver = false;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const addObstacle = () => {
    const gap = Math.random() < 0.5; // 50% gap, else block
    const width = randomBetween(30, 80);
    if (gap) {
      obstacles.push({ x: nextObstacleX, w: width, type: 'gap' });
    } else {
      const height = randomBetween(30, 80);
      obstacles.push({ x: nextObstacleX, w: width, h: height, type: 'block' });
    }
    nextObstacleX += width + randomBetween(100, 200);
  };

  // initial obstacles
  for (let i = 0; i < 5; i++) addObstacle();

  const handleJump = () => player.jump();
  window.addEventListener('click', handleJump);
  window.addEventListener('keydown', e => { if (e.code === 'Space') handleJump(); });

  const checkCollision = () => {
    for (const o of obstacles) {
      if (o.type === 'block') {
        const ox = o.x - scroll;
        if (
          player.x < ox + o.w &&
          player.x + player.w > ox &&
          player.y + player.h > groundY - o.h
        ) {
          return true;
        }
      }
    }
    // falling into gap
    const overGap = obstacles.some(o => {
      if (o.type !== 'gap') return false;
      const ox = o.x - scroll;
      return player.x + player.w > ox && player.x < ox + o.w && player.y + player.h >= groundY;
    });
    return overGap && !player.onGround;
  };

  const loop = () => {
    if (gameOver) {
      // overlay dim background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // draw Game Over text with shadow
      ctx.fillStyle = '#ff4444';
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      // reset shadow for future frames
      ctx.shadowColor = 'transparent';
      return;
    }
    // draw sky background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw ground with gradient
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGrad.addColorStop(0, '#8B5A2B');
    groundGrad.addColorStop(1, '#654321');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // update and draw obstacles with rounded gradient blocks
    scroll += speed;
    for (const o of obstacles) {
      const ox = o.x - scroll;
      if (o.type === 'block') {
        const grad = ctx.createLinearGradient(ox, groundY - o.h, ox, groundY);
        grad.addColorStop(0, '#b22222');
        grad.addColorStop(1, '#8b0000');
        ctx.fillStyle = grad;
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(ox + radius, groundY - o.h);
        ctx.lineTo(ox + o.w - radius, groundY - o.h);
        ctx.quadraticCurveTo(ox + o.w, groundY - o.h, ox + o.w, groundY - o.h + radius);
        ctx.lineTo(ox + o.w, groundY - radius);
        ctx.quadraticCurveTo(ox + o.w, groundY, ox + o.w - radius, groundY);
        ctx.lineTo(ox + radius, groundY);
        ctx.quadraticCurveTo(ox, groundY, ox, groundY - radius);
        ctx.lineTo(ox, groundY - o.h + radius);
        ctx.quadraticCurveTo(ox, groundY - o.h, ox + radius, groundY - o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        // gap: do nothing (ground missing)
      }
    }
    // remove passed obstacles
    while (obstacles.length && obstacles[0].x - scroll < -obstacles[0].w) obstacles.shift();
    // ensure enough ahead
    while (nextObstacleX - scroll < canvas.width * 2) addObstacle();

    player.update();
    player.draw();

    if (checkCollision()) gameOver = true;

    requestAnimationFrame(loop);
  };
  loop();
})();
