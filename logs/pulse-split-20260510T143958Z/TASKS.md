1. HTML scaffold + meta.json — Create index.html with header, description, controls list, canvas, restart button per CONVENTIONS.md and add matching meta.json stub; include empty <script> tag.
2. Game state objects — Define player, hazards, score, and phase objects as plain literals with initial values at the top of the script.
3. Animation loop — Implement startLoop() using requestAnimationFrame, include cancelAnimationFrame handling, wrap update/render calls in try/catch, and clear the canvas each frame.
4. Input handling — Set up a `keys` Set with keydown/keyup listeners, add R-key restart hook and Restart button click handler that both invoke a reset() function.
5. Player movement — Add dt‑based physics for the player using keys input, enforce max speed, friction, and clamp position within canvas bounds; ensure meta.json controls affect movement.
6. Hazard system — Create hazard data structure, spawn logic with SAFE_RADIUS to avoid player spawn, and dt‑scaled motion for each hazard.
7. Collision detection — Detect player‑hazard collisions, transition `phase` to "gameover", and halt gameplay updates.
8. Scoring — Increment score on defined events, render the numeric score at the top‑left of the canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD elements each frame.
10. Game‑over overlay — Dim the screen, display "Game Over" with final score and instructions to press R or click Restart.
11. Observable contract — Populate `window.__game` each frame with `{ state, score, player:{x,y,visible}, objective }` where state is "playing" or "gameover" and objective is a short description.
12. Audio feedback — lazy‑initialize AudioContext in a beep() helper, wrap calls in try/catch, and trigger sounds on hit, score, and death events.