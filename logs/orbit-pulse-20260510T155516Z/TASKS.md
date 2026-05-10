1. HTML scaffold & meta.json — Create index.html with header, canvas, restart button per CONVENTIONS.md and an empty script block; add matching meta.json file.
2. Game state objects — Declare player, hazards, score, and phase objects with initial values at top of script.
3. Main loop — Implement startLoop() using requestAnimationFrame with cancel logic, try/catch, and stub update/render calls clearing the canvas.
4. Input handling — Add a keys Set with keydown/keyup listeners, R-key restart, and restart button click invoking a reset() function.
5. Player movement — Apply dt‑based physics for player using arrow keys, including acceleration, max speed, friction, and canvas bounds.
6. Hazard system — Define hazard data structure, spawn logic respecting SAFE_RADIUS, and dt‑scaled movement.
7. Collision detection — Detect player‑hazard collisions, transition phase to "gameover" and halt gameplay.
8. Scoring — Increment score on defined events and render the value at top‑left of the canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD elements.
10. Game‑over overlay — Dim screen, display "Game Over", final score, and restart instructions.
11. Observable contract — Expose window.__game each frame with state, score, player position/visibility, and objective description.
12. Audio system — Initialize AudioContext lazily in a beep() helper, add try/catch, and trigger sounds on hit, score, and death events.
13. Pulse mechanic — Implement tap/click to emit a radial pulse expanding orbit radius temporarily, allowing the dot to slip through outer obstacles.
14. Obstacle wrapping — Ensure outer obstacles re‑appear correctly after the pulse contracts, maintaining gameplay flow.
15. Final polish — Add any missing constants, ensure no console errors, and verify all tasks integrate smoothly.