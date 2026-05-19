// Meteor Dodge game – minimal implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // set canvas size to match displayed size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // generate static starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.5
    });
  }
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
      osc.stop(audioCtx.currentTime + 0.03);
    }, duration);
  }
  // background hum (soft low beep loop)
  setInterval(() => playBeep(80, 100), 3000);


  const player = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    draw() {
      // draw ship as a gradient triangle
      const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
      grad.addColorStop(0, '#0af');
      grad.addColorStop(1, '#05a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    move(dx) {
      this.x = Math.max(0, Math.min(this.x + dx, canvas.width - this.w));
    }
  };

  const meteors = [];
  let spawnTimer = 0;
  const spawnInterval = 60; // frames
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3
    });
    // sound for meteor spawn
    playBeep(300, 80);
  }

  function update() {
    if (gameOver) return;
    // player input (arrow keys / A‑D)
    if (keys['ArrowLeft'] || keys['a']) player.move(-player.speed);
    if (keys['ArrowRight'] || keys['d']) player.move(player.speed);

    // meteors
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnMeteor();
      spawnTimer = 0;
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // remove off‑screen
      if (m.y > canvas.height) meteors.splice(i, 1);
    }

    // collision
    for (const m of meteors) {
      if (
        player.x < m.x + m.w &&
        player.x + player.w > m.x &&
        player.y < m.y + m.h &&
        player.y + player.h > m.y
      ) {
        gameOver = true;
        // collision sound
        playBeep(100, 200);
        break;
      }
    }
    if (!gameOver) score++;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // starfield background
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player
    player.draw();
    // meteors with radial gradient
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 4,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      radGrad.addColorStop(0, '#f88');
      radGrad.addColorStop(1, '#800');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  // resume AudioContext on first interaction (required by some browsers)
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
