1. Create HTML scaffold and meta.json — build base page with header, description, controls list, canvas, restart button, stub script block, and generate a matching meta.json per CONVENTIONS.md.
2. Initialize game state objects — define player (position, radius states), hazards array, score, phase, and constants (SAFE_RADIUS, GAP_SMALL, GAP_LARGE, etc.) at the top of the script.
3. Implement animation loop — write startLoop with cancelAnimationFrame handling, try/catch around loop body, clear canvas each frame.
4. Set up input system — add keyboard listeners to track a Set of pressed keys, handle R key for restart, click/tap to toggle radius, and restart button click, all calling a common reset function.
5. Implement player radius toggle — on input toggle the player between small and large radius, update player state accordingly.
6. Add forward motion and tunnel progression — auto‑advance the player forward through the tunnel each frame and update tunnel offset based on dt.
7. Spawn tunnel segments and hazards — create spawn timer logic that generates new tunnel gaps sized for the current radius, respecting SAFE_RADIUS so nothing spawns too close at start.
8. Detect collisions — compare player radius to tunnel gap boundaries each frame; on collision set phase to "gameover" and stop gameplay.
9. Implement scoring — increase score on each successfully traversed gap, draw the score at the top‑left of the canvas.
10. Render game elements — clear canvas, draw background, tunnel walls, player dot (high‑contrast), and HUD elements.
11. Add game‑over overlay and restart flow — dim background, display "Game Over" with final score and restart instructions; ensure R key and restart button both reset the game.
12. Expose observable contract — populate window.__game each frame with state ("menu"|"playing"|"gameover"), score, player position/visibility, and a one‑sentence objective.
13. Integrate audio cues — lazy‑init an AudioContext in a beep() helper, wrap in try/catch, and trigger sounds on radius toggle, scoring events, and game‑over.
