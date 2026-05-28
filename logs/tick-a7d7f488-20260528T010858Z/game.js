// Asteroid Dodge with enhanced graphics
// Canvas element with id "game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio assets
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAAAB3AgAEABAAZGF0YQAAAAA='); // short beep
  const fuelSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAAAB3AgAEABAAZGF0YQAAAAA=');

  const stars = [];
  const initStars = () => {
    const count = Math.min(200, Math.floor(canvas.width * canvas.height / 5000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };

  const updateStars = () => {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.x = Math.random() * canvas.width;
        s.y = -s.r;
      }
    }
  };

const resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Reinitialize stars on resize
  stars.length = 0;
  initStars();
}
    }

    // Update fuel pickups
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.r > canvas.height) {
        fuels.splice(i, 1);
        continue;
      }
      const shipCenterX = ship.x + ship.width / 2;
      const shipCenterY = ship.y + ship.height / 2;
      const dx = f.x - shipCenterX;
      const dy = f.y - shipCenterY;
      if (Math.hypot(dx, dy) < f.r + Math.max(ship.width, ship.height) / 2) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        fuels.splice(i, 1);
      }
    }
    frame++;
  };

  // Draw background stars and game objects
  // Draw background stars and game objects
  // Draw background stars and game objects
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel pickups (glowing)
    fuels.forEach(f => {
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      glow.addColorStop(0, '#0f0');
      glow.addColorStop(1, '#030');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel bar
    ctx.fillStyle = '#ff0';
    ctx.fillRect(10, 10, ship.fuel * 2, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 200, 10);
  };

  const endGame = msg => {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 20);
  };

  const loop = () => {
    if (!gameOver) {
      update();
      draw();
    }
    requestAnimationFrame(loop);
  };
  loop();
})();
