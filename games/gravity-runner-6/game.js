// game.js – simple "Gravity Runner" demo
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 400);

  // ==== Config ====
  // audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const GRAVITY = 0.6;
  const JUMP = -12;
  const SPEED = 4; // horizontal scroll speed
  const PLATFORM_HEIGHT = 20;
  const PLAYER_RADIUS = 12;
  const SPIKE_SIZE = 12; // side length of triangular spike

  // ==== Game state ====
  const player = { x: 80, y: height - PLAYER_RADIUS - PLATFORM_HEIGHT, vy: 0, onGround: true };
  let platforms = [];
  let spikes = [];
  // clouds for background
  let clouds = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // create initial platform covering the start
  platforms.push({ x: 0, w: width * 2, y: height - PLATFORM_HEIGHT });

  // ==== Helpers ====
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function addPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = rand(80, 200);
    const w = rand(100, 250);
    const x = last.x + last.w + gap;
    platforms.push({ x, w, y: height - PLATFORM_HEIGHT });
    // maybe add a spike on this platform
    if (Math.random() < 0.3) {
      const spikeX = x + rand(20, w - 20);
      spikes.push({ x: spikeX, y: height - PLATFORM_HEIGHT, size: SPIKE_SIZE });
    }
  }

  function update() {
    // spawn clouds occasionally
    if (Math.random() < 0.02) {
      const r = rand(15, 30);
      clouds.push({
        x: width + r,
        y: rand(30, height / 2),
        r,
        speed: SPEED * 0.5,
      });
    }
    // move clouds (parallax)
    for (const c of clouds) c.x -= c.speed;
    // remove off‑screen clouds
    clouds = clouds.filter(c => c.x + c.r > -50);
    if (gameOver) return;
    frame++;
    score += SPEED / 10;

    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // simple ground check
    player.onGround = false;
    for (const p of platforms) {
      if (
        player.x + PLAYER_RADIUS > p.x &&
        player.x - PLAYER_RADIUS < p.x + p.w &&
        player.y + PLAYER_RADIUS > p.y &&
        player.y + PLAYER_RADIUS - player.vy <= p.y
      ) {
        player.y = p.y - PLAYER_RADIUS;
        player.vy = 0;
        player.onGround = true;
        break;
      }
    }
    // lose if falling below canvas
    if (player.y - PLAYER_RADIUS > height) {
      playTone(200, 0.3); // death sound
      gameOver = true;
    }

    // spike collision
    for (const s of spikes) {
      // treat spike as an upright triangle; simple bounding box check
      if (
        player.x > s.x - s.size &&
        player.x < s.x + s.size &&
        player.y + PLAYER_RADIUS > s.y - s.size &&
        player.y - PLAYER_RADIUS < s.y
      ) {
        gameOver = true;
        break;
      }
    }

    // move world left
    for (const p of platforms) p.x -= SPEED;
    for (const s of spikes) s.x -= SPEED;

    // remove off‑screen objects
    platforms = platforms.filter(p => p.x + p.w > -50);
    spikes = spikes.filter(s => s.x + s.size > -50);

    // generate new platforms as needed
    const last = platforms[platforms.length - 1];
    if (last && last.x + last.w < width * 2) addPlatform();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // draw background
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87ceeb'); // light sky
    skyGrad.addColorStop(1, '#4682b4'); // deep sky
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // simple clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw platforms
    ctx.fillStyle = '#555';
    for (const p of platforms) {
      ctx.fillRect(p.x, p.y, p.w, PLATFORM_HEIGHT);
    }
    // draw spikes
    ctx.fillStyle = '#a00';
    for (const s of spikes) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.size / 2, s.y - s.size);
      ctx.lineTo(s.x + s.size / 2, s.y - s.size);
      ctx.closePath();
      ctx.fill();
    }
    // draw player
    ctx.fillStyle = '#0a0';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input
  canvas.addEventListener('click', () => {
    // ensure audio context is running
    audioCtx.resume().then(() => playTone(440, 0.1)); // jump sound
    if (player.onGround) player.vy = JUMP;
    if (player.onGround) player.vy = JUMP;
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (player.onGround) player.vy = JUMP;
  }, { passive: false });

  // start
  requestAnimationFrame(loop);
})();
