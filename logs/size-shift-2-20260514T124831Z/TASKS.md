1. HTML scaffold + meta.json — create `index.html` with required header, canvas, restart button, empty script block, and `meta.json` matching title, description, controls, tags.
2. Game state objects — define plain objects for player, hazards array, score, phase, constants (e.g., SAFE_RADIUS) at the top of the script.
3. Animation loop — implement `startLoop` with `cancelAnimationFrame` handling, requestAnimationFrame loop invoking `update(dt)` and `render()`.
4. Input handling — set up a `keys` Set via keydown/keyup listeners, R-key restart hook, and restart button click hook calling `reset()`.
5. Player movement — add dt‑based physics for player movement using arrow keys, with speed, friction, bounds, and update meta player position.
6. Size‑shift mechanic — allow toggling player size (shrink to 0.5× or expand to 2×) on tap/key for a few seconds, then revert.
7. Hazard system — design hazard data structure, spawn logic that respects `SAFE_RADIUS` and avoids spawning on the player, with dt‑scaled motion.
8. Collision detection — detect collisions between player (considering current size) and hazards; on hit transition to `gameover` state and stop the gameplay loop.
9. Scoring — increase score when hazards are successfully passed, and draw the score on the canvas top‑left.
10. Rendering — clear canvas, draw background, hazards, player (respecting current size), and HUD; ensure player is high‑contrast.
11. Game‑over overlay — dim background and draw "Game Over", final score, and restart instructions on the canvas.
12. Observable contract — populate `window.__game` each frame with `state`, `score`, player `x`, `y`, `visible`, and an `objective` sentence.
13. Audio feedback — implement lazy‑init `AudioContext` with a `beep()` helper, hooking into hit, score, and game‑over events.
14. Final polish — define all numeric constants (player speed, size‑shift duration, hazard speed, canvas size), ensure no uncaught exceptions, and verify controls affect gameplay.
15. Validation checklist — run quick sanity checks: page loads without errors, controls work, player visible, score updates, and game‑over triggers correctly.