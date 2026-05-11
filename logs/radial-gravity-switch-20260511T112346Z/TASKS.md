1. HTML scaffold & meta.json — create `index.html` with required header, canvas, restart button and matching `meta.json` per CONVENTIONS.
2. Game state objects — declare plain objects for player, hazards, score, and phase with initial values at top of the script.
3. Animation loop — implement `startLoop()` with cancelAnimationFrame handling, try/catch wrapper, and clear canvas each frame.
4. Input handling — set up a `keys` Set via keydown/keyup, map gravity toggle, R-key restart, and restart button click to `reset()`.
5. Player movement — apply dt‑based physics to move the dot forward and adjust radial position based on current gravity direction.
6. Hazard system — define hazard data structure, spawn rules respecting `SAFE_RADIUS`, and dt‑scaled motion.
7. Collision detection — check player against hazards each frame, transition to `gameover` state on hit.
8. Scoring — increase score on successful gap passes, render the score at the top‑left of the canvas.
9. Rendering — clear canvas, draw background, tunnel rings, hazards, player (high contrast), and HUD each frame.
10. Game‑over overlay — dim the scene and draw “Game Over”, final score, and restart instructions.
11. Observable contract — populate `window.__game` each frame with `state`, `score`, player position/visibility, and an objective sentence.
12. Audio — add a lazy‑initialized `AudioContext` with a `beep()` helper and play sounds on hit, score, and death events.