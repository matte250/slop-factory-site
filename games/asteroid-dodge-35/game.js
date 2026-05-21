const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustOsc = null;
let thrustGain = null;
function startThrustSound(){
  if (thrustOsc) return;
  thrustOsc = audioCtx.createOscillator();
  thrustGain = audioCtx.createGain();
  thrustOsc.frequency.value = 250;
  thrustOsc.connect(thrustGain);
  thrustGain.connect(audioCtx.destination);
  thrustGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  thrustOsc.start();
}
function stopThrustSound(){
  if (!thrustOsc) return;
  thrustGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  thrustOsc.stop(audioCtx.currentTime + 0.1);
  thrustOsc = null;
}
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
let ship = {x: canvas.width/2, y: canvas.height/2, angle: 0, vx: 0, vy: 0, radius: 10};
let asteroids = [];
let stars = [];
let keys = {};
let score = 0;
let lastSpawn = 0;
let gameOverFlag = false;

function initStars(){
  const starCount = 100;
  for(let i=0;i<starCount;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*1.5 + 0.5
    });
  }
}
initStars();

function spawnAsteroid(){
  const edge = Math.floor(Math.random()*4);
  let x, y, vx, vy;
  const speed = 1 + Math.random()*2;
  if(edge===0){x = 0; y = Math.random()*canvas.height; vx = speed; vy = (Math.random()-0.5)*speed;}
  else if(edge===1){x = canvas.width; y = Math.random()*canvas.height; vx = -speed; vy = (Math.random()-0.5)*speed;}
  else if(edge===2){x = Math.random()*canvas.width; y = 0; vy = speed; vx = (Math.random()-0.5)*speed;}
  else {x = Math.random()*canvas.width; y = canvas.height; vy = -speed; vx = (Math.random()-0.5)*speed;}
  const r = 15 + Math.random()*15;
  // add rotation for visual flair
  const angle = Math.random()*Math.PI*2;
  const rotSpeed = (Math.random()-0.5) * 0.02; // radians per frame
  asteroids.push({x, y, vx, vy, r, angle, rotSpeed});
}

function update(dt){
  if(keys['ArrowLeft']) ship.angle -= 0.1;
  if(keys['ArrowRight']) ship.angle += 0.1;
  if(keys['ArrowUp']){
    ship.vx += Math.cos(ship.angle) * 0.05;
    ship.vy += Math.sin(ship.angle) * 0.05;
  }
  ship.x += ship.vx;
  ship.y += ship.vy;
  if(ship.x < 0 || ship.x > canvas.width || ship.y < 0 || ship.y > canvas.height){
    gameOver();
    return;
  }
  // move and rotate asteroids
  asteroids.forEach(a => {
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotSpeed;
  });
  for(const a of asteroids){
    const dx = a.x - ship.x, dy = a.y - ship.y;
    if(Math.hypot(dx, dy) < a.r + ship.radius){
      gameOver();
      return;
    }
  }
  if(performance.now() - lastSpawn > 1000){
    spawnAsteroid();
    lastSpawn = performance.now();
  }
  asteroids = asteroids.filter(a => a.x > -a.r && a.x < canvas.width + a.r && a.y > -a.r && a.y < canvas.height + a.r);
  score += dt;
}

function draw(){
  // Background
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Starfield
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  });
  // Ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fillStyle = '#00ffcc';
  ctx.fill();
  // Thrust flame
  if (keys['ArrowUp']) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-15, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  ctx.restore();
  // Asteroids with gradient and rotation
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(0, 0, a.r*0.3, 0, 0, a.r);
    grad.addColorStop(0, '#777777');
    grad.addColorStop(1, '#222222');
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.beginPath();
    // simple irregular polygon for visual variety
    const points = 7;
    for(let i=0;i<points;i++){
      const theta = (i/points) * Math.PI * 2;
      const radius = a.r * (0.7 + Math.random()*0.3);
      ctx.lineTo(Math.cos(theta)*radius, Math.sin(theta)*radius);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  });
  // Score UI
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 4;
  ctx.fillText('Score: ' + Math.floor(score/1000), 10, 20);
}

function gameOver(){
  gameOverFlag = true;
  // Play collision/explosion sound
  playTone(120, 0.4);
  ctx.fillStyle = 'red';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
}

let lastTime = 0;
function loop(ts){
  const dt = ts - lastTime;
  lastTime = ts;
  if(!gameOverFlag) update(dt);
  draw();
  if(!gameOverFlag) requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if(e.key === 'ArrowUp') startThrustSound();
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
  if(e.key === 'ArrowUp') stopThrustSound();
});
requestAnimationFrame(loop);
