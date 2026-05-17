// Minimal Meteor Dodge game targeting canvas with id "game"
// Author: OpenAI

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // ---- Audio setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Set a default size if not defined in HTML
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // ==== Game State ==== //
  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  const player = {
    x: 80,
    y: canvas.height / 2 - 15,
    w: 30,
    h: 30,
    speed: 4,
    shield: false,
    shieldTimer: 0,
    draw() {
      // ship as triangle
      ctx.fillStyle = this.shield ? '#00FFFF' : '#00F'; // cyan when shielded
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (keys['ArrowUp']) this.y = Math.max(0, this.y - this.speed);
      if (keys['ArrowDown']) this.y = Math.min(canvas.height - this.h, this.y + this.speed);
      if (this.shield) {
        this.shieldTimer -= 1 / 60;
        if (this.shieldTimer <= 0) this.shield = false;
      }
    },
  };

  const meteors = [];
  const powerUps = [];
  let frames = 0;
  let lastEngineSound = 0; // timestamp in seconds
  const ENGINE_INTERVAL = 0.1;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnMeteor() {
    const size = 20 + Math.random() * 30;
    meteors.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
    });
  }

  function spawnPowerUp() {
    const size = 20;
    powerUps.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - size),
      w: size,
      h: size,
      speed: 3,
    });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

function update() {
    if (gameOver) return;
    // Update starfield
    for (let s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }
    
    frames++;
    // Spawn meteors every ~90 frames (~1.5s at 60fps)
    if (frames % 90 === 0) spawnMeteor();
    // Spawn power‑ups less often
    if (frames % 600 === 0) spawnPowerUp();

    player.update();
    // Engine sound when moving
    if ((keys['ArrowUp'] || keys['ArrowDown']) && (audioCtx.currentTime - lastEngineSound) > ENGINE_INTERVAL) {
      playTone(220, 0.07);
      lastEngineSound = audioCtx.currentTime;
    }


    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x -= m.speed;
      if (m.x + m.w < 0) meteors.splice(i, 1);
      else if (rectIntersect(player, m) && !player.shield) {
        // Play collision sound
        playTone(150, 0.5);
        gameOver = true;
      }
    }

    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.x -= p.speed;
      if (p.x + p.w < 0) powerUps.splice(i, 1);
      else if (rectIntersect(player, p)) {
        // Play power‑up sound
        playTone(600, 0.2);
        player.shield = true;
        player.shieldTimer = 5; // seconds of invulnerability
        powerUps.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = '#FFF';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw player (triangle ship)
    player.draw();
    // Draw meteors as glowing circles
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(m.x + m.w/2, m.y + m.h/2, 0, m.x + m.w/2, m.y + m.h/2, m.w/2);
      radGrad.addColorStop(0, 'rgba(255,80,80,0.9)');
      radGrad.addColorStop(1, 'rgba(255,30,30,0.3)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(m.x + m.w/2, m.y + m.h/2, m.w/2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw power‑ups as pulsing circles
    powerUps.forEach(p => {
      const pulse = Math.sin(Date.now() / 200) * 2 + 4;
      ctx.fillStyle = '#FF0';
      ctx.beginPath();
      ctx.arc(p.x + p.w/2, p.y + p.h/2, pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    // If game over show text
    if (gameOver) {
      ctx.fillStyle = '#FFF';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
