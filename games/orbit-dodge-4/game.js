// Simple Orbit Dodge game
"use strict";
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const CENTER = {x: W/2, y: H/2};
// Game constants
const PLANET_R = 30;
const ORBIT_R = 80;
const SHIP_R = 8;
const ASTEROID_R = 12;
const LASER_SPEED = 5;
const ASTEROID_SPEED = 1.5;
const SPAWN_INTERVAL = 120; // frames
let angle = 0; // ship angle around planet
let left = false, right = false, fire = false;
let lasers = [];
let asteroids = [];
let frame = 0;
let score = 0;
let gameOver = false;
// starfield background
const STAR_COUNT = 100;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5});
}
// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playLaser() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
function playExplosion() {
  const bufferSize = audioCtx.sampleRate * 0.2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  noise.connect(gain).connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime + 0.2);
}
function playGameOver() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}
// explosion particles
let particles = [];
function addExplosion(x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push({x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30});
  }
  playExplosion();
}
// Input handling
window.addEventListener("keydown", e => {
  // resume audio context on first user interaction
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (e.code === "ArrowLeft") left = true;
  if (e.code === "ArrowRight") right = true;
  if (e.code === "Space") fire = true;
});
window.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft") left = false;
  if (e.code === "ArrowRight") right = false;
  if (e.code === "Space") fire = false;
});
function spawnAsteroid() {
  // random edge position
  const side = Math.floor(Math.random()*4);
  let x, y, vx, vy;
  if (side===0) {x=0; y=Math.random()*H;}
  else if (side===1) {x=W; y=Math.random()*H;}
  else if (side===2) {x=Math.random()*W; y=0;}
  else {x=Math.random()*W; y=H;}
  // direction toward center
  const dx = CENTER.x - x, dy = CENTER.y - y;
  const length = Math.hypot(dx, dy);
  vx = (dx/length)*ASTEROID_SPEED;
  vy = (dy/length)*ASTEROID_SPEED;
  asteroids.push({x, y, vx, vy});
}
function update() {
  if (gameOver) return;
  // rotate ship
  if (left) angle -= 0.04;
  if (right) angle += 0.04;
  // fire laser
  if (fire) {
    const sx = CENTER.x + Math.cos(angle)*ORBIT_R;
    const sy = CENTER.y + Math.sin(angle)*ORBIT_R;
    const vx = Math.cos(angle)*LASER_SPEED;
    const vy = Math.sin(angle)*LASER_SPEED;
    lasers.push({x:sx, y:sy, vx, vy});
    playLaser();
    fire = false; // single shot per press
  }
  // update lasers
  lasers.forEach(l => {l.x += l.vx; l.y += l.vy;});
  lasers = lasers.filter(l => l.x>=0 && l.x<=W && l.y>=0 && l.y<=H);
  // update asteroids
  asteroids.forEach(a => {a.x += a.vx; a.y += a.vy;});
  // update particles
  particles.forEach(p => {p.x += p.vx; p.y += p.vy; p.life--;});
  particles = particles.filter(p => p.life > 0);
  // spawn
  if (frame % SPAWN_INTERVAL === 0) spawnAsteroid();
  // collision checks
  const shipPos = {x: CENTER.x + Math.cos(angle)*ORBIT_R, y: CENTER.y + Math.sin(angle)*ORBIT_R};
  for (let i=asteroids.length-1; i>=0; i--) {
    const a = asteroids[i];
    // asteroid hits planet
    if (Math.hypot(a.x-CENTER.x, a.y-CENTER.y) < PLANET_R) {playGameOver(); gameOver=true; break;}
    // asteroid hits ship
    if (Math.hypot(a.x-shipPos.x, a.y-shipPos.y) < ASTEROID_R) {playGameOver(); gameOver=true; break;}
    // laser hits asteroid
    for (let j=lasers.length-1; j>=0; j--) {
      const l = lasers[j];
      if (Math.hypot(a.x-l.x, a.y-l.y) < ASTEROID_R) {
        addExplosion(a.x, a.y);
        asteroids.splice(i,1);
        lasers.splice(j,1);
        score++;
        break;
      }
    }
  }
  frame++;
}
function draw() {
  ctx.clearRect(0,0,W,H);
  // stars background
  ctx.fillStyle = "#fff";
  stars.forEach(s => {ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();});
  // planet with gradient
  const grad = ctx.createRadialGradient(CENTER.x, CENTER.y, PLANET_R*0.2, CENTER.x, CENTER.y, PLANET_R);
  grad.addColorStop(0, "#557");
  grad.addColorStop(1, "#112");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(CENTER.x, CENTER.y, PLANET_R,0,Math.PI*2); ctx.fill();
  // ship (triangle pointing outward)
  const sx = CENTER.x + Math.cos(angle)*ORBIT_R;
  const sy = CENTER.y + Math.sin(angle)*ORBIT_R;
  const dir = angle;
  ctx.fillStyle = "#0f0";
  ctx.beginPath();
  ctx.moveTo(sx + Math.cos(dir)*SHIP_R, sy + Math.sin(dir)*SHIP_R);
  ctx.lineTo(sx + Math.cos(dir+Math.PI*0.6)*SHIP_R, sy + Math.sin(dir+Math.PI*0.6)*SHIP_R);
  ctx.lineTo(sx + Math.cos(dir-Math.PI*0.6)*SHIP_R, sy + Math.sin(dir-Math.PI*0.6)*SHIP_R);
  ctx.closePath(); ctx.fill();
  // asteroids with simple craters
  ctx.fillStyle = "#a55";
  asteroids.forEach(a=>{
    ctx.beginPath(); ctx.arc(a.x,a.y,ASTEROID_R,0,Math.PI*2); ctx.fill();
    // crater
    ctx.fillStyle = "#822";
    ctx.beginPath(); ctx.arc(a.x-3, a.y-2, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#a55";
  });
  // lasers
  ctx.strokeStyle = "#ff0"; ctx.lineWidth=2;
  lasers.forEach(l=>{ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x - l.vx*2, l.y - l.vy*2);ctx.stroke();});
  // particles
  ctx.fillStyle = "#f90";
  particles.forEach(p=>{ctx.globalAlpha = p.life/30; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();});
  ctx.globalAlpha = 1.0;
  // score
  ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.fillText("Score: "+score,10,20);
  // game over overlay
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#f88"; ctx.font = "24px sans-serif"; ctx.textAlign="center";
    ctx.fillText("Game Over", W/2, H/2);
    ctx.fillText("Final Score: "+score, W/2, H/2+30);
  }
}
function loop(){
  if (!gameOver) update();
  draw();
  requestAnimationFrame(loop);
}
loop();
