// Simple endless runner for a canvas with id "game"
// Idea: top‑down runner where a packet moves up the screen while obstacles scroll down.

(() => {
  // ----- Graphics -----
  // Create a subtle circuit‑board style background grid
  function drawBackground() {
    const gridSize = 40;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
  }

  // Helper to apply neon glow effect
  function withGlow(color, fn) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    fn();
    ctx.restore();
  }

  // Flow lines to suggest data movement
  let flowOffset = 0;
  function drawFlow() {
    const lineSpacing = 20;
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const x = laneX(lane);
      ctx.beginPath();
      ctx.moveTo(x, flowOffset % lineSpacing - lineSpacing);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    flowOffset += 2; // speed of flow
  }

  // ----- Config -----
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');

  // ----- Config -----
  const WIDTH = canvas.width = canvas.clientWidth || 400;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;
  const LANE_COUNT = 3;
  const LANE_WIDTH = WIDTH / LANE_COUNT;
  const PLAYER_RADIUS = 15;
  const PLAYER_Y = HEIGHT - 60; // fixed vertical position
  const OBSTACLE_HEIGHT = 30;
  const OBSTACLE_WIDTH = LANE_WIDTH * 0.8;
  const COLLECT_RADIUS = 10;
  const SPAWN_INTERVAL = 1000; // ms
  const SPEED = 2; // pixels per frame

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollect() { playTone(600, 0.1); }
  function playCrash() { playTone(150, 0.3); }
  // Optional ambient hum
  function startHum() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.start();
    return () => { osc.stop(); };
  }
  const stopHum = startHum();

  // ----- State -----
  let playerLane = 1; // 0,1,2
  let obstacles = [];
  let collectibles = [];
  let lastSpawn = 0;
  let score = 0;
  let running = true;

  // ----- Helpers -----
  const laneX = (lane) => lane * LANE_WIDTH + LANE_WIDTH / 2;

  function drawPlayer() {
    // Glowing packet
    withGlow('#00ff99', () => {
      ctx.fillStyle = '#00ff99';
      ctx.beginPath();
      ctx.arc(laneX(playerLane), PLAYER_Y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawObstacles() {
    // Glowing obstacles (broken connections)
    withGlow('#ff5555', () => {
      ctx.fillStyle = '#ff5555';
      obstacles.forEach(o => {
        const x = laneX(o.lane) - OBSTACLE_WIDTH / 2;
        ctx.fillRect(x, o.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      });
    });
  }

  function drawCollectibles() {
    // Glowing data nodes
    withGlow('#ffdd33', () => {
      ctx.fillStyle = '#ffdd33';
      collectibles.forEach(c => {
        ctx.beginPath();
        ctx.arc(laneX(c.lane), c.y, COLLECT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
  }

  function updateObjects(dt) {
    // move obstacles down
    obstacles.forEach(o => o.y += SPEED);
    // remove off‑screen
    obstacles = obstacles.filter(o => o.y < HEIGHT);
    // same for collectibles
    collectibles.forEach(c => c.y += SPEED);
    collectibles = collectibles.filter(c => c.y < HEIGHT);

    // spawn new objects
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      lastSpawn = performance.now();
      const lane = Math.floor(Math.random() * LANE_COUNT);
      // 70% obstacle, 30% collectible
      if (Math.random() < 0.7) {
        obstacles.push({ lane, y: -OBSTACLE_HEIGHT });
      } else {
        collectibles.push({ lane, y: -COLLECT_RADIUS * 2 });
      }
    }
  }

  function checkCollisions() {
    // player rectangle for simple hit test
    const px = laneX(playerLane);
    const py = PLAYER_Y;
    // obstacles
    for (const o of obstacles) {
      const ox = laneX(o.lane);
      const oy = o.y + OBSTACLE_HEIGHT / 2;
      const dx = Math.abs(px - ox);
      const dy = Math.abs(py - oy);
      if (dx < PLAYER_RADIUS + OBSTACLE_WIDTH / 2 && dy < PLAYER_RADIUS + OBSTACLE_HEIGHT / 2) {
        running = false; // lose condition
        playCrash();
        return;
      }
    }
    // collectibles
    collectibles = collectibles.filter(c => {
      const cx = laneX(c.lane);
      const cy = c.y;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < PLAYER_RADIUS + COLLECT_RADIUS) {
        score += 10;
        playCollect();
        return false; // remove collected
      }
      return true;
    });
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
      ctx.fillText('Score: ' + score, WIDTH / 2 - 70, HEIGHT / 2 + 40);
      return;
    }
    // Draw background grid and flowing data lines
    drawBackground();
    drawFlow();
    // Clear any leftover (optional, background already fills)
    // ctx.clearRect(0, 0, WIDTH, HEIGHT);
    updateObjects();
    checkCollisions();
    drawObstacles();
    drawCollectibles();
    drawPlayer();
    drawScore();
    requestAnimationFrame(loop);
  }

  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
    else if (e.key === 'ArrowRight' && playerLane < LANE_COUNT - 1) playerLane++;
  });

  // start
  requestAnimationFrame(loop);
})();
