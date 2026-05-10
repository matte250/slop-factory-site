1. HTML scaffold & meta.json — Add index.html with header, description, controls list, canvas, restart button per CONVENTIONS.md and create matching meta.json.
2. Game state objects — Define player, hazards, score, and phase objects with initial values at top of script.
3. Animation loop — Implement startLoop() using requestAnimationFrame with cancel handling, try/catch, and call update(dt) and render().
4. Input handling — Set up a keys Set with keydown/keyup listeners, R-key restart, and restart button click invoking reset().
5. Player movement — Add dt‑based physics for player movement using arrow keys, with acceleration, max speed, friction, and canvas bounds.
6. Hazard system — Create hazard data structure, spawn logic with SAFE_RADIUS to avoid player start, and dt‑scaled motion.
7. Collision detection — Detect player‑hazard collisions, switch phase to "gameover" and halt gameplay.
8. Scoring — Increment score on defined events and render score text at top‑left of canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD elements.
10. Game‑over overlay — Dim screen, show "Game Over", final score, and restart instructions.
11. Observable contract — Expose window.__game each frame with state, score, player visibility, and objective description.
12. Audio subsystem — Initialize AudioContext lazily in beep() helper, wrap calls in try/catch, and trigger sounds on hit, score, and death events.