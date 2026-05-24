# Game Idea: Solar Flare Escape

**Genre:** Arcade / Endless Runner

**Core Loop:** The player controls a tiny probe navigating a scrolling starfield. The probe can thrust up/down/left/right using arrow keys or WASD. Random solar flares, asteroids, and space debris appear from the right and move leftwards at varying speeds.

**Goal:** Survive as long as possible, racking up points based on distance traveled and flares avoided.

**Lose Condition:** The game ends when the probe collides with any obstacle (solar flare, asteroid, debris) or the probe drifts off-screen.

**Features:**
- Simple HTML5 Canvas rendering.
- Particle effects for flares.
- Incrementally increasing speed/difficulty.
- High‑score tracking via localStorage.

**Why Feasible:** Uses basic 2‑D shapes, collision detection via bounding boxes, and a single animation loop – all easily implemented with vanilla JavaScript and the Canvas API.