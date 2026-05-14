1. HTML scaffold and meta.json - create index.html with required structure and a matching meta.json file.
2. Game state objects - define player, hazards, score, and phase objects at the top of the script with initial values.
3. Animation loop - implement startLoop with cancelAnimationFrame logic, requestAnimationFrame, dt calculation, and canvas clearing.
4. Input handling - add a keys Set and document keydown/keyup listeners to track controls.
5. Restart logic - implement a reset() function that fully resets state and cancels prior loop, bind it to the R key and restart button.
6. Player movement - apply dt‑scaled physics based on keys, including acceleration, friction, speed caps, and canvas bounds.
7. Hazard system - create hazard data structure, spawn rules with SAFE_RADIUS, and dt‑scaled motion.
8. Collision detection and game‑over transition - detect player‑hazard collisions, switch state to "gameover", and stop gameplay.
9. Score system - increase score on discrete events and draw the current score on the canvas.
10. Rendering - clear the canvas and draw background, hazards, player (high‑contrast), and HUD each frame.
11. Game‑over overlay - dim the background and render "Game Over", final score, and restart instructions.
12. Observable contract - populate window.__game each frame with state, score, player position/visibility, and objective.
13. Audio integration - lazily create an AudioContext, add a beep() helper, and hook it to hit, score, and death events.