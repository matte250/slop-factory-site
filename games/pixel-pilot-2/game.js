// Simple game based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 400;

  const plane = {x: 80, y: height/2, w: 40, h: 20, color: '#0af'};
  const fuel = {time: 30, max: 30}; // seconds
  const clouds = [];
  const fuels = [];
  const speed = 2; // background scroll speed

  // Helpers
  const rectsOverlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const spawnCloud = () => {
    const size = 30 + Math.random()*20;
    clouds.push({x: width, y: Math.random()*(height-size), w: size, h: size, color: '#777'});
  };
  const spawnFuel = () => {
    const size = 20;
    fuels.push({x: width, y: Math.random()*(height-size), w: size, h: size, color: '#f80'});
  };

  let lastTime = 0, cloudTimer = 0, fuelTimer = 0;
  const update = (timestamp) => {
    const delta = (timestamp - lastTime)/1000; // seconds
    lastTime = timestamp;
    // move plane vertically based on keys
    if (keys["ArrowUp"]) plane.y -= 200*delta;
    if (keys["ArrowDown"]) plane.y += 200*delta;
    plane.y = Math.max(0, Math.min(height-plane.h, plane.y));

    // scroll clouds and fuels
    clouds.forEach(c=>c.x -= speed*delta*100);
    fuels.forEach(f=>f.x -= speed*delta*100);
    // remove off-screen
    while (clouds.length && clouds[0].x + clouds[0].w < 0) clouds.shift();
    while (fuels.length && fuels[0].x + fuels[0].w < 0) fuels.shift();

    // spawn logic
    cloudTimer += delta;
    fuelTimer += delta;
    if (cloudTimer > 1.5) { spawnCloud(); cloudTimer = 0; }
    if (fuelTimer > 5) { spawnFuel(); fuelTimer = 0; }

    // collisions
    for (let i=clouds.length-1;i>=0;i--) if (rectsOverlap(plane,clouds[i])) { playSound(200,0.3); endGame(); }
    for (let i=fuels.length-1;i>=0;i--) if (rectsOverlap(plane,fuels[i])) { fuel.time = Math.min(fuel.max, fuel.time+5); fuels.splice(i,1); playSound(800,0.1); }

    // fuel depletion
    fuel.time -= delta;
    if (fuel.time <= 0) endGame();

    draw();
    requestAnimationFrame(update);
  };

  const draw = () => {
    // Background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#1E90FF'); // deep sky blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground strip
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - 40, width, 40);

    // Plane – simple triangular shape
    ctx.fillStyle = plane.color;
    ctx.beginPath();
    ctx.moveTo(plane.x, plane.y + plane.h / 2);
    ctx.lineTo(plane.x + plane.w, plane.y);
    ctx.lineTo(plane.x + plane.w, plane.y + plane.h);
    ctx.closePath();
    ctx.fill();

    // Clouds – soft circles with radial gradient
    clouds.forEach(c => {
      const grad = ctx.createRadialGradient(
        c.x + c.w / 2,
        c.y + c.h / 2,
        c.w * 0.2,
        c.x + c.w / 2,
        c.y + c.h / 2,
        c.w / 2
      );
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(200,200,200,0.6)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuels – bright orange cans with simple rect + circle top
    fuels.forEach(f => {
      // body
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(f.x, f.y + f.h * 0.2, f.w, f.h * 0.8);
      // top cap
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h * 0.2, f.w / 2, Math.PI, 0);
      ctx.fill();
    });

    // UI fuel timer
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + Math.ceil(fuel.time) + 's', 10, 20);
  };

  const endGame = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', width/2-80, height/2);
    // stop animation
    cancelAnimationFrame(raf);
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // Engine hum loop
  let engineInterval = null;
  const startEngine = () => {
    if (engineInterval) return;
    engineInterval = setInterval(() => playSound(150, 0.05), 500);
  };
  const stopEngine = () => {
    if (engineInterval) clearInterval(engineInterval);
    engineInterval = null;
  };

  // Resume audio on first interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startEngine();
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);

  const keys = {};
  window.addEventListener('keydown', e=>keys[e.key]=true);
  window.addEventListener('keyup', e=>keys[e.key]=false);

  let raf = requestAnimationFrame(update);
})();
