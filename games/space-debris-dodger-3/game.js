// Simple Space Debris Dodger
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
    if (!canvas) return; // no canvas present
    const ctx = canvas.getContext('2d');
    // Audio setup using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, duration = 0.1) {
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
      osc.stop(audioCtx.currentTime + duration);
    }
    function playSound(name) {
      switch (name) {
        case 'shield':
          playTone(440);
          break;
        case 'shieldHit':
          playTone(660);
          break;
        case 'hit':
          playTone(220);
          break;
        case 'power':
          playTone(880);
          break;
        case 'gameover':
          playTone(110);
          break;
      }
    }
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // Ship definition
  const ship = {
    x: W / 2,
    y: H - 40,
    w: 30,
    h: 30,
    speed: 5,
    shield: false,
    health: 3,
    // Draw ship as a triangle; color changes when shielded
    draw() {
      ctx.fillStyle = this.shield ? 'cyan' : '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
  };

  // Background stars for visual depth
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // Draw stars each frame
  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      ship.shield = true;
      playSound('shield');
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'Space') ship.shield = false;
  });

  // Game objects
  const debris = [];
  const powerUps = [];
  let score = 0;
  let spawnTimer = 0;
  let difficulty = 1;

  function spawnDebris() {
    const size = Math.random() * 20 + 10;
    debris.push({
      x: Math.random() * W,
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * difficulty,
    });
  }

  function spawnPower() {
    const size = 15;
    powerUps.push({
      x: Math.random() * W,
      y: -size,
      w: size,
      h: size,
      speed: 2,
    });
  }

  function update() {
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(W - ship.w / 2, ship.x));
    ship.y = Math.max(ship.h / 2, Math.min(H - ship.h / 2, ship.y));

    // Spawn debris & power-ups
    spawnTimer++;
    if (spawnTimer % Math.max(30, 90 - difficulty * 10) === 0) spawnDebris();
    if (spawnTimer % 600 === 0) spawnPower();

    // Update objects
    debris.forEach(d => (d.y += d.speed));
    powerUps.forEach(p => (p.y += p.speed));

    // Collision detection
    debris.forEach((d, i) => {
      if (rectCollide(ship, d)) {
        if (ship.shield) {
          debris.splice(i, 1);
          score += 5;
          playSound('shieldHit');
        } else {
          ship.health--;
          debris.splice(i, 1);
          playSound('hit');
        }
      } else if (d.y - d.h > H) {
        debris.splice(i, 1);
        score++;
      }
    });
    powerUps.forEach((p, i) => {
      if (rectCollide(ship, p)) {
        ship.shield = true;
        setTimeout(() => (ship.shield = false), 3000);
        powerUps.splice(i, 1);
        playSound('power');
      } else if (p.y - p.h > H) {
        powerUps.splice(i, 1);
      }
    });

    // Increase difficulty
    difficulty = 1 + Math.floor(score / 20);
  }

  function rectCollide(a, b) {
    return (
      a.x - a.w / 2 < b.x + b.w / 2 &&
      a.x + a.w / 2 > b.x - b.w / 2 &&
      a.y - a.h / 2 < b.y + b.h / 2 &&
      a.y + a.h / 2 > b.y - b.h / 2
    );
  }

  function draw() {
    // Draw moving star field background
    drawStars();
    // Draw ship
    ship.draw();
    // Draw debris as semi‑transparent orange circles
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(
        d.x, d.y, 0,
        d.x, d.y, d.w / 2
      );
      grad.addColorStop(0, 'rgba(255,140,0,0.8)');
      grad.addColorStop(1, 'rgba(255,69,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw power‑ups as glowing yellow squares
    powerUps.forEach(p => {
      ctx.shadowColor = 'yellow';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'gold';
      ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      ctx.shadowBlur = 0;
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
    if (ship.shield) ctx.fillText('Shield', 10, 60);
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (ship.health <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 30);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game
  ctx.font = '16px sans-serif';
  loop();
})();
