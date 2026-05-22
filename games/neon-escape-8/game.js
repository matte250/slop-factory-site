// Neon Escape – simple endless runner
// Assumes a <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }
  function playCollision() { playTone(150, 0.3); }
  function playScore() { playTone(600, 0.08); }
  // simple background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 40;
  bgOsc.type = 'sine';
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgGain.gain.value = 0.02;
  bgOsc.start();

  const player = {x: 80, y: H / 2, size: 30, speedY: 0, color: '#0ff'};
  const gravity = 0.4, thrust = -8;
  const obstacles = [];
  const stars = [];
  // initialize star field
  for(let i=0;i<100;i++){
    stars.push({x:Math.random()*W, y:Math.random()*H, size:Math.random()*2+1, speed:Math.random()*1.5+0.5});
  }
  const obsGap = 150; // horizontal distance between obstacles
  const obsWidth = 40;
  const minHole = 80, maxHole = 180; // vertical opening size
  let frame = 0, score = 0, running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') keys.up = true;
    // resume audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // optional thrust sound
    if (e.key === 'ArrowUp') playTone(300, 0.05);
  });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowUp') keys.up = false; });

  function spawnObstacle() {
    const holeY = Math.random() * (H - maxHole - minHole) + minHole;
    const holeHeight = Math.random() * (maxHole - minHole) + minHole;
    obstacles.push({x: W, holeY, holeHeight});
  }

  function update() {
    // Player physics
    player.speedY += gravity;
    if (keys.up) player.speedY = thrust;
    player.y += player.speedY;
    if (player.y + player.size > H) { playCollision(); running = false; }
    if (player.y < 0) player.y = 0;

    // Star field movement
    for (let s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
        s.size = Math.random() * 2 + 1;
        s.speed = Math.random() * 1.5 + 0.5;
      }
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      // collision check
      if (player.x < o.x + obsWidth && player.x + player.size > o.x) {
        if (player.y < o.holeY || player.y + player.size > o.holeY + o.holeHeight) {
          running = false;
        }
      }
      if (o.x + obsWidth < 0) { obstacles.splice(i, 1); score++; playScore(); }
    }
    if (frame % 120 === 0) spawnObstacle();
    frame++;
  }

function draw() {
    ctx.clearRect(0, 0, W, H);
    // neon background with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#112');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // draw star field
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 4;
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset

    // player with neon glow
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.shadowBlur = 0;

    // obstacles with neon gradient
    const obsGrad = ctx.createLinearGradient(0, 0, obsWidth, 0);
    obsGrad.addColorStop(0, '#f0f');
    obsGrad.addColorStop(1, '#a0a');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      // top block
      ctx.fillRect(o.x, 0, obsWidth, o.holeY);
      // bottom block
      ctx.fillRect(o.x, o.holeY + o.holeHeight, obsWidth, H - (o.holeY + o.holeHeight));
    });

    // score
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 4;
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', W / 2 - 100, H / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
