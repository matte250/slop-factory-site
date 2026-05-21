// Simple canvas game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = { x: 50, y: 50, size: 20, speed: 4 };
  const keys = {};

  // Simple sound setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
window.addEventListener('keydown', e => { keys[e.key] = true; playBeep(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
  }

  function draw() {
    // fade previous frame for motion trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw player as a glowing circle
    const gradient = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size * 0.1,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    gradient.addColorStop(0, '#fffd7a');
    gradient.addColorStop(1, '#ff6a00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
