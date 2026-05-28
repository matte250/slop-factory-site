// Neon Grid Runner – enhanced graphics
// Player: glowing square with neon glow, moves left/right on three lanes.
// Grid: neon lines with glow scrolling downwards over a dark gradient background.
// Lose: collision with a line or 2 s of inactivity.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();

  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  // Background hum
  const humOsc = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  humOsc.frequency.value = 40;
  humOsc.type = 'sine';
  humGain.gain.value = 0.02;
  humOsc.connect(humGain);
  humGain.connect(audioCtx.destination);
  humOsc.start();

  const laneCount = 3;
  const laneWidth = width / laneCount;
  const playerSize = laneWidth * 0.4;
  const player = {
    lane: 1, // start middle lane (0,1,2)
    x: laneWidth * 1 + laneWidth / 2,
    y: height - playerSize * 2,
    size: playerSize,
    color: '#0ff',
  };

  const lines = [];
  const lineSpeed = 2; // pixels per frame
  const lineSpacing = 120; // vertical distance between lines
  const lineWidth = 4;

  let lastInput = Date.now();
  let running = true;

  // Input handling
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' && player.lane > 0) {
      player.lane--;
      playBeep(400, 80); // move left sound
    }
    else if (e.key === 'ArrowRight' && player.lane < laneCount - 1) {
      player.lane++;
      playBeep(500, 80); // move right sound
    }
    // update x based on lane
    player.x = player.lane * laneWidth + laneWidth / 2;
    lastInput = Date.now();
  };
  window.addEventListener('keydown', onKey);

  // Create initial lines
  for (let y = -lineSpacing; y < height; y += lineSpacing) {
    lines.push({ y });
  }

  function update() {
    // move lines down
    for (const line of lines) line.y += lineSpeed;
    // recycle lines
    if (lines[lines.length - 1].y > height) {
      lines.shift();
      lines.push({ y: lines[lines.length - 1].y - lineSpacing });
    }
    // inactivity check
    if (Date.now() - lastInput > 2000) endGame('Inactivity');
    // collision check (simple: if line passes player y and same lane)
    for (const line of lines) {
      if (Math.abs(line.y - player.y) < lineSpeed) {
        // line spans full width, treat as collision
        endGame('Collision');
        break;
      }
    }
  }

  function draw() {
    // draw dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // neon glow effect for later draws
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;

    // draw neon grid lines (vertical lanes)
    const lineHue = Math.floor(Date.now() / 50) % 360;
    ctx.strokeStyle = `hsl(${lineHue}, 100%, 60%)`;
    ctx.lineWidth = lineWidth;
    for (let i = 1; i < laneCount; i++) {
      const x = i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // draw moving horizontal lines with fading effect
    ctx.beginPath();
    for (const line of lines) {
      const hue = (lineHue + (line.y / height) * 60) % 360;
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.8)`;
      ctx.moveTo(0, line.y);
      ctx.lineTo(width, line.y);
    }
    ctx.stroke();

    // draw player square with neon glow
    ctx.fillStyle = player.color;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 20;
    ctx.fillRect(
      player.x - player.size / 2,
      player.y - player.size / 2,
      player.size,
      player.size,
    );
    // reset shadow for next frame
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function endGame(reason) {
    running = false;
    window.removeEventListener('keydown', onKey);
    // play distinct sound for game over
    if (reason === 'Collision') {
      playBeep(150, 300);
    } else if (reason === 'Inactivity') {
      playBeep(100, 400);
    } else {
      playBeep(200, 200);
    }
    alert('Game Over: ' + reason);
  }

  // start
  loop();
})();
