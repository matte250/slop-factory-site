1. HTML scaffold + meta.json — create index.html with header, description, controls list, canvas, restart button per CONVENTIONS.md and generate matching meta.json.
2. Game state objects — define player, hazards, score, and phase plain objects with initial values at top of script.
3. Animation loop — implement startLoop() using requestAnimationFrame, include cancelAnimationFrame discipline, try/catch, and clear canvas each frame.
4. Input handling — set up a keys Set updated by keydown/keyup, add R-key restart hook and restart button click calling a shared reset() function.
5. Player size toggle — implement tap/click to toggle player between tiny and large forms, updating size state each frame.
6. Player movement — apply dt‑based forward motion and optional lateral drift, ensure controls from meta.json affect player velocity.
7. Hazard system — create data structure for obstacles, spawn rules respecting SAFE_RADIUS, and dt‑scaled motion.
8. Collision detection — detect player vs hazards, trigger gameOver phase and stop gameplay loop.
9. Scoring — increase score on discrete events (passing narrow gap, crushing block, surviving wave) and draw score on canvas.
10. Rendering — draw background, hazards, player (high‑contrast), and HUD each frame.
11. Game‑over overlay — dim background and display "Game Over" with final score and restart instructions.
12. Observable contract — populate window.__game each frame with state, score, player position/visibility, and objective description.
13. Audio system — lazy‑initialize AudioContext in a beep() helper, wrap in try/catch, and invoke on hit, score, and death events.
14. Final polish — ensure all required meta.json fields match header text, controls list, and tags; verify no external resources; test restart loop resets correctly.
15. Validation run — manually load page, verify no console errors, ensure observable contract exists from first frame, and that gameplay meets playtest invariants.