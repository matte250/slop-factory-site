// Minimal endless‑runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playToggleSound = () => playTone(440);
  const playCollisionSound = () => playTone(150, 0.3);
  if (!canvas) return; // no canvas present
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  const player = {
    x: 50,
    y: H / 2,
    size: 20,
    col: 0,
    colors: ['red', 'blue'],
    draw() {
      // draw player as a gradient circle
      const grad = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size / 2);
      const color = this.colors[this.col];
      grad.addColorStop(0, color);
      grad.addColorStop(1, color === 'red' ? '#8b0000' : '#00008b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      // subtle outer stroke
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    toggle() { this.col = 1 - this.col; }
  };

  const obstacles = [];
  let speed = 2;
  let spawnTimer = 0;
  const spawnInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  const handleInput = () => { player.toggle(); playToggleSound(); };
  document.addEventListener('keydown', e => { if (e.code === 'Space') handleInput(); });
  canvas.addEventListener('click', handleInput);

  function spawnObs() {
    const color = Math.random() < 0.5 ? 0 : 1; // 0-red,1-blue
    obstacles.push({ x: W, w: 30, col: color });
  }

  function update(dt) {
    if (gameOver) return;
    // increase speed gradually
    speed += dt * 0.0005;
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // collision detection when player passes obstacle's x range
      if (o.x < player.x + player.size / 2 && o.x + o.w > player.x - player.size / 2) {
        if (o.col !== player.col) {
          gameOver = true;
          playCollisionSound();
        }
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // spawn logic
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) { spawnObs(); spawnTimer = 0; }
    // score
    score += dt / 1000;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#a0d8ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // draw obstacles with rounded corners and slight shadow
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 5;
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, o.col === 0 ? '#ff8080' : '#8080ff');
      grad.addColorStop(1, o.col === 0 ? '#ff4040' : '#4040ff');
      ctx.fillStyle = grad;
      // rounded rectangle
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, 0);
      ctx.lineTo(o.x + o.w - radius, 0);
      ctx.quadraticCurveTo(o.x + o.w, 0, o.x + o.w, radius);
      ctx.lineTo(o.x + o.w, H - radius);
      ctx.quadraticCurveTo(o.x + o.w, H, o.x + o.w - radius, H);
      ctx.lineTo(o.x + radius, H);
      ctx.quadraticCurveTo(o.x, H, o.x, H - radius);
      ctx.lineTo(o.x, radius);
      ctx.quadraticCurveTo(o.x, 0, o.x + radius, 0);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset shadow
    // draw player as circle with stroke
    player.draw();
    // draw score
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
