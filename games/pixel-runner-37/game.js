// Simple endless runner for canvas with id "game"
// Based on IDEA.md description

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set fixed size; could be made responsive later
  const WIDTH = (canvas.width = 800);
  const HEIGHT = (canvas.height = 200);

  // Player constants
  const PLAYER_W = 20;
  const PLAYER_H = 40;
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;

  const player = {
    x: 50,
    y: HEIGHT - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    jumping: false,
    slide: false,
  };

  const obstacles = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // Input handling – space to jump, down‑arrow to slide
  const keys = {};
  // Audio setup
  let audioCtx;
  function initAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  }
  function playTone(freq, dur){
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !player.jumping && !player.slide) {
      player.vy = JUMP_VELOCITY;
      player.jumping = true;
      playTone(400, 0.1); // jump sound
    }
    if (e.code === 'ArrowDown' && !player.jumping) {
      player.slide = true;
      player.h = PLAYER_H / 2;
      playTone(200, 0.2); // slide sound
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'ArrowDown') {
      player.slide = false;
      player.h = PLAYER_H;
    }
  });

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'low' : 'high';
    const w = 20;
    const h = type === 'low' ? 30 : 60;
    const y = type === 'low' ? HEIGHT - h : HEIGHT - PLAYER_H - h;
    obstacles.push({ x: WIDTH, y, w, h, type });
  }

  function update() {
    if (gameOver) return;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= HEIGHT - player.h) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.jumping = false;
    }

    // obstacle movement & spawn
    if (frame % 90 === 0) spawnObstacle(); // roughly every 1.5 s at 60 fps
    obstacles.forEach((obs) => (obs.x -= 4));
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // collision detection
    for (const obs of obstacles) {
      if (
        player.x < obs.x + obs.w &&
        player.x + player.w > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.h > obs.y
      ) {
        gameOver = true;
        playTone(100, 0.3); // collision sound
      }
    }

    // score based on frames survived
    score = Math.floor(frame / 60);
    frame++;
  }

  function draw() {
    // Background – subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Ground – thicker line with shadow
    ctx.strokeStyle = '#4e4e4e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - 2);
    ctx.lineTo(WIDTH, HEIGHT - 2);
    ctx.stroke();

    // Player – green with slight corner radius
    ctx.fillStyle = '#6fff6f';
    roundRect(ctx, player.x, player.y, player.w, player.h, 4);

    // Obstacles – color based on type
    obstacles.forEach((o) => {
      ctx.fillStyle = o.type === 'low' ? '#ff6b6b' : '#ffb86c';
      roundRect(ctx, o.x, o.y, o.w, o.h, 2);
    });

    // Score – crisp white text
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
    }
  }

  // Utility – rounded rectangle helper
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game loop
  requestAnimationFrame(loop);
})();
