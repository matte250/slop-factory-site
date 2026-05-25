// Neon Runner – simple canvas game
// Canvas element with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // audio helper using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSynth(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur/1000);
    osc.start(now);
    osc.stop(now + dur/1000);
  }
  // helper: draw rounded rectangle
  function drawRoundedRect(x,y,w,h,r,fillStyle){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  // stars for parallax background
  const stars = [];
  for(let i=0;i<80;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*2+0.5, speed: 0.2+Math.random()*0.3});
  }
  function drawStars(){
    ctx.fillStyle = '#555';
    stars.forEach(s=>{
      s.x -= s.speed;
      if(s.x < 0) s.x = width;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
  }
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const SCROLL_SPEED = 4;
  const OBSTACLE_FREQ = 120; // frames
  const ORB_FREQ = 80;

  let frame = 0;
  let score = 0;
  let running = true;

  const player = {
    x: 80,
    y: height - PLAYER_SIZE,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    onGround: true,
draw() {
        // neon player with rounded corners and glow
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        drawRoundedRect(this.x, this.y, this.width, this.height, 5, '#0ff');
        ctx.shadowBlur = 0;
      },
    update() {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y + this.height >= height) {
        this.y = height - this.height;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    },
    jump() {
      if (this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
        playSynth(200, 120); // jump sound
      }
    }
  };

  const obstacles = [];
  const orbs = [];

  function spawnObstacle() {
    const size = 30 + Math.random() * 20;
    obstacles.push({
      x: width,
      y: height - size,
      width: size,
      height: size,
      draw() {
        // neon obstacle with glow
        ctx.shadowColor = '#f0f';
        ctx.shadowBlur = 12;
        drawRoundedRect(this.x, this.y, this.width, this.height, 5, '#f0f');
        ctx.shadowBlur = 0;
      },
    });
  }

  function spawnOrb() {
    const radius = 8;
    const yPos = height - PLAYER_SIZE - 80 - Math.random() * 120;
    orbs.push({
      x: width,
      y: yPos,
      r: radius,
      draw() {
        // glowing orb with radial gradient
        const grad = ctx.createRadialGradient(this.x, this.y, this.r*0.2, this.x, this.y, this.r);
        grad.addColorStop(0, 'rgba(255,255,0,0.8)');
        grad.addColorStop(1, 'rgba(255,255,0,0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
      },
    });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function circleRectCollide(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.width/2);
    const distY = Math.abs(circle.y - rect.y - rect.height/2);
    if (distX > (rect.width/2 + circle.r)) return false;
    if (distY > (rect.height/2 + circle.r)) return false;
    if (distX <= (rect.width/2)) return true;
    if (distY <= (rect.height/2)) return true;
    const dx = distX - rect.width/2;
    const dy = distY - rect.height/2;
    return (dx*dx + dy*dy <= (circle.r * circle.r));
  }

  function update() {
    frame++;
    // spawn
    if (frame % OBSTACLE_FREQ === 0) spawnObstacle();
    if (frame % ORB_FREQ === 0) spawnOrb();

    // move obstacles & check collisions
    for (let i = obstacles.length-1; i>=0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      if (rectCollide(player, o)) {
          playSynth(100, 300); // collision / game over sound
          running = false;
        }
      if (o.x + o.width < 0) obstacles.splice(i,1);
    }
    for (let i = orbs.length-1; i>=0; i--) {
      const orb = orbs[i];
      orb.x -= SCROLL_SPEED;
      if (circleRectCollide(orb, player)) {
        score++;
        playSynth(400,100); // orb collect sound
        orbs.splice(i,1);
      } else if (orb.x + orb.r < 0) {
        orbs.splice(i,1);
      }
    }
    player.update();
  }

function draw() {
      ctx.clearRect(0,0,width,height);
      // background gradient
      const bgGrad = ctx.createLinearGradient(0,0,width,height);
      bgGrad.addColorStop(0,'#111');
      bgGrad.addColorStop(1,'#000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,width,height);
      // stars
      drawStars();
      // ground line
      ctx.strokeStyle = '#555';
      ctx.beginPath(); ctx.moveTo(0,height-2); ctx.lineTo(width,height-2); ctx.stroke();
      // entities
      player.draw();
      obstacles.forEach(o=>o.draw());
      orbs.forEach(o=>o.draw());
      // score
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('Score: '+score, 10,30);
      if (!running) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,width,height);
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.font = '40px sans-serif';
        ctx.fillText('Game Over', width/2, height/2);
      }
    }

  function loop(){
    if (running) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', e=>{ if(e.code==='Space') player.jump(); });
  canvas.addEventListener('click',()=>player.jump());

  loop();
})();
