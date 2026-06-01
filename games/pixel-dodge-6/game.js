// Pixel Dodge game implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById("game");
  if (!canvas) return console.error("Canvas #game not found");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function initAudio(){
    if (!audioInitialized){
      audioCtx.resume();
      audioInitialized = true;
    }
  }
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSpawn(){ playTone(400, 0.05); }
  function playGameOver(){ playTone(100, 0.3); }

  // Player
  const player = { w: 40, h: 40, x: width / 2 - 20, y: height - 50, speed: 5 };

  // Falling shapes
  const shapes = [];
  let shapeSize = 30;
  let shapeSpeed = 2;
  let spawnInterval = 1500; // ms
  let lastSpawn = 0;

  let left = false, right = false;
  let startTime = performance.now();
  let gameOver = false;

  const keyDown = e => {
    if (e.key === "ArrowLeft") left = true;
    if (e.key === "ArrowRight") right = true;
  };
  const keyUp = e => {
    if (e.key === "ArrowLeft") left = false;
    if (e.key === "ArrowRight") right = false;
  };
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  function spawnShape() {
    const x = Math.random() * (width - shapeSize);
    const color = `hsl(${Math.random()*360}, 80%, 60%)`;
    shapes.push({ x, y: -shapeSize, w: shapeSize, h: shapeSize, color });
    initAudio();
    playSpawn();
  }

  function update(dt) {
    if (gameOver) return;

    // Move player
    if (left) player.x = Math.max(0, player.x - player.speed);
    if (right) player.x = Math.min(width - player.w, player.x + player.speed);

    // Spawn shapes based on interval
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnShape();
      lastSpawn = performance.now();
    }

    // Update shapes
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      s.y += shapeSpeed;
      // Collision detection
      if (
        s.x < player.x + player.w &&
        s.x + s.w > player.x &&
        s.y < player.y + player.h &&
        s.y + s.h > player.y
      ) {
        gameOver = true;
        initAudio();
        playGameOver();
      }
      // Remove off‑screen shapes
      if (s.y > height) shapes.splice(i, 1);
    }

    // Increase difficulty over time
    const elapsed = (performance.now() - startTime) / 1000;
    shapeSpeed = 2 + elapsed * 0.02; // gradual speed up
    spawnInterval = Math.max(300, 1500 - elapsed * 10); // faster spawns
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Player with rounded corners and shadow
    ctx.fillStyle = "#3498db";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 5;
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "transparent"; // reset shadow
    // Shapes with gradient fills
    shapes.forEach(s => {
      const grad = ctx.createRadialGradient(s.x + s.w/2, s.y + s.h/2, s.w/4, s.x + s.w/2, s.y + s.h/2, s.w/2);
      grad.addColorStop(0, s.color);
      grad.addColorStop(1, "#000");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x + s.w/2, s.y + s.h/2, s.w/2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    const score = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillText(`Score: ${score}` , 10, 20);
    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.font = "24px sans-serif";
      ctx.fillText("Game Over", width / 2 - 60, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
