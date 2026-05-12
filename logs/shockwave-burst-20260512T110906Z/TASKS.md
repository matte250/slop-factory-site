1. HTML scaffold & meta.json - create index.html with required header, canvas, restart button, empty script block and generate meta.json containing title, description, controls, tags.
2. Game state objects - declare plain object literals for player, hazards, score, and phase with initial values at top of script.
3. Animation loop - implement startLoop using requestAnimationFrame with canceling prior loop, try/catch, clear canvas each frame.
4. Input handling - add a keys Set, bind keydown/keyup listeners, implement R-key and button restart hooks calling a reset function.
5. Player movement - apply dt-scaled physics using input: acceleration, max speed, friction, and clamp position to canvas bounds.
6. Hazards system - create hazards array, spawn hazards respecting SAFE_RADIUS, update positions with dt-scaled motion.
7. Collision detection & game over - detect player-hazard collisions, transition to "gameover" state and stop gameplay loop.
8. Score system - increase score on discrete events, render score on canvas top-left.
9. Rendering pipeline - clear canvas, draw background, hazards, player (high-contrast), and HUD each frame.
10. Game-over overlay - dim background and display "Game Over", final score, and restart instructions.
11. Observable contract - populate window.__game each frame with state, score, player position/visibility, and objective string.
12. Audio integration - lazy-initialize AudioContext in a beep() helper, invoke on hit, score, and death events.