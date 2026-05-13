1. Scaffold HTML and meta.json — create index.html with required header, canvas, restart button, empty script block, and matching meta.json with title, description, and controls.
2. Define initial game state objects — declare plain objects for player, hazards, score, phase, and overall state with initial values at top of script.
3. Implement animation loop — add startLoop() with cancelAnimationFrame handling, requestAnimationFrame loop that computes dt, wraps body in try/catch, and calls update(dt) and render().
4. Set up input handling — create a Set keys, add keydown/keyup listeners, map R key and restart button to a shared reset() function.
5. Add player movement — implement dt‑based physics for horizontal movement based on Arrow keys (or A/D), with acceleration, friction, speed cap, and canvas bounds.
6. Create hazard system — define hazard data structure, spawn rules respecting SAFE_RADIUS around player, and dt‑scaled motion.
7. Implement collision detection — detect player vs hazard collisions, transition state to "gameover", and stop the active gameplay loop.
8. Add scoring logic — increase score on discrete events (e.g., each hazard passed), and draw current score on canvas top‑left.
9. Render frame — clear canvas, draw background, draw hazards, draw player (high‑contrast), and draw HUD elements.
10. Game‑over overlay — dim background, display "Game Over", final score, and restart instructions on canvas.
11. Expose observable contract — populate window.__game each frame with state ("menu" | "playing" | "gameover"), score, player position/visibility, and a one‑sentence objective.
12. Add audio effects — lazy‑initialize AudioContext with a beep() helper, and play sounds on hit, score, and death events.