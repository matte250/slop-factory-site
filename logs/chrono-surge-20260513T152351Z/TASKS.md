1. HTML scaffold & meta.json — build index.html with header, canvas, restart button, placeholder script; create meta.json matching header text, description, and controls.
2. Game state initialization — declare player object, hazards array, score, phase, and other globals at top of script with default values.
3. Main loop setup — implement startLoop() with cancelAnimationFrame, requestAnimationFrame loop; compute dt, clear canvas; wrap body in try/catch.
4. Input handling — create Set keys, add keydown/keyup listeners, tap/click listener for burst, R-key and restart button to call reset().
5. Player movement — dt-based physics for lateral movement and forward scrolling; clamp to canvas bounds; update player position each frame.
6. Time‑dilation burst — on tap, apply short forward speed boost to player and temporarily reduce tunnel scroll speed; enforce cooldown timer before next activation.
7. Hazard system — define hazard objects, spawn logic obeying SAFE_RADIUS and 3‑second safe start; update hazard positions scaled by dt.
8. Collision detection & game‑over — check player vs hazards each frame; on collision set phase to "gameover", stop active gameplay loop.
9. Scoring — increment score on safe passage events and collectibles; render score text at top‑left of canvas.
10. Rendering — clear canvas, draw background tunnel, hazards, player (high‑contrast dot), and HUD each frame.
11. Game‑over overlay — dim background, display "Game Over", final score, and restart instructions on canvas.
12. Observable contract — update window.__game each frame with current state, score, player position/visibility, and objective sentence.
13. Audio — lazily create AudioContext, implement beep() helper, hook into hit, score, and death events with try/catch.