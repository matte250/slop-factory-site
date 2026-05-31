# Game Idea: Pixel Runner

A fast-paced side‑scrolling endless runner rendered on an HTML canvas. The player controls a pixel‑styled character that automatically runs forward. Tap or press space to jump over procedurally generated obstacles (spikes, gaps, moving blocks) and collect glowing power‑ups for score multipliers.

**Lose condition:** Collision with any obstacle or falling into a gap ends the game.

**Core mechanics:**
- Simple 2‑D sprite animation using canvas `drawImage`.
- Random obstacle generation with increasing speed.
- Score based on distance traveled and power‑ups collected.
- Minimal UI: current score, high score, and a “Game Over” screen.

The concept is lightweight, requires only canvas drawing, basic physics, and input handling, making it quick to prototype.