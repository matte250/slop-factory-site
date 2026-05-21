// Canvas Dodge game implementation
// HTML must contain: <canvas id="game"></canvas>

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas element with id "game" not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.width || 800;
canvas.height = canvas.height || 400;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  audioCtx.resume();
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
function playJumpSound(){ playTone(300, 0.1); }
function playStarSound(){ playTone(600, 0.08); }
function playGameOverSound(){ playTone(150, 0.3); }

// constants
const GRAVITY = 0.6;
const JUMP = -12;
const PLAYER_SIZE = 30;
const PLAYER_X = 50;
const OBSTACLE_W = 20;
const OBSTACLE_MIN_H = 30;
const OBSTACLE_MAX_H = 120;
const SPEED = 4;
const STAR_R = 8;
const SPAWN_MS = 1500;

let lastTime = 0, spawn = 0, score = 0, over = false;
const player = {x: PLAYER_X, y: canvas.height-PLAYER_SIZE, vy:0, w:PLAYER_SIZE, h:PLAYER_SIZE, onGround:true};
const obstacles = [];
const stars = [];

function reset(){
  player.y = canvas.height-PLAYER_SIZE; player.vy=0; player.onGround=true;
  obstacles.length=0; stars.length=0; score=0; spawn=0; over=false; requestAnimationFrame(loop);
}
function spawnObstacle(){
  const h = OBSTACLE_MIN_H + Math.random()*(OBSTACLE_MAX_H-OBSTACLE_MIN_H);
  obstacles.push({x:canvas.width, y:canvas.height-h, w:OBSTACLE_W, h});
}
function spawnStar(){
  const y = Math.random()*(canvas.height-100)+50;
  stars.push({x:canvas.width, y, r:STAR_R, collected:false});
}
function update(dt){
  if(over) return;
  // player physics
  player.vy+=GRAVITY; player.y+=player.vy;
  if(player.y+player.h>=canvas.height){player.y=canvas.height-player.h; player.vy=0; player.onGround=true;} else player.onGround=false;
  // move obstacles
  for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i]; o.x-=SPEED; if(o.x+o.w<0) obstacles.splice(i,1);}
  // move stars
  for(let i=stars.length-1;i>=0;i--){const s=stars[i]; s.x-=SPEED; if(s.x+s.r<0) stars.splice(i,1);}
  // spawn
  spawn+=dt; if(spawn>SPAWN_MS){spawn=0; Math.random()<0.7?spawnObstacle():spawnStar();}
  // collisions obstacles
  for(const o of obstacles){if(player.x<o.x+o.w && player.x+player.w>o.x && player.y<o.y+o.h && player.y+player.h>o.y){over=true; playGameOverSound();}}
  // star collection
  for(const s of stars){if(!s.collected){const dx=player.x+player.w/2-s.x; const dy=player.y+player.h/2-s.y; if(Math.hypot(dx,dy)<s.r+player.w/2){s.collected=true; score++; playStarSound();}}}
}
function draw(){
  // background gradient
  const bg = ctx.createLinearGradient(0,0,0,canvas.height);
  bg.addColorStop(0,'#87ceeb'); // sky blue
  bg.addColorStop(1,'#f0f8ff'); // lighter near bottom
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // player with rounded corners
  ctx.fillStyle = '#3498db';
  const radius = 6;
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
  ctx.fill();

  // obstacles as triangles (spikes)
  ctx.fillStyle = '#e74c3c';
  for(const o of obstacles){
    ctx.beginPath();
    ctx.moveTo(o.x, canvas.height);
    ctx.lineTo(o.x + o.w/2, canvas.height - o.h);
    ctx.lineTo(o.x + o.w, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  // stars with glow
  ctx.fillStyle = '#f1c40f';
  ctx.shadowColor = '#f1c40f';
  ctx.shadowBlur = 8;
  for(const s of stars){
    if(!s.collected){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2*Math.PI);
      ctx.fill();
    }
  }
  // reset shadow
  ctx.shadowBlur = 0;

  // score text
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: '+score,10,30);

  // game over overlay
  if(over){
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';
    ctx.textAlign='center';
    ctx.font='36px sans-serif';
    ctx.fillText('Game Over',canvas.width/2,canvas.height/2-20);
    ctx.font='24px sans-serif';
    ctx.fillText('Press R to Restart',canvas.width/2,canvas.height/2+20);
  }
}
function loop(ts){
  if(!lastTime) lastTime=ts; const dt=ts-lastTime; lastTime=ts; update(dt); draw(); if(!over) requestAnimationFrame(loop);
}
window.addEventListener('keydown',e=>{if(e.code==='Space' && player.onGround && !over){player.vy=JUMP; player.onGround=false; playJumpSound();} if(e.key==='r' && over){reset();}});
reset();
