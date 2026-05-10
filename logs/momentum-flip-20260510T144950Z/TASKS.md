1. HTML scaffold & meta.json — Add basic HTML page with header, description, controls list, canvas, restart button, empty script tag, and create matching meta.json file.
2. Game state objects — Define player, hazards, score, and phase objects with initial values at the top of the script.
3. Animation loop — Implement startLoop() using requestAnimationFrame, cancel previous loop, wrap body in try/catch, call update(dt) and render().
4. Input handling — Set up a keys Set with keydown/keyup listeners, R-key restart hook, and restart button click invoking a reset() function.
5. Player movement — Add dt‑based physics for the player using the keys Set, enforce speed limits and friction, and ensure controls affect state as listed in meta.json.
6. Hazards system — Create hazard data structure, spawn rules with SAFE_RADIUS to avoid the player at start, and dt‑scaled motion.
7. Collision detection — Detect player–hazard collisions, transition phase to "gameover", and halt gameplay.
8. Scoring — Increment score on discrete events, render score at top‑left of the canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD elements.
10. Game‑over overlay — Dim screen, display "Game Over", final score, and prompt "Press R or click Restart".
11. Observable contract — Expose window.__game each frame with state, score, player visibility, and an objective description.
12. Audio integration — Lazy‑initialize AudioContext in a beep() helper, wrap calls in try/catch, and trigger sounds on hit, score, and death events.