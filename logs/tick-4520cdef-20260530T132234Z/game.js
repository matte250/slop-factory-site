// Simple Asteroid Dodge game – enhanced graphics with sound
// Canvas with id="game"
(() => {
  // Audio context and simple tone generator
+  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
+  function playTone(freq, duration) {
+    const osc = audioCtx.createOscillator();
+    const gain = audioCtx.createGain();
+    osc.frequency.value = freq;
+    osc.type = 'square';
+    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
+    osc.connect(gain).connect(audioCtx.destination);
+    osc.start();
+    osc.stop(audioCtx.currentTime + duration);
+  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
+
+  // Starfield background – generate once
+  const stars = [];
+  for (let i = 0; i < 200; i++) {
+    stars.push({
+      x: Math.random() * width,
+      y: Math.random() * height,
+      radius: Math.random() * 1.2 + 0.3,
+    });
+  }
 
   // Ship state
   const ship = {
     x: width / 2,
     y: height / 2,
     radius: 10,
@@
-  // Asteroid pool
-  const asteroids = [];
+  // Asteroid pool
+  const asteroids = [];
   const asteroidSpawnInterval = 1500; // ms
   let lastSpawn = 0;
@@
-  // Scoring
-  let startTime = performance.now();
-  let score = 0;
+  // Scoring
+  let startTime = performance.now();
+  let score = 0;
@@
-  function spawnAsteroid() {
-    const size = Math.random() * 20 + 15; // radius
-    // Choose edge
-    const edge = Math.floor(Math.random() * 4);
-    let x, y, vx, vy;
-    const speed = Math.random() * 1.5 + 0.5;
-    if (edge === 0) { // top
-      x = Math.random() * width;
-      y = -size;
-      vx = (Math.random() - 0.5) * speed;
-      vy = speed;
-    } else if (edge === 1) { // right
-      x = width + size;
-      y = Math.random() * height;
-      vx = -speed;
-      vy = (Math.random() - 0.5) * speed;
-    } else if (edge === 2) { // bottom
-      x = Math.random() * width;
-      y = height + size;
-      vx = (Math.random() - 0.5) * speed;
-      vy = -speed;
-    } else { // left
-      x = -size;
-      y = Math.random() * height;
-      vx = speed;
-      vy = (Math.random() - 0.5) * speed;
-    }
-    asteroids.push({ x, y, vx, vy, radius: size });
-  }
+  function spawnAsteroid() {
+    const size = Math.random() * 20 + 15; // radius
+    // Choose edge (0 top, 1 right, 2 bottom, 3 left)
+    const edge = Math.floor(Math.random() * 4);
+    let x, y, vx, vy;
+    const speed = Math.random() * 1.5 + 0.5;
+    if (edge === 0) { // top
+      x = Math.random() * width;
+      y = -size;
+      vx = (Math.random() - 0.5) * speed;
+      vy = speed;
+    } else if (edge === 1) { // right
+      x = width + size;
+      y = Math.random() * height;
+      vx = -speed;
+      vy = (Math.random() - 0.5) * speed;
+    } else if (edge === 2) { // bottom
+      x = Math.random() * width;
+      y = height + size;
+      vx = (Math.random() - 0.5) * speed;
+      vy = -speed;
+    } else { // left
+      x = -size;
+      y = Math.random() * height;
+      vx = speed;
+      vy = (Math.random() - 0.5) * speed;
+    }
+    asteroids.push({ x, y, vx, vy, radius: size });
+  }
@@
-  function draw() {
-    ctx.clearRect(0, 0, width, height);
-    // Draw ship (triangle)
-    ctx.save();
-    ctx.translate(ship.x, ship.y);
-    ctx.rotate(ship.angle);
-    ctx.beginPath();
-    ctx.moveTo(15, 0);
-    ctx.lineTo(-10, -8);
-    ctx.lineTo(-10, 8);
-    ctx.closePath();
-    ctx.fillStyle = 'white';
-    ctx.fill();
-    ctx.restore();
-
-    // Draw asteroids
-    ctx.fillStyle = 'gray';
-    for (const a of asteroids) {
-      ctx.beginPath();
-      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
-      ctx.fill();
-    }
-
-    // Draw score
-    ctx.fillStyle = 'lime';
-    ctx.font = '16px sans-serif';
-    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
-  }
+  function draw() {
+    // Clear and draw starfield background
+    ctx.fillStyle = 'black';
+    ctx.fillRect(0, 0, width, height);
+    ctx.fillStyle = 'white';
+    for (const s of stars) {
+      ctx.beginPath();
+      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
+      ctx.fill();
+    }
+
+    // Draw ship – white hull with optional thrust flame
+    ctx.save();
+    ctx.translate(ship.x, ship.y);
+    ctx.rotate(ship.angle);
+    // Ship body
+    ctx.beginPath();
+    ctx.moveTo(15, 0);
+    ctx.lineTo(-10, -8);
+    ctx.lineTo(-10, 8);
+    ctx.closePath();
+    ctx.fillStyle = 'white';
+    ctx.fill();
+    // Optional thrust flame
+    if (keys['ArrowUp']) {
+      ctx.beginPath();
+      ctx.moveTo(-10, 0);
+      ctx.lineTo(-18, -5);
+      ctx.lineTo(-18, 5);
+      ctx.closePath();
+      ctx.fillStyle = 'orange';
+      ctx.fill();
+    }
+    ctx.restore();
+
+    // Draw asteroids with radial gradient for depth
+    for (const a of asteroids) {
+      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
+      grad.addColorStop(0, '#bbbbbb');
+      grad.addColorStop(1, '#444444');
+      ctx.fillStyle = grad;
+      ctx.beginPath();
+      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
+      ctx.fill();
+    }
+
+    // Draw score
+    ctx.fillStyle = 'lime';
+    ctx.font = '16px sans-serif';
+    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
+  }
*** End of File ***

