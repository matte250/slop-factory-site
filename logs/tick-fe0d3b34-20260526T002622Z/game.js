// Simple Asteroid Dodge game with improved graphics
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
+  // starfield background
+  const stars = Array.from({ length: 120 }, () => ({
+    x: Math.random() * width,
+    y: Math.random() * height,
+    r: Math.random() * 1.5 + 0.5,
+  }));
+  // Audio assets
+  const collisionSound = new Audio('https://www.soundjay.com/button/sounds/button-09.wav');
+  const fuelSound = new Audio('https://www.soundjay.com/button/sounds/button-10.wav');
+  const gameOverSound = new Audio('https://www.soundjay.com/button/sounds/button-4.wav');
+  // set modest volume
+  [collisionSound, fuelSound, gameOverSound].forEach(s => s.volume = 0.3);
 
   // Ship
   const ship = { x: width / 2, y: height - 40, w: 30, h: 30, speed: 5 };
@@
   const spawnAsteroid = () => {
-    const size = Math.random() * 30 + 20;
-    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
+    const size = Math.random() * 30 + 20;
+    // add rotation for visual flair
+    asteroids.push({
+      x: Math.random() * (width - size),
+      y: -size,
+      w: size,
+      h: size,
+      speed: 2 + Math.random() * 2,
+      angle: Math.random() * Math.PI * 2,
+      rotSpeed: (Math.random() - 0.5) * 0.04,
+    });
   };
@@
   const draw = () => {
-    ctx.clearRect(0, 0, width, height);
-    // Ship (triangle)
-    ctx.fillStyle = '#0f0';
-    ctx.beginPath();
-    ctx.moveTo(ship.x, ship.y);
-    ctx.lineTo(ship.x + ship.w, ship.y);
-    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
-    ctx.closePath();
-    ctx.fill();
-    // Asteroids
-    ctx.fillStyle = '#888';
-    asteroids.forEach(a => ctx.fillRect(a.x, a.y, a.w, a.h));
-    // Fuel cans
-    ctx.fillStyle = '#ff0';
-    fuels.forEach(f => ctx.fillRect(f.x, f.y, f.w, f.h));
-    // Fuel bar
-    ctx.fillStyle = '#fff';
-    ctx.fillRect(10, 10, 100, 10);
-    ctx.fillStyle = '#0ff';
-    ctx.fillRect(10, 10, fuel, 10);
-    // Score
-    ctx.fillStyle = '#fff';
-    ctx.font = '16px Arial';
-    ctx.fillText('Score: ' + score, width - 100, 20);
-    // Game over
-    if (gameOver) {
-      ctx.fillStyle = 'rgba(0,0,0,0.7)';
-      ctx.fillRect(0, 0, width, height);
-      ctx.fillStyle = '#f00';
-      ctx.textAlign = 'center';
-      ctx.font = '48px Arial';
-      ctx.fillText('Game Over', width / 2, height / 2);
-    }
+    // background
+    ctx.fillStyle = '#000';
+    ctx.fillRect(0, 0, width, height);
+    // stars
+    ctx.fillStyle = '#fff';
+    stars.forEach(s => {
+      ctx.beginPath();
+      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
+      ctx.fill();
+    });
+    // Ship (gradient triangle)
+    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.h, ship.x, ship.y);
+    shipGrad.addColorStop(0, '#0f0');
+    shipGrad.addColorStop(1, '#050');
+    ctx.fillStyle = shipGrad;
+    ctx.beginPath();
+    ctx.moveTo(ship.x, ship.y);
+    ctx.lineTo(ship.x + ship.w, ship.y);
+    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
+    ctx.closePath();
+    ctx.fill();
+    // Asteroids (radial gradient circles with rotation)
+    asteroids.forEach(a => {
+      ctx.save();
+      ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
+      ctx.rotate(a.angle);
+      const grad = ctx.createRadialGradient(0, 0, a.w * 0.2, 0, 0, a.w / 2);
+      grad.addColorStop(0, '#aaa');
+      grad.addColorStop(1, '#555');
+      ctx.fillStyle = grad;
+      ctx.beginPath();
+      ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
+      ctx.fill();
+      ctx.restore();
+    });
+    // Fuel cans (simple cylinder with gradient)
+    fuels.forEach(f => {
+      const grad = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
+      grad.addColorStop(0, '#ff0');
+      grad.addColorStop(1, '#aa0');
+      ctx.fillStyle = grad;
+      ctx.fillRect(f.x, f.y, f.w, f.h);
+    });
+    // Fuel bar
+    ctx.fillStyle = '#222';
+    ctx.fillRect(10, 10, 100, 10);
+    ctx.fillStyle = '#0ff';
+    ctx.fillRect(10, 10, fuel, 10);
+    // Score
+    ctx.fillStyle = '#fff';
+    ctx.font = '16px Arial';
+    ctx.fillText('Score: ' + score, width - 100, 20);
+    // Game over overlay
+    if (gameOver) {
+      ctx.fillStyle = 'rgba(0,0,0,0.7)';
+      ctx.fillRect(0, 0, width, height);
+      ctx.fillStyle = '#f00';
+      ctx.textAlign = 'center';
+      ctx.font = '48px Arial';
+      ctx.fillText('Game Over', width / 2, height / 2);
+    }
   };
+
+  // update asteroid rotation each frame
+  const update = () => {
+    if (gameOver) return;
+    // Move ship
+    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
+    if (keys.ArrowRight) ship.x = Math.min(width - ship.w, ship.x + ship.speed);
+
+    // Spawn
+    if (frame % 90 === 0) spawnAsteroid();
+    if (frame % 600 === 0) spawnFuel();
+
+    // Update asteroids positions and rotation
+    asteroids.forEach(a => {
+      a.y += a.speed;
+      a.angle += a.rotSpeed;
+    });
+    asteroids = asteroids.filter(a => a.y < height);
+
+    // Update fuels
+    fuels.forEach(f => f.y += f.speed);
+    fuels = fuels.filter(f => f.y < height);
+
+    // Collision detection
+    for (let i = 0; i < asteroids.length; i++) {
+      const a = asteroids[i];
+      if (rectIntersect(ship, a)) { gameOver = true; break; }
+      if (a.y > height) { score++; asteroids.splice(i, 1); i--; }
+    }
+    for (let i = 0; i < fuels.length; i++) {
+      const f = fuels[i];
+      if (rectIntersect(ship, f)) { fuel = Math.min(100, fuel + 30); fuels.splice(i, 1); i--; }
+    }
+
+    // Fuel drain
+    fuel -= 0.05;
+    if (fuel <= 0) gameOver = true;
+
+    frame++;
+  };
*** End Patch
*** End Patch
