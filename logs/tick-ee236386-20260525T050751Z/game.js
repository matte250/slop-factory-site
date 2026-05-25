// Gravity Flip Runner – minimal canvas game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;

  // player
  const player = {x: 50, size: 20, y: H - 20, vy: 0, gravity: 0.6, onGround: true, dir: -1}; // dir -1 = floor, 1 = ceiling

  // obstacles (spikes)
  const spikes = [];
  // utility to draw rounded rectangles
  function drawRoundedRect(x,y,w,h,radius,fillStyle){
    ctx.beginPath();
    ctx.moveTo(x+radius, y);
    ctx.lineTo(x+w-radius, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+radius);
    ctx.lineTo(x+w, y+h-radius);
    ctx.quadraticCurveTo(x+w, y+h, x+w-radius, y+h);
    ctx.lineTo(x+radius, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-radius);
    ctx.lineTo(x, y+radius);
    ctx.quadraticCurveTo(x, y, x+radius, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  let spawnTimer = 0;
  const SPAWN_INTERVAL = 1200; // ms
  let lastTime = 0;
  let running = true;

  // flip gravity on tap/click
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
    osc.stop(audioCtx.currentTime + duration / 1000);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  }
  // helper to ensure AudioContext is resumed before playing
  function safePlay(freq, duration) {
    audioCtx.resume().then(() => playTone(freq, duration));
  }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  }
  canvas.addEventListener('pointerdown', () => {
    // ensure audio context is running
    audioCtx.resume().then(() => {
      playTone(440, 200);
    });
    player.dir *= -1; // swap floor/ceiling
    player.vy = 0;
    player.onGround = false;
  });

  function spawnSpike() {
    const size = 20;
    const y = player.dir === -1 ? H - size : 0; // attach to floor/ceiling
    spikes.push({x: W, y, size});
  }

  function update(dt) {
    // player vertical motion
    if (!player.onGround) {
      player.vy += player.gravity * player.dir * dt / 16;
      player.y += player.vy;
    }
    // clamp to floor/ceiling
    if (player.dir === -1 && player.y >= H - player.size) {
      player.y = H - player.size; player.vy = 0; player.onGround = true;
    } else if (player.dir === 1 && player.y <= 0) {
      player.y = 0; player.vy = 0; player.onGround = true;
    }

    // move spikes
    for (let i = spikes.length - 1; i >= 0; i--) {
      spikes[i].x -= 2; // constant speed
      // collision detection (simple AABB)
if (
          player.x < spikes[i].x + spikes[i].size &&
          player.x + player.size > spikes[i].x &&
          player.y < spikes[i].y + spikes[i].size &&
          player.y + player.size > spikes[i].y
        ) {
          // play collision sound then end game
          safePlay(220, 300);
          running = false; // lose
        }
      // remove off‑screen
      if (spikes[i].x + spikes[i].size < 0) spikes.splice(i, 1);
    }

    // spawn logic
    spawnTimer += dt;
    if (spawnTimer > SPAWN_INTERVAL) {
      spawnSpike();
      spawnTimer = 0;
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(lastTime / 1000), 10, 20);
    // player
    // draw rounded player
    drawRoundedRect(player.x, player.y, player.size, player.size, 4, '#09f');
    // spikes
    ctx.fillStyle = '#f44';
    spikes.forEach(s => {
      ctx.beginPath();
      if (player.dir === -1) {
        // floor spike – triangle pointing up
        ctx.moveTo(s.x, s.y + s.size);
        ctx.lineTo(s.x + s.size / 2, s.y);
        ctx.lineTo(s.x + s.size, s.y + s.size);
      } else {
        // ceiling spike – triangle pointing down
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.size / 2, s.y + s.size);
        ctx.lineTo(s.x + s.size, s.y);
      }
      ctx.closePath();
      ctx.fill();
    });
    // game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
