// Simple canvas game: move a square with arrow keys
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const state = {x:50, y:50, size:30, speed:2};
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.key]=true});
  window.addEventListener('keyup',e=>{keys[e.key]=false});
  function update(){
    let moved = false;
    if(keys.ArrowUp){ state.y-=state.speed; moved = true; }
    if(keys.ArrowDown){ state.y+=state.speed; moved = true; }
    if(keys.ArrowLeft){ state.x-=state.speed; moved = true; }
    if(keys.ArrowRight){ state.x+=state.speed; moved = true; }
    // keep inside canvas
    state.x = Math.max(0, Math.min(canvas.width-state.size, state.x));
    state.y = Math.max(0, Math.min(canvas.height-state.size, state.y));
    if(moved) playMoveSound();
  }
  // Initialize audio context and movement sound
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playMoveSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
  function draw(){
    // Draw gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#001133');
    bgGrad.addColorStop(1, '#003366');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player as a circle with radial gradient
    const radius = state.size / 2;
    const gradient = ctx.createRadialGradient(state.x + radius, state.y + radius, radius * 0.2, state.x + radius, state.y + radius, radius);
    gradient.addColorStop(0, '#ffcc00');
    gradient.addColorStop(1, '#ff6600');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(state.x + radius, state.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // Adjust canvas size to its CSS size if not set
  if(!canvas.width||!canvas.height){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  loop();
})();
