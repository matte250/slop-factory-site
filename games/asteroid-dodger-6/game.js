// Asteroid Dodger game implementation
// Canvas id: "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 400;

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // Simple tone player
  function playTone(freq, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Background music loop (low drones)
  let musicInterval;
  function startMusic() {
    if (musicInterval) return;
    musicInterval = setInterval(() => playTone(110, 0.3), 2000); // A2 note every 2s
  }
  function stopMusic() {
    clearInterval(musicInterval);
    musicInterval = null;
  }


   // background stars
   const STAR_COUNT = 100;
   const stars = Array.from({length: STAR_COUNT}, () => ({
     x: Math.random() * WIDTH,
     y: Math.random() * HEIGHT,
     radius: Math.random() * 1.5 + 0.5
   }));

  // Ship definition
  const ship = {
    x: 50,
    y: HEIGHT / 2,
    width: 30,
    height: 20,
    speed: 5,
    dy: 0,
    draw() {
      // draw ship as a simple triangle
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpeed = 3;
  const spawnInterval = 1500; // ms

  let lastSpawn = 0;
  let gameOver = false;
  let gameOverSoundPlayed = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const y = Math.random() * (HEIGHT - size);
    asteroids.push({ x: WIDTH, y, size, width: size, height: size });
    // play a short rise tone when an asteroid appears
    playTone(300, 0.05);
  }

  function update(dt) {
    // ship movement
    ship.y += ship.dy;
    // keep within bounds
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.height > HEIGHT) ship.y = HEIGHT - ship.height;

    // move background stars to create forward motion
    const starSpeed = 0.5;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= starSpeed;
      if (s.x < 0) {
        s.x = WIDTH;
        s.y = Math.random() * HEIGHT;
      }
    }

    // asteroids movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      if (a.x + a.width < 0) asteroids.splice(i, 1);
      // collision detection (AABB)
      if (a.x < ship.x + ship.width && a.x + a.width > ship.x &&
          a.y < ship.y + ship.height && a.y + a.height > ship.y) {
        gameOver = true;
      }
    }

    // spawn logic
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // clear and draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ship.draw();
    // draw asteroids as gray circles
    ctx.fillStyle = '#666';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.width / 2, a.y + a.height / 2, a.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let lastTime = performance.now();
  function loop() {
    if (gameOver) {
      // play game over sound once
      if (!gameOverSoundPlayed) {
        playTone(100, 0.3);
        stopMusic();
        gameOverSoundPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      return;
    }
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // input handling
  document.addEventListener('keydown', e => {
    // resume audio context on first user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    // start background music if not already
    if (!musicInterval) startMusic();
    if (e.key === 'ArrowUp') ship.dy = -ship.speed;
    else if (e.key === 'ArrowDown') ship.dy = ship.speed;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' && ship.dy < 0) ship.dy = 0;
    if (e.key === 'ArrowDown' && ship.dy > 0) ship.dy = 0;
  });

  // start game
  requestAnimationFrame(loop);
})();
