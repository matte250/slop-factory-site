// Neon Snake game targeting <canvas id="game"></canvas>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration/1000);
}

const grid = 20; // size of one snake segment
let snake = [{x: 5, y: 5}];
let dir = {x: 1, y: 0};
let food = randomFood();
let speed = 100; // ms per frame
let gameOver = false;

function randomFood(){
  const cols = Math.floor(canvas.width / grid);
  const rows = Math.floor(canvas.height / grid);
  return {
    x: Math.floor(Math.random()*cols),
    y: Math.floor(Math.random()*rows)
  };
}

function loop(){
  if(gameOver) return;
  // move snake
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  // wall collision
  if(head.x<0||head.y<0||head.x>=canvas.width/grid||head.y>=canvas.height/grid){
    endGame();return;
  }
  // self collision
  if(snake.some(seg=>seg.x===head.x && seg.y===head.y)){
    endGame();return;
  }
  snake.unshift(head);
  // food check
  if(head.x===food.x && head.y===food.y){
    // play eat sound
    playTone(600, 100);
    food = randomFood();
    speed = Math.max(30, speed-5); // increase speed
  } else {
    snake.pop();
  }
  draw();
  setTimeout(loop, speed);
}

function draw(){
  // Clear with dark background
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Neon glow settings
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 15;

  // Draw food with cyan glow
  ctx.fillStyle = '#0ff';
  ctx.fillRect(food.x*grid, food.y*grid, grid, grid);

  // Draw snake with green neon glow and rounded edges
  ctx.fillStyle = '#0f0';
  snake.forEach(seg=>{
    ctx.beginPath();
    ctx.arc(seg.x*grid + grid/2, seg.y*grid + grid/2, grid/2 - 1, 0, Math.PI*2);
    ctx.fill();
  });

  // Reset shadow for UI text
  ctx.shadowBlur = 0;
}

function endGame(){
  // Ensure audio context is running
  if(audioCtx.state === 'suspended') audioCtx.resume();
  // play game over tone
  playTone(200, 300);
  gameOver = true;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#f00';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
}

window.addEventListener('keydown',e=>{
  switch(e.key){
    case 'ArrowUp': if(dir.y===0){dir={x:0,y:-1};}break;
    case 'ArrowDown': if(dir.y===0){dir={x:0,y:1};}break;
    case 'ArrowLeft': if(dir.x===0){dir={x:-1,y:0};}break;
    case 'ArrowRight': if(dir.x===0){dir={x:1,y:0};}break;
  }
});

loop();
