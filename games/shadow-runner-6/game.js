// Simple side‑scroll runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // size canvas (use its defined size or fill window)
  canvas.width = canvas.width || window.innerWidth;
  canvas.height = canvas.height || window.innerHeight;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const PLAYER_SIZE = 30;
  const SPIKE_WIDTH = 20;
  const SPIKE_HEIGHT = 40;
  const SPACING = 200; // distance between spikes

  let player = {x:50, y:canvas.height-PLAYER_SIZE, w:PLAYER_SIZE, h:PLAYER_SIZE, vy:0, onGround:true};
  let spikes = [];
  let distance = 0;
  let gameOver = false;
  let gameOverPlayed = false;
  let nextSpikeX = canvas.width + 100; // first spike ahead

  function spawnSpike(){
    spikes.push({x:nextSpikeX, w:SPIKE_WIDTH, h:SPIKE_HEIGHT});
    nextSpikeX += SPACING + Math.random()*100; // add randomness
  }

  function reset(){
    player = {x:50, y:canvas.height-PLAYER_SIZE, w:PLAYER_SIZE, h:PLAYER_SIZE, vy:0, onGround:true};
    spikes = [];
    distance = 0;
    gameOver = false;
    gameOverPlayed = false;
    nextSpikeX = canvas.width + 100;
    spawnSpike();
    requestAnimationFrame(loop);
  }

  function loop(){
    if(gameOver) return;
    // move player
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y + player.h >= canvas.height){
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // move spikes left
    const speed = 5; // world scroll speed
    spikes.forEach(s=>s.x -= speed);
    // remove passed spikes
    spikes = spikes.filter(s=>s.x + s.w > 0);
    // spawn new spike when needed
    if(spikes.length===0 || spikes[spikes.length-1].x < canvas.width - SPACING){
      spawnSpike();
    }
    // collision detection
    for(let s of spikes){
      if(player.x < s.x + s.w && player.x + player.w > s.x &&
         player.y < canvas.height && player.y + player.h > canvas.height - s.h){
        gameOver = true;
        if(!gameOverPlayed){
          playTone(100, 0.3); // game over sound
          gameOverPlayed = true;
        }
        break;
      }
    }
    // update distance
    distance += speed;
    // draw background
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    skyGrad.addColorStop(0, '#88c');
    skyGrad.addColorStop(1, '#55a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, canvas.height-20, canvas.width, 20);
    // player (rounded square with shadow)
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x+2, player.y+2, player.w, player.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // spikes (triangles)
    ctx.fillStyle = '#c00';
    spikes.forEach(s=>{
      ctx.beginPath();
      ctx.moveTo(s.x, canvas.height - s.h);
      ctx.lineTo(s.x + s.w/2, canvas.height - s.h - s.h);
      ctx.lineTo(s.x + s.w, canvas.height - s.h);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: '+Math.floor(distance/10), 10, 30);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // input: click or tap to jump
  canvas.addEventListener('click',()=>{
    audioCtx.resume();
    if(player.onGround) {
      player.vy = JUMP_VELOCITY;
      playTone(300, 0.1); // jump sound
    }
  });
  canvas.addEventListener('touchstart',()=>{
    audioCtx.resume();
    if(player.onGround) {
      player.vy = JUMP_VELOCITY;
      playTone(300, 0.1);
    }
  });

  // start
  reset();
})();
