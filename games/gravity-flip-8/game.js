// Simple Gravity‑Flip side‑scroller
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Utility to play a tone
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playFlip() { playTone(300, 120); }
  function playGem() { playTone(800, 80); }
  function playGameOver() { playTone(150, 500); }

  // player (ball)
  const player = {x: 80, y: H/2, r: 12, vy: 0, g: 0.4, dir: 1, color: '#ff5722'};

  // world scroll offset
  let scroll = 0;

  // simple level data – platforms, gems, spikes (x relative to world)
  const platforms = [
    {x:0, w:200, h:20},
    {x:300, w:150, h:20},
    {x:600, w:200, h:20},
    {x:950, w:180, h:20},
    {x:1300, w:220, h:20}
  ];
  const gems = [
    {x:350, y:H-40},
    {x:720, y:H-80},
    {x:1080, y:H-60}
  ];
  const spikes = [
    {x:500, y:H-20, w:20, h:20},
    {x:850, y:H-20, w:20, h:20},
    {x:1150, y:H-20, w:20, h:20}
  ];
  // starfield background (parallax)
  const stars = Array.from({length: 120}, () => ({
    x: Math.random() * (W * 3), // extend beyond view for scrolling
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5
  }));

  let score = 0;
  const particles = [];
  let gameOver = false;
  let gameOverPlayed = false;

  // input – flip gravity on space or ArrowUp
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      player.dir *= -1; // invert gravity direction
      playFlip();
    }
  });

  function update() {
    if (gameOver) return;
    // apply gravity
    player.vy += player.g * player.dir;
    player.y += player.vy;

    // simple floor/ceiling collision via platforms
    let onGround = false;
    platforms.forEach(p => {
      const px = p.x - scroll;
      if (player.x + player.r > px && player.x - player.r < px + p.w) {
        const py = H - p.h; // platform y coordinate
        if (player.dir === 1 && player.y + player.r > py && player.y - player.r < py) {
          // falling down onto platform
          player.y = py - player.r;
          player.vy = 0;
          onGround = true;
        } else if (player.dir === -1 && player.y - player.r < p.h && player.y + player.r > p.h) {
          // hitting ceiling platform when gravity is up
          player.y = p.h + player.r;
          player.vy = 0;
          onGround = true;
        }
      }
    });
    // collect gems and spawn particles
    gems.forEach(g => {
      const gx = g.x - scroll;
      if (Math.hypot(player.x - gx, player.y - g.y) < player.r + 5) {
        score++;
        g.collected = true;
        playGem();
        // particle burst
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 30,
            size: Math.random() * 3 + 2,
            color: '#ff8c00'
          });
        }
      }
    });
    // spikes – end game
    spikes.forEach(s => {
      const sx = s.x - scroll;
        if (player.x + player.r > sx && player.x - player.r < sx + s.w &&
            player.y + player.r > H - s.h && player.y - player.r < H) {
          if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
          gameOver = true;
        }
    });
    // leave screen – lose
    if (player.y - player.r > H || player.y + player.r < 0) gameOver = true;

    // advance scroll
    scroll += 2;
    // update starfield for parallax effect
    if (stars) {
      stars.forEach(s => {
        s.x -= 0.5; // slower than world scroll
        if (s.x < -s.r) s.x = W * 3 + s.r; // recycle to right
      });
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.life++;
      if (p.life > p.maxLife) particles.splice(i, 1);
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87CEEB');
    bgGrad.addColorStop(1, '#1e3c72');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // starfield overlay
    ctx.fillStyle = '#fff';
    stars && stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw platforms with gradient
    const platGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    platGrad.addColorStop(0, '#666');
    platGrad.addColorStop(1, '#222');
    ctx.fillStyle = platGrad;
    platforms.forEach(p => {
      const px = p.x - scroll;
      if (px + p.w < 0) return; // off‑screen left
      ctx.fillRect(px, H - p.h, p.w, p.h);
    });
    // draw gems with glow
    gems.forEach(g => {
      if (g.collected) return;
      const gx = g.x - scroll;
      const gemGrad = ctx.createRadialGradient(gx, g.y, 2, gx, g.y, 6);
      gemGrad.addColorStop(0, '#fff700');
      gemGrad.addColorStop(1, '#ff8c00');
      ctx.fillStyle = gemGrad;
      ctx.beginPath();
      ctx.arc(gx, g.y, 6, 0, Math.PI*2);
      ctx.fill();
    });
    // draw spikes with gradient
    const spikeGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    spikeGrad.addColorStop(0, '#a00');
    spikeGrad.addColorStop(1, '#550');
    ctx.fillStyle = spikeGrad;
    spikes.forEach(s => {
      const sx = s.x - scroll;
      ctx.beginPath();
      ctx.moveTo(sx, H);
      ctx.lineTo(sx + s.w/2, H - s.h);
      ctx.lineTo(sx + s.w, H);
      ctx.closePath();
      ctx.fill();
    });
    // draw player with gradient shading
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.r*0.2, player.x, player.y, player.r);
    playerGrad.addColorStop(0, '#fff');
    playerGrad.addColorStop(0.5, player.color);
    playerGrad.addColorStop(1, '#000');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
    ctx.fill();
    // draw particles
    particles.forEach(p => {
      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop(){
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  // start game
  loop();
})();
