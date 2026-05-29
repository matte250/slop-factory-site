// Simple Snake game for canvas with id "game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const tileSize = 20;
  const width = canvas.width / tileSize;
  const height = canvas.height / tileSize;

  let snake = [{ x: Math.floor(width / 2), y: Math.floor(height / 2) }];
  let dir = { x: 1, y: 0 };
  let food = randomFood();
  let speed = 150; // ms per frame

  function randomFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function update() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // Wall collision
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) return gameOver();
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();
    snake.unshift(head);
    // Food check
    if (head.x === food.x && head.y === food.y) {
      // Play eat sound
      beep(660, 0.08);
      food = randomFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#111');
    gradient.addColorStop(1, '#333');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + (snake.length - 1), 10, 20);

    // Draw food as a circle
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * tileSize, (food.y + 0.5) * tileSize, tileSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake segments with rounded rectangles
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#0f0' : '#2f2'; // head brighter
      const x = s.x * tileSize;
      const y = s.y * tileSize;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + tileSize - radius, y);
      ctx.quadraticCurveTo(x + tileSize, y, x + tileSize, y + radius);
      ctx.lineTo(x + tileSize, y + tileSize - radius);
      ctx.quadraticCurveTo(x + tileSize, y + tileSize, x + tileSize - radius, y + tileSize);
      ctx.lineTo(x + radius, y + tileSize);
      ctx.quadraticCurveTo(x, y + tileSize, x, y + tileSize - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
    });
  }

  function loop() {
    update();
    draw();
    timer = setTimeout(loop, speed);
  }

  function gameOver() {
    clearTimeout(timer);
    // Play game over sound
    beep(200, 0.5);
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 50, canvas.height / 2);
  }

  function changeDir(e) {
    // Ensure audio context is resumed on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    const key = e.key;
    if (key === 'ArrowUp' && dir.y !== 1) dir = { x: 0, y: -1 };
    else if (key === 'ArrowDown' && dir.y !== -1) dir = { x: 0, y: 1 };
    else if (key === 'ArrowLeft' && dir.x !== 1) dir = { x: -1, y: 0 };
    else if (key === 'ArrowRight' && dir.x !== -1) dir = { x: 1, y: 0 };
  }

  document.addEventListener('keydown', changeDir);
  let timer = setTimeout(loop, speed);
})();
