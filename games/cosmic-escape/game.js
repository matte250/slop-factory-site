// Simple canvas game: bouncing ball
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBounce() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  // resume audio on user interaction (required by browsers)
  window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, {once: true});
  // Set canvas size (fallback to 400x400 if not set via CSS)
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 400;

  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let vx = 2; // velocity X
  let vy = 3; // velocity Y
  const radius = 20;

  function update() {
    x += vx;
    y += vy;
    // bounce off walls with sound
    let bounced = false;
    if (x + radius > canvas.width || x - radius < 0) { vx = -vx; bounced = true; }
    if (y + radius > canvas.height || y - radius < 0) { vy = -vy; bounced = true; }
    if (bounced) playBounce();
  }

  function draw() {
    // draw gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1e3c72');
    bgGrad.addColorStop(1, '#2a5298');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw ball with radial gradient
    const radGrad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    radGrad.addColorStop(0, '#ffdd57');
    radGrad.addColorStop(1, '#ff5722');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = radGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    // reset shadow for next frame
    ctx.shadowBlur = 0;

  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the animation
  requestAnimationFrame(loop);
})();
