1. HTML scaffold & meta.json — Create index.html with header, canvas, restart button and empty script block; generate meta.json matching header text and controls.
2. Game state objects — Declare plain object literals for player, hazards list, score, and phase at top of script with initial values.
3. Animation loop — Implement startLoop() with cancelAnimationFrame, dt calculation, try/catch wrapper, calling update(dt) and render().
4. Input handling — Set up a Set for keys, keydown/keyup listeners, R-key restart hook, restart button click listener, and a reset() function that reinitialises state and restarts the loop.
5. Player movement — Add dt‑scaled physics for player based on key inputs, with velocity caps, friction, and canvas bounds clamping.
6. Hazard system & spawning — Define hazard objects, spawn rules respecting SAFE_RADIUS and 3‑second safety, and dt‑scaled motion.
7. Collision detection — Check player vs hazards each frame; on hit transition to "gameover" state and stop active gameplay.
8. Scoring — Increment score on discrete events (surviving hazards, on‑beat pulses), and render the score on the canvas top‑left.
9. Rendering — Clear canvas, draw background, hazards, player (high‑contrast), and HUD each frame.
10. Game‑over overlay — Dim background and draw "Game Over" with final score and restart instructions.
11. Observable contract — Populate window.__game each frame with state, score, player{x,y,visible}, and a one‑sentence objective.
12. Audio — Lazy‑init AudioContext in a beep() helper; hook beep calls into hit, score, and pulse events with try/catch.
