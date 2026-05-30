// Simple Meteor Shield game with enhanced graphics and sounds
// Canvas with id="game"
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
    canvas.removeEventListener('mousemove', resumeAudio);
    canvas.removeEventListener('click', resumeAudio);
  };
  canvas.addEventListener('mousemove', resumeAudio);
  canvas.addEventListener('click', resumeAudio);

  function playTone(freq, duration = 0.1, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function playBounce() {
    playTone(440, 0.07, 'triangle'); // higher pitch on bounce
  }

  function playGameOverSound() {
    playTone(150, 0.5, 'sawtooth'); // low rumble
  }

  function playSpawn() {
    playTone(220, 0.05, 'square'); // subtle spawn cue
  }

  // Rest of the game starts below

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Pre‑generate simple star field
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawBackground() {
    // Space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0d001a');
    bgGrad.addColorStop(1, '#20002b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Shield
  const shield = {
    width: 100,
    height: 10,
    x: width / 2 - 50,
    y: height - 20,
    speed: 7,
  };

  // Meteor constructor
  class Meteor {
    constructor() {
      this.radius = 8 + Math.random() * 6;
      this.x = Math.random() * (width - this.radius * 2) + this.radius;
      this.y = -this.radius;
      this.vy = 2 + Math.random() * 2;
    }
    update() {
      this.y += this.vy;
    }
    draw() {
      // Meteor with radial gradient and slight glow
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, 'rgba(255,200,150,0.9)');
      grad.addColorStop(1, 'rgba(255,87,34,0.6)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // optional glow effect
      ctx.shadowColor = 'rgba(255,87,34,0.7)';
      ctx.shadowBlur = this.radius * 0.8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  let meteors = [];
  let spawnTimer = 0;
  const spawnInterval = 1000; // ms
  let score = 0;
  let gameOver = false;

  // Input: mouse moves shield horizontally
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    shield.x = mouseX - shield.width / 2;
    // clamp
    shield.x = Math.max(0, Math.min(width - shield.width, shield.x));
  });

  function drawShield() {
    // Rounded shield with gradient
    const radius = 5;
    const grad = ctx.createLinearGradient(shield.x, shield.y, shield.x, shield.y + shield.height);
    grad.addColorStop(0, '#64b5f6');
    grad.addColorStop(1, '#1976d2');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(shield.x + radius, shield.y);
    ctx.lineTo(shield.x + shield.width - radius, shield.y);
    ctx.quadraticCurveTo(shield.x + shield.width, shield.y, shield.x + shield.width, shield.y + radius);
    ctx.lineTo(shield.x + shield.width, shield.y + shield.height - radius);
    ctx.quadraticCurveTo(shield.x + shield.width, shield.y + shield.height, shield.x + shield.width - radius, shield.y + shield.height);
    ctx.lineTo(shield.x + radius, shield.y + shield.height);
    ctx.quadraticCurveTo(shield.x, shield.y + shield.height, shield.x, shield.y + shield.height - radius);
    ctx.lineTo(shield.x, shield.y + radius);
    ctx.quadraticCurveTo(shield.x, shield.y, shield.x + radius, shield.y);
    ctx.closePath();
    ctx.fill();
  }

  function checkCollision(meteor) {
    // Simple AABB circle collision with shield rectangle
    const withinX = meteor.x > shield.x && meteor.x < shield.x + shield.width;
    const touchingY = meteor.y + meteor.radius >= shield.y && meteor.y - meteor.radius <= shield.y + shield.height;
    return withinX && touchingY;
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over! Score: ' + score, width / 2, height / 2);
      return;
    }

    drawBackground();

    // Spawn meteors
    if (timestamp - spawnTimer > spawnInterval) {
      meteors.push(new Meteor());
      playSpawn();
      spawnTimer = timestamp;
    }

    // Update meteors
    meteors.forEach((m, i) => {
      m.update();
      // Collision with shield
if (checkCollision(m)) {
      m.vy = -m.vy; // bounce upward
      score++;
      playBounce();
    }
      // Check for game over (meteor reaches bottom)
      if (m.y - m.radius > height) {
        gameOver = true;
      }
      m.draw();
    });

    // Remove off‑screen meteors (above canvas after bounce)
    meteors = meteors.filter(m => m.y + m.radius >= 0 && m.y - m.radius <= height);

    drawShield();

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
