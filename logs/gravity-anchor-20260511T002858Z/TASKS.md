1. HTML scaffold & meta.json — create index.html with required header, canvas, restart button and matching meta.json.
2. Game state objects — declare player, hazards, score, and phase/state objects at top of script with initial values.
3. Animation loop — implement startLoop with cancelAnimationFrame, requestAnimationFrame loop, try/catch, and canvas clearing.
4. Input handling — set up keys Set, keydown/keyup listeners, R-key and restart button to call reset().
5. Player movement — apply dt-based physics, anchor toggle effect, velocity caps, and position updates each frame.
6. Hazard system — define hazard data structures, spawn rules with SAFE_RADIUS, and dt-scaled motion.
7. Collision detection — check player vs hazards, trigger gameover phase and stop gameplay loop.
8. Scoring — increase score on successful gap passes, draw score on canvas top-left.
9. Rendering — draw background, hazards, player dot (high contrast), and HUD each frame.
10. Game-over overlay — dim background, show "Game Over", final score, and restart instructions.
11. Observable contract — populate window.__game each frame with state, score, player position/visibility, and objective.
12. Audio feedback — lazy-initialize AudioContext, create beep() helper, play sounds on hit, score, and death events.