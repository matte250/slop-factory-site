## Concept
The player guides a dot that automatically travels forward through a tunnel of two concentric rings. By tapping, the dot instantly switches between the inner and outer ring, allowing it to thread through the moving gaps that appear in each ring.

## Player
The player controls a single dot that slides along the tunnel. Visually it is a small illuminated circle. The only verb is **swap** – a tap (or click) instantly moves the dot from the inner ring to the outer ring or vice‑versa.

## Core loop
Every frame the dot advances along the tunnel while the rings rotate, creating gaps that move past the dot. The player watches the approaching gaps, decides whether to stay on the current ring or tap to swap to the other ring, and executes the swap at the right moment. Successful swaps let the dot pass through a gap; missed swaps result in a collision. The loop repeats continuously, with the rotation speed gradually increasing.

## Hazards / Obstacles
- **Solid ring segments** that fill the circumference of each ring; colliding with them ends the game.
- **Moving gaps** that open and close as the rings rotate; timing a swap to line up with a gap is required.
- **Random rotating blockers** that briefly cover a gap on one ring, forcing the player to stay on or switch to the opposite ring.

## Score
The score increments each time the dot successfully passes through a gap, rewarding precise swaps. Bonus points are awarded for surviving a full rotation without swapping, encouraging risk‑free play.

## Win and lose
The player loses when the dot collides with a solid segment of either ring. On loss the game overlays a “Game Over” screen showing the final score and restart instructions. The player wins after successfully navigating a predefined number of gaps (e.g., thirty) or after surviving a set distance, at which point a celebratory “You Win!” overlay appears.

## Feel
A fast‑paced, reflex‑driven experience with a crisp neon aesthetic. The tunnel glows with electric blues and magentas, while the dot pulses in sync with each successful swap. The soundscape consists of sharp beeps on swaps and a low‑drone that ramps up as speed increases, creating tension and reward.

## Why it's fun
The thrill of snapping between rings at the exact instant a gap aligns, turning a single tap into a high‑stakes, split‑second decision that can make you grin or gasp.
