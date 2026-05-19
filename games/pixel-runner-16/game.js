// Minimal endless runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;
  // Audio context for simple beep sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  // Simple beep generator
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Player
  const GROUND_HEIGHT = 20;
  const player = {x: 50, y: H - GROUND_HEIGHT - 30, w: 20, h: 30, vy: 0, onGround: true};
  const GRAVITY = 0.9, JUMP = -15;

  // Obstacles
  let obstacles = [];
  const OBSTACLE_W = 20, OBSTACLE_H = 30;
  let speed = 4;
  // background offset for moving clouds
  let bgOffset = 0;
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 90; // frames

  let gameOver = false;

  function reset() {
    // place player on ground (ground height = 20)
    player.y = H - 20 - player.h;
    player.vy = 0;
    player.onGround = true;
    obstacles = [];
    speed = 4;
    spawnTimer = 0;
    bgOffset = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function loop() {
    if (gameOver) return;
    // update
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - 20 - player.h) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // spawn obstacles
    if (spawnTimer-- <= 0) {
      obstacles.push({x: W, y: H - 20 - OBSTACLE_H, w: OBSTACLE_W, h: OBSTACLE_H});
      spawnTimer = SPAWN_INTERVAL + Math.random() * 30;
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision
        if (
          player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y
        ) {
          playBeep(100, 0.3); // collision sound
          gameOver = true;
        }
      // remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // draw background with gradient and simple clouds
    ctx.clearRect(0, 0, W, H);
    // gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#1e3c72'); // dark blue
    skyGrad.addColorStop(1, '#2a5298'); // lighter blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
    // clouds (simple white ellipses moving slowly)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const cloudY = H * 0.2;
    for (let i = 0; i < 3; i++) {
      const cx = (bgOffset / 2 + i * 200) % (W + 100) - 100;
      ctx.beginPath();
      ctx.ellipse(cx, cloudY, 60, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 40, cloudY - 10, 50, 25, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 40, cloudY - 10, 50, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, H - 20, W, 20);
    // player (rounded rect)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 4);
    ctx.fill();
    // obstacles (spike triangles)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // increase speed gradually
    speed += 0.001;
    // move background for clouds
    bgOffset += speed * 0.5;

    requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('mousedown', () => {
    resumeAudio();
    if (player.onGround) {
      player.vy = JUMP;
      playBeep(300, 0.1); // jump sound
    }
  });
  window.addEventListener('touchstart', e => {
    e.preventDefault();
    resumeAudio();
    if (player.onGround) {
      player.vy = JUMP;
      playBeep(300, 0.1);
    }
  }, {passive:false});

  // start
  reset();
})();
