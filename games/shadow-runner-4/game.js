// Simple Endless Runner based on IDEA.md
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game settings
  const PLAYER_W = 30;
  const PLAYER_H = 60;
  const PLAYER_X = 80; // fixed x position
  const GROUND_Y = height - 80; // ground baseline
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const OBSTACLE_W = 30;
  const OBSTACLE_H = 60;
  const OBSTACLE_SPEED = 4;
  const ORB_R = 8;
  const ORB_SPEED = OBSTACLE_SPEED;
  const SPAWN_INTERVAL = 1500; // ms
  const ORB_INTERVAL = 3000; // ms
  const MAX_LIVES = 3;

  let player = {
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    onGround: true,
  };

  let obstacles = [];
  let orbs = [];
  let lastObstacleTime = 0;
  let lastOrbTime = 0;
  let lightOn = false; // reveals obstacles when true
  let lives = MAX_LIVES;
  let score = 0;
  let startTime = performance.now();

  // Input handling
  const toggleLight = () => {
    // ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playTone(200, 'sine', 0.05);
    lightOn = !lightOn;
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      toggleLight();
    }
    if (e.code === 'ArrowUp' && player.onGround) {
      playTone(440, 'sine', 0.1); // jump sound
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
    }
  });
  window.addEventListener('mousedown', toggleLight);

  function spawnObstacle() {
    const obs = {
      x: width,
      y: GROUND_Y - OBSTACLE_H,
      w: OBSTACLE_W,
      h: OBSTACLE_H,
    };
    obstacles.push(obs);
  }

  function spawnOrb() {
    const orb = {
      x: width,
      y: GROUND_Y - PLAYER_H - 40,
      r: ORB_R,
    };
    orbs.push(orb);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(delta) {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // move obstacles
    obstacles.forEach((o) => (o.x -= OBSTACLE_SPEED));
    obstacles = obstacles.filter((o) => o.x + o.w > 0);

    // move orbs
    orbs.forEach((o) => (o.x -= ORB_SPEED));
    orbs = orbs.filter((o) => o.x + o.r > 0);

    // collisions (obstacle regardless of light)
    for (const o of obstacles) {
      if (rectIntersect(player, o)) {
        lives--;
        // collision sound
        playTone(100, 'sawtooth', 0.2);
        // remove collided obstacle
        obstacles = obstacles.filter((obs) => obs !== o);
        if (lives <= 0) {
          // game over sound
          playTone(50, 'sine', 0.5);
          stopGame();
        }
        break;
      }
    }
    // orb collection (only visible when light on for fairness)
    if (lightOn) {
      for (const orb of orbs) {
        const orbRect = { x: orb.x - orb.r, y: orb.y - orb.r, w: orb.r * 2, h: orb.r * 2 };
        if (rectIntersect(player, orbRect)) {
          score += 10;
          orbs = orbs.filter((o) => o !== orb);
          break;
        }
      }
    }

    // spawn logic
    const now = performance.now();
    if (now - lastObstacleTime > SPAWN_INTERVAL) {
      spawnObstacle();
      lastObstacleTime = now;
    }
    if (now - lastOrbTime > ORB_INTERVAL) {
      spawnOrb();
      lastOrbTime = now;
    }

    // score based on time survived
    score = Math.floor((now - startTime) / 100) + (score % 10);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // background gradient (night sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#001d3d');
    skyGrad.addColorStop(1, '#003566');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // optional stars (pre‑generated)
    if (!window.__stars) {
      window.__stars = [];
      for (let i = 0; i < 100; i++) {
        window.__stars.push({ x: Math.random() * width, y: Math.random() * GROUND_Y, r: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = '#fff';
    window.__stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });

    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, height);
    groundGrad.addColorStop(0, '#444');
    groundGrad.addColorStop(1, '#111');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);

    // player silhouette with subtle inner glow
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#111');
    playerGrad.addColorStop(1, '#000');
    ctx.fillStyle = playerGrad;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // obstacles (draw only if light on) with simple gradient
    if (lightOn) {
      obstacles.forEach((o) => {
        const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        grad.addColorStop(0, '#800');
        grad.addColorStop(1, '#b00');
        ctx.fillStyle = grad;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      });
    }

    // orbs (visible only when light on) with radial glow
    if (lightOn) {
      orbs.forEach((orb) => {
        const radGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        radGrad.addColorStop(0, 'rgba(0,255,0,0.8)');
        radGrad.addColorStop(1, 'rgba(0,255,0,0.2)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // light overlay (soft glow when light on)
    if (lightOn) {
      const lightGrad = ctx.createRadialGradient(
        player.x + player.w / 2,
        player.y + player.h / 2,
        20,
        player.x + player.w / 2,
        player.y + player.h / 2,
        width
      );
      lightGrad.addColorStop(0, 'rgba(255,255,200,0.4)');
      lightGrad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
    ctx.fillText(`Light: ${lightOn ? 'ON' : 'OFF'}`, 10, 60);
  }

  let animationId;
  function loop(timestamp) {
    const delta = timestamp - (loop.last ?? timestamp);
    loop.last = timestamp;
    update(delta);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function stopGame() {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over', width / 2 - 80, height / 2);
    ctx.font = '20px Arial';
    ctx.fillText(`Final Score: ${score}`, width / 2 - 70, height / 2 + 30);
  }

  // start loop
  animationId = requestAnimationFrame(loop);
})();
