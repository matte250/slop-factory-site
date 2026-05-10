1. HTML Scaffold — Create index.html with header, description, controls list, canvas, restart button, stub script tag, and matching meta.json file.
2. Game State Objects — Define player, hazards, score, and phase objects with initial values at top of script.
3. Animation Loop — Implement startLoop() using requestAnimationFrame, with cancelAnimationFrame handling, try/catch, and clear canvas.
4. Input Handling — Set up keys Set with keydown/keyup listeners, R-key restart, and restart button click invoking reset().
5. Player Movement — Add dt‑based physics for acceleration, velocity reversal on tap, speed caps, and bounds clamping.
6. Hazard System — Create hazard data structure, spawn logic with SAFE_RADIUS, and dt‑scaled motion.
7. Collision Detection — Detect player‑hazard collisions, switch phase to "gameover", and halt gameplay.
8. Scoring — Increment score on events, render score text at top‑left of canvas.
9. Rendering — Draw background, hazards, player (high contrast), and HUD each frame.
10. Game‑Over Overlay — Dim screen, show "Game Over", final score, and restart instructions.
11. Observable Contract — Expose window.__game each frame with state, score, player visibility, and objective description.
12. Audio System — Initialize AudioContext lazily, add beep() helper, and hook sounds to hit, score, and death events.