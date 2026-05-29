// Simple endless runner game targeting <canvas id="game"></canvas>
// Ship moves upward on click/tap, gravity pulls down, asteroids appear randomly.
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Background music (placeholder silent track)
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play();

  // Audio context for generated tones
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.1;
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCrash(){
    // quick descending tone for crash
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    osc.type = 'sawtooth';
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  // Game objects
  const ship = { x: 80, y: H/2, w: 30, h: 20, vy: 0 };
  const asteroids = [];
  const STAR_COUNT = 100;
  const stars = [];
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x: Math.random()*W, y: Math.random()*H, r: Math.random()*2});
  }

  let lastTime = 0;
  let gameOver = false;

  // Input – click/tap adds upward thrust and plays sound
  canvas.addEventListener('mousedown',()=>{ ship.vy=-0.6; playTone(400,0.08); });
  canvas.addEventListener('touchstart',()=>{ ship.vy=-0.6; playTone(400,0.08); });

  function spawnAsteroid(){
    const size = 20+Math.random()*30;
    asteroids.push({x:W+size, y:Math.random()*(H-size), w:size, h:size, vx:-2-Math.random()*2});
  }

  function update(dt){
    if(gameOver) return;
    // gravity
    ship.vy += 0.0015*dt; // gentle pull down
    ship.y += ship.vy*dt*0.06; // scale speed
    // bounds check (bottom ends game)
    if(ship.y > H - ship.h){
      gameOver = true;
      crashSound.play();
    }
    // move asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x += a.vx*dt*0.06;
      if(a.x + a.w < 0) asteroids.splice(i,1);
    }
    // spawn periodically
    if(Math.random()<0.02) spawnAsteroid();
    // collision detection
    for(const a of asteroids){
      if(ship.x < a.x + a.w && ship.x + ship.w > a.x &&
         ship.y < a.y + a.h && ship.y + ship.h > a.h){
        gameOver = true;
        crashSound.play();
        break;
      }
    }
  }

  function draw(){
    // gradient background (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    // twinkling stars (vary opacity & size)
    for(const s of stars){
      const twinkle = 0.5 + 0.5*Math.random();
      ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r,0,Math.PI*2);
      ctx.fill();
    }

    // ship with thrust flame when moving up
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h/2);
    ctx.closePath();
    ctx.fill();
    // flame effect
    if(ship.vy < -0.2){
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h/2);
      ctx.lineTo(ship.x - 10, ship.y + ship.h/2 + 5);
      ctx.lineTo(ship.x, ship.y + ship.h/2 + 10);
      ctx.closePath();
      ctx.fill();
    }

    // asteroids with radial shading
    for(const a of asteroids){
      const grad = ctx.createRadialGradient(
        a.x + a.w/2, a.y + a.h/2, a.w*0.1,
        a.x + a.w/2, a.y + a.h/2, a.w/2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2,0,Math.PI*2);
      ctx.fill();
    }

    // game over overlay
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
