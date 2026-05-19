// Enhanced endless runner with richer graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // player definition
  const player = {
    x: 50,
    y: H - 30,
    w: 20,
    h: 30,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    onGround: true,
    sliding: false,
    slideHeight: 15,
  };

  const obstacles = [];
  let speed = 2;
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playJumpSound = () => playTone(440);
  const playSlideSound = () => playTone(220);
  const playHitSound = () => playTone(100);

  // Input handling
  const onJump = () => {
    if (player.onGround && !player.sliding) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  };
    if (player.onGround && !player.sliding) {
      player.vy = player.jumpStrength;
      player.onGround = false;
    }
  };
  const onSlide = (down) => {
    if (down && player.onGround && !player.sliding) {
      player.sliding = true;
      player.h = player.slideHeight;
      player.y = H - player.h;
      playSlideSound();
    } else if (!down && player.sliding) {
      player.sliding = false;
      player.h = 30;
      player.y = H - player.h;
    }
  };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') onJump();
    if (e.code === 'ArrowDown') onSlide(true);
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') onSlide(false);
  });
  canvas.addEventListener('click', onJump);

  // obstacle generator
  function addObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    const w = 20 + Math.random() * 30;
    const h = type === 'spike' ? 20 + Math.random() * 20 : 0; // gap handled by y=H
    const ob = {
      x: W,
      y: H - h,
      w,
      h,
      type,
    };
    obstacles.push(ob);
  }

  function update() {
    if (gameOver) return;

    // player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn
    if (frame % 100 === 0) addObstacle();

    // collision detection (AABB)
    for (const o of obstacles) {
      if (o.type === 'gap') continue; // gap handled by falling
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playHitSound();
        gameOver = true;
      }
    }
    // gap check (if player is over a gap area)
    for (const o of obstacles) {
      if (o.type !== 'gap') continue;
      if (player.x + player.w > o.x && player.x < o.x + o.w) {
        // player is over gap
        if (player.y + player.h >= H) {
          gameOver = true;
        }
      }
    }

    score++;
    frame++;
    if (frame % 500 === 0) speed += 0.5; // gradual speed increase
  }

  function draw() {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue top
    skyGrad.addColorStop(1, '#b0e0e6'); // pale cyan bottom
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // ground with parallax layers
    const groundY = H - 30;
    ctx.fillStyle = '#555';
    ctx.fillRect(0, groundY, W, 30);
    ctx.fillStyle = '#777';
    ctx.fillRect(0, groundY + 5, W, 5);
    ctx.fillStyle = '#999';
    ctx.fillRect(0, groundY + 10, W, 3);

    // player with rounded rectangle and gradient
    const pGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    pGrad.addColorStop(0, '#4a90e2');
    pGrad.addColorStop(1, '#003399');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();

    // obstacles
    for (const o of obstacles) {
      if (o.type === 'gap') continue;
      if (o.type === 'spike') {
        // draw triangle spike
        ctx.fillStyle = '#a52a2a';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#f00';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }

    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
