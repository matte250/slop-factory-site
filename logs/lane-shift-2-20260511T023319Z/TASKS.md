1. Scaffold HTML and meta.json — create `index.html` with required header, canvas, restart button, and an empty script block; generate `meta.json` matching the game title, description, controls, and tags.
2. Define initial game state — declare player object, hazards array, score, and phase/state literals at the top of the script with default values.
3. Set up animation loop — implement `startLoop` with `cancelAnimationFrame` handling, requestAnimationFrame loop, and canvas clearing; wrap loop body in try/catch.
4. Input handling — add a `keys` Set, `keydown`/`keyup` listeners, R-key restart hook, and click listener on the restart button that both call a common `reset` function.
5. Player movement — implement dt‑based lane shifting based on input; update player position each frame and ensure lane wrap‑around.
6. Hazard spawning and movement — create hazard objects, spawn them respecting `SAFE_RADIUS` so none appear on the player within the first 3 seconds, and move them each frame scaled by dt.
7. Collision detection and game over — check player vs hazards each frame, transition `state` to "gameover" on hit, and stop the active gameplay loop.
8. Score system — increase score on each survived obstacle (or safe pass), draw the current score on the canvas top‑left.
9. Rendering — clear canvas, draw background, hazards, player (high‑contrast), and HUD elements each frame.
10. Game‑over overlay — dim the background, render "Game Over", final score, and "Press R or click Restart" instructions.
11. Observable state contract — populate `window.__game` each frame with `state`, `score`, `player` coordinates, visibility flag, and a concise `objective` sentence.
12. Audio integration — add a lazy‑initialized `AudioContext` in a `beep()` helper; trigger sounds on lane shift, scoring events, and death, all wrapped in try/catch.
