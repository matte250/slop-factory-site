## Concept
The player controls a constantly orbiting dot that can instantly toggle between a tight inner orbit and a wide outer orbit, using each tap to weave through obstacles placed on either track.

## Player
A small, glowing dot that revolves around a fixed central point. The player’s only verb is **toggle orbit** (tap or click) which switches the dot from the inner path to the outer path and back.

## Core loop
The dot spins continuously while obstacles appear on the inner and outer tracks. Every few seconds a new obstacle spawns, giving the player a brief window to decide whether to stay in the current orbit or toggle to the opposite radius. The player watches the upcoming pattern, taps at the right moment, and the dot instantly flips its path, avoiding collisions and earning points.

## Hazards / Obstacles
- **Static protrusions** that extend from the inner or outer track, requiring the player to be on the opposite radius to pass.
- **Sweeping arcs** that travel along one orbit, temporarily blocking that radius and forcing a toggle.
- **Radial projectiles** that cross the space between the two orbits, threatening the dot if it happens to be in the crossing zone.
Each hazard has a clear visual cue that telegraphs its motion, allowing the player to time their toggle.

## Score
Score increases each time the player successfully passes an obstacle without colliding, and extra points are awarded for rapid toggles that avoid a dangerous sweep.

## Win and lose
The player loses immediately on collision with any obstacle, triggering a Game Over overlay that shows the final score and a prompt to restart. The player wins after surviving a pre‑defined wave of obstacles (e.g., after a set number of cycles), prompting a victory screen with celebratory graphics and the final score.

## Feel
A fast‑paced, rhythm‑driven experience with a neon‑glow aesthetic. The orbiting motion feels steady and hypnotic, while the toggle action injects bursts of urgency. Sound consists of crisp beeps for toggles and short bursts for obstacle interactions, reinforcing the kinetic feel.

## Why it's fun
The thrill of a split‑second tap that flips the dot out of a collision path, turning a near‑miss into a triumphant escape.