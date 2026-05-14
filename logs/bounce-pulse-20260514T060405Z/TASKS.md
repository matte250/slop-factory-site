1. HTML Scaffold & Meta — Create index.html with required header, canvas, restart button and an empty script block; create meta.json matching the header text and controls.
2. Game State Objects — Declare player, hazards, score, and phase objects at the top of the script with initial values.
3. Animation Loop — Implement startLoop() with cancelAnimationFrame discipline, a requestAnimationFrame loop that clears the canvas, and calls update(dt) and render().
4. Input System — Add a Set of keys, keydown/keyup listeners, R-key restart hook, and restart button click handler that both call a reset() function.
5. Player Movement — Apply dt‑based physics for horizontal movement based on arrow keys, include upward jump on tap, enforce speed limits and friction.
6. Hazard Management — Define hazard data structure, spawn logic respecting SAFE_RADIUS (no spawn near player within first 3 s), and dt‑scaled motion.
7. Collision Detection — Detect player‑hazard collisions, transition phase to "gameover", stop gameplay, and trigger hit feedback.
8. Scoring System — Increment score on discrete events (e.g., each passed hazard), and render the current score at the top‑left of the canvas.
9. Rendering Pipeline — Clear canvas, draw background, then hazards, then player (high‑contrast), and finally HUD elements.
10. Game‑Over Overlay — Dim the scene and display "Game Over", final score, and "Press R or click Restart" instructions.
11. Observable Contract — Populate window.__game each frame with state, score, player position/visibility, and a one‑sentence objective.
12. Audio Effects — Lazily create an AudioContext, implement a beep() helper, and play tones on hit, score, and death events.