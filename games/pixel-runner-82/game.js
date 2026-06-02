// Simple endless runner targeting canvas#game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
function playBeep(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  oscillator.start();
  setTimeout(() => {
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    oscillator.stop(audioCtx.currentTime + 0.05);
  }, duration);
}
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Game state
let speed = 2; // pixels per frame
let particles = []; // simple jump particles
let score = 0;
let lastObstacleTime = 0;
const obstacles = [];

const player = {
  w: 20,
  h: 20,
  x: 50,
  y: canvas.height - 20,
  vy: 0,
  jumpStrength: -8,
  gravity: 0.4,
  grounded: true,
  update() {
    this.vy += this.gravity;
    this.y += this.vy;
    if (this.y >= canvas.height - this.h) {
      this.y = canvas.height - this.h;
      this.vy = 0;
      this.grounded = true;
    }
  },
  draw() {
    // neon pixel with slight shadow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 5;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;
  },
  jump() {
    if (this.grounded) {
      this.vy = this.jumpStrength;
      this.grounded = false;
      // sound
      playBeep(600, 80);
      // create simple particles burst
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: this.x + this.w / 2,
          y: this.y + this.h,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          radius: Math.random() * 2 + 1,
          life: 30
        });
      }
    }
  }
};

function addObstacle() {
  const size = Math.random() * 30 + 20; // width and height
  obstacles.push({
    x: canvas.width,
    y: canvas.height - size,
    w: size,
    h: size
  });
}

function updateObstacles(dt) {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    if (o.x + o.w < 0) {
      obstacles.splice(i, 1);
      score++;
    }
  }
}

function drawObstacles() {
  // draw obstacles as simple spikes (triangles) with glow
  ctx.fillStyle = '#f44';
  ctx.shadowColor = '#f44';
  ctx.shadowBlur = 4;
  obstacles.forEach(o => {
    ctx.beginPath();
    // triangle base at ground, peak upwards
    ctx.moveTo(o.x, canvas.height - 5);
    ctx.lineTo(o.x + o.w / 2, o.y);
    ctx.lineTo(o.x + o.w, canvas.height - 5);
    ctx.closePath();
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function checkCollisions() {
  for (const o of obstacles) {
    const coll =
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y;
    if (coll) return true;
  }
  return false;
}

function loop(timestamp) {
  // Update and render particles
  function updateParticles(){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.vy+=0.1; // gravity
      p.x+=p.vx;
      p.y+=p.vy;
      p.life--;
      p.radius*=0.96;
      if(p.life<=0||p.radius<0.5) particles.splice(i,1);
    }
  }
  function drawParticles(){
    ctx.fillStyle='#ff0';
    ctx.shadowColor='#ff0';
    ctx.shadowBlur=4;
    particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();});
    ctx.shadowBlur=0;
  }
  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#001d3d');
  gradient.addColorStop(1, '#003566');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw moving stars for parallax effect
  if (!window.__stars) {
    window.__stars = [];
    for (let i = 0; i < 50; i++) {
      window.__stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1
      });
    }
  }
  ctx.fillStyle = '#fff';
  window.__stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    s.x -= s.speed * speed; // parallax slower than ground speed
    if (s.x < 0) s.x = canvas.width;
  });

  // draw ground line
  ctx.fillStyle = '#555';
  ctx.fillRect(0, canvas.height - 5, canvas.width, 5);

  // increase speed gradually
  speed += 0.0005;
  // update and render particles
  updateParticles();
  drawParticles();

  // obstacle generation
  if (timestamp - lastObstacleTime > 1500) {
    addObstacle();
    lastObstacleTime = timestamp;
  }

  updateObstacles();
  player.update();

  drawObstacles();
  player.draw();

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 10, 20);

  if (checkCollisions()) {
    // collision sound
    playBeep(200, 150);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px monospace';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    return; // stop animation
  }

  requestAnimationFrame(loop);
}

// Input
function resumeAudio(){if(audioCtx.state==='suspended'){audioCtx.resume();}}
window.addEventListener('mousedown', () => {resumeAudio(); player.jump();});
window.addEventListener('touchstart', () => {resumeAudio(); player.jump();});

requestAnimationFrame(loop);
