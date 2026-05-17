## Concept
The player guides a glowing dot that automatically travels along a sinusoidal trajectory, tapping to shift its wave frequency between low, medium, and high. Obstacles present timing‑gated gaps that line up with a specific frequency, so matching the dot’s current frequency lets it thread the opening and survive.

## Player
A single radiant dot representing the player’s avatar. It continuously moves forward on a wavy path. The player’s only action is to tap (or click) to cycle the dot’s wave frequency among three discrete settings.

## Core loop
Every moment the dot progresses along its sinusoidal route, the game presents a series of incoming obstacles with gaps that open at a rhythm matching one of the three frequencies. The player watches the timing of each gap, taps to change the dot’s frequency, and aims to align the dot’s current frequency with the upcoming gap. Successful alignment allows the dot to pass through; a mismatch results in collision. The loop repeats as new obstacles appear, each demanding a fresh frequency choice.

## Hazards / Obstacles
- **Frequency‑locked gates**: vertical barriers that contain a moving aperture timed to a specific wave frequency. Only a dot set to the matching frequency can slip through without hitting the barrier.
- **Static spikes**: fixed points on the path that always cause a collision if the dot’s trajectory intersects them, regardless of frequency. They serve as additional timing challenges.
- **Rapid oscillators**: short‑lived barriers that flicker on and off in sync with a particular frequency, creating a brief window that must be caught precisely.

## Score
- Each time the dot safely traverses a frequency‑locked gate, the score increases.
- Collecting floating “beat” icons that appear when the dot’s frequency matches the obstacle’s rhythm grants bonus points.
- Surviving a set of consecutive obstacles without a mismatch yields a combo bonus.

## Win and lose
The player loses immediately when the dot collides with any part of an obstacle. On loss, a “Game Over” overlay shows the final score and prompts a restart. The player wins after successfully passing a predefined sequence of obstacle sets (e.g., a full wave cycle of low, medium, and high challenges), at which point a celebratory animation and “You Win!” message appear.

## Feel
A pulse‑driven, rhythm‑centric experience that feels both frantic and satisfying. Neon‑bright visuals on a dark backdrop give a retro‑futuristic arcade vibe, while crisp electronic chimes punctuate each successful frequency match. The gameplay rhythm encourages quick reflexes and a sense of flow as the dot dances through the waves.

## Why it's fun
Nailing the perfect tap to sync the dot’s frequency with a closing gap delivers an instant, gratifying “aha!” moment that makes the player feel like they’ve mastered a rhythmic puzzle.
