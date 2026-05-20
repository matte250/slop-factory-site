// Minimal Canvas Escape game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let speed = 2; // scroll speed
let spawnTimer = 0;
const player = {x: canvas.width/2, y: canvas.height-30, size:20, angle:0};
const obstacles = [];

function spawnObstacle(){
  const size = 30 + Math.random()*20;
  const x = Math.random() * (canvas.width - size);
  const y = -size;
  const rotSpeed = (Math.random()<0.5?-1:1) * 0.02;
  obstacles.push({x, y, size, angle:0, rotSpeed});
}

function update(dt){
  spawnTimer += dt;
  if(spawnTimer > 2000){ // every 2s
    spawnObstacle();
    spawnTimer = 0;
    speed *= 1.02; // accelerate
  }
  // move obstacles
  for(const o of obstacles){
    o.y += speed;
    o.angle += o.rotSpeed;
  }
  // remove off‑screen obstacles
  for(let i=obstacles.length-1;i>=0;--i){
    if(obstacles[i].y > canvas.height + obstacles[i].size) obstacles.splice(i,1);
  }
  // player drifts upward
  player.y -= speed;
  // collision detection (simple AABB)
  for(const o of obstacles){
    const dx = Math.abs((o.x+o.size/2) - player.x);
    const dy = Math.abs((o.y+o.size/2) - player.y);
    if(dx < (o.size+player.size)/2 && dy < (o.size+player.size)/2){
      endGame();
      return;
    }
  }
  // lose if fall off bottom
  if(player.y > canvas.height) endGame();
}

function render(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001028');
  bgGrad.addColorStop(1,'#000814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // player square with soft glow and rounded corners
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.shadowColor = 'rgba(0,255,150,0.6)';
  ctx.shadowBlur = 12;
  const rad = 4;
  ctx.fillStyle = '#00ff99';
  ctx.beginPath();
  ctx.moveTo(-player.size/2 + rad, -player.size/2);
  ctx.lineTo(player.size/2 - rad, -player.size/2);
  ctx.quadraticCurveTo(player.size/2, -player.size/2, player.size/2, -player.size/2 + rad);
  ctx.lineTo(player.size/2, player.size/2 - rad);
  ctx.quadraticCurveTo(player.size/2, player.size/2, player.size/2 - rad, player.size/2);
  ctx.lineTo(-player.size/2 + rad, player.size/2);
  ctx.quadraticCurveTo(-player.size/2, player.size/2, -player.size/2, player.size/2 - rad);
  ctx.lineTo(-player.size/2, -player.size/2 + rad);
  ctx.quadraticCurveTo(-player.size/2, -player.size/2, -player.size/2 + rad, -player.size/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // obstacles (rotating triangles with radial gradient)
  for(const o of obstacles){
    ctx.save();
    ctx.translate(o.x+o.size/2, o.y+o.size/2);
    ctx.rotate(o.angle);
    const grad = ctx.createRadialGradient(0,0,o.size*0.2,0,0,o.size/2);
    grad.addColorStop(0,'#ff6b6b');
    grad.addColorStop(1,'#8b0000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -o.size/2);
    ctx.lineTo(o.size/2, o.size/2);
    ctx.lineTo(-o.size/2, o.size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

let running = true;
let last = 0;
function loop(ts){
  const dt = ts - last;
  last = ts;
  if(running){
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
}
function endGame(){
  running = false;
  // play crash sound
  playTone(150, 0.5);
  // delay alert to let sound play
  setTimeout(() => alert('Game Over'), 600);
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
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

// controls: rotate left/right
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft') {
    player.angle -= 0.2;
    playTone(440, 0.08);
  }
  if(e.key === 'ArrowRight') {
    player.angle += 0.2;
    playTone(440, 0.08);
  }
});

requestAnimationFrame(loop);
