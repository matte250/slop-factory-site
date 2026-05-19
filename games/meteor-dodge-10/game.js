// Simple Meteor Dodge game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // full‑screen canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playExplosion() {
    // short low‑frequency burst
    playTone(80, 300);
  }
  function playSpawn() {
    // higher pitch ping
    playTone(440, 100);
  }

  const player = {x: canvas.width/2, y: canvas.height-60, w:40, h:40, speed:5};
  const meteors = [];
  let lastMeteor = 0;
  let gameOver = false;

  // handle keyboard input
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function spawnMeteor(){
    const size = 20+Math.random()*30;
    meteors.push({x: Math.random()*canvas.width, y:-size, w:size, h:size, v:2+Math.random()*3});
    playSpawn(); // sound for new meteor
  }

  function update(dt){
    if(gameOver) return;
    // move player
    if(keys.ArrowLeft)  player.x -= player.speed;
    if(keys.ArrowRight) player.x += player.speed;
    if(keys.ArrowUp)    player.y -= player.speed;
    if(keys.ArrowDown)  player.y += player.speed;
    // keep inside bounds
    player.x = Math.max(0, Math.min(canvas.width-player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height-player.h, player.y));
    // spawn meteors over time
    lastMeteor += dt;
    if(lastMeteor>800){ // ms
      spawnMeteor();
      lastMeteor = 0;
    }
    // update meteors
    for(let i=meteors.length-1;i>=0;i--){
      const m = meteors[i];
      m.y += m.v;
      // remove off‑screen
      if(m.y>canvas.height) meteors.splice(i,1);
      // collision
      if(!(player.x+player.w < m.x || player.x > m.x+m.w || player.y+player.h < m.y || player.y > m.y+m.h)){
        gameOver = true;
        playExplosion(); // collision sound
      }
    }
  }

  function draw(){
    // background gradient (space)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // update and draw twinkling stars
    if (!window._stars) {
      // initialise starfield once
      window._stars = [];
      for (let i = 0; i < 200; i++) {
        window._stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2 + 0.5,
          ttl: Math.random() * 2000 + 1000 // twinkle cycle ms
        });
      }
    }
    const now = performance.now();
    ctx.fillStyle = '#fff';
    window._stars.forEach(s => {
      const phase = ((now % s.ttl) / s.ttl);
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(phase * Math.PI * 2));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // player ship (green triangle with glow)
    ctx.save();
    ctx.fillStyle = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // meteors with radial gradient and slight rotation
    meteors.forEach(m => {
      const radGrad = ctx.createRadialGradient(
        m.x + m.w / 2,
        m.y + m.h / 2,
        0,
        m.x + m.w / 2,
        m.y + m.h / 2,
        m.w / 2
      );
      radGrad.addColorStop(0, '#ff8c00');
      radGrad.addColorStop(1, '#8b0000');
      ctx.fillStyle = radGrad;
      ctx.save();
      ctx.translate(m.x + m.w / 2, m.y + m.h / 2);
      ctx.rotate((now / 1000) % (Math.PI * 2));
      ctx.fillRect(-m.w / 2, -m.h / 2, m.w, m.h);
      ctx.restore();
    });
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let last = performance.now();
  function loop(){
    const now = performance.now();
    const dt = now-last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
