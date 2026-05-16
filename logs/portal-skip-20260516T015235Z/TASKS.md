1. HTML scaffold + meta.json — create index.html with required header, canvas, restart button, empty script block and matching meta.json per CONVENTIONS.md and concept.
2. Game state objects — define player, hazards array, score, phase/state as plain objects at top of script with initial values.
3. Animation loop — implement requestAnimationFrame loop with startLoop, cancelAnimationFrame discipline, dt calculation, try/catch, clear canvas.
4. Input handling — set up keys Set for keydown/keyup, R-key restart, restart button click, shared reset() function.
5. Player movement — dt‑based forward motion, apply acceleration, handle boundaries, update player position each frame.
6. Portal creation & cooldown — tap/click creates short‑range portal ahead of player, starts cooldown timer, teleports player when reaching portal.
7. Hazard system — define hazard data structure, spawn rules respecting SAFE_RADIUS (no spawn within safe radius or reaching player within 3 s), dt‑scaled motion.
8. Collision detection — detect player vs hazards, trigger game over state and stop gameplay loop.
9. Scoring — increase score on each avoided hazard, extra points for portal skips, draw score on canvas top‑left.
10. Rendering — clear canvas, draw background, hazards, portal, player (high‑contrast), HUD elements.
11. Game‑over overlay — dim background, show "Game Over", final score, and restart instructions.
12. Observable contract — populate window.__game each frame with state, score, player.x/y/visible, and objective sentence.
13. Audio — lazy‑init AudioContext in beep() helper, wrap in try/catch, hook into hit, score, portal, and death events.
