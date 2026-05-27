// Minimal endless runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 200);
  const GROUND = H - 30;
  let speed = 3;
  let score = 0;
  let running = true;

  const player = {
    x: 50,
    y: GROUND - 20,
    w: 20,
    h: 20,
    vy: 0,
    onGround: true,
    crouch: false,
    draw() {
      ctx.fillStyle = '#0077ff';
      const ph = this.crouch ? this.h / 2 : this.h;
      // draw player with rounded corners
      const ph = this.crouch ? this.h / 2 : this.h;
      const py = this.y + (this.h - ph);
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + radius, py);
      ctx.lineTo(this.x + this.w - radius, py);
      ctx.quadraticCurveTo(this.x + this.w, py, this.x + this.w, py + radius);
      ctx.lineTo(this.x + this.w, py + ph - radius);
      ctx.quadraticCurveTo(this.x + this.w, py + ph, this.x + this.w - radius, py + ph);
      ctx.lineTo(this.x + radius, py + ph);
      ctx.quadraticCurveTo(this.x, py + ph, this.x, py + ph - radius);
      ctx.lineTo(this.x, py + radius);
      ctx.quadraticCurveTo(this.x, py, this.x + radius, py);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (!this.onGround) {
        this.vy += 0.5; // gravity
        this.y += this.vy;
        if (this.y + this.h >= GROUND) {
          this.y = GROUND - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
    },
    jump() {
      if (this.onGround) { this.vy = -10; this.onGround = false; }
    },
    slide(start) {
      this.crouch = start;
    },
  };

  const obstacles = [];
  function spawnObstacle() {
    // random type: spike (triangle) or gap (hole)
    const type = Math.random() < 0.7 ? 'spike' : 'gap';
    if (type === 'spike') {
      const w = 20 + Math.random() * 30;
      const h = 20 + Math.random() * 30;
      obstacles.push({ x: W, y: GROUND - h, w, h, type });
    } else {
      // gap: visual hole in ground
      const w = 30 + Math.random() * 20;
      obstacles.push({ x: W, y: GROUND, w, h: 0, type }); // h=0 marks gap
    }
  }
  let spawnTimer = 0;

  function checkCollision(obs) {
    if (obs.type === 'spike') {
      return (
        player.x < obs.x + obs.w &&
        player.x + player.w > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.h > obs.y
      );
    } else { // gap
      // player is on ground; if over gap, it's a loss
      const overGap = player.x + player.w > obs.x && player.x < obs.x + obs.w;
      return overGap && player.y + player.h >= GROUND;
    }
  }

  function loop() {
    if (!running) return;
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#b0e0e6'); // light teal
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, GROUND, W, H - GROUND);

    // update and draw player
    player.update();
    player.draw();

    // spawn obstacles
    spawnTimer -= speed;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 100 + Math.random() * 100; // distance until next
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      // draw spike
      if (o.type === 'spike') {
        // draw spike as triangle
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.moveTo(o.x, GROUND);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, GROUND);
        ctx.closePath();
        ctx.fill();
      } else if (o.type === 'gap') {
        // create a gap by clearing the ground area
        ctx.clearRect(o.x, GROUND, o.w, H - GROUND);
      }
      // check collision
      if (checkCollision(o)) {
        running = false;
        // play game over sound
        playTone(110, 300);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', W / 2, H / 2);
        ctx.fillText(`Score: ${Math.floor(score)}` , W / 2, H / 2 + 30);
        return;
      }
      // remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // increase difficulty
    speed += 0.001;
    score += speed;
    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  }

  // controls
  window.addEventListener('keydown', e => {
    // play sound effects
    if (e.code === 'Space') { player.jump(); playTone(440, 120); }
    else if (e.code === 'ArrowDown') { player.slide(true); playTone(220, 120); }
    // other keys
    if (e.code !== 'Space' && e.code !== 'ArrowDown') {
      // fallback handling for any other keys (none currently)
    }
  });
    if (e.code === 'Space') player.jump();
    if (e.code === 'ArrowDown') player.slide(true);
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') player.slide(false);
  });

  // start game
  loop();
})();
