// Simple Space Junk Collector game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let soundEnabled = false; // will enable on first user interaction
  function playTone(freq, duration) {
    if (!soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }
  // Enable sound after first key press (required by browsers)
  window.addEventListener('keydown', () => {
    if (!soundEnabled) {
      audioCtx.resume().then(() => { soundEnabled = true; });
    }
  }, { once: true });

  // Game entities
  const ship = {x: width/2, y: height/2, r: 15, speed: 3, dx:0, dy:0, junk:0};
  const junk = [];
  const meteors = [];
  let score = 0;
  const maxJunk = 20;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnJunk() {
    junk.push({x: Math.random()*width, y: Math.random()*height, r: 8});
  }
  function spawnMeteor() {
    const side = Math.random()<0.5? 'h':'v';
    const m = {r: 20, speed: 2 + Math.random()*2};
    if (side==='h') {
      m.x = Math.random()*width; m.y = Math.random()<0.5? -m.r : height+m.r;
      m.vx = 0; m.vy = Math.random()<0.5? m.speed : -m.speed;
    } else {
      m.x = Math.random()<0.5? -m.r : width+m.r; m.y = Math.random()*height;
      m.vx = Math.random()<0.5? m.speed : -m.speed; m.vy = 0;
    }
    meteors.push(m);
  }

  // Initial spawns
  for(let i=0;i<5;i++) spawnJunk();
  for(let i=0;i<3;i++) spawnMeteor();

  function update() {
    // ship movement
    ship.dx = ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));

    // meteors move
    meteors.forEach(m => { m.x += m.vx; m.y += m.vy; });

    // collision detection
    junk.forEach((j, idx) => {
      const d = Math.hypot(ship.x-j.x, ship.y-j.y);
      if (d < ship.r + j.r) {
        score++; ship.junk++; junk.splice(idx,1);
        playTone(800, 120); // collect junk sound
        if (ship.junk < maxJunk) spawnJunk();
      }
    });
    meteors.forEach(m => {
      const d = Math.hypot(ship.x-m.x, ship.y-m.y);
      if (d < ship.r + m.r) {
        // game over sound
        playTone(300, 300);
        cancelAnimationFrame(frameId);
        alert('Game Over! Score: '+score);
      }
    });
    // keep meteors in bounds
    meteors.forEach((m,i)=>{ if(m.x<-m.r||m.x>width+m.r||m.y<-m.r||m.y>height+m.r) meteors.splice(i,1); });
    // spawn new meteors occasionally
    if (Math.random()<0.01) spawnMeteor();
  }

  // Draw the game scene with improved graphics
function draw() {
    // Background: dark space with stars
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, width, height);
    // draw stars (once per frame, cheap)
    if (!ctx.stars) {
        ctx.stars = [];
        for (let i = 0; i < 100; i++) {
            ctx.stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
        }
    }
    ctx.fillStyle = 'white';
    ctx.stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // ship: draw as a triangle pointing movement direction
    const angle = Math.atan2(ship.dy || 0, ship.dx || 1);
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.8, ship.r);
    ctx.lineTo(-ship.r * 0.8, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // junk: gold circles with radial gradient
    junk.forEach(j => {
        const grad = ctx.createRadialGradient(j.x, j.y, 0, j.x, j.y, j.r);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(1, '#b8860b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // meteors: gray circles with glow
    ctx.shadowColor = 'rgba(200,200,200,0.6)';
    ctx.shadowBlur = 12;
    meteors.forEach(m => {
        ctx.fillStyle = '#777777';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0; // reset

    // score text
    ctx.fillStyle = 'white';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, 10, 24);
}

  let frameId;
  function loop(){
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }
  loop();
})();
