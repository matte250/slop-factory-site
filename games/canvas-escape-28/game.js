// Simple endless runner with enhanced graphics
// Canvas with id="game" is expected in the HTML.
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas element with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 200;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const SCROLL_SPEED = 4;
  // Graphics enhancements
  const CLOUD_COUNT = 5;
  const CLOUD_SPEED = 1; // slower than ground for parallax
  const PLAYER_COLOR = '#0a0';
  const GROUND_COLOR = '#8B4513'; // brown
  const SPIKE_COLOR = '#b00';
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJumpSound() { audioCtx.resume(); playTone(300, 0.1); }
  function playCollisionSound() { audioCtx.resume(); playTone(100, 0.2); }
  function playGameOverSound() { audioCtx.resume(); playTone(50, 0.4); }
  const OBSTACLE_WIDTH = 20;
  const GAP_MIN = 100;
  const GAP_MAX = 250;
  const SPIKE_HEIGHT = 30;

  // Player state
  const clouds = []; // will hold cloud objects
  const player = {
    x: 50,
    y: height - PLAYER_SIZE,
    vy: 0,
    onGround: true
  };

  // Platform, obstacles, and clouds
  const segments = [];
  let lastX = 0;

  function addSegment(length, type) {
    segments.push({x: lastX, length, type});
    lastX += length;
  }

  // Initialise first platform
  addSegment(width, 'ground');
  // Generate subsequent segments (ground, gap, spikes)
  function generate() {
    while (lastX < width * 3) { // keep ahead of view
      const gap = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
      addSegment(gap, 'gap');
      const groundLen = 80 + Math.random() * 120;
      addSegment(groundLen, 'ground');
      // Occasionally add spikes on top of ground
      if (Math.random() < 0.3) {
        const spikeCount = 1 + Math.floor(Math.random()*3);
        addSegment(spikeCount * OBSTACLE_WIDTH, 'spikes');
        // Followed by a short ground to land on
        addSegment(40, 'ground');
      }
    }
  }

  function reset() {
    // Reset game over sound flag
    gameOverHandled = false;
    // Initialize clouds
    clouds.length = 0;
    for (let i = 0; i < CLOUD_COUNT; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * (height / 2),
        size: 30 + Math.random() * 20
      });
    }
    player.x = 50; player.y = height - PLAYER_SIZE; player.vy = 0; player.onGround = true;
    segments.length = 0; lastX = 0; addSegment(width, 'ground'); generate();
    gameOver = false; score = 0;
  }

  let gameOver = false;
  let gameOverHandled = false; // ensure game over sound plays once
  let score = 0;

  function update() {
    // Move clouds for parallax effect
    // Update cloud positions for parallax
    for (let cloud of clouds) {
      cloud.x -= CLOUD_SPEED;
      // Recycle cloud when off-screen
      if (cloud.x + cloud.size < 0) {
        cloud.x = width + Math.random() * 100;
        cloud.y = Math.random() * (height / 2);
        cloud.size = 30 + Math.random() * 20;
      }
    }
    if (gameOver) return;
    // Move world left
    for (let seg of segments) {
      seg.x -= SCROLL_SPEED;
    }
    // Remove passed segments
    while (segments.length && segments[0].x + segments[0].length < 0) {
      segments.shift();
    }
    // Ensure enough generated ahead
    generate();

    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // Ground detection
    let onGround = false;
    for (let seg of segments) {
      if (seg.type === 'ground' && player.x + PLAYER_SIZE > seg.x && player.x < seg.x + seg.length) {
        const groundY = height - PLAYER_SIZE;
        if (player.y >= groundY) {
          player.y = groundY;
          player.vy = 0;
          onGround = true;
        }
      }
      // Spikes collision
      if (seg.type === 'spikes' && player.x + PLAYER_SIZE > seg.x && player.x < seg.x + seg.length) {
        const spikeTop = height - SPIKE_HEIGHT - PLAYER_SIZE;
        if (player.y <= spikeTop) {
          // collide with spike tip
          gameOver = true;
          playCollisionSound();
        }
      }
    }
    player.onGround = onGround;
    if (player.y > height) gameOver = true; // fell off
    if (!gameOver) score++;
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0,0,width,height);
    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0,0,width,0);
    skyGrad.addColorStop(0,"#87CEEB");
    skyGrad.addColorStop(1,"#B0E0E6");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,width,height);
    // Draw clouds for parallax effect
    for (let cloud of clouds) {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }
    // Draw ground and obstacles
    for (let seg of segments) {
      if (seg.type === 'ground') {
        ctx.fillStyle = GROUND_COLOR;
        ctx.fillRect(seg.x, height - PLAYER_SIZE, seg.length, PLAYER_SIZE);
      } else if (seg.type === 'spikes') {
        ctx.fillStyle = SPIKE_COLOR;
        for (let i=0;i<seg.length;i+=OBSTACLE_WIDTH) {
          ctx.beginPath();
          ctx.moveTo(seg.x + i, height - PLAYER_SIZE);
          ctx.lineTo(seg.x + i + OBSTACLE_WIDTH/2, height - PLAYER_SIZE - SPIKE_HEIGHT);
          ctx.lineTo(seg.x + i + OBSTACLE_WIDTH, height - PLAYER_SIZE);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    // Player
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width/2-60, height/2);
    }
  }

  function loop(){
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  function jump(){
    if (player.onGround && !gameOver) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playJumpSound();
    } else if (gameOver) {
      reset();
      requestAnimationFrame(loop);
    }
  }
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e=>{ e.preventDefault(); jump(); });

  // Start game
  reset();
  requestAnimationFrame(loop);
})();
