1. HTML scaffold & meta.json — create index.html with header, canvas, restart button and stub script; create meta.json matching header and controls.
2. Game state objects — define plain objects for player, hazards array, score, and phase at top of script.
3. Animation loop — implement startLoop() that cancels previous loop, uses requestAnimationFrame, clears canvas each frame, wraps update/render calls in try/catch.
4. Input handling — set up a Set `keys`, attach keydown/keyup listeners, map R key and restart button to a reset() function.
5. Player movement — apply dt‑scaled acceleration and friction based on arrow keys, clamp to canvas bounds, update player position each frame.
6. Hazard system — create hazard objects, spawn them respecting SAFE_RADIUS from player at t = 0, move them with dt‑scaled velocity.
7. Collision detection — check player vs hazards each frame; on hit set phase to "gameover" and stop gameplay.
8. Scoring — increase score on each survived hazard or time event, render numeric score at top‑left of canvas.
9. Rendering — clear canvas, draw background, draw each hazard, draw player as highest‑contrast shape, draw HUD elements.
10. Game‑over overlay — dim canvas, draw "Game Over" with final score and restart instructions.
11. Observable contract — populate `window.__game` each frame with state, score, player position/visibility, and a one‑sentence objective.
12. Audio feedback — lazily create an AudioContext in a beep() helper, wrap calls in try/catch and trigger sounds on hit, score, and death.