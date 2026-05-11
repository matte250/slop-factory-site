1. Scaffold HTML and meta.json — create `index.html` with header, canvas, restart button and matching `meta.json` per CONVENTIONS.md.
2. Define game state objects — declare player, hazards array, score, and phase objects at the top of the script.
3. Implement main loop — add `startLoop` using `requestAnimationFrame`, with cancel logic, clearing canvas, calling `update(dt)` and `render()`.
4. Set up input handling — create a `keys` Set for keydown/keyup events, add R‑key restart hook and restart button click invoking a common reset function.
5. Add player movement — implement dt‑based lane‑cycling physics responding to input, updating player position each frame.
6. Create hazard system — define hazard data structure, spawn rules respecting `SAFE_RADIUS`, and move hazards each frame.
7. Add collision detection — detect player‑hazard collisions, transition to `gameover` state and stop the active loop.
8. Implement scoring — increase score on hazard passes, draw the score at top‑left each frame.
9. Render game elements — clear canvas, draw background, hazards, the player (high‑contrast dot), and HUD.
10. Show game‑over overlay — dim the background and display "Game Over", final score, and restart instructions.
11. Expose observable contract — populate `window.__game` each frame with state, score, player coordinates, visibility, and a short objective string.
12. Add audio helpers — lazy‑initialize an `AudioContext` and provide a `beep()` function for hit, score, and death events, wrapped in try/catch.