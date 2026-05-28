// Simple endless runner with improved graphics for canvas with id="game"
(() => {
  // graphics colors (defined after ctx)
  const groundColor = '#4B5320'; // dark olive
  const runnerColor = '#FF4500'; // orange-red
  const obstacleColor = '#2F4F4F'; // dark slate gray
  let skyGradient; // will be created after ctx is available

  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.width || 800;
  const height = canvas.height = canvas.height || 200;
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // ensure audio context starts on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once: true});
  window.addEventListener('keydown', resumeAudio, {once: true});

  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const playJumpSound = () => playTone(440, 0.1);
  const playGameOverSound = () => playTone(150, 0.5);

  // create sky gradient now that ctx and dimensions are known
  skyGradient = (() => {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87CEEB'); // top sky blue
    grad.addColorStop(1, '#FFF');   // horizon white
    return grad;
  })();

  // Game parameters
  const gravity = 0.6;
  const jumpStrength = -12;
  const groundY = height - 40;
  const runnerWidth = 30;
  const runnerHeight = 30;

  let runner = { x: 50, y: groundY - runnerHeight, vy: 0, width: runnerWidth, height: runnerHeight };
  let obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let score = 0;
  let gameOver = false;

  function reset() {
    runner = { x: 50, y: groundY - runnerHeight, vy: 0, width: runnerWidth, height: runnerHeight };
    obstacles = [];
    spawnTimer = 0;
    score = 0;
    gameOver = false;
  }

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    obstacles.push({ x: width, y: groundY - size, width: size, height: size, speed: 6 });
  }

  function update() {
    if (gameOver) return;
    // Runner physics
    runner.vy += gravity;
    runner.y += runner.vy;
    if (runner.y > groundY - runner.height) {
      runner.y = groundY - runner.height;
      runner.vy = 0;
    }
    // Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      // remove offscreen
      if (o.x + o.width < 0) obstacles.splice(i, 1);
    }
    // spawn
    spawnTimer++;
    if (spawnTimer >= spawnInterval) { spawnObstacle(); spawnTimer = 0; }
    // collision
    for (const o of obstacles) {
      if (runner.x < o.x + o.width && runner.x + runner.width > o.x &&
          runner.y < o.y + o.height && runner.y + runner.height > o.y) {
        gameOver = true;
        playGameOverSound();
        break;
      }
    }
    if (!gameOver) score++;
  }

  function draw() {
    // sky background
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    // ground
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundY, width, height - groundY);
    // runner (rounded)
    ctx.fillStyle = runnerColor;
    ctx.beginPath();
    ctx.arc(runner.x + runner.width/2, runner.y + runner.height/2, runner.width/2, 0, Math.PI*2);
    ctx.fill();
    // obstacles (draw as rectangles with color)
    ctx.fillStyle = obstacleColor;
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
      ctx.textAlign = 'start';
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input
  function jump() { if (runner.vy === 0) { runner.vy = jumpStrength; playJumpSound(); } }
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('click', jump);

  reset();
  requestAnimationFrame(loop);
})();
