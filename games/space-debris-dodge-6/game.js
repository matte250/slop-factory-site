// game.js – minimal Space Debris Dodge implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ----- configuration -----
  const PLAYER_SIZE = 10;
  const DEBRIS_SIZE = 8;
  const FUEL_SIZE = 6;
  const MAX_FUEL = 100;
  const FUEL_RECHARGE = 0.05; // per frame
  const FUEL_CONSUMPTION = 0.2; // per thrust
  const DEBRIS_SPEED = 1.2;
  const PLAYER_ACCEL = 0.3;
  const SPAWN_DEBRIS_EVERY = 90; // frames
  const SPAWN_FUEL_EVERY = 600; // frames;
  // extra graphics config
  const STAR_COUNT = 80;
  const STAR_COLOR = '#444';
  const PLAYER_COLOR = 'cyan';
  const DEBRIS_COLOR = '#888';
  const FUEL_COLOR = 'orange';
  // ----- audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function initAudio(){
    if(audioInitialized) return;
    audioCtx.resume();
    audioInitialized = true;
  }
  function beep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust(){ beep(200, 0.05); }
  function playPickup(){ beep(600, 0.1); }
  function playCollision(){ beep(100, 0.3); }
  function playGameOver(){ beep(50, 0.5); }
  // ----- star field -----
  const stars = Array.from({length: STAR_COUNT}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
    twinkle: Math.random()
  }));

  // ----- game state -----
  const player = { x: width/2, y: height/2, vx:0, vy:0, fuel:MAX_FUEL };
  const debris = [];
  const fuelPacks = [];
  let frame = 0;
  let gameOver = false;
  let gameOverPlayed = false;

  // ----- input handling -----
  const keys = {};
  window.addEventListener('keydown', e=>{keys[e.key]=true;});
  window.addEventListener('keyup', e=>{keys[e.key]=false;});

  function spawnDebris(){
    // spawn at random edge, velocity towards random direction
    const side = Math.floor(Math.random()*4);
    let x,y,vx,vy;
    if(side===0){x=0; y=Math.random()*height; vx=DEBRIS_SPEED; vy=(Math.random()-0.5)*DEBRIS_SPEED;}
    else if(side===1){x=width; y=Math.random()*height; vx=-DEBRIS_SPEED; vy=(Math.random()-0.5)*DEBRIS_SPEED;}
    else if(side===2){x=Math.random()*width; y=0; vx=(Math.random()-0.5)*DEBRIS_SPEED; vy=DEBRIS_SPEED;}
    else {x=Math.random()*width; y=height; vx=(Math.random()-0.5)*DEBRIS_SPEED; vy=-DEBRIS_SPEED;}
    debris.push({x,y,vx,vy});
  }

  function spawnFuel(){
    const x = Math.random()*width;
    const y = Math.random()*height;
    fuelPacks.push({x,y});
  }

  function update(){
    if(gameOver) return;
    frame++;
    // player thrust
    let thrust = false;
    // update stars twinkle
    for(const s of stars){
      s.twinkle += (Math.random() - 0.5) * 0.02;
      if(s.twinkle < 0) s.twinkle = 0;
      if(s.twinkle > 1) s.twinkle = 1;
    }
    if((keys['ArrowUp']||keys['w']) && player.fuel>0){player.vy-=PLAYER_ACCEL; player.fuel-=FUEL_CONSUMPTION; thrust=true;}
    if((keys['ArrowDown']||keys['s']) && player.fuel>0){player.vy+=PLAYER_ACCEL; player.fuel-=FUEL_CONSUMPTION; thrust=true;}
    if((keys['ArrowLeft']||keys['a']) && player.fuel>0){player.vx-=PLAYER_ACCEL; player.fuel-=FUEL_CONSUMPTION; thrust=true;}
    if((keys['ArrowRight']||keys['d']) && player.fuel>0){player.vx+=PLAYER_ACCEL; player.fuel-=FUEL_CONSUMPTION; thrust=true;}
    // fuel regen (only when not thrusting)
    if(thrust){initAudio(); playThrust();}
    if(!thrust && player.fuel<MAX_FUEL) player.fuel+=FUEL_RECHARGE;
    if(!thrust && player.fuel<MAX_FUEL) player.fuel+=FUEL_RECHARGE;
    // move player
    player.x+=player.vx; player.y+=player.vy;
    // simple drag
    player.vx*=0.99; player.vy*=0.99;
    // keep inside bounds
    if(player.x<0) player.x=0; if(player.x>width) player.x=width;
    if(player.y<0) player.y=0; if(player.y>height) player.y=height;
    // spawn debris/fuel
    if(frame%SPAWN_DEBRIS_EVERY===0) spawnDebris();
    if(frame%SPAWN_FUEL_EVERY===0) spawnFuel();
    // update debris
    for(let i=debris.length-1;i>=0;i--){
      const d=debris[i];
      d.x+=d.vx; d.y+=d.vy;
      // remove off‑screen
      if(d.x<0||d.x>width||d.y<0||d.y>height) debris.splice(i,1);
    }
    // check collisions with debris
    for(const d of debris){
      const dx=d.x-player.x, dy=d.y-player.y;
      if(Math.hypot(dx,dy)<(PLAYER_SIZE+DEBRIS_SIZE)) {
        initAudio();
        playCollision();
        gameOver=true;
        break;
      }
    }
    // check fuel packs
    for(let i=fuelPacks.length-1;i>=0;i--){
      const f=fuelPacks[i];
      const dx=f.x-player.x, dy=f.y-player.y;
      if(Math.hypot(dx,dy)<(PLAYER_SIZE+FUEL_SIZE)){
        player.fuel=Math.min(MAX_FUEL, player.fuel+30);
        initAudio();
        playPickup();
        fuelPacks.splice(i,1);
      }
    }
    // lose when fuel empty
    if(player.fuel<=0) gameOver=true;
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
  // player (triangle ship)
  ctx.fillStyle = PLAYER_COLOR;
  const angle = Math.atan2(player.vy, player.vx) || -Math.PI/2;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle + Math.PI/2);
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_SIZE);
  ctx.lineTo(PLAYER_SIZE/2, PLAYER_SIZE);
  ctx.lineTo(-PLAYER_SIZE/2, PLAYER_SIZE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // stars (twinkling background)
  ctx.fillStyle = STAR_COLOR;
  for(const s of stars){
    ctx.globalAlpha = 0.5 + 0.5 * s.twinkle;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  // debris
  ctx.fillStyle = DEBRIS_COLOR;
  for(const d of debris){
    ctx.fillRect(d.x - DEBRIS_SIZE/2, d.y - DEBRIS_SIZE/2, DEBRIS_SIZE, DEBRIS_SIZE);
  }
  // fuel packs
  ctx.fillStyle = FUEL_COLOR;
  for(const f of fuelPacks){
    ctx.fillRect(f.x - FUEL_SIZE/2, f.y - FUEL_SIZE/2, FUEL_SIZE, FUEL_SIZE);
  }
    // HUD
    ctx.fillStyle='white';
    ctx.font='12px sans-serif';
    ctx.fillText('Fuel: '+Math.floor(player.fuel), 10, 20);
    if(gameOver){
      // play game over sound once
      if(!gameOverPlayed){
        initAudio();
        playGameOver();
        gameOverPlayed = true;
      }
      ctx.fillStyle='red';
      ctx.font='24px sans-serif';
      ctx.fillText('Game Over', width/2-60, height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
