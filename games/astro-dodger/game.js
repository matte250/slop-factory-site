// Simple game targeting canvas with id "game"
(function() {
  const canvas = document.getElementById('game');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  // Add subtle shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.scale(dpr, dpr);
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  let x = width / 2, y = height / 2;
  let vx = 2, vy = 3;
  let audioCtx;
function initAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playHitSound(){
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}
function update() {
  let bounced = false;
  x += vx;
  y += vy;
  if (x < 0) { x = 0; vx = -vx; bounced = true; }
  else if (x > width) { x = width; vx = -vx; bounced = true; }
  if (y < 0) { y = 0; vy = -vy; bounced = true; }
  else if (y > height) { y = height; vy = -vy; bounced = true; }
  if (bounced) playHitSound();
}
  function draw() {
    // Fade previous frame for motion blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    // Draw ball with radial gradient
    const grad = ctx.createRadialGradient(x, y, 5, x, y, 20);
    grad.addColorStop(0, '#ffffaa');
    grad.addColorStop(1, '#ff6600');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
