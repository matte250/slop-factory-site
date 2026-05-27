# Game Idea: Neon Light Runner

**Genre:** Endless runner (side‑scroll) on an HTML canvas.

**Core Loop:**
- The player controls a glowing neon ship that continuously moves forward.
- Tap / click to make the ship jump or ascend; release to descend.
- Randomly generated obstacles (spikes, lasers) appear from the right.
- Collect glowing orbs to boost a visual "energy" meter.

**Lose Condition:**
- The ship collides with an obstacle **or** the energy meter depletes to zero.

**Win Condition (optional):**
- Achieve a high score based on distance and orbs collected.

**Why it works on Canvas:**
- Simple 2‑D shapes and sprite drawing.
- Uses requestAnimationFrame for smooth animation.
- Collision detection via bounding boxes.
- Minimal assets needed – can be generated procedurally.

**Potential Extensions:**
- Power‑ups that temporarily make the ship invincible.
- Dynamic background that reacts to the music beat.

The idea is concise, clear, and implementable with vanilla JavaScript on a canvas element.