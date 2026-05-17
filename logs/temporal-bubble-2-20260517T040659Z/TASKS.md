1. HTML scaffold and meta.json — generate `index.html` with required header, canvas, restart button, empty script block, and create `meta.json` matching game title, description, controls, tags.
2. Game state objects — declare plain object literals for player, hazards list, score, and phase at top of script with initial values.
3. Main loop implementation — add `startLoop()` with cancelAnimationFrame handling, requestAnimationFrame loop, try/catch, and clear canvas each frame.
4. Input handling — create a `Set` of pressed keys, add `keydown`/`keyup` listeners, and bind R‑key and restart button to a common `reset()` function.
5. Player movement — implement dt‑based physics: velocity updates from arrow keys, caps at MAX_SPEED, friction, and clamp position to canvas bounds.
6. Hazard system — design data structure, spawn rules that respect `SAFE_RADIUS` at start, and dt‑scaled motion for each hazard.
7. Collision detection — check player against hazards each frame; on hit transition `phase` to "gameover" and stop active gameplay.
8. Scoring — increase score on discrete events (e.g., hazard passes), and draw the current score on the canvas top‑left.
9. Rendering — each frame draw background, hazards, player (high‑contrast), and HUD after clearing the canvas.
10. Game‑over overlay — dim the scene, display "Game Over", final score, and restart instructions on the canvas.
11. Observable contract — populate `window.__game` each frame with `state`, `score`, `player` (x, y, visible), and an `objective` sentence.
12. Audio integration — lazily create an `AudioContext` in a `beep()` helper, wrap in try/catch, and trigger sounds on hit, score, and death events.