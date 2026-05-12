1. Scaffold HTML and script — create index.html with header, description, controls list, canvas, restart button, and an empty <script> block.
2. Create meta.json — populate title, description, controls, and tags matching the header content.
3. Define initial game state objects — player, hazards list, score, and phase at the top of the script.
4. Implement startLoop and requestAnimationFrame loop — include cancelAnimationFrame logic, try/catch wrapper, and canvas clearing.
5. Set up input handling — keys Set via keydown/keyup events, bind R key and restart button to a shared reset() function.
6. Add player movement — dt‑based physics for tilt left/right using input, update position each frame.
7. Build hazard system — data structure, spawn logic respecting SAFE_RADIUS, and dt‑scaled motion.
8. Implement collision detection — check player against hazards, transition to "gameover" state and stop the loop on hit.
9. Create scoring — increment score on survived hazards (or interval) and render it on the canvas.
10. Render frame — clear canvas, draw background, hazards, player (high‑contrast), and HUD with score.
11. Add game‑over overlay — dim background, display "Game Over", final score, and restart instructions.
12. Populate window.__game observable contract each frame — expose state, score, player coordinates/visibility, and objective sentence.
13. Add audio support — lazy‑init AudioContext, beep() helper, and trigger sounds on hit, score, and death events.