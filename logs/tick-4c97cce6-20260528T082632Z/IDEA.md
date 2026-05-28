# Game Idea: Canvas Runner

A side‑scrolling endless runner where the player controls a character that automatically moves forward on a simple 2‑D canvas. The player taps/clicks to make the character jump over incoming obstacles (spikes, pits, moving enemies). Collect coins for score. **Lose condition:** the game ends when the character collides with any obstacle or falls into a pit.

The mechanics are easy to implement with `requestAnimationFrame`, simple rectangle collision detection, and keyboard/mouse input, making it ideal for a quick HTML canvas prototype.