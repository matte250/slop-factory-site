1. Scaffold HTML & meta.json — create index.html with header (title, description, controls list), canvas, restart button, and empty script block; create meta.json matching header text and controls per CONVENTIONS.
2. Define core game state objects — add plain object literals for player, hazards, score, phase, and config at the top of the script with initial values.
3. Implement main loop — write startLoop() with cancelAnimationFrame discipline, requestAnimationFrame loop, try/catch body, calling update(dt) and render(), clearing canvas each frame.
4. Setup input handling — create a Set "keys", add keydown/keyup listeners, map R key and restart button to a shared reset() function.
5. Implement player physics and lateral control — dt‑scaled movement for left/right (or WASD), base forward drift, friction, bounds clamping, and ensure controls listed in meta.json are functional.
6. Add time‑slip mechanic — on tap (e.g., Space or mouse click) instantly advance the player forward by a fixed distance, start a cooldown timer preventing further slips until elapsed.
7. Create hazards system — define hazard data structures, spawn logic respecting SAFE_RADIUS to avoid immediate collisions, dt‑scaled motion, include at least one hazard type (spike).
8. Implement collision detection — check player vs hazards each frame, transition phase to "gameover" and stop active gameplay on hit.
9. Add scoring logic — increment score when player passes a hazard, award a bonus point on a successful time‑slip that clears at least one obstacle, draw score in top‑left corner.
10. Render scene — clear canvas, draw background, hazards, player (high‑contrast), and HUD each frame.
11. Display game‑over overlay — dim background, show "Game Over", final score, and "Press R or click Restart" instructions.
12. Expose observable contract — populate window.__game each frame with state, score, player {x, y, visible}, and a short objective sentence.
13. Integrate audio cues — lazy‑initialize AudioContext, implement beep() helper, play sounds on hit, score, and death events.