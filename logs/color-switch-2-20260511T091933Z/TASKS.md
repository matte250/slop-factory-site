1. HTML scaffold & meta.json — create `index.html` with required header, canvas, restart button, empty script block, and matching `meta.json` containing title, description, and controls.
2. Game state objects — declare top‑level objects for player (position, color, velocity), hazards array, score counter, and game phase/state.
3. Main loop setup — implement `startLoop()` using `requestAnimationFrame`, cancel previous loop, wrap body in try/catch, call `update(dt)` and `render()` each frame, clearing the canvas.
4. Input handling — add `keys` Set with `keydown`/`keyup` listeners, map `R` key and restart button click to a shared `reset()` function.
5. Player color cycling — implement tap/click (or key) handler that cycles the player's color through a preset list and updates the player object.
6. Player movement — apply continuous forward motion scaled by `dt` to the player's position each frame.
7. Hazard structure & spawning — define hazard objects (position, color, speed), implement spawn timer with `SAFE_RADIUS` check to avoid spawning on top of the player within the first 3 seconds.
8. Hazard motion — update each hazard's position each frame using `dt`‑scaled velocity.
9. Collision detection — detect player‑hazard collisions; if colors differ, transition to `gameover` state and stop active gameplay.
10. Scoring system — increment score on successful hazard passes, render the score on the canvas top‑left.
11. Rendering — clear canvas, draw background, hazards, player dot (high‑contrast), and HUD each frame.
12. Game‑over overlay — dim the canvas, display "Game Over", final score, and restart instructions.
13. Observable contract — populate `window.__game` each frame with `state`, `score`, `player` coordinates & visibility, and a one‑sentence `objective`.
14. Audio integration — lazily create an `AudioContext` in a `beep()` helper, wrap calls in try/catch, and trigger sounds on hit, score, and death events.