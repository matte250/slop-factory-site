# Game Idea: Canvas Runner

A fast‑paced endless runner where the player controls a character that automatically moves forward across a scrolling canvas.

**Core mechanics**
- Tap or press space to make the character jump over obstacles (gaps, spikes, moving enemies).
- Collect glowing orbs to increase score.
- The speed gradually ramps up, challenging reaction time.

**Lose condition**
- The game ends when the character collides with an obstacle or falls into a gap.

**Visuals**
- Simple shapes (rectangles for ground, circles for orbs) and a silhouette for the player.
- Color palette shifts as speed increases, adding visual feedback.

**Why it works on canvas**
- Uses `requestAnimationFrame` for smooth animation.
- Collision detection via bounding‑box checks.
- No external assets needed; everything drawn with canvas API.