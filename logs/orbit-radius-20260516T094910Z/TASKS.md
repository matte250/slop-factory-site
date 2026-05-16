1. Setup HTML scaffold & meta.json — create index.html with header, canvas, restart button and matching meta.json per CONVENTIONS.md.
2. Initialize game state objects — define player, hazards array, score, phase, and other constants at top of script.
3. Implement main loop with requestAnimationFrame — startLoop function with cancelAnimationFrame, error handling, clear canvas each frame.
4. Add input handling — keys Set for keydown/keyup, R key to restart, restart button click to call reset().
5. Implement player orbit toggling movement — dt-based physics for orbit radius toggle, ensure controls affect player position.
6. Create hazard data structures and spawn logic — ensure SAFE_RADIUS safety and motion scaling with dt.
7. Add collision detection — detect player vs hazards, switch state to "gameover" and stop gameplay.
8. Implement scoring system — increase score on successful hazard passes, render score on canvas top-left.
9. Render all elements — draw background, hazards, player, HUD; ensure player high contrast.
10. Add game‑over overlay — dim background, display "Game Over", final score, and restart instructions.
11. Expose observable contract — populate window.__game each frame with state, score, player position/visibility, objective.
12. Integrate audio cues — lazy‑init AudioContext, beep() helper, trigger sounds on toggle, score, hit, death.
