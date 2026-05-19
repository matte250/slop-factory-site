// Neon Runner – minimal endless runner for canvas #game
(() => {
  const canvas = document.getElementById('game');
  // generate neon stars for background; will be regenerated on resize
  let stars = [];
  const generateStars = () => {
    const count = 80;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    }));
  };
  const ctx = canvas.getContext('2d');
  const setSize = () => {canvas.width = innerWidth; canvas.height = innerHeight;};
  setSize();
  generateStars();
  // audio setup
  let audioCtx;
  let audioReady = false;
  const initAudio = () => { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); audioReady = true; } };
  const playJumpSound = () => {
    if (!audioReady) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  const playDeathSound = () => {
    if (!audioReady) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 120;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };
  addEventListener('keydown', initAudio, {once: true});
  addEventListener('touchstart', initAudio, {once: true});
  addEventListener('resize', () => { setSize(); generateStars(); });

  const player = {x:80, y:0, w:30, h:30, vy:0, onGround:false, jump(){if(this.onGround){this.vy=-8;this.onGround=false; if (audioReady) playJumpSound();}}};
  const GRAV = 0.35;
  const obstacles = [];
  let lastObs = 0, score = 0, dead = false;

  const spawn = () => {
    const gap = 150; // distance between obstacles
    const h = Math.random()* (canvas.height/2) + 30;
    obstacles.push({x:canvas.width, y:canvas.height-h, w:30, h});
  };

  const rectCollide = (a,b)=> a.x<a.x+b.w && a.x+a.w>b.x && a.y<a.y+b.h && a.y+a.h>b.y;

  const update = dt=> {
    if(dead) return;
    // player physics
    player.vy+=GRAV; player.y+=player.vy;
    if(player.y+player.h>=canvas.height){player.y=canvas.height-player.h; player.vy=0; player.onGround=true;}
    else player.onGround=false;
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i]; o.x-=6;
      if(o.x+o.w<0) obstacles.splice(i,1);
      else if(rectCollide(player,o)) { dead=true; if (audioReady) playDeathSound(); }
    }
    // spawn
    if(performance.now()-lastObs>1200){spawn(); lastObs=performance.now();}
    score+=dt/1000;
  };

  const draw = ()=>{
    // background gradient (dark to near‑black)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#020202');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // neon glow settings
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    // neon style for shapes
    ctx.strokeStyle = '#0ff';
    ctx.fillStyle = '#001a1a'; // dark fill for contrast

    // draw neon stars
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#0ff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // reset shadow for shapes
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';

    // player with neon fill and outline
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    // obstacles with neon fill and outline
    obstacles.forEach(o=>{ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);});
    // score
    ctx.fillStyle = '#0ff'; ctx.font = '20px monospace'; ctx.fillText('Score: '+Math.floor(score),10,30);
    if(dead){ctx.fillStyle='red'; ctx.font='40px monospace'; ctx.fillText('Game Over',canvas.width/2-100,canvas.height/2);}
  };

  let last = performance.now();
  const loop = now=>{
    const dt = now-last; last=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // input
  addEventListener('keydown', e=>{if(e.code==='Space') player.jump();});
  addEventListener('touchstart', e=>{player.jump();});
})();
