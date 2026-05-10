1. Scaffold HTML and meta.json — create `index.html` with required header, canvas, restart button, empty script block, and generate `meta.json` matching title, description, controls, tags.
2. Define game state objects — add plain object literals for player (position, velocity, radii, current radius), hazards array, score, state, objective.
3. Implement animation loop — write `startLoop` with `cancelAnimationFrame`, dt calculation, try/catch, and canvas clearing each frame.
4. Set up input handling — create `keys` Set, keydown/keyup listeners, map R key and restart button to a shared `reset()` function.
5. Add player movement — dt‑based physics updating player position based on arrow/WASD keys, clamped within canvas bounds.
6. Implement size toggle — handle tap/Space key to switch player radius between small and large values.
7. Create hazard system — define hazard data structure, spawn logic respecting `SAFE_RADIUS`, and per‑frame motion updates.
8. Add collision detection — detect player‑hazard collisions, transition to "gameover" state, and stop active gameplay.
9. Implement scoring — increase score on successful hazard passes or distance milestones, and draw the score on canvas.
10. Render core visuals — clear canvas, draw background, hazards, player (high‑contrast), and HUD elements each frame.
11. Game‑over overlay — dim background, display "Game Over" with final score and restart instructions on canvas.
12. Expose observable contract — assign `window.__game` each frame with state, score, player position/visibility, and objective string.
13. Add audio effects — create lazy‑init `beep()` using `AudioContext`, trigger sounds on hit, score, and death events.