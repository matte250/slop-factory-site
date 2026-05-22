# Game Idea: Orbital Dodge

- **Genre:** Minimalist arcade shooter
- **Core mechanic:** The player controls a stationary ship at the center of the canvas that can rotate 360°. Asteroids spawn at the edges and move straight toward the center.
- **Controls:** Mouse movement or left/right keys rotate the ship; spacebar fires a laser in the ship's facing direction.
- **Goal:** Destroy as many asteroids as possible. Each destroyed asteroid grants a point and slightly increases spawn rate.
- **Lose condition:** The game ends when any asteroid reaches the ship's radius (collision detection), displaying a "Game Over" screen with the final score.
- **Why it's canvas‑friendly:** Simple shape rendering (circles for asteroids, triangle for ship) and basic trigonometry for movement, all doable with the Canvas 2D API.