1. HTML Scaffold & Meta.json — create index.html with header, canvas, restart button, empty script block, and meta.json matching header text.
2. Game State Objects — define player, hazards, score, phase objects at top of script with initial values.
3. Animation Loop — implement startLoop with cancelAnimationFrame, loop body try/catch, calling update(dt) and render(), clearing canvas.
4. Input System — set up keys Set via keydown/keyup, map R key and restart button to same reset function.
5. Player Movement — apply dt-based physics based on key inputs, ensure controls affect player state.
6. Hazard Management — create hazard data structure, spawn logic respecting SAFE_RADIUS, update motion with dt.
7. Collision Detection — detect player-hazard collisions, transition to "gameover" state and stop gameplay.
8. Scoring — increment score on discrete events, render score on canvas top-left.
9. Rendering — clear canvas, draw background, hazards, player (high contrast), and HUD each frame.
10. Game Over Overlay — draw dimmed screen with "Game Over", final score, and restart instructions.
11. Observable Contract — expose window.__game each frame with state, score, player coordinates/visibility, and objective sentence.
12. Audio Integration — add lazy AudioContext in beep() helper, trigger sounds on hit, scoring, and death events.
