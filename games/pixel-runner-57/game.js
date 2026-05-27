// Pixel Runner – simple endless runner
// Target canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 200;

  // Game settings
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // distance between obstacles

  let frame = 0;
  let speed = 4; // base scroll speed
  let score = 0;

  const player = {x: 50, y: height - PLAYER_SIZE, vy: 0, onGround: true};
  const obstacles = [];

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (frequency, length) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + length);
    oscillator.stop(audioCtx.currentTime + length);
  };

  const input = () => {
    const jump = () => {
      if (player.onGround) { player.vy = JUMP_VELOCITY; player.onGround = false; playBeep(660, 0.08); }
    };
    window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
    canvas.addEventListener('pointerdown', jump);
  };

  const spawnObstacle = () => {
    const heightObs = Math.random() * (height / 2) + 20;
    obstacles.push({x: width, y: height - heightObs, w: OBSTACLE_WIDTH, h: heightObs});
  };

  const update = () => {
    frame++;
    // increase speed slowly
    if (frame % 600 === 0) speed += 0.5;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= height - PLAYER_SIZE) { player.y = height - PLAYER_SIZE; player.vy = 0; player.onGround = true; }

    // obstacles movement and spawn
    if (frame % Math.round(OBSTACLE_GAP / speed) === 0) spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // remove off‑screen
      if (o.x + o.w < 0) { obstacles.splice(i, 1); score++; }
    }

    // collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + PLAYER_SIZE > o.x &&
          player.y < o.y + o.h && player.y + PLAYER_SIZE > o.y) {
        // game over – stop animation
        cancelAnimationFrame(rAF);
        playBeep(200, 0.4);
        ctx.fillStyle = 'red';
        ctx.font = '30px monospace';
        ctx.fillText('Game Over', width/2 - 80, height/2);
        return;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // background – simple gradient and ground line
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // ground line
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();
    // player – small square with subtle shading
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE/2);
    // obstacles – varying colors for visual interest
    for (const o of obstacles) {
      const hue = Math.floor((o.x / width) * 360) % 360;
      ctx.fillStyle = `hsl(${hue},70%,50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  };

  const loop = () => {
    update();
    draw();
    rAF = requestAnimationFrame(loop);
  };

  let rAF;
  input();
  loop();
})();
