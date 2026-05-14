1. Scaffold HTML and meta.json — create index.html with header, canvas, restart button, and a matching meta.json file.
2. Define game state objects — declare plain objects for player, hazards, score, phase, and constants like SAFE_RADIUS.
3. Implement main animation loop — create startLoop() with cancelAnimationFrame management, try/catch, clear canvas each frame.
4. Set up input handling — add keyboard listeners for arrow keys and R restart, mouse/tap listener for scale toggle, and restart button click hook.
5. Implement player movement and size toggle — dt-based physics for position, and toggle between small and large size on tap, updating collision radius accordingly.
6. Create hazard system — data structure for obstacles, spawn logic respecting SAFE_RADIUS and speed, include low-height breakable and narrow obstacles.
7. Add collision detection — detect player vs hazards, considering current player size; on hit transition to "gameover" state and stop gameplay.
8. Implement scoring — increase score when player successfully passes a hazard, display score on canvas.
9. Render game elements — draw background, hazards, player (high-contrast), and HUD each frame.
10. Show game-over overlay — dim scene, display "Game Over" with final score and restart instructions.
11. Expose observable contract — populate window.__game with state, score, player coordinates, visibility, and objective each frame.
12. Add audio feedback — lazy-init AudioContext, beep() helper, play sounds on hit, score, and death events.