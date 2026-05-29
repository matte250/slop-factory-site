// Simple bouncing ball game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill its container
  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  // Ball properties
  const ball = { x: 50, y: 50, vx: 2, vy: 2, radius: 15, color: '#0095DD' };
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBounce(){
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
  function update(){
    ball.x += ball.vx;
    ball.y += ball.vy;
    let bounced = false;
    if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0){
      ball.vx *= -1;
      bounced = true;
    }
    if(ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0){
      ball.vy *= -1;
      bounced = true;
    }
    if(bounced) playBounce();
  }
  function draw(){
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ball with radial gradient and shadow
    const grad = ctx.createRadialGradient(
      ball.x, ball.y, ball.radius * 0.1,
      ball.x, ball.y, ball.radius
    );
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, ball.color);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.closePath();
    // Reset shadow for future drawing
    ctx.shadowBlur = 0;
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
