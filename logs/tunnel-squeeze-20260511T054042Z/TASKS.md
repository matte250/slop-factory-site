1. Create HTML scaffold and meta.json — Build index.html with required header, canvas, restart button, empty script tag, and generate meta.json matching game title, description, controls, and tags.
2. Initialize game state objects — Define plain objects for player (position, velocity, visible), hazards array, score, and game phase at the top of the script.
3. Set up main loop with requestAnimationFrame — Implement startLoop function, cancel previous loop, loop using try/catch, compute dt, and call update(dt) and render().
4. Implement input handling — Create a keys Set, add keydown/keyup listeners for squeeze action (Space/Click/Tap), R key restart, and restart button click linking to reset().
5. Add automatic player forward motion and squeeze effect — In update(dt), move player forward, apply tunnel compression when squeeze is active for a short duration, and ensure the control changes the game state.
6. Implement hazard data structure and spawning — Define hazard objects, spawn rules respecting SAFE_RADIUS and a survivable first 3 seconds, and move hazards each frame.
7. Add collision detection and game over transition — Detect player collision with hazards or walls, set phase to "gameover", and stop gameplay loop.
8. Implement scoring system — Increment score on successful squeeze passing a gap or collecting pickups, and display the score on the canvas.
9. Create rendering logic — Clear canvas, draw background, tunnel, hazards, player (high‑contrast), and HUD elements each frame.
10. Add game‑over overlay — Dim background, show "Game Over" with final score and restart instructions on the canvas.
11. Expose observable contract — Populate window.__game each frame with state, score, player coordinates, visibility, and an objective sentence.
12. Integrate audio feedback — Lazy‑init an AudioContext, define a beep() helper, and play sounds on squeeze, score, and death events.
