// Simple Gravity Runner game
// Canvas element with id="game" is expected in the HTML.
// The player is a ball that falls under gravity, can move left/right
// and jump on moving platforms while avoiding spikes.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // ---- Sound Setup ----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // jump sound
  const jumpBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
  const jumpData = jumpBuffer.getChannelData(0);
  for (let i = 0; i < jumpData.length; i++) {
    jumpData[i] = Math.sin(i / 10) * Math.exp(-i / jumpData.length);
  }
  // hit sound
  const hitBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
  const hitData = hitBuffer.getChannelData(0);
  for (let i = 0; i < hitData.length; i++) {
    hitData[i] = Math.random() * 0.5 * Math.exp(-i / hitData.length);
  }
  function playBuffer(buf) { const src = audioCtx.createBufferSource(); src.buffer = buf; src.connect(audioCtx.destination); src.start(); }
  function playJump() { playBuffer(jumpBuffer); }
  function playHit() { playBuffer(hitBuffer); }
  // resume on interaction
  function resumeAudio(){ if (audioCtx.state==='suspended') audioCtx.resume(); window.removeEventListener('keydown', resumeAudio); window.removeEventListener('mousedown', resumeAudio); }
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('mousedown', resumeAudio);

  // Game constants
  const GRAVITY = 0.5;
  const JUMP_VEL = -10;
  const PLAYER_RADIUS = 15;
  const PLAYER_SPEED = 4;
  const PLATFORM_SPEED = 2;
  const PLATFORM_WIDTH = 100;
  const PLATFORM_HEIGHT = 20;
  const SPIKE_SIZE = 20;

  // Input state
  const keys = { left: false, right: false, up: false };
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = false;
  });

  const player = {
    x: W / 2,
    y: H - PLAYER_RADIUS - 1,
    vx: 0,
    vy: 0,
    onGround: false,
  };

  // Platform constructor
  let platformSpeed = PLATFORM_SPEED; // mutable speed
  function Platform(x, y, w = PLATFORM_WIDTH, h = PLATFORM_HEIGHT) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = -platformSpeed; // move left
    this.update = function () {
      this.x += this.vx;
      // recycle when off screen
      if (this.x + this.w < 0) this.x = W;
    };
    this.draw = function () {
      // Platform gradient shading
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    };
  }

  // Spike constructor (simple triangle)
  function Spike(x, y, size = SPIKE_SIZE) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.vx = -PLATFORM_SPEED;
    this.update = function () {
      this.x += this.vx;
      if (this.x + this.size < 0) this.x = W;
    };
    this.draw = function () {
      ctx.fillStyle = '#a00';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.size);
      ctx.lineTo(this.x + this.size / 2, this.y);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
    };
  }

  // Generate initial platforms, spikes, and stars
  const platforms = [];
  const spikes = [];
  const stars = [];
  for (let i = 0; i < 5; i++) {
    const pX = i * (W / 4) + W;
    const pY = H - 100 - i * 80;
    platforms.push(new Platform(pX, pY));
    // Add a spike on some platforms
    if (i % 2 === 0) {
      spikes.push(new Spike(pX + PLATFORM_WIDTH / 2, pY - SPIKE_SIZE));
    }
  }
  // Create star field
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
    });
  }

  let gameOver = false;
  let frame = 0;

  function update() {
    if (gameOver) return;
    // Horizontal movement
    player.vx = 0;
    if (keys.left) player.vx = -PLAYER_SPEED;
    if (keys.right) player.vx = PLAYER_SPEED;
    // Jump
    if (keys.up && player.onGround) {
      player.vy = JUMP_VEL;
      player.onGround = false;
      playJump();
    }

    // Apply gravity
    player.vy += GRAVITY;

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Keep inside horizontal bounds
    if (player.x - PLAYER_RADIUS < 0) player.x = PLAYER_RADIUS;
    if (player.x + PLAYER_RADIUS > W) player.x = W - PLAYER_RADIUS;

    // Collision with platforms (simple AABB check)
    player.onGround = false;
    for (const p of platforms) {
      // Only check when falling
      if (player.vy >= 0) {
        const withinX = player.x + PLAYER_RADIUS > p.x && player.x - PLAYER_RADIUS < p.x + p.w;
        const abovePlatform = player.y + PLAYER_RADIUS <= p.y && player.y + PLAYER_RADIUS + player.vy >= p.y;
        if (withinX && abovePlatform) {
          player.y = p.y - PLAYER_RADIUS;
          player.vy = 0;
          player.onGround = true;
        }
      }
    }

    // Spike collision (point inside triangle approximation using bounding box)
    for (const s of spikes) {
      const withinX = player.x > s.x && player.x < s.x + s.size;
      const withinY = player.y + PLAYER_RADIUS > s.y && player.y - PLAYER_RADIUS < s.y + s.size;
        if (withinX && withinY) {
          playHit();
          gameOver = true;
        }
    }

    // Fall off bottom
    if (player.y - PLAYER_RADIUS > H) gameOver = true;

    // Update platforms and spikes
    for (const p of platforms) p.update();
    for (const s of spikes) s.update();
  }

function draw() {
    // Background gradient (already drawn in cleared area)
    ctx.clearRect(0, 0, W, H);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player with radial gradient
    const grad = ctx.createRadialGradient(player.x, player.y, PLAYER_RADIUS*0.3, player.x, player.y, PLAYER_RADIUS);
    grad.addColorStop(0, '#8f8');
    grad.addColorStop(1, '#0a0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Draw platforms
    for (const p of platforms) p.draw();
    // Draw spikes with gradient shading
    for (const s of spikes) {
      const spikeGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.size);
      spikeGrad.addColorStop(0, '#f44');
      spikeGrad.addColorStop(1, '#a00');
      ctx.fillStyle = spikeGrad;
      s.draw();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    frame++;
    requestAnimationFrame(loop);
  }

  // Start the game loop
  loop();
})();
