// Simple Pixel Dodge game
// Canvas id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  const player = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  const keys = {};
  const obstacles = [];
  let score = 0;
  let gameOver = false;

  // Input handling and audio init
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const w = 40 + Math.random() * 60;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -20, w, h: 20, speed: 2 + Math.random() * 2 });
    // play a short tone for new obstacle
    playTone(300, 80);
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // obstacles
    obstacles.forEach(o => o.y += o.speed);
    // remove passed obstacles and increment score
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > height) {
        obstacles.splice(i, 1);
        score++;
        // play a tone for scoring
        playTone(600, 100);
      }
    }

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        playTone(150, 300);
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // helper for rounded rectangles
    function roundRect(x, y, w, h, r) {
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
      ctx.fill();
    }

    // player with cyan gradient and rounded corners
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#00a');
    ctx.fillStyle = playerGrad;
    roundRect(player.x, player.y, player.w, player.h, 5);

    // obstacles with red gradient and slight shadow
    obstacles.forEach(o => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      obsGrad.addColorStop(0, '#f44');
      obsGrad.addColorStop(1, '#a00');
      ctx.fillStyle = obsGrad;
      roundRect(o.x, o.y, o.w, o.h, 3);
      ctx.restore();
    });

    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  setInterval(spawnObstacle, 1000);
  requestAnimationFrame(loop);
})();
