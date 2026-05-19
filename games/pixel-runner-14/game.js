// Pixel Runner - simple endless runner
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 4; // base scroll speed
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.01);
      osc.stop(audioCtx.currentTime + 0.02);
    }, dur);
  };

  const player = { x: 50, y: H - 30, w: 20, h: 20, vy: 0, onGround: false };
  const obstacles = [];
  const orbs = [];
  let frame = 0;
  let score = 0;
  let speed = SPEED;
  const clouds = [];

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 20;
    obstacles.push({ x: W, y: H - size, w: size, h: size });
  };
  const spawnOrb = () => {
    const size = 10;
    const y = H - 80 - Math.random() * 150;
    orbs.push({ x: W, y, w: size, h: size, collected: false });
  };

  const spawnCloud = () => {
    const r = 20 + Math.random() * 30;
    const y = 30 + Math.random() * (H / 2 - 30);
    clouds.push({ x: W, y, r });
  };

  const rectIntersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

  // move obstacles, orbs, and clouds
    obstacles.forEach(o => (o.x -= speed));
    orbs.forEach(o => (o.x -= speed));
    clouds.forEach(c => (c.x -= speed * 0.5)); // slower for parallax

  // remove off‑screen entities
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (orbs.length && orbs[0].x + orbs[0].w < 0) orbs.shift();
    while (clouds.length && clouds[0].x + clouds[0].r < 0) clouds.shift();

    // spawn logic
    if (frame % 120 === 0) spawnObstacle(); // every 2 seconds @ 60fps
    if (frame % 150 === 0) spawnOrb();
    if (frame % 180 === 0) spawnCloud(); // occasional clouds

    // collisions
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        // lose condition – stop animation
        cancelAnimationFrame(rAF);
        // game over sound
        playTone(220, 300);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', W / 2 - 80, H / 2);
        ctx.fillText('Score: ' + Math.floor(score), W / 2 - 80, H / 2 + 40);
        return;
      }
    }
    for (const orb of orbs) {
        if (!orb.collected && rectIntersect(player, orb)) {
          orb.collected = true;
          score += 10;
          speed += 0.2; // slight speed boost
          playTone(880, 80); // orb collection sound
        }
    }
    // score based on distance
    score += 0.1;
    frame++;
    draw();
    rAF = requestAnimationFrame(update);
  };

  const draw = () => {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#87ceeb'); // top light blue
    skyGrad.addColorStop(1, '#4682b4'); // deeper blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground gradient
    const groundGrad = ctx.createLinearGradient(0, H - 10, 0, H);
    groundGrad.addColorStop(0, '#555');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 10, W, 10);

    // player as gradient circle
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      2,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    playerGrad.addColorStop(0, '#aaffaa');
    playerGrad.addColorStop(1, '#00aa00');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles as spikes (triangles)
    ctx.fillStyle = '#c00';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // glowing orbs with radial gradient
    orbs.forEach(o => {
      if (o.collected) return;
      const orbGrad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        2,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      orbGrad.addColorStop(0, '#fffacd');
      orbGrad.addColorStop(1, '#ff8c00');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  };

  // input
  const jump = () => {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(440, 100); // jump sound
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });

  let rAF = requestAnimationFrame(update);
})();
