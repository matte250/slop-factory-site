// Minimal Orbit Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // ----- Audio -----
  // Simple beep sound for thrust (looped) and collect
  const thrustAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA');
  thrustAudio.loop = true;
  const collectAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA');

  // ----- Game parameters -----
  const planet = { x: W / 2, y: H / 2, r: 30 };
  const ship = {
    r: planet.r + 60, // orbital radius
    angle: 0,
    angularSpeed: 0.02,
    radialSpeed: 0,
    size: 8,
    fuel: 100,
  };
  const orbs = [];
  const maxOrbs = 5;
  const orbRadius = 5;
  let score = 0;
  let missed = 0;
  const maxMissed = 3;

  // ----- Helpers -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnOrb() {
    const radius = rand(planet.r + 80, Math.min(W, H) / 2 - 20);
    const angle = rand(0, Math.PI * 2);
    const x = planet.x + radius * Math.cos(angle);
    const y = planet.y + radius * Math.sin(angle);
    orbs.push({ x, y, radius, collected: false });
  }

  // fill initial orbs
  for (let i = 0; i < maxOrbs; i++) spawnOrb();

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.code] = true));
  window.addEventListener('keyup', (e) => (keys[e.code] = false));

  // ----- Game loop -----
  function update(dt) {
    // thrust outward with ArrowUp
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.radialSpeed += 0.06;
      ship.fuel -= 0.2;
      ship.thrusting = true;
    } else {
      ship.thrusting = false;
    }
    // brake inward with ArrowDown
    if (keys['ArrowDown']) {
      ship.radialSpeed -= 0.06;
    }
    // handle thrust sound
    if (ship.thrusting) {
      if (thrustAudio.paused) {
        thrustAudio.currentTime = 0;
        thrustAudio.play();
      }
    } else {
      thrustAudio.pause();
    }

    // apply radial speed with simple damping
    ship.r += ship.radialSpeed * dt;
    ship.radialSpeed *= 0.98; // friction

    // update angle (keep orbital motion)
    ship.angle += ship.angularSpeed * dt;

    // lose conditions
    if (ship.r <= planet.r + ship.size) {
      endGame('Crashed into the planet');
    }
    if (ship.r >= Math.min(W, H) / 2 - ship.size) {
      endGame('Flown off the canvas');
    }
    if (ship.fuel <= 0 && !keys['ArrowUp']) {
      // out of fuel but still can coast; no immediate loss
    }

    // check orb collisions
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = ship.r * Math.cos(ship.angle) + planet.x - o.x;
      const dy = ship.r * Math.sin(ship.angle) + planet.y - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + orbRadius) {
        // collect
        score++;
        ship.fuel = Math.min(100, ship.fuel + 20);
        // play collect sound
        collectAudio.currentTime = 0;
        collectAudio.play();
        orbs.splice(i, 1);
        spawnOrb();
        continue;
      }
    }
  }

function draw() {
  ctx.clearRect(0, 0, W, H);
  // planet with radial gradient
  const planetGrad = ctx.createRadialGradient(
    planet.x,
    planet.y,
    planet.r * 0.3,
    planet.x,
    planet.y,
    planet.r
  );
  planetGrad.addColorStop(0, '#777');
  planetGrad.addColorStop(1, '#222');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
  ctx.fill();
  // draw orbital path
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, ship.r, 0, Math.PI * 2);
  ctx.stroke();
  // orbs with glow
  for (const o of orbs) {
    const orbGrad = ctx.createRadialGradient(
      o.x,
      o.y,
      0,
      o.x,
      o.y,
      orbRadius
    );
    orbGrad.addColorStop(0, '#ff0');
    orbGrad.addColorStop(1, '#aa0');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, orbRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  // ship (filled triangle with outline)
  const sx = planet.x + ship.r * Math.cos(ship.angle);
  const sy = planet.y + ship.r * Math.sin(ship.angle);
  const dir = ship.angle + Math.PI / 2; // point outward
  ctx.fillStyle = '#0f0';
  ctx.strokeStyle = '#0c0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(
    sx + ship.size * Math.cos(dir),
    sy + ship.size * Math.sin(dir)
  );
  ctx.lineTo(
    sx + ship.size * Math.cos(dir + 2.5),
    sy + ship.size * Math.sin(dir + 2.5)
  );
  ctx.lineTo(
    sx + ship.size * Math.cos(dir - 2.5),
    sy + ship.size * Math.sin(dir - 2.5)
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // thrust flame when accelerating
  if (ship.thrusting) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(
      sx + (ship.size - 2) * Math.cos(dir + Math.PI),
      sy + (ship.size - 2) * Math.sin(dir + Math.PI)
    );
    ctx.lineTo(
      sx + (ship.size + 6) * Math.cos(dir + Math.PI + 0.2),
      sy + (ship.size + 6) * Math.sin(dir + Math.PI + 0.2)
    );
    ctx.lineTo(
      sx + (ship.size + 6) * Math.cos(dir + Math.PI - 0.2),
      sy + (ship.size + 6) * Math.sin(dir + Math.PI - 0.2)
    );
    ctx.closePath();
    ctx.fill();
  }
  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 40);
}

  let last = performance.now();
  let gameOver = false;
  function loop(now) {
    const dt = (now - last) / 16; // normalized to ~60fps step
    last = now;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }

  function endGame(msg) {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f00';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, W / 2, H / 2 - 20);
    ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 20);
  }

  requestAnimationFrame(loop);
})();
