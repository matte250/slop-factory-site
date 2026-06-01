// Minimal endless runner for canvas with id="game"
// Player: 20x20 square, jumps on click/tap
// World scrolls left, generating ground, gaps, and spikes.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 20;
  const GROUND_HEIGHT = 20;

  let player = {x: 50, y: H - GROUND_HEIGHT - PLAYER_SIZE, vy: 0, onGround: true};
  let scroll = 0; // total world offset
  let score = 0;

  // each segment: {type: 'ground'|'gap'|'spike', width}
  const segments = [];
  const SEG_MIN = 100, SEG_MAX = 300;

  function randWidth() {return SEG_MIN + Math.random() * (SEG_MAX-SEG_MIN);}
  function addSegment() {
    const r = Math.random();
    let type = 'ground';
    if (r < 0.15) type = 'gap';
    else if (r < 0.25) type = 'spike';
    segments.push({type, width: randWidth()});
  }
  // initialise a few segments to fill initial view
  while (segments.reduce((a,s)=>a+s.width,0) < W*2) addSegment();

  function handleInput() {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      // jump sound
      playTone(440, 0.12);
    }
  }
  canvas.addEventListener('click', handleInput);
  canvas.addEventListener('touchstart', e=>{e.preventDefault(); handleInput();});

  function update() {
    // move world
    const speed = 4;
    scroll += speed;
    score = Math.floor(scroll / 10);
    // shift segments that moved off screen
    while (segments.length && segments[0].width < scroll) {
      scroll -= segments[0].width;
      segments.shift();
      addSegment();
    }
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // collision with ground segments
    const worldX = player.x + scroll;
    let cum = 0;
    let onGround = false;
    let onSpike = false;
    for (const seg of segments) {
      const segStart = cum;
      const segEnd = cum + seg.width;
      if (worldX >= segStart && worldX < segEnd) {
        if (seg.type === 'ground') {
          const groundY = H - GROUND_HEIGHT;
          if (player.y + PLAYER_SIZE >= groundY) {
            player.y = groundY - PLAYER_SIZE;
            player.vy = 0;
            onGround = true;
          }
        } else if (seg.type === 'spike') {
          const spikeY = H - GROUND_HEIGHT - 20; // spike height 20
          if (player.y + PLAYER_SIZE >= spikeY) {
            onSpike = true;
          }
          // also treat as ground for landing
          const groundY = H - GROUND_HEIGHT;
          if (player.y + PLAYER_SIZE >= groundY) {
            player.y = groundY - PLAYER_SIZE;
            player.vy = 0;
            onGround = true;
          }
        }
        // gaps have no ground
        break;
      }
      cum = segEnd;
    }
    player.onGround = onGround;
    // falling off screen ends game
if (player.y > H) {
        alert('Game Over! Score: ' + score);
        playTone(200, 0.5);
        // reset
      player.y = H - GROUND_HEIGHT - PLAYER_SIZE;
      player.vy = 0;
      scroll = 0;
      score = 0;
      segments.length = 0;
      while (segments.reduce((a,s)=>a+s.width,0) < W*2) addSegment();
    }
    if (onSpike) {
      alert('Hit a spike! Score: ' + score);
      // reset similar to above
      player.y = H - GROUND_HEIGHT - PLAYER_SIZE;
      player.vy = 0;
      scroll = 0;
      score = 0;
      segments.length = 0;
      while (segments.reduce((a,s)=>a+s.width,0) < W*2) addSegment();
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // draw simple clouds for parallax effect
    function drawClouds() {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const cloudY = H * 0.2;
      const cloudSpacing = 200;
      const offset = scroll * 0.3; // slower than ground
      for (let i = -1; i < W / cloudSpacing + 2; i++) {
        const cx = (i * cloudSpacing) - (offset % cloudSpacing);
        ctx.beginPath();
        ctx.arc(cx, cloudY, 20, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(cx + 25, cloudY - 15, 25, Math.PI * 1, Math.PI * 1.85);
        ctx.arc(cx + 55, cloudY - 10, 20, Math.PI * 1.2, Math.PI * 1.8);
        ctx.closePath();
        ctx.fill();
      }
    }
    drawClouds();

    // draw segments with nicer ground and spikes
    let x = -scroll;
    for (const seg of segments) {
      if (seg.type === 'ground' || seg.type === 'spike') {
        // ground texture
        ctx.fillStyle = '#8B4513'; // brown
        ctx.fillRect(x, H - GROUND_HEIGHT, seg.width, GROUND_HEIGHT);
        // optional simple pattern lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, H - GROUND_HEIGHT);
        ctx.lineTo(x + seg.width, H - GROUND_HEIGHT);
        ctx.stroke();
        if (seg.type === 'spike') {
          // stylized spike (triangle)
          ctx.fillStyle = '#b22222';
          ctx.beginPath();
          ctx.moveTo(x + seg.width / 2 - 12, H - GROUND_HEIGHT);
          ctx.lineTo(x + seg.width / 2 + 12, H - GROUND_HEIGHT);
          ctx.lineTo(x + seg.width / 2, H - GROUND_HEIGHT - 30);
          ctx.closePath();
          ctx.fill();
        }
      }
      x += seg.width;
    }

    // draw player as a rounded green circle with a slight gradient
    const playerGrad = ctx.createRadialGradient(
      player.x + PLAYER_SIZE / 2,
      player.y + PLAYER_SIZE / 2,
      PLAYER_SIZE / 4,
      player.x + PLAYER_SIZE / 2,
      player.y + PLAYER_SIZE / 2,
      PLAYER_SIZE / 2
    );
    playerGrad.addColorStop(0, '#7CFC00');
    playerGrad.addColorStop(1, '#006400');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
