1. HTML scaffold and meta.json — Create the HTML skeleton with required header, canvas, restart button, and stub script block; generate meta.json matching the header text.
2. Core game state objects — Define player, hazard list, score, phase, and bubble state as plain objects at the top of the script.
3. Main loop implementation — Set up requestAnimationFrame loop with delta‑time handling, cancel logic, and try/catch; clear the canvas each frame.
4. Input handling — Populate a `keys` Set via keyboard events, add tap detection for bubble activation, and bind R‑key and Restart button to a shared reset() function.
5. Player movement — Implement dt‑based left/right steering that updates player position and reflects changes in `window.__game`.
6. Time‑dilation bubble — Add tap‑activated bubble that temporarily slows world speed, enforce a cooldown period, and update observable state.
7. Hazard system — Create hazard data structure, spawn rules respecting SAFE_RADIUS, motion scaled by dt and affected by bubble slowdown.
8. Collision detection — Detect player‑hazard collisions, transition to "gameover" phase, stop the active gameplay loop, and trigger audio.
9. Scoring — Increase score on each passed obstacle segment, award bonus for bubble‑less segments, and draw the score HUD.
10. Rendering — Clear canvas, draw background, tunnel, hazards, player (high‑contrast), bubble overlay, and HUD each frame.
11. Game‑over overlay — Dim background and render "Game Over" with final score and restart instructions.
12. Observable contract — Populate `window.__game` each frame with `state`, `score`, `player` coordinates/visibility, and an objective sentence.
13. Audio — Lazy‑initialize AudioContext in a beep() helper and play sounds on hit, score, and death events.