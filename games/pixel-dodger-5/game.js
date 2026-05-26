// Simple canvas game: move a square with arrow keys
const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('Canvas with id "game" not found');
}
const ctx = canvas.getContext('2d');
const size = 30;
let x = canvas.width / 2 - size / 2;
let y = canvas.height / 2 - size / 2;
const speed = 2;
const keys = {};
// Set up audio context for movement sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioStarted = false;
function playMoveSound(){
  // Create short beep using oscillator
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  // Resume audio context on first user interaction
  if (!audioStarted){
    audioCtx.resume().then(()=>{audioStarted=true;});
  }
  // Play sound on movement keys
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    playMoveSound();
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
function update() {
  if (keys.ArrowLeft) x -= speed;
  if (keys.ArrowRight) x += speed;
  if (keys.ArrowUp) y -= speed;
  if (keys.ArrowDown) y += speed;
  // keep inside bounds
  x = Math.max(0, Math.min(canvas.width - size, x));
  y = Math.max(0, Math.min(canvas.height - size, y));
}
function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a0a30');
  bgGrad.addColorStop(1, '#001');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player as a circle with a radial gradient
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;
  const playerGrad = ctx.createRadialGradient(
    centerX, centerY, radius * 0.2,
    centerX, centerY, radius
  );
  playerGrad.addColorStop(0, '#ffcc66');
  playerGrad.addColorStop(1, '#ff6600');
  ctx.fillStyle = playerGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
}
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
// start when canvas is ready
if (canvas.width && canvas.height) {
  loop();
} else {
  window.addEventListener('load', () => loop());
}
