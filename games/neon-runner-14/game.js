// Neon Runner – minimalist endless runner
// Canvas with id="game" is expected in the HTML.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Ensure audio can start after a user gesture
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');

  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Game objects
  const player = {
    w: 40,
    h: 40,
    x: width / 2 - 20,
    y: height - 50,
    speed: 5,
    color: '#0ff',
  };

  let obstacles = [];
  const obstacleFreq = 90; // frames
  let frameCount = 0;
  let score = 0;
  let running = true;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) { keys[e.key] = true; resumeAudio(); } });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnObstacle() {
    const w = 60 + Math.random() * 80;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -h, w, h, speed: 2 + Math.random() * 2, color: '#f0f' });
  }

  function update() {
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // obstacles
    obstacles.forEach(o => o.y += o.speed);
    // remove passed obstacles and increase score
    obstacles = obstacles.filter(o => {
      if (o.y > height) { 
        score++; 
        // play short tone for scoring
        playTone(800, 0.08);
        return false; 
      }
      return true;
    });

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // collision sound
        playTone(200, 0.3);
        running = false;
        break;
      }
    }

    // spawn new obstacles
    if (frameCount % obstacleFreq === 0) spawnObstacle();
    frameCount++;
  }

  function draw() {
    // neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020024');
    bgGrad.addColorStop(1, '#090979');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // helper for rounded rectangles
    const roundRect = (x, y, w, h, r) => {
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
      ctx.closePath();
    };

    // player with glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    roundRect(player.x, player.y, player.w, player.h, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // obstacles with soft glow
    obstacles.forEach(o => {
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = o.color;
      roundRect(o.x, o.y, o.w, o.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // neon score display
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.strokeText(`Score: ${score}`, 10, 30);
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 20);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start
  loop();
})();
